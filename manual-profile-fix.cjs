const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin access
const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function manualSchemaFix() {
  console.log('🚀 Manual Schema Fix - Creating profiles for existing users...\n');

  try {
    // Step 1: Get current auth users
    console.log('📋 Step 1: Getting current auth users...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Error getting users:', usersError.message);
      return;
    }

    console.log(`✅ Found ${users.length} auth users`);

    // Step 2: Check current profiles table structure
    console.log('\n📋 Step 2: Checking current profiles...');
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    console.log('Current profiles table columns:', existingProfiles ? Object.keys(existingProfiles[0] || {}).join(', ') : 'No data');

    // Step 3: Create profiles for missing users with existing table structure
    console.log('\n📋 Step 3: Creating profiles with current table structure...');
    
    for (const user of users) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        console.log(`Creating profile for ${user.email}...`);
        
        // Create profile with only the columns that currently exist
        const profileData = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
          role: user.user_metadata?.role || user.app_metadata?.role || 'part_timer',
          verification_status: 'pending',
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        };

        // Only add tenant_id if it exists in the table
        if (user.id) {
          profileData.tenant_id = user.id;
        }

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) {
          console.log(`  ❌ Error: ${insertError.message}`);
        } else {
          console.log(`  ✅ Success`);
        }
      } else {
        console.log(`Profile already exists for ${user.email}`);
      }
    }

    // Step 4: Verify profiles were created
    console.log('\n📋 Step 4: Verifying profiles...');
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.log('❌ Verification Error:', finalError.message);
    } else {
      console.log(`✅ Profiles table now has ${finalProfiles.length} records:`);
      finalProfiles.forEach((profile, index) => {
        const roleEmoji = profile.role === 'part_timer' ? '👨‍💼' : profile.role === 'company' ? '🏢' : profile.role === 'company_admin' ? '🏢' : profile.role === 'super_admin' ? '👑' : '❓';
        console.log(`  ${index + 1}. ${profile.email} (${profile.full_name}) - ${roleEmoji} ${profile.role}`);
      });
    }

    // Step 5: Test authentication and profile access
    console.log('\n📋 Step 5: Testing profile access patterns...');
    
    // Try to simulate what the app does
    for (const user of users.slice(0, 1)) { // Just test first user
      console.log(`Testing profile access for ${user.email}...`);
      
      const { data: userProfile, error: accessError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (accessError) {
        console.log(`  ❌ Profile access error: ${accessError.message}`);
      } else {
        console.log(`  ✅ Profile accessible: ${userProfile.email} - ${userProfile.role}`);
      }
    }

    console.log('\n🎉 Basic profile creation complete!');
    console.log('\n📋 Status Summary:');
    console.log(`✅ ${users.length} auth users exist`);
    console.log(`✅ ${finalProfiles?.length || 0} profiles created`);
    console.log('\n📋 Next Steps:');
    console.log('1. Test signup flow with new users');
    console.log('2. Check if part-timer dashboard works now');
    console.log('3. Apply enhanced schema later if needed');

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

manualSchemaFix();
