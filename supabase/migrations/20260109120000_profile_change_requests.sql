-- Migration: Create profile_change_requests table
-- Allows admins to request profile changes from promoters and companies

-- =============================================
-- CREATE PROFILE_CHANGE_REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profile_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type text NOT NULL CHECK (request_type IN ('file_upload', 'profile_info', 'document', 'other')),
  field_name text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_user_id ON public.profile_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_status ON public.profile_change_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_created_at ON public.profile_change_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_requested_by ON public.profile_change_requests(requested_by);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_profile_change_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_change_requests_updated_at
  BEFORE UPDATE ON public.profile_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_change_requests_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view own change requests" ON public.profile_change_requests;
CREATE POLICY "Users can view own change requests" 
  ON public.profile_change_requests FOR SELECT 
  USING (user_id = auth.uid());

-- Admins can view all requests
DROP POLICY IF EXISTS "Admins can view all change requests" ON public.profile_change_requests;
CREATE POLICY "Admins can view all change requests" 
  ON public.profile_change_requests FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create requests
DROP POLICY IF EXISTS "Admins can create change requests" ON public.profile_change_requests;
CREATE POLICY "Admins can create change requests" 
  ON public.profile_change_requests FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND requested_by = auth.uid()
  );

-- Users can update status of their own requests
DROP POLICY IF EXISTS "Users can update own request status" ON public.profile_change_requests;
CREATE POLICY "Users can update own request status" 
  ON public.profile_change_requests FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Users can only update status field
      OLD.status != NEW.status OR
      -- Or admins can update any field
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Admins can update any request
DROP POLICY IF EXISTS "Admins can update any change request" ON public.profile_change_requests;
CREATE POLICY "Admins can update any change request" 
  ON public.profile_change_requests FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can delete their own resolved/dismissed requests
DROP POLICY IF EXISTS "Users can delete own resolved requests" ON public.profile_change_requests;
CREATE POLICY "Users can delete own resolved requests" 
  ON public.profile_change_requests FOR DELETE 
  USING (
    user_id = auth.uid() 
    AND status IN ('resolved', 'dismissed')
  );

-- Admins can delete any request
DROP POLICY IF EXISTS "Admins can delete any change request" ON public.profile_change_requests;
CREATE POLICY "Admins can delete any change request" 
  ON public.profile_change_requests FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE public.profile_change_requests IS 'Stores admin requests for profile changes from users';
COMMENT ON COLUMN public.profile_change_requests.request_type IS 'Type of request: file_upload, profile_info, document, other';
COMMENT ON COLUMN public.profile_change_requests.field_name IS 'Name of the field that needs to be fixed (e.g., id_card, profile_photo, company_name)';
COMMENT ON COLUMN public.profile_change_requests.status IS 'Request status: pending, in_progress, resolved, dismissed';
