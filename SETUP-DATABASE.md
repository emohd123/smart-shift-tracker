# Database Setup Instructions

## Quick Setup (Required)

Your database needs the multi-tenant tables to be created. Follow these steps:

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/znjtryqrqxjghvvdlvdg
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run the Database Setup Script

Copy and paste the **entire contents** of `complete-database-setup.sql` into the SQL editor and click "Run".

This will create:
- ✅ `tenants` table (companies/organizations)
- ✅ `tenant_memberships` table (user-tenant relationships)
- ✅ Row Level Security policies
- ✅ Helper functions
- ✅ Proper indexes

### Step 3: Verify Setup

After running the script, you should see a success message. You can verify by running this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'tenant_memberships')
ORDER BY table_name;
```

Expected result: You should see both `tenants` and `tenant_memberships` tables listed.

## Alternative: Manual Table Creation

If you prefer to create tables step by step, run these commands one by one:

### 1. Create Tenants Table
```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  domain TEXT UNIQUE CHECK (domain IS NULL OR domain ~ '^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'),
  settings JSONB NOT NULL DEFAULT '{}',
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
  max_users INTEGER NOT NULL DEFAULT 50 CHECK (max_users > 0),
  stripe_customer_id TEXT UNIQUE,
  billing_email TEXT CHECK (billing_email IS NULL OR billing_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2. Create Tenant Memberships Table
```sql
CREATE TABLE public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('company_admin', 'company_manager', 'part_timer')) DEFAULT 'part_timer',
  status TEXT NOT NULL CHECK (status IN ('active', 'invited', 'suspended')) DEFAULT 'active',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
```

### 3. Enable Row Level Security
```sql
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
```

### 4. Create Signup Policies
```sql
CREATE POLICY "Users can create tenants during signup"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can create memberships during signup"
  ON public.tenant_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'company_admin' 
      AND status = 'active'
    )
  );
```

## After Setup

Once the database is set up:

1. Run `npm run dev` to start your development server
2. Test the company signup functionality
3. The error "Could not find the table 'public.tenants'" should be resolved

## Troubleshooting

If you still get errors after setup:

1. Check that the tables exist:
   ```sql
   \dt public.*
   ```

2. Verify RLS is enabled:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('tenants', 'tenant_memberships');
   ```

3. Check policies exist:
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

## Project Configuration

Your Supabase project is configured as:
- **Project URL**: `https://znjtryqrqxjghvvdlvdg.supabase.co`
- **Anon Key**: Already configured in `.env.local`

The database setup is required for the multi-tenant SaaS functionality to work properly.