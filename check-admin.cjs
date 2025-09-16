const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin access
const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

// Service role client bypasses RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSignups() {
  try {
    console.log('📊 Checking user signups in database with admin access...\n');
    
    // First, let's see what tables exist
    console.log('🔍 Checking available tables...');
    
    // Try different approaches to get user data
    console.log('📋 Attempting to query profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
    } else {
      console.log('✅ Profiles table query successful!');
      console.log(`📈 Total profiles found: ${profiles?.length || 0}`);
      
      if (profiles && profiles.length > 0) {
        // Count by role
        const roleCounts = profiles.reduce((acc, profile) => {
          const role = profile.role || 'unknown';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n👥 Users by role:');
        Object.entries(roleCounts).forEach(([role, count]) => {
          const emoji = role === 'part_timer' ? '👨‍💼' : role === 'company' ? '🏢' : role === 'super_admin' ? '👑' : '❓';
          console.log(`   ${emoji} ${role}: ${count}`);
        });
        
        console.log('\n📋 Recent signups:');
        profiles.slice(0, 10).forEach((profile, index) => {
          const date = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown date';
          const roleEmoji = profile.role === 'part_timer' ? '👨‍💼' : profile.role === 'company' ? '🏢' : profile.role === 'super_admin' ? '👑' : '❓';
          console.log(`   ${index + 1}. ${profile.email || 'No email'} (${profile.full_name || 'No name'}) - ${roleEmoji} ${profile.role || 'unknown'} - ${date}`);
        });
      } else {
        console.log('📝 No profiles found in database.');
        console.log('💡 This could mean:');
        console.log('   - No users have signed up yet');
        console.log('   - The profiles table is empty');
        console.log('   - Profile creation trigger is not working');
      }
    }
    
    // Try to get auth users count
    console.log('\n🔐 Checking auth users...');
    try {
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log('❌ Auth users error:', authError.message);
      } else {
        console.log(`✅ Auth users found: ${users?.length || 0}`);
        
        if (users && users.length > 0) {
          console.log('\n👤 Auth user details:');
          users.slice(0, 10).forEach((user, index) => {
            const date = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown date';
            const role = user.user_metadata?.role || user.app_metadata?.role || 'unknown';
            const roleEmoji = role === 'part_timer' ? '👨‍💼' : role === 'company' ? '🏢' : role === 'super_admin' ? '👑' : '❓';
            console.log(`   ${index + 1}. ${user.email} - ${roleEmoji} ${role} - ${date}`);
          });
        }
      }
    } catch (authErr) {
      console.log('❌ Auth admin error:', authErr.message);
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

checkSignups();
