# Backend Setup (Supabase) — Smart Shift Tracker

This project’s backend is **Supabase**:
- **Database schema**: `supabase/migrations/`
- **Edge Functions**: `supabase/functions/`
- **Storage buckets + policies**: created via migrations

## What “connected to Supabase” means

- Your **frontend** is connected when your local env contains:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Your **backend** is “built” when migrations are applied and functions are deployed to the same Supabase project.

## 1) Configure frontend env (required)

Create `.env` or `.env.local` (never commit it):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

## 2) Install Supabase CLI (recommended)

Use one of:
- Install globally: `supabase` CLI
- Or run via `npx supabase@latest ...`

## 3) Link this repo to your Supabase project

From the project root:

```powershell
# PowerShell
npx -y supabase@latest link --project-ref YOUR_PROJECT_REF
```

## 4) Apply DB migrations (“build the database”)

```powershell
npx -y supabase@latest db push
```

This applies everything in `supabase/migrations/` in order (tables, RLS, policies, storage buckets, etc).

## 5) Deploy Edge Functions (“build backend logic”)

Deploy all functions:

```powershell
npx -y supabase@latest functions deploy
```

Or deploy one function:

```powershell
npx -y supabase@latest functions deploy verify-certificate
```

## 6) Set required secrets (Stripe, etc.)

If you use payments/webhooks, set secrets in Supabase (not in frontend env files):

```powershell
npx -y supabase@latest secrets set STRIPE_SECRET_KEY=YOUR_VALUE
```

## 7) Verify Storage buckets

Migrations create buckets like:
- `id_cards`
- `profile_photos`
- `company_logos`
- `certificates`

Check in Supabase Dashboard → Storage.

## Troubleshooting

- If you see auth/RLS errors, verify you’re logged in as the correct role and the policies in migrations match your intended access.
- If you use Cursor MCP, ensure MCP points to the **same** `YOUR_PROJECT_REF` as your `.env` and that MCP has a token (see `MCP_SUPABASE_FULL_ACCESS_SETUP.md`).


