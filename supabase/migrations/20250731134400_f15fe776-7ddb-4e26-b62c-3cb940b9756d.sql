-- Create comprehensive shift management system

-- Create shift_applications table for promoters to apply to shifts
CREATE TABLE public.shift_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  promoter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_date timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  cover_letter text,
  admin_notes text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(shift_id, promoter_id)
);

-- Enable RLS on shift_applications
ALTER TABLE public.shift_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for shift_applications
CREATE POLICY "Promoters can view their own applications" 
ON public.shift_applications 
FOR SELECT 
USING (promoter_id = auth.uid());

CREATE POLICY "Promoters can create applications" 
ON public.shift_applications 
FOR INSERT 
WITH CHECK (promoter_id = auth.uid());

CREATE POLICY "Promoters can update their pending applications" 
ON public.shift_applications 
FOR UPDATE 
USING (promoter_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can view all applications" 
ON public.shift_applications 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update applications" 
ON public.shift_applications 
FOR UPDATE 
USING (public.is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_shift_applications_updated_at
BEFORE UPDATE ON public.shift_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update shifts table to add more fields for better management
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS requirements text[],
ADD COLUMN IF NOT EXISTS max_promoters integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS application_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_email text;

-- Create a view for shifts with application counts
CREATE OR REPLACE VIEW public.shifts_with_stats AS
SELECT 
  s.*,
  COALESCE(app_stats.total_applications, 0) as total_applications,
  COALESCE(app_stats.approved_applications, 0) as approved_applications,
  COALESCE(app_stats.pending_applications, 0) as pending_applications,
  CASE 
    WHEN s.max_promoters > 0 AND COALESCE(app_stats.approved_applications, 0) >= s.max_promoters 
    THEN true 
    ELSE false 
  END as is_full
FROM public.shifts s
LEFT JOIN (
  SELECT 
    shift_id,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_applications,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_applications
  FROM public.shift_applications
  GROUP BY shift_id
) app_stats ON s.id = app_stats.shift_id;

-- Grant access to the view
GRANT SELECT ON public.shifts_with_stats TO authenticated;

-- Create function to auto-approve applications if shift needs more people
CREATE OR REPLACE FUNCTION public.auto_approve_shift_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-approve if shift has space and is not urgent
  IF EXISTS (
    SELECT 1 FROM public.shifts 
    WHERE id = NEW.shift_id 
    AND max_promoters > (
      SELECT COUNT(*) FROM public.shift_applications 
      WHERE shift_id = NEW.shift_id AND status = 'approved'
    )
  ) THEN
    -- Update the shift_assignments table
    INSERT INTO public.shift_assignments (shift_id, promoter_id)
    VALUES (NEW.shift_id, NEW.promoter_id)
    ON CONFLICT (shift_id, promoter_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update shift assignments when application is approved
CREATE TRIGGER on_application_approved
AFTER UPDATE OF status ON public.shift_applications
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
EXECUTE FUNCTION public.auto_approve_shift_application();

-- Create notification function for new shift applications
CREATE OR REPLACE FUNCTION public.notify_shift_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for admins when new application is created
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT 
    p.id,
    'New Shift Application',
    'A promoter has applied for shift: ' || s.title,
    'shift_application',
    NEW.id::text
  FROM public.profiles p, public.shifts s
  WHERE p.role = 'admin' AND s.id = NEW.shift_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for notifications on new applications
CREATE TRIGGER on_new_shift_application
AFTER INSERT ON public.shift_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_shift_application();