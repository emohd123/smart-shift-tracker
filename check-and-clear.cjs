const { createClient } = require('@supabase/supabase-js');

// Using the CORRECT Supabase credentials
const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentUsers() {
  console.log('🔍 Checking current database state...\n');

  try {
    // Check auth users
    console.log('📊 Auth users:');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot list auth users:', authError.message);
    } else {
      console.log(`✅ Found ${users?.length || 0} auth users`);
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
        });
      }
    }

    // Check profiles
    console.log('\n📊 Profile records:');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role');
    
    if (profileError) {
      console.log('❌ Cannot list profiles:', profileError.message);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profile records`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} (${profile.full_name}) - ${profile.role}`);
        });
      }
    }

    // If users exist, delete them immediately
    if (users && users.length > 0) {
      console.log('\n🗑️ Deleting remaining users...');
      for (const user of users) {
        console.log(`   Deleting: ${user.email}...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.log(`   ❌ Failed: ${deleteError.message}`);
        } else {
          console.log(`   ✅ Deleted: ${user.email}`);
        }
      }

      // Final verification
      console.log('\n📊 Final check:');
      const { data: { users: finalUsers }, error: finalError } = await supabase.auth.admin.listUsers();
      console.log(`✅ Auth users remaining: ${finalUsers?.length || 0}`);
    }

    console.log('\n🎯 Database should now be completely clean for signup!');

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkCurrentUsers();
