import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk4MjUsImV4cCI6MjA3MjU1NTgyNX0.cnozRMnDLTsdMRs5-Uql38x5uZTh7l4WZuSSs4-H-34';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLStatements() {
  console.log('🚀 Setting up database with individual SQL statements...');
  
  const sqlStatements = [
    // Create tenants table
    `CREATE TABLE IF NOT EXISTS public.tenants (
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
    );`,

    // Create tenant_memberships table
    `CREATE TABLE IF NOT EXISTS public.tenant_memberships (
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
    );`,

    // Enable RLS
    'ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;',
  ];

  // Execute each statement individually using the REST API
  for (const [index, sql] of sqlStatements.entries()) {
    console.log(`📝 Executing statement ${index + 1}/${sqlStatements.length}...`);
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`⚠️  Statement ${index + 1} may have failed or already exists:`, error);
      } else {
        console.log(`✅ Statement ${index + 1} executed successfully`);
      }
    } catch (error) {
      console.log(`⚠️  Error with statement ${index + 1}:`, error.message);
    }
  }

  // Test if we can access tenants table now
  console.log('🧪 Testing tenants table access...');
  try {
    const { data, error } = await supabase.from('tenants').select('id').limit(1);
    if (error) {
      console.log('❌ Cannot access tenants table:', error.message);
      return false;
    } else {
      console.log('✅ Tenants table accessible!');
      return true;
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Smart Shift Tracker - Database Setup');
  console.log('🔗 Connecting to:', supabaseUrl);
  
  const success = await executeSQLStatements();
  
  if (success) {
    console.log('');
    console.log('🎉 Database setup completed successfully!');
    console.log('✅ Your company signup should now work.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Test company signup functionality');
  } else {
    console.log('');
    console.log('⚠️  Automatic setup could not complete.');
    console.log('📋 Please manually run the complete-database-setup.sql script in Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/znjtryqrqxjghvvdlvdg/sql/new');
    console.log('   2. Copy and paste the contents of complete-database-setup.sql');
    console.log('   3. Click Run');
  }
}

main().catch(console.error);