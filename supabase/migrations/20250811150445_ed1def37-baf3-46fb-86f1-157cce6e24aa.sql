-- Remove Jobs module tables safely
-- Note: This will drop job_applications first due to FK dependency on job_postings

-- Revoke realtime before drop (optional safety)
-- Not strictly necessary, but harmless if publication exists
-- alter publication supabase_realtime drop table if exists public.job_applications;
-- alter publication supabase_realtime drop table if exists public.job_postings;

-- Drop tables if they exist
DROP TABLE IF EXISTS public.job_applications;
DROP TABLE IF EXISTS public.job_postings;

-- Clean up any leftover functions or policies referencing jobs (no-ops if absent)
DO $$
BEGIN
  -- Remove helper function is_job_owner if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_job_owner'
  ) THEN
    DROP FUNCTION public.is_job_owner(uuid);
  END IF;
END $$;
