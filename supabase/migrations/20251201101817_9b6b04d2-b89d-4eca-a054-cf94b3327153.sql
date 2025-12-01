-- Create company certificate configurations table
CREATE TABLE company_certificate_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company_profiles(user_id) ON DELETE CASCADE,
  stamp_message TEXT DEFAULT 'This certificate is officially verified and authenticated.',
  enable_digital_signature BOOLEAN DEFAULT true,
  signature_position TEXT DEFAULT 'bottom-right' CHECK (signature_position IN ('bottom-left', 'bottom-center', 'bottom-right')),
  stamp_opacity NUMERIC DEFAULT 0.8 CHECK (stamp_opacity >= 0 AND stamp_opacity <= 1),
  custom_footer_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE company_certificate_configs ENABLE ROW LEVEL SECURITY;

-- Companies can manage their own configs
CREATE POLICY "Companies can manage their own certificate configs"
  ON company_certificate_configs
  FOR ALL
  USING (
    company_id IN (
      SELECT user_id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can view all configs
CREATE POLICY "Admins can view all certificate configs"
  ON company_certificate_configs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_company_certificate_configs_company_id ON company_certificate_configs(company_id);