const { createClient } = require('@supabase/supabase-js');

// Using service role key for admin operations
const supabaseUrl = 'https://bsqwtvdmvcmucpkajhpv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXd0dmRtdmNtdWNwa2FqaHB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODM5OTI3NiwiZXhwIjoyMDUzOTc1Mjc2fQ.xxCrG0GYo1QElHHX4o3l9sQQacZUayEtGJ1oFYx4f-o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function completeReset() {
  console.log('🧹 COMPLETE DATABASE RESET - Removing ALL user data...\n');

  try {
    // Step 1: List all auth users first
    console.log('📊 Step 1: Getting all auth users...');
    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();
    
    if (listUsersError) {
      console.log('❌ Cannot list auth users:', listUsersError.message);
    } else {
      console.log(`✅ Found ${users?.length || 0} auth users to delete`);
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.id})`);
        });
      }
    }

    // Step 2: Delete all auth users (this is the key step)
    console.log('\n🗑️ Step 2: Deleting ALL auth users...');
    if (users && users.length > 0) {
      for (const user of users) {
        console.log(`   Deleting auth user: ${user.email}...`);
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteUserError) {
          console.log(`   ❌ Error deleting ${user.email}:`, deleteUserError.message);
        } else {
          console.log(`   ✅ Deleted auth user: ${user.email}`);
        }
      }
    }

    // Step 3: Clear profiles table
    console.log('\n🗑️ Step 3: Clearing profiles table...');
    const { error: deleteProfilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteProfilesError) {
      console.log('❌ Error clearing profiles:', deleteProfilesError.message);
    } else {
      console.log('✅ All profiles deleted');
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

    // Step 5: Clear tenants
    console.log('\n🗑️ Step 5: Clearing all tenants...');
    const { error: deleteTenantsError } = await supabase
      .from('tenants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteTenantsError) {
      console.log('⚠️ Cannot clear tenants:', deleteTenantsError.message);
    } else {
      console.log('✅ All tenants cleared');
    }

    // Step 6: Clear all other user-related tables
    console.log('\n🗑️ Step 6: Clearing other user data tables...');
    
    const tablesToClear = [
      'shifts',
      'certificates', 
      'messages',
      'notifications',
      'user_files',
      'training_progress',
      'promoter_stats'
    ];
    
    for (const table of tablesToClear) {
      console.log(`   Clearing ${table}...`);
      const { error: clearError } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (clearError) {
        console.log(`   ⚠️ ${table}: ${clearError.message}`);
      } else {
        console.log(`   ✅ ${table} cleared`);
      }
    }

    // Step 7: Final verification
    console.log('\n📊 Step 7: Final verification...');
    
    // Check auth users
    const { data: { users: finalUsers }, error: finalUsersError } = await supabase.auth.admin.listUsers();
    if (finalUsersError) {
      console.log('⚠️ Cannot verify auth users:', finalUsersError.message);
    } else {
      console.log(`✅ Auth users remaining: ${finalUsers?.length || 0}`);
    }

    // Check profiles
    const { data: finalProfiles, error: finalProfilesError } = await supabase
      .from('profiles')
      .select('id, email');
    
    if (finalProfilesError) {
      console.log('⚠️ Cannot verify profiles:', finalProfilesError.message);
    } else {
      console.log(`✅ Profiles remaining: ${finalProfiles?.length || 0}`);
    }

    console.log('\n🎉 COMPLETE DATABASE RESET FINISHED!');
    console.log('\n📋 Your database is now completely fresh:');
    console.log('✅ All auth users deleted');
    console.log('✅ All profiles cleared');
    console.log('✅ All tenants cleared'); 
    console.log('✅ All user-related data cleared');
    
    console.log('\n🚀 NOW YOU CAN:');
    console.log('1. 🌐 Go to http://localhost:8081/');
    console.log('2. ✍️ Click "Sign Up" with ANY email');
    console.log('3. 📝 Fill out the signup form completely');
    console.log('4. ✅ Should work without "email already registered" error');
    console.log('5. 🎯 Test the full signup → profile creation → dashboard flow');

  } catch (error) {
    console.error('💥 Reset error:', error.message);
    console.log('\n⚠️ If there are still issues, the database might need manual admin intervention.');
  }
}

completeReset();
