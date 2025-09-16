import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk4MjUsImV4cCI6MjA3MjU1NTgyNX0.cnozRMnDLTsdMRs5-Uql38x5uZTh7l4WZuSSs4-H-34';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Direct Database Setup for Smart Shift Tracker');
console.log('=================================================');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Using provided credentials');
console.log('');

// SQL statements to execute
const setupStatements = [
  {
    name: 'Create Tenants Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
        domain TEXT UNIQUE CHECK (domain IS NULL OR domain ~ '^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$'),
        settings JSONB NOT NULL DEFAULT '{}',
        subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
        subscription_status TEXT CHECK (subscription_status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
        max_users INTEGER NOT NULL DEFAULT 50 CHECK (max_users > 0),
        stripe_customer_id TEXT UNIQUE,
        billing_email TEXT CHECK (billing_email IS NULL OR billing_email ~ '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `
  },
  {
    name: 'Create Tenant Memberships Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.tenant_memberships (
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
    `
  },
  {
    name: 'Create Indexes',
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
      CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON public.tenants(subscription_tier, subscription_status);
      CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON public.tenant_memberships(tenant_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role ON public.tenant_memberships(tenant_id, role);
    `
  },
  {
    name: 'Enable Row Level Security',
    sql: `
      ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
    `
  },
  {
    name: 'Create Tenant Insert Policy',
    sql: `
      DROP POLICY IF EXISTS "Users can create tenants during signup" ON public.tenants;
      CREATE POLICY "Users can create tenants during signup"
        ON public.tenants FOR INSERT
        TO authenticated
        WITH CHECK (true);
    `
  },
  {
    name: 'Create Membership Insert Policy',
    sql: `
      DROP POLICY IF EXISTS "Users can create memberships during signup" ON public.tenant_memberships;
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
    `
  },
  {
    name: 'Create Tenant Select Policy',
    sql: `
      DROP POLICY IF EXISTS "tenant_select_own" ON public.tenants;
      CREATE POLICY "tenant_select_own"
        ON public.tenants FOR SELECT
        USING (id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND status = 'active'));
    `
  },
  {
    name: 'Create Membership Select Policy',
    sql: `
      DROP POLICY IF EXISTS "membership_select_own_and_tenant_admins" ON public.tenant_memberships;
      CREATE POLICY "membership_select_own_and_tenant_admins"
        ON public.tenant_memberships FOR SELECT
        USING (
          user_id = auth.uid() OR 
          tenant_id IN (SELECT tenant_id FROM public.tenant_memberships 
                        WHERE user_id = auth.uid() AND role IN ('company_admin', 'company_manager') AND status = 'active')
        );
    `
  }
];

async function executeSQL(statement) {
  try {
    console.log(`📝 ${statement.name}...`);
    
    // Use the rpc method to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: statement.sql 
    });
    
    if (error) {
      // If exec_sql doesn't exist, try alternative approach
      if (error.code === 'PGRST202') {
        console.log(`   ℹ️  Direct SQL execution not available, statement may need manual execution`);
        return { success: false, needsManual: true };
      }
      throw error;
    }
    
    console.log(`   ✅ ${statement.name} completed successfully`);
    return { success: true };
    
  } catch (error) {
    console.log(`   ❌ ${statement.name} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDatabase() {
  console.log('\n🧪 Testing Database Setup');
  console.log('=========================');
  
  try {
    // Test tenants table access
    console.log('1️⃣  Testing tenants table...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    if (tenantsError) {
      console.log(`   ❌ Tenants table error: ${tenantsError.message}`);
      return false;
    } else {
      console.log('   ✅ Tenants table accessible');
    }
    
    // Test tenant_memberships table access
    console.log('2️⃣  Testing tenant_memberships table...');
    const { data: memberships, error: membershipsError } = await supabase
      .from('tenant_memberships')
      .select('id')
      .limit(1);
    
    if (membershipsError) {
      console.log(`   ❌ Tenant_memberships table error: ${membershipsError.message}`);
      return false;
    } else {
      console.log('   ✅ Tenant_memberships table accessible');
    }
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Database test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  let successCount = 0;
  let failureCount = 0;
  let needsManualCount = 0;
  
  // Execute all setup statements
  for (const statement of setupStatements) {
    const result = await executeSQL(statement);
    
    if (result.success) {
      successCount++;
    } else if (result.needsManual) {
      needsManualCount++;
    } else {
      failureCount++;
    }
    
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Setup Results');
  console.log('=================');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`⚠️  Needs Manual: ${needsManualCount}`);
  
  // Test the database
  const testResult = await testDatabase();
  
  console.log('\n🎯 Final Status');
  console.log('===============');
  
  if (testResult) {
    console.log('🎉 SUCCESS! Database is set up and working!');
    console.log('✅ You can now test company signup functionality');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Try creating a company in your app');
    console.log('   2. The "Could not find table" error should be resolved');
    return true;
  } else {
    console.log('❌ Database setup incomplete');
    console.log('');
    console.log('📋 Manual setup required:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/znjtryqrqxjghvvdlvdg/sql/new');
    console.log('   2. Copy and paste the contents of complete-database-setup.sql');
    console.log('   3. Click Run');
    console.log('   4. Test again: node verify-database.js');
    return false;
  }
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});