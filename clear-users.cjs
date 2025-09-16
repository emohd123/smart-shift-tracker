const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bsqwtvdmvcmucpkajhpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXd0dmRtdmNtdWNwa2FqaHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzOTkyNzYsImV4cCI6MjA1Mzk3NTI3Nn0.2e1QKHnLqRoqkdLhJKvnyxeB3b8_cCwcdmvQWGM-VJI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllUsers() {
  try {
    console.log('🧹 Clearing all user data for fresh testing...\n');

    // Step 1: Get current state
    console.log('📊 Step 1: Checking current user data...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role');
    
    if (profilesError) {
      console.log('⚠️ Cannot access profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profiles to delete`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} (${profile.full_name}) - ${profile.role}`);
        });
      }
    }

    // Step 2: Clear profiles table
    console.log('\n🗑️ Step 2: Clearing profiles table...');
    
    const { error: deleteProfilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteProfilesError) {
      console.log('❌ Error deleting profiles:', deleteProfilesError.message);
    } else {
      console.log('✅ Profiles table cleared');
    }

    // Step 3: Try to clear tenant memberships (if accessible)
    console.log('\n🗑️ Step 3: Clearing tenant memberships...');
    
    const { error: deleteMembershipsError } = await supabase
      .from('tenant_memberships')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteMembershipsError) {
      console.log('⚠️ Cannot clear tenant memberships:', deleteMembershipsError.message);
    } else {
      console.log('✅ Tenant memberships cleared');
    }

    // Step 4: Try to clear shifts (if any exist)
    console.log('\n🗑️ Step 4: Clearing shifts data...');
    
    const { error: deleteShiftsError } = await supabase
      .from('shifts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteShiftsError) {
      console.log('⚠️ Cannot clear shifts:', deleteShiftsError.message);
    } else {
      console.log('✅ Shifts cleared');
    }

    // Step 5: Clear certificates (if any exist)
    console.log('\n🗑️ Step 5: Clearing certificates...');
    
    const { error: deleteCertsError } = await supabase
      .from('certificates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteCertsError) {
      console.log('⚠️ Cannot clear certificates:', deleteCertsError.message);
    } else {
      console.log('✅ Certificates cleared');
    }

    // Step 6: Try to clear some tenants (keep system ones)
    console.log('\n🗑️ Step 6: Clearing test tenants...');
    
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, name, slug');
    
    if (tenants && tenants.length > 0) {
      console.log(`Found ${tenants.length} tenants:`);
      for (const tenant of tenants) {
        // Only delete tenants that look like test data
        if (tenant.name?.includes('Test') || tenant.slug?.includes('test') || tenant.slug?.includes('svc-')) {
          const { error: deleteTenantError } = await supabase
            .from('tenants')
            .delete()
            .eq('id', tenant.id);
          
          if (deleteTenantError) {
            console.log(`⚠️ Cannot delete tenant ${tenant.name}:`, deleteTenantError.message);
          } else {
            console.log(`✅ Deleted test tenant: ${tenant.name}`);
          }
        }
      }
    }

    // Step 7: Final verification
    console.log('\n📊 Step 7: Verifying cleanup...');
    
    const { data: remainingProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email');
    
    if (verifyError) {
      console.log('⚠️ Cannot verify cleanup:', verifyError.message);
    } else {
      console.log(`✅ Profiles remaining: ${remainingProfiles?.length || 0}`);
    }

    console.log('\n🎉 User data cleanup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. 🌐 Go to http://localhost:8081/');
    console.log('2. ✍️ Click "Sign Up" to create a new account');
    console.log('3. 📝 Fill in all form fields (name, email, nationality, age, etc.)');
    console.log('4. ✅ Test that signup creates profile and redirects to dashboard');
    console.log('5. 🔍 Verify dashboard shows all your information');

  } catch (error) {
    console.error('💥 Cleanup error:', error.message);
  }
}

clearAllUsers();
