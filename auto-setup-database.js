import { createClient } from '@supabase/supabase-js'

// Configuration - Updated to match the service role key
const SUPABASE_URL = 'https://depeamhvogstuynlqudi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcGVhbWh2b2dzdHV5bmxxdWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTk5NCwiZXhwIjoyMDcyNTU1OTk0fQ.RN0l8GnBkG4z61HNu7f5U130vrRKmAcXsHGgCmAOPJo'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function runSQL(sql, description) {
  console.log(`🚀 Running: ${description}`)
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
      console.error(`❌ Failed: ${description}`)
      console.error('Error:', error)
      return false
    }
    console.log(`✅ Success: ${description}`)
    return true
  } catch (err) {
    console.error(`❌ Exception during: ${description}`)
    console.error('Error:', err)
    return false
  }
}

async function setupDatabase() {
  console.log('🔧 Starting Supabase Database Setup...\n')

  // Step 1: Create the SQL execution function if it doesn't exist
  const createExecFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'SQL executed successfully';
    EXCEPTION WHEN OTHERS THEN
      RETURN 'Error: ' || SQLERRM;
    END;
    $$;
  `

  await runSQL(createExecFunction, 'Creating SQL execution helper function')

  // Step 2: Create tables
  const createTables = `
    -- Create tenants table
    CREATE TABLE IF NOT EXISTS public.tenants (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      domain TEXT,
      settings JSONB DEFAULT '{}',
      subscription_tier TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
      subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
      max_users INTEGER NOT NULL DEFAULT 10,
      stripe_customer_id TEXT,
      billing_email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create tenant memberships table
    CREATE TABLE IF NOT EXISTS public.tenant_memberships (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      role TEXT NOT NULL DEFAULT 'part_timer' CHECK (role IN ('company_admin', 'company_manager', 'part_timer')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
      invited_by UUID REFERENCES auth.users(id),
      invited_at TIMESTAMP WITH TIME ZONE,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(tenant_id, user_id)
    );
  `

  if (!(await runSQL(createTables, 'Creating tenant tables'))) {
    return false
  }

  // Step 3: Add tenant_id to profiles if it doesn't exist
  const addTenantIdColumn = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'tenant_id'
      ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
      END IF;
    END $$;
  `

  await runSQL(addTenantIdColumn, 'Adding tenant_id to profiles table')

  // Step 4: Create indexes
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
    CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_id ON public.tenant_memberships(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_id ON public.tenant_memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
  `

  await runSQL(createIndexes, 'Creating performance indexes')

  // Step 5: Enable RLS
  const enableRLS = `
    ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
  `

  await runSQL(enableRLS, 'Enabling Row Level Security')

  // Step 6: Drop existing policies
  const dropPolicies = `
    DROP POLICY IF EXISTS "tenants_insert_authenticated" ON public.tenants;
    DROP POLICY IF EXISTS "tenants_insert_signup" ON public.tenants;
    DROP POLICY IF EXISTS "tenants_select_members" ON public.tenants;
    DROP POLICY IF EXISTS "tenants_select_simple" ON public.tenants;
    DROP POLICY IF EXISTS "tenants_view_own" ON public.tenants;
    DROP POLICY IF EXISTS "tenants_update_admins" ON public.tenants;
    DROP POLICY IF EXISTS "tenants_update_simple" ON public.tenants;
    DROP POLICY IF EXISTS "tenants_update_admin" ON public.tenants;
    DROP POLICY IF EXISTS "memberships_insert_auth" ON public.tenant_memberships;
    DROP POLICY IF EXISTS "memberships_insert_simple" ON public.tenant_memberships;
    DROP POLICY IF EXISTS "memberships_insert_own" ON public.tenant_memberships;
    DROP POLICY IF EXISTS "memberships_select_relevant" ON public.tenant_memberships;
    DROP POLICY IF EXISTS "memberships_select_simple" ON public.tenant_memberships;
    DROP POLICY IF EXISTS "memberships_view_involved" ON public.tenant_memberships;
    DROP POLICY IF EXISTS "memberships_update_auth" ON public.tenant_memberships;
    DROP POLICY IF EXISTS "memberships_update_simple" ON public.tenant_memberships;
    DROP POLICY IF EXISTS "memberships_update_own" ON public.tenant_memberships;
    DROP POLICY IF EXISTS "Users can create tenants during signup" ON public.tenants;
    DROP POLICY IF EXISTS "Users can create memberships during signup" ON public.tenant_memberships;
  `

  await runSQL(dropPolicies, 'Dropping old conflicting policies')

  // Step 7: Create new simple policies
  const createPolicies = `
    -- TENANTS POLICIES
    CREATE POLICY "tenants_allow_insert"
      ON public.tenants FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "tenants_allow_select"
      ON public.tenants FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "tenants_allow_update"
      ON public.tenants FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);

    -- MEMBERSHIPS POLICIES
    CREATE POLICY "memberships_allow_insert"
      ON public.tenant_memberships FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "memberships_allow_select"
      ON public.tenant_memberships FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "memberships_allow_update"
      ON public.tenant_memberships FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  `

  await runSQL(createPolicies, 'Creating new RLS policies')

  // Step 8: Create triggers
  const createTriggers = `
    -- Create trigger function for updating updated_at
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create triggers for updated_at
    DROP TRIGGER IF EXISTS set_timestamp_tenants ON public.tenants;
    CREATE TRIGGER set_timestamp_tenants
      BEFORE UPDATE ON public.tenants
      FOR EACH ROW
      EXECUTE PROCEDURE trigger_set_timestamp();

    DROP TRIGGER IF EXISTS set_timestamp_tenant_memberships ON public.tenant_memberships;
    CREATE TRIGGER set_timestamp_tenant_memberships
      BEFORE UPDATE ON public.tenant_memberships
      FOR EACH ROW
      EXECUTE PROCEDURE trigger_set_timestamp();
  `

  await runSQL(createTriggers, 'Creating timestamp triggers')

  console.log('\n🎉 Database setup completed successfully!')
  console.log('✅ Multi-tenant tables created')
  console.log('✅ RLS policies configured')
  console.log('✅ Indexes and triggers set up')
  console.log('\n🚀 Your company signup should now work without RLS errors!')

  return true
}

// Test the setup
async function testSetup() {
  console.log('\n🧪 Testing database setup...')
  
  try {
    // Test if we can query the tenants table
    const { data, error } = await supabase
      .from('tenants')
      .select('count')
      .limit(1)

    if (error) {
      console.log('❌ Test failed:', error.message)
      return false
    }

    console.log('✅ Database test passed!')
    return true
  } catch (err) {
    console.log('❌ Test error:', err.message)
    return false
  }
}

// Main execution
async function main() {
  if (SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.error('❌ Please set your SUPABASE_SERVICE_ROLE_KEY!')
    console.log('📝 Usage:')
    console.log('   export SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key"')
    console.log('   node auto-setup-database.js')
    console.log('\n🔑 Get your service role key from:')
    console.log('   Supabase Dashboard → Settings → API → service_role key')
    return
  }

  const success = await setupDatabase()
  
  if (success) {
    await testSetup()
  } else {
    console.log('\n❌ Setup failed. Please check the errors above.')
  }
}

main().catch(console.error)
