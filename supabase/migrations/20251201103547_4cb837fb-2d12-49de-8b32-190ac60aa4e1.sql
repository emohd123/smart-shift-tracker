-- Add approval columns to shift_assignments
ALTER TABLE shift_assignments 
ADD COLUMN IF NOT EXISTS certificate_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- Create index for faster queries on approved shifts
CREATE INDEX IF NOT EXISTS idx_shift_assignments_approved ON shift_assignments(certificate_approved);

-- RLS Policy: Companies can update certificate approval for their shifts
CREATE POLICY "Companies can approve certificates for their shifts"
ON shift_assignments
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT shifts.company_id
    FROM shifts
    WHERE shifts.id = shift_assignments.shift_id
  )
);

-- RLS Policy: Promoters can view their approval status
CREATE POLICY "Promoters can view their certificate approval status"
ON shift_assignments
FOR SELECT
USING (auth.uid() = promoter_id);

-- Create storage bucket for company logos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_logos', 'company_logos', true)
ON CONFLICT (id) DO NOTHING;