const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk4MjUsImV4cCI6MjA3MjU1NTgyNX0.cnozRMnDLTsdMRs5-Uql38x5uZTh7l4WZuSSs4-H-34';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSignups() {
  try {
    console.log('📊 Checking user signups in database...\n');
    
    // Try to get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, created_at, full_name')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
      console.log('🔍 Trying to check other tables...\n');
      
      // Try to get users from auth (may not be accessible with anon key)
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
          console.log('❌ Auth users error (expected with anon key):', authError.message);
        } else {
          console.log('✅ Found auth users:', authData.users.length);
        }
      } catch (e) {
        console.log('❌ Cannot access auth admin functions with anon key');
      }
      
      // Try to check what tables exist
      const { data: tables, error: tablesError } = await supabase.rpc('get_table_names');
      if (tablesError) {
        console.log('❌ Cannot get table list:', tablesError.message);
      }
      
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('📝 No user profiles found in database yet.');
      console.log('💡 This might mean:');
      console.log('   - No users have signed up yet');
      console.log('   - The profiles table needs to be created');
      console.log('   - Users exist in auth.users but not in profiles table');
      return;
    }
    
    console.log(`📈 Total signups: ${profiles.length}\n`);
    
    // Count by role
    const roleCounts = profiles.reduce((acc, profile) => {
      const role = profile.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('👥 Users by role:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      const emoji = role === 'part_timer' ? '👨‍💼' : role === 'company' ? '🏢' : role === 'super_admin' ? '👑' : '❓';
      console.log(`   ${emoji} ${role}: ${count}`);
    });
    
    console.log('\n📋 Recent signups:');
    profiles.slice(0, 10).forEach((profile, index) => {
      const date = new Date(profile.created_at).toLocaleDateString();
      const roleEmoji = profile.role === 'part_timer' ? '👨‍💼' : profile.role === 'company' ? '🏢' : profile.role === 'super_admin' ? '👑' : '❓';
      console.log(`   ${index + 1}. ${profile.email || 'No email'} (${profile.full_name || 'No name'}) - ${roleEmoji} ${profile.role || 'unknown'} - ${date}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSignups();
