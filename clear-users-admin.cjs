const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bsqwtvdmvcmucpkajhpv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXd0dmRtdmNtdWNwa2FqaHB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODM5OTI3NiwiZXhwIjoyMDUzOTc1Mjc2fQ.xxCrG0GYo1QElHHX4o3l9sQQacZUayEtGJ1oFYx4f-o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAllUsersAdmin() {
  try {
    console.log('🧹 Clearing all user data with admin access...\n');

    // Step 1: Get current profiles
    console.log('📊 Step 1: Checking current profiles...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.log('❌ Error getting profiles:', profilesError.message);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles to delete`);
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} (${profile.full_name}) - ${profile.role}`);
      });
    }

    // Step 2: Clear profiles table completely
    console.log('\n🗑️ Step 2: Clearing all profiles...');
    
    const { error: deleteProfilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all real UUIDs
    
    if (deleteProfilesError) {
      console.log('❌ Error clearing profiles:', deleteProfilesError.message);
    } else {
      console.log('✅ All profiles deleted successfully');
    }

    // Step 3: Clear auth users (this might require additional permissions)
    console.log('\n🗑️ Step 3: Attempting to clear auth users...');
    
    try {
      // Get list of auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log('⚠️ Cannot access auth users:', authError.message);
      } else {
        console.log(`Found ${authUsers.users?.length || 0} auth users`);
        
        // Delete each auth user
        for (const user of authUsers.users || []) {
          const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);
          if (deleteAuthError) {
            console.log(`⚠️ Cannot delete auth user ${user.email}:`, deleteAuthError.message);
          } else {
            console.log(`✅ Deleted auth user: ${user.email}`);
          }
        }
      }
    } catch (authClearError) {
      console.log('⚠️ Auth user clearing failed:', authClearError.message);
    }

    // Step 4: Clear tenant memberships
    console.log('\n🗑️ Step 4: Clearing tenant memberships...');
    
    const { error: deleteMembershipsError } = await supabase
      .from('tenant_memberships')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteMembershipsError) {
      console.log('⚠️ Cannot clear memberships:', deleteMembershipsError.message);
    } else {
      console.log('✅ Tenant memberships cleared');
    }

    // Step 5: Clear test tenants
    console.log('\n🗑️ Step 5: Clearing test tenants...');
    
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*');
    
    if (tenantsError) {
      console.log('⚠️ Cannot get tenants:', tenantsError.message);
    } else {
      console.log(`Found ${tenants?.length || 0} tenants`);
      
      for (const tenant of tenants || []) {
        // Delete all tenants (they seem to be test data)
        const { error: deleteTenantError } = await supabase
          .from('tenants')
          .delete()
          .eq('id', tenant.id);
        
        if (deleteTenantError) {
          console.log(`⚠️ Cannot delete tenant ${tenant.name}:`, deleteTenantError.message);
        } else {
          console.log(`✅ Deleted tenant: ${tenant.name} (${tenant.slug})`);
        }
      }
    }

    // Step 6: Clear any other related data
    console.log('\n🗑️ Step 6: Clearing other user-related data...');
    
    const tablesToClear = ['shifts', 'certificates', 'messages', 'notifications'];
    
    for (const table of tablesToClear) {
      const { error: clearError } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (clearError) {
        console.log(`⚠️ Cannot clear ${table}:`, clearError.message);
      } else {
        console.log(`✅ Cleared ${table} table`);
      }
    }

    // Step 7: Final verification
    console.log('\n📊 Step 7: Final verification...');
    
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('id, email');
    
    if (finalError) {
      console.log('⚠️ Cannot verify:', finalError.message);
    } else {
      console.log(`✅ Profiles remaining: ${finalProfiles?.length || 0}`);
    }

    console.log('\n🎉 Complete database cleanup finished!');
    console.log('\n📋 Your database is now fresh and ready for testing:');
    console.log('1. 🌐 Go to http://localhost:8081/');
    console.log('2. ✍️ Click "Sign Up" to create your first account');
    console.log('3. 📝 Fill in all signup form fields');
    console.log('4. ✅ Test the complete signup → profile creation → dashboard flow');
    console.log('\n🚀 Ready for fresh signup testing!');

  } catch (error) {
    console.error('💥 Admin cleanup error:', error.message);
  }
}

clearAllUsersAdmin();
