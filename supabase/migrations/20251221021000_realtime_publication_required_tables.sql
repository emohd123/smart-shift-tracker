-- Ensure tables used by the app's realtime subscriptions are in supabase_realtime publication.
-- Safe/idempotent: checks pg_publication_rel before ALTER PUBLICATION.

DO $$
DECLARE
  pub_oid oid;
  rel_oid oid;
BEGIN
  SELECT oid INTO pub_oid FROM pg_publication WHERE pubname = 'supabase_realtime';
  IF pub_oid IS NULL THEN
    RAISE NOTICE 'Publication supabase_realtime not found; skipping.';
    RETURN;
  END IF;

  -- public.shifts
  SELECT c.oid INTO rel_oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'shifts';

  IF rel_oid IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_publication_rel WHERE prpubid = pub_oid AND prrelid = rel_oid
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
  END IF;

  -- public.profiles
  SELECT c.oid INTO rel_oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'profiles';

  IF rel_oid IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_publication_rel WHERE prpubid = pub_oid AND prrelid = rel_oid
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;


