-- Online contracts + payment status
-- - Company maintains a reusable contract template
-- - Promoter signs once per company
-- - Shift assignment can track payment: scheduled/paid

-- 1) Add super_admin to role system (used by has_role)
DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Keep profiles.role check in sync (profiles.role is a text column)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'super_admin', 'company', 'promoter'));

-- Helper predicate for admin-like access
CREATE OR REPLACE FUNCTION public.is_admin_like(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'super_admin'::public.app_role)
$$;

-- 2) Company contract templates
CREATE TABLE IF NOT EXISTS public.company_contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Company Contract',
  body_markdown text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- one active template per company
CREATE UNIQUE INDEX IF NOT EXISTS company_contract_templates_one_active_per_company
  ON public.company_contract_templates(company_id)
  WHERE is_active;

ALTER TABLE public.company_contract_templates ENABLE ROW LEVEL SECURITY;

-- Company can manage its own templates
CREATE POLICY "Company can manage own contract templates"
ON public.company_contract_templates
FOR ALL
TO authenticated
USING (auth.uid() = company_id OR public.is_admin_like(auth.uid()))
WITH CHECK (auth.uid() = company_id OR public.is_admin_like(auth.uid()));

-- Promoters can read active contract template for companies where they are assigned a shift
CREATE POLICY "Promoters can read contract template for assigned companies"
ON public.company_contract_templates
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    public.is_admin_like(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.shift_assignments sa
      JOIN public.shifts s ON s.id = sa.shift_id
      WHERE sa.promoter_id = auth.uid()
        AND s.company_id = company_contract_templates.company_id
    )
  )
);

-- updated_at trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_company_contract_templates_updated_at ON public.company_contract_templates;
    CREATE TRIGGER update_company_contract_templates_updated_at
    BEFORE UPDATE ON public.company_contract_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Contract acceptances (sign once per company)
CREATE TABLE IF NOT EXISTS public.company_contract_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promoter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.company_contract_templates(id) ON DELETE RESTRICT,
  signature_text text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  accept_ip inet,
  accept_user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, promoter_id)
);

ALTER TABLE public.company_contract_acceptances ENABLE ROW LEVEL SECURITY;

-- Promoters can read their own acceptance
CREATE POLICY "Promoters can read own contract acceptance"
ON public.company_contract_acceptances
FOR SELECT
TO authenticated
USING (promoter_id = auth.uid() OR public.is_admin_like(auth.uid()));

-- Company can read acceptances for its company
CREATE POLICY "Company can read acceptances for own company"
ON public.company_contract_acceptances
FOR SELECT
TO authenticated
USING (company_id = auth.uid() OR public.is_admin_like(auth.uid()));

-- Promoters can insert their own acceptance (must match active template for that company)
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

-- 4) Shift assignment payment status
CREATE TABLE IF NOT EXISTS public.shift_assignment_payment_status (
  assignment_id uuid PRIMARY KEY REFERENCES public.shift_assignments(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('scheduled', 'paid')),
  scheduled_at timestamptz,
  paid_at timestamptz,
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_assignment_payment_status ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_shift_assignment_payment_status_updated_at ON public.shift_assignment_payment_status;
    CREATE TRIGGER update_shift_assignment_payment_status_updated_at
    BEFORE UPDATE ON public.shift_assignment_payment_status
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Select: promoter sees own assignments; company sees their shifts; admins see all
CREATE POLICY "Read payment status for related assignments"
ON public.shift_assignment_payment_status
FOR SELECT
TO authenticated
USING (
  public.is_admin_like(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.shift_assignments sa
    WHERE sa.id = shift_assignment_payment_status.assignment_id
      AND sa.promoter_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.shift_assignments sa
    JOIN public.shifts s ON s.id = sa.shift_id
    WHERE sa.id = shift_assignment_payment_status.assignment_id
      AND s.company_id = auth.uid()
  )
);

-- Company/admin can upsert/update payment status for their assignments
CREATE POLICY "Company can manage payment status for own shifts"
ON public.shift_assignment_payment_status
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_like(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.shift_assignments sa
    JOIN public.shifts s ON s.id = sa.shift_id
    WHERE sa.id = shift_assignment_payment_status.assignment_id
      AND s.company_id = auth.uid()
  )
);

CREATE POLICY "Company can update payment status for own shifts"
ON public.shift_assignment_payment_status
FOR UPDATE
TO authenticated
USING (
  public.is_admin_like(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.shift_assignments sa
    JOIN public.shifts s ON s.id = sa.shift_id
    WHERE sa.id = shift_assignment_payment_status.assignment_id
      AND s.company_id = auth.uid()
  )
);


