-- Create admin stamp configuration table
CREATE TABLE public.admin_stamp_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL DEFAULT 'Professional Certification Authority',
  company_website text DEFAULT 'https://yourcompany.com',
  company_email text DEFAULT 'certificates@yourcompany.com', 
  company_phone text DEFAULT '+1 (555) 123-4567',
  logo_url text,
  stamp_message text NOT NULL DEFAULT 'This certificate is officially verified and authenticated.',
  enable_digital_signature boolean NOT NULL DEFAULT true,
  signature_position text NOT NULL DEFAULT 'bottom-right' CHECK (signature_position IN ('bottom-left', 'bottom-center', 'bottom-right')),
  stamp_opacity numeric NOT NULL DEFAULT 0.8 CHECK (stamp_opacity >= 0.3 AND stamp_opacity <= 1.0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_stamp_configs ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage stamp configs
CREATE POLICY "Only admins can view stamp configs"
ON public.admin_stamp_configs
FOR SELECT
USING (is_admin());

CREATE POLICY "Only admins can insert stamp configs"
ON public.admin_stamp_configs
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update stamp configs"
ON public.admin_stamp_configs
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_stamp_configs_updated_at
BEFORE UPDATE ON public.admin_stamp_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.admin_stamp_configs (id) VALUES (gen_random_uuid());