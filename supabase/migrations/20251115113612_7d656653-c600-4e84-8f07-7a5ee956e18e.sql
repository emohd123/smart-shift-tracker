-- Storage Bucket Setup: Create buckets for ID cards and profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('id_cards', 'id_cards', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[]),
  ('profile_photos', 'profile_photos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/jpg']::text[]);

-- Storage RLS Policies for id_cards bucket
CREATE POLICY "Users can upload their own id cards"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id_cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own id cards"
ON storage.objects FOR SELECT
USING (bucket_id = 'id_cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own id cards"
ON storage.objects FOR UPDATE
USING (bucket_id = 'id_cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS Policies for profile_photos bucket
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_photos');

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- User Roles System: Create enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'company', 'promoter');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles Table with all user information
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone_number text,
  nationality text,
  age integer,
  gender text,
  height numeric,
  weight numeric,
  is_student boolean DEFAULT false,
  address text,
  bank_details text,
  id_card_url text,
  profile_photo_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  role text DEFAULT 'promoter' CHECK (role IN ('admin', 'company', 'promoter')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger function to create profile and assign role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with data from user metadata
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email,
    phone_number,
    nationality,
    age,
    gender,
    height,
    weight,
    is_student,
    address,
    bank_details,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'nationality',
    (NEW.raw_user_meta_data->>'age')::integer,
    NEW.raw_user_meta_data->>'gender',
    (NEW.raw_user_meta_data->>'height')::numeric,
    (NEW.raw_user_meta_data->>'weight')::numeric,
    COALESCE((NEW.raw_user_meta_data->>'is_student')::boolean, (NEW.raw_user_meta_data->>'isStudent')::boolean, false),
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'bank_details',
    COALESCE(NEW.raw_user_meta_data->>'role', 'promoter')
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'promoter'::app_role)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to execute on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Shifts Table for work assignments
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  latitude numeric,
  longitude numeric,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  pay_rate numeric NOT NULL,
  company_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  promoter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promoters can view their assigned shifts"
ON public.shifts FOR SELECT
USING (auth.uid() = promoter_id);

CREATE POLICY "Companies can view their own shifts"
ON public.shifts FOR SELECT
USING (auth.uid() = company_id);

CREATE POLICY "Companies can create shifts"
ON public.shifts FOR INSERT
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Companies can update their own shifts"
ON public.shifts FOR UPDATE
USING (auth.uid() = company_id);

CREATE POLICY "Companies can delete their own shifts"
ON public.shifts FOR DELETE
USING (auth.uid() = company_id);

CREATE POLICY "Admins can view all shifts"
ON public.shifts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Time Logs Table for tracking work hours
CREATE TABLE public.time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  check_in_time timestamptz NOT NULL,
  check_out_time timestamptz,
  total_hours numeric,
  earnings numeric,
  check_in_latitude numeric,
  check_in_longitude numeric,
  check_out_latitude numeric,
  check_out_longitude numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time logs"
ON public.time_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time logs"
ON public.time_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time logs"
ON public.time_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all time logs"
ON public.time_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Certificates Table for generated work certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reference_number text UNIQUE NOT NULL,
  certificate_type text NOT NULL,
  issue_date date NOT NULL,
  total_hours numeric NOT NULL,
  time_period text,
  promotion_names text[],
  skills_gained text[],
  position_title text,
  pdf_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  issued_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
ON public.certificates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates"
ON public.certificates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can verify certificates by reference number"
ON public.certificates FOR SELECT
USING (true);

CREATE POLICY "Admins can view all certificates"
ON public.certificates FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all certificates"
ON public.certificates FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Certificate verification logging
CREATE TABLE public.certificate_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text NOT NULL,
  verified_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Function to log certificate verification
CREATE OR REPLACE FUNCTION public.log_certificate_verification(
  ref_number text,
  ip_address text,
  user_agent text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.certificate_verifications (reference_number, ip_address, user_agent)
  VALUES (ref_number, ip_address, user_agent);
END;
$$;

-- Function to check certificate validity
CREATE OR REPLACE FUNCTION public.is_certificate_valid(ref_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.certificates
    WHERE reference_number = ref_number AND status = 'approved'
  )
$$;

-- Messages Table for chat functionality
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE
USING (auth.uid() = recipient_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Notifications Table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- User Credits Table
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  credits_balance integer DEFAULT 0,
  total_credits_purchased integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credits"
ON public.user_credits FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin Stamp Configs Table
CREATE TABLE public.admin_stamp_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company_name text,
  company_website text,
  company_email text,
  company_phone text,
  logo_url text,
  stamp_message text,
  enable_digital_signature boolean DEFAULT true,
  signature_position text DEFAULT 'bottom-right',
  stamp_opacity numeric DEFAULT 0.8,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_stamp_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage their stamp configs"
ON public.admin_stamp_configs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));