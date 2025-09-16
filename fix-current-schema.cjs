const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixCurrentSchema() {
  try {
    console.log('🔧 Fixing Current Database Schema...\n');

    // Step 1: Work with the current profiles table structure
    console.log('📋 Step 1: Testing with current table structure...');
    
    const testEmail = 'simple-test' + Date.now() + '@test.com';
    
    // Create a user with minimal metadata
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Simple Test User',
        role: 'part_timer'
      }
    });

    if (userError) {
      console.log('❌ User creation failed:', userError.message);
      return;
    }

    console.log('✅ User created:', userData.user.id);

    // Create profile with only the fields that exist
    console.log('\n📋 Step 2: Creating profile with existing table structure...');
    
    const simpleProfileData = {
      id: userData.user.id,
      full_name: userData.user.user_metadata.full_name || 'Simple Test',
      nationality: '',
      age: 25,
      phone_number: null,
      gender: 'Male',
      height: 0,
      weight: 0,
      is_student: false,
      verification_status: 'pending',
      role: userData.user.user_metadata.role || 'part_timer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .insert(simpleProfileData)
      .select();

    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message);
      console.log('Available columns might be different. Let me check...');
      
      // Try to get one existing profile to see the structure
      const { data: existingProfile, error: existingError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (!existingError && existingProfile && existingProfile.length > 0) {
        console.log('Current profile table columns:', Object.keys(existingProfile[0]));
      }
    } else {
      console.log('✅ Profile created successfully with current structure');
      
      // Test profile retrieval
      const { data: retrievedProfile, error: retrieveError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (retrieveError) {
        console.log('❌ Profile retrieval failed:', retrieveError.message);
      } else {
        console.log('✅ Profile retrieved:', retrievedProfile);
      }
    }

    // Cleanup
    await supabase.auth.admin.deleteUser(userData.user.id);
    if (profileResult && profileResult.length > 0) {
      await supabase.from('profiles').delete().eq('id', userData.user.id);
    }

    console.log('\n📋 Step 3: Update signup form to use current structure...');
    console.log('Based on the test, I\'ll now update the signup form to work with the existing table structure.');

    console.log('\n✅ Schema analysis complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixCurrentSchema();
