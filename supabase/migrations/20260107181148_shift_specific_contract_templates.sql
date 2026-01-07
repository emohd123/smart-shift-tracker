-- Shift-Specific Contract Templates
-- Allows companies to create contract templates specific to individual shifts
-- These override the company-wide template for that shift

-- Step 1: Create shift_contract_templates table
CREATE TABLE IF NOT EXISTS public.shift_contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Shift Contract',
  body_markdown text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shift_id) -- One contract template per shift
);

-- Step 2: Enable RLS
ALTER TABLE public.shift_contract_templates ENABLE ROW LEVEL SECURITY;

-- Step 3: RLS Policies
-- Companies can manage shift contracts for their own shifts
CREATE POLICY "Companies can manage shift contract templates"
ON public.shift_contract_templates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.shifts s
    WHERE s.id = shift_contract_templates.shift_id
      AND s.company_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.shifts s
    WHERE s.id = shift_contract_templates.shift_id
      AND s.company_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  )
);

-- Promoters can read shift contract templates for assigned shifts
CREATE POLICY "Promoters can read shift contract templates for assigned shifts"
ON public.shift_contract_templates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.shift_assignments sa
    WHERE sa.shift_id = shift_contract_templates.shift_id
      AND sa.promoter_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  )
);

-- Step 4: Create updated_at trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_shift_contract_templates_updated_at ON public.shift_contract_templates;
    CREATE TRIGGER update_shift_contract_templates_updated_at
    BEFORE UPDATE ON public.shift_contract_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Step 5: Create function to handle shift contract template updates
CREATE OR REPLACE FUNCTION public.handle_shift_contract_template_update()
RETURNS TRIGGER AS $$
DECLARE
  v_assignment RECORD;
BEGIN
  -- Only process if this is an update (not insert) and template content changed
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Check if title or body changed
  IF OLD.title = NEW.title AND OLD.body_markdown = NEW.body_markdown THEN
    RETURN NEW;
  END IF;

  -- Mark all existing acceptances for this shift as superseded
  UPDATE public.company_contract_acceptances
  SET superseded_at = NOW()
  WHERE shift_id = NEW.shift_id
    AND status = 'accepted'
    AND superseded_at IS NULL;

  -- Create new pending acceptances for all active shift assignments
  FOR v_assignment IN
    SELECT DISTINCT
      sa.id as assignment_id,
      sa.shift_id,
      sa.promoter_id,
      sa.created_at
    FROM public.shift_assignments sa
    WHERE sa.shift_id = NEW.shift_id
      -- Only if there's no existing pending acceptance for this assignment
      AND NOT EXISTS (
        SELECT 1
        FROM public.company_contract_acceptances cca2
        WHERE cca2.shift_assignment_id = sa.id
          AND cca2.status = 'pending'
          AND cca2.superseded_at IS NULL
      )
  LOOP
    -- Create new pending acceptance with shift-specific template
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
      NEW.company_id,
      v_assignment.promoter_id,
      NULL, -- Shift-specific contracts don't use company template_id
      v_assignment.shift_id,
      v_assignment.assignment_id,
      'pending',
      NOW()
    )
    ON CONFLICT (shift_assignment_id) 
    WHERE shift_assignment_id IS NOT NULL
    DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to handle shift contract template updates
DROP TRIGGER IF EXISTS on_shift_contract_template_update_require_reapproval ON public.shift_contract_templates;
CREATE TRIGGER on_shift_contract_template_update_require_reapproval
  AFTER UPDATE ON public.shift_contract_templates
  FOR EACH ROW
  WHEN (
    -- Only trigger if title or body changed
    (OLD.title IS DISTINCT FROM NEW.title OR OLD.body_markdown IS DISTINCT FROM NEW.body_markdown)
  )
  EXECUTE FUNCTION public.handle_shift_contract_template_update();

-- Step 7: Create function to handle shift contract template creation
CREATE OR REPLACE FUNCTION public.handle_shift_contract_template_create()
RETURNS TRIGGER AS $$
DECLARE
  v_assignment RECORD;
BEGIN
  -- Create pending acceptances for all existing shift assignments
  FOR v_assignment IN
    SELECT DISTINCT
      sa.id as assignment_id,
      sa.shift_id,
      sa.promoter_id,
      sa.created_at
    FROM public.shift_assignments sa
    WHERE sa.shift_id = NEW.shift_id
      -- Only if there's no existing pending acceptance for this assignment
      AND NOT EXISTS (
        SELECT 1
        FROM public.company_contract_acceptances cca2
        WHERE cca2.shift_assignment_id = sa.id
          AND cca2.status = 'pending'
          AND cca2.superseded_at IS NULL
      )
  LOOP
    -- Create new pending acceptance with shift-specific template
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
      NEW.company_id,
      v_assignment.promoter_id,
      NULL, -- Shift-specific contracts don't use company template_id
      v_assignment.shift_id,
      v_assignment.assignment_id,
      'pending',
      NOW()
    )
    ON CONFLICT (shift_assignment_id) 
    WHERE shift_assignment_id IS NOT NULL
    DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger to handle shift contract template creation
DROP TRIGGER IF EXISTS on_shift_contract_template_create_require_approval ON public.shift_contract_templates;
CREATE TRIGGER on_shift_contract_template_create_require_approval
  AFTER INSERT ON public.shift_contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_shift_contract_template_create();

