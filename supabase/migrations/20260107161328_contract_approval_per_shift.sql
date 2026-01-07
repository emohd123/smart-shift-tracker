-- Contract Approval Before Shift Start - Per-Shift Implementation
-- This migration modifies the contract acceptance system to require approval per shift assignment
-- instead of once per company

-- Step 1: Add new columns to company_contract_acceptances
ALTER TABLE public.company_contract_acceptances
  ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS shift_assignment_id uuid REFERENCES public.shift_assignments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Step 2: Remove the old UNIQUE constraint (company_id, promoter_id)
ALTER TABLE public.company_contract_acceptances
  DROP CONSTRAINT IF EXISTS company_contract_acceptances_company_id_promoter_id_key;

-- Step 3: Create new unique constraint for per-shift approvals
-- Allow multiple acceptances per company/promoter, but only one per shift assignment
CREATE UNIQUE INDEX IF NOT EXISTS company_contract_acceptances_shift_assignment_unique
  ON public.company_contract_acceptances(shift_assignment_id)
  WHERE shift_assignment_id IS NOT NULL;

-- Step 4: Update existing acceptances to have status='accepted' (migrate old data)
UPDATE public.company_contract_acceptances
  SET status = 'accepted'
  WHERE status IS NULL;

-- Step 5: Create function to auto-create contract acceptance records when shift assignments are created
CREATE OR REPLACE FUNCTION public.create_contract_acceptance_on_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
  v_template_id uuid;
BEGIN
  -- Get company_id from the shift
  SELECT s.company_id INTO v_company_id
  FROM public.shifts s
  WHERE s.id = NEW.shift_id;

  -- If no company_id, skip contract creation
  IF v_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get active contract template for the company
  SELECT id INTO v_template_id
  FROM public.company_contract_templates
  WHERE company_id = v_company_id
    AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;

  -- If no active template, skip contract creation
  IF v_template_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create contract acceptance record with pending status
  -- Check if one already exists to avoid duplicates
  IF NOT EXISTS (
    SELECT 1
    FROM public.company_contract_acceptances
    WHERE shift_assignment_id = NEW.id
  ) THEN
    INSERT INTO public.company_contract_acceptances (
      company_id,
      promoter_id,
      template_id,
      shift_id,
      shift_assignment_id,
      status,
      created_at
    )
    VALUES (
      v_company_id,
      NEW.promoter_id,
      v_template_id,
      NEW.shift_id,
      NEW.id,
      'pending',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to auto-create contract acceptance on shift assignment
DROP TRIGGER IF EXISTS on_shift_assignment_create_contract_acceptance ON public.shift_assignments;
CREATE TRIGGER on_shift_assignment_create_contract_acceptance
  AFTER INSERT ON public.shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_contract_acceptance_on_assignment();

-- Step 7: Create function to send notifications when contract acceptance records are created
CREATE OR REPLACE FUNCTION public.notify_contract_required()
RETURNS TRIGGER AS $$
DECLARE
  v_shift_title text;
  v_shift_date date;
BEGIN
  -- Only send notification for pending contracts
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get shift details for the notification message
  SELECT s.title, s.date INTO v_shift_title, v_shift_date
  FROM public.shifts s
  WHERE s.id = NEW.shift_id;

  -- Create notification for the promoter
  -- Check if notification already exists to avoid duplicates
  IF NOT EXISTS (
    SELECT 1
    FROM public.notifications
    WHERE user_id = NEW.promoter_id
      AND type = 'contract_required'
      AND related_id = NEW.id::text
      AND created_at > NOW() - INTERVAL '1 hour'
  ) THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      related_id,
      read,
      created_at
    )
    VALUES (
      NEW.promoter_id,
      'Contract Approval Required',
      COALESCE('Please review and approve the contract before starting shift: ' || v_shift_title, 'Contract approval required for assigned shift'),
      'contract_required',
      NEW.id::text,
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger to send notifications when contract acceptance is created
DROP TRIGGER IF EXISTS on_contract_acceptance_notify ON public.company_contract_acceptances;
CREATE TRIGGER on_contract_acceptance_notify
  AFTER INSERT ON public.company_contract_acceptances
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_contract_required();

-- Step 9: Update RLS policies to support per-shift queries
-- The existing policies should work, but let's ensure they allow queries by shift_assignment_id

-- Update the SELECT policy to allow querying by shift_assignment_id
DROP POLICY IF EXISTS "Promoters can read own contract acceptance" ON public.company_contract_acceptances;
CREATE POLICY "Promoters can read own contract acceptance"
ON public.company_contract_acceptances
FOR SELECT
TO authenticated
USING (promoter_id = auth.uid() OR public.is_admin_like(auth.uid()));

-- Update INSERT policy to allow creating records with shift_assignment_id
DROP POLICY IF EXISTS "Promoters can accept company contract" ON public.company_contract_acceptances;
CREATE POLICY "Promoters can accept company contract"
ON public.company_contract_acceptances
FOR INSERT
TO authenticated
WITH CHECK (
  promoter_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.company_contract_templates t
    WHERE t.id = template_id
      AND t.company_id = company_id
      AND t.is_active = true
  )
);

-- Add UPDATE policy for promoters to update status
DROP POLICY IF EXISTS "Promoters can update own contract acceptance" ON public.company_contract_acceptances;
CREATE POLICY "Promoters can update own contract acceptance"
ON public.company_contract_acceptances
FOR UPDATE
TO authenticated
USING (promoter_id = auth.uid())
WITH CHECK (
  promoter_id = auth.uid()
  AND (
    -- Can only update status, signature, and acceptance metadata
    (OLD.company_id = NEW.company_id)
    AND (OLD.promoter_id = NEW.promoter_id)
    AND (OLD.template_id = NEW.template_id)
    AND (OLD.shift_id = NEW.shift_id)
    AND (OLD.shift_assignment_id = NEW.shift_assignment_id)
  )
);

-- Step 10: Create helper function to check if contract is approved for a specific shift assignment
CREATE OR REPLACE FUNCTION public.is_contract_approved_for_shift_assignment(
  p_assignment_id uuid,
  p_promoter_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_contract_acceptances
    WHERE shift_assignment_id = p_assignment_id
      AND promoter_id = p_promoter_id
      AND status = 'accepted'
  );
$$;

-- Step 11: Add index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_shift_assignment
  ON public.company_contract_acceptances(shift_assignment_id)
  WHERE shift_assignment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contract_acceptances_promoter_status
  ON public.company_contract_acceptances(promoter_id, status)
  WHERE status = 'pending';

