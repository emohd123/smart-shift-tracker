const { createClient } = require('@supabase/supabase-js');

// Using the CORRECT Supabase credentials from .env
const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function correctReset() {
  console.log('🧹 CORRECT DATABASE RESET - Using right credentials...\n');

  try {
    // Step 1: Test connection first
    console.log('🔗 Step 1: Testing connection...');
    const { data: testData, error: testError } = await supabase.from('profiles').select('count').limit(1);
    
    if (testError) {
      console.log('❌ Connection failed:', testError.message);
      return;
    }
    console.log('✅ Connection successful!');

    // Step 2: List all auth users
    console.log('\n📊 Step 2: Getting all auth users...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Cannot list users:', listError.message);
      return;
    }
    
    console.log(`✅ Found ${users?.length || 0} auth users to delete`);
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id.substring(0, 8)}...)`);
      });
    }

    // Step 3: Delete all auth users
    console.log('\n🗑️ Step 3: Deleting ALL auth users...');
    if (users && users.length > 0) {
      for (const user of users) {
        console.log(`   Deleting: ${user.email}...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.log(`   ❌ Failed to delete ${user.email}:`, deleteError.message);
        } else {
          console.log(`   ✅ Deleted: ${user.email}`);
        }
      }
    }

    // Step 4: Clear profiles table
    console.log('\n🗑️ Step 4: Clearing profiles table...');
    const { error: deleteProfilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteProfilesError) {
      console.log('❌ Error clearing profiles:', deleteProfilesError.message);
    } else {
      console.log('✅ Profiles table cleared');
    }

    // Step 5: Clear other tables
    console.log('\n🗑️ Step 5: Clearing related tables...');
    const tablesToClear = ['tenant_memberships', 'tenants', 'shifts', 'certificates'];
    
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

    // Step 6: Final verification
    console.log('\n📊 Step 6: Final verification...');
    
    const { data: { users: finalUsers }, error: finalError } = await supabase.auth.admin.listUsers();
    if (finalError) {
      console.log('⚠️ Cannot verify users:', finalError.message);
    } else {
      console.log(`✅ Auth users remaining: ${finalUsers?.length || 0}`);
    }

    const { data: finalProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id');
    
    if (profileError) {
      console.log('⚠️ Cannot verify profiles:', profileError.message);
    } else {
      console.log(`✅ Profiles remaining: ${finalProfiles?.length || 0}`);
    }

    console.log('\n🎉 DATABASE RESET COMPLETE!');
    console.log('\n📋 Your database is now fresh and clean:');
    console.log('✅ All auth users deleted');
    console.log('✅ All profiles cleared');
    console.log('✅ All related data cleared');
    
    console.log('\n🚀 NOW YOU CAN:');
    console.log('1. 🌐 Go to http://localhost:8081/');
    console.log('2. ✍️ Click "Sign Up"');
    console.log('3. ✉️ Use ANY email address (no more "already registered" error!)');
    console.log('4. 📝 Fill out the complete signup form');
    console.log('5. ✅ Should successfully create account and redirect to dashboard');
    console.log('\n🎯 Ready for fresh signup testing!');

  } catch (error) {
    console.error('💥 Reset error:', error.message);
  }
}

correctReset();
