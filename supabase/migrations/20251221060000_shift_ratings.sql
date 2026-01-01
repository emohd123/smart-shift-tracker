-- Shift Ratings System
-- Allows companies to rate promoters after shift completion

-- 1) Create shift_ratings table
CREATE TABLE IF NOT EXISTS public.shift_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  shift_assignment_id uuid NOT NULL REFERENCES public.shift_assignments(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promoter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text CHECK (char_length(comment) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shift_assignment_id) -- one rating per assignment
);

-- 2) Create index for fast average rating calculation
CREATE INDEX IF NOT EXISTS idx_shift_ratings_promoter_id ON public.shift_ratings(promoter_id);
CREATE INDEX IF NOT EXISTS idx_shift_ratings_company_id ON public.shift_ratings(company_id);
CREATE INDEX IF NOT EXISTS idx_shift_ratings_shift_id ON public.shift_ratings(shift_id);

-- 3) Enable RLS
ALTER TABLE public.shift_ratings ENABLE ROW LEVEL SECURITY;

-- 4) updated_at trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_shift_ratings_updated_at ON public.shift_ratings;
    CREATE TRIGGER update_shift_ratings_updated_at
    BEFORE UPDATE ON public.shift_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 5) RLS Policies

-- SELECT: Companies can view their own ratings
CREATE POLICY "Companies can view own ratings"
ON public.shift_ratings
FOR SELECT
TO authenticated
USING (
  company_id = auth.uid()
  OR public.is_admin_like(auth.uid())
);

-- SELECT: Promoters can view ratings where they are the promoter
CREATE POLICY "Promoters can view own ratings"
ON public.shift_ratings
FOR SELECT
TO authenticated
USING (promoter_id = auth.uid());

-- INSERT: Companies can create ratings for their own shifts only
CREATE POLICY "Companies can create ratings for own shifts"
ON public.shift_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be the company that owns the shift
  (
    company_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.shifts s
      WHERE s.id = shift_id
        AND s.company_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.shift_assignments sa
      WHERE sa.id = shift_assignment_id
        AND sa.shift_id = shift_id
        AND sa.promoter_id = shift_ratings.promoter_id
    )
  )
  OR public.is_admin_like(auth.uid())
);

-- UPDATE: Companies can update their own ratings (but not delete)
CREATE POLICY "Companies can update own ratings"
ON public.shift_ratings
FOR UPDATE
TO authenticated
USING (
  company_id = auth.uid()
  OR public.is_admin_like(auth.uid())
);

-- No DELETE policy - ratings are permanent

-- 6) Function to calculate promoter's average rating
CREATE OR REPLACE FUNCTION public.get_promoter_average_rating(promoter_uuid uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ROUND(AVG(rating)::numeric, 2)
  FROM public.shift_ratings
  WHERE promoter_id = promoter_uuid
$$;

-- 7) Function to get promoter rating stats (average and count)
CREATE OR REPLACE FUNCTION public.get_promoter_rating_stats(promoter_uuid uuid)
RETURNS TABLE(average_rating numeric, total_ratings bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROUND(AVG(rating)::numeric, 2) as average_rating,
    COUNT(*) as total_ratings
  FROM public.shift_ratings
  WHERE promoter_id = promoter_uuid
$$;
