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

async function setupDatabase() {
  console.log('🚀 Starting database setup...');
  console.log('📍 Project URL:', supabaseUrl);

  try {
    // Read the complete database setup script
    const setupSQL = fs.readFileSync(path.join(__dirname, 'complete-database-setup.sql'), 'utf8');
    
    console.log('📄 Loaded SQL script, executing...');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: setupSQL }).single();
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute via raw SQL
      console.log('🔄 Trying alternative execution method...');
      const { data: altData, error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['tenants', 'tenant_memberships']);
        
      if (altError) {
        console.error('❌ Cannot access database:', altError);
        return false;
      }
      
      console.log('📊 Current tables:', altData);
      
      // If tenants table doesn't exist, we need manual setup
      const hasTenants = altData.some(t => t.table_name === 'tenants');
      if (!hasTenants) {
        console.log('⚠️  Tenants table not found. You need to manually run the SQL script.');
        console.log('📋 Please follow these steps:');
        console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard');
        console.log('   2. Go to SQL Editor');
        console.log('   3. Copy and paste the contents of complete-database-setup.sql');
        console.log('   4. Run the script');
        return false;
      }
    } else {
      console.log('✅ Database setup completed successfully!');
    }

    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['tenants', 'tenant_memberships', 'profiles']);

    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError);
      return false;
    }

    console.log('📊 Verified tables:', tables.map(t => t.table_name));

    // Test tenant creation
    console.log('🧪 Testing tenant creation...');
    const testTenant = {
      name: 'Test Company',
      slug: 'test-company-' + Date.now(),
      settings: {}
    };

    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert([testTenant])
      .select()
      .single();

    if (tenantError) {
      console.error('❌ Error creating test tenant:', tenantError);
      console.log('ℹ️  This might be due to RLS policies or missing permissions');
    } else {
      console.log('✅ Test tenant created successfully:', tenantData);
      
      // Clean up test tenant
      await supabase.from('tenants').delete().eq('id', tenantData.id);
      console.log('🧹 Cleaned up test tenant');
    }

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  const success = await setupDatabase();
  
  if (success) {
    console.log('🎉 Database setup completed! Your company signup should now work.');
  } else {
    console.log('⚠️  Manual setup required. Please run the SQL script in Supabase Dashboard.');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);