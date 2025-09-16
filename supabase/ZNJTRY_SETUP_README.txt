Steps to initialize the znjtry Supabase project

1) Open https://znjtryqrqxjghvvdlvdg.supabase.co/dashboard
2) Go to SQL Editor.
3) Open the file supabase/ZNJTRY_INITIAL_SETUP.sql from this repo and paste it into the editor.
4) Run it. It is safe to run multiple times.

What this does
- Creates public.tenants and public.tenant_memberships tables.
- Enables RLS and installs safe, non-recursive policies.
- Adds helper functions (get_current_tenant_id, is_tenant_admin) and timestamp triggers.
- Optionally wires profiles/shifts with tenant_id and policies if those tables already exist.

After running, re-run the local diagnosis:
- From the repo root, run: node diagnose-supabase.js
  (This checks reachability, table existence, and simple inserts.)

If you still see "Auth service not reachable" in diagnose output:
- Wait 1-2 minutes; sometimes the endpoint cache takes a moment.
- Confirm the project URL in .env matches the dashboard project.
- Confirm the Anon and Service Role keys match the ones in Settings > API.