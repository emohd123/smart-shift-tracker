-- Create company_logos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_logos', 'company_logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for company_logos bucket
CREATE POLICY "Companies can upload their own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company_logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view company logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company_logos');

CREATE POLICY "Companies can update their own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company_logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Companies can delete their own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company_logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);