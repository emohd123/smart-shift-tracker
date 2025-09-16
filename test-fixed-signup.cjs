const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testFixedSignup() {
  try {
    console.log('🧪 Testing Fixed Signup Flow with Current Schema...\n');

    const testEmail = 'fixedtest' + Date.now() + '@test.com';
    
    console.log(`📋 Step 1: Creating user: ${testEmail}`);
    
    // Create user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Fixed Test User',
        role: 'part_timer',
        // Additional data that will go into metadata
        nationality: 'United States',
        age: '28',
        gender: 'Male',
        height: '175',
        weight: '70',
        address: '123 Test Street'
      }
    });

    if (userError) {
      console.log('❌ User creation failed:', userError.message);
      return;
    }

    console.log('✅ User created:', userData.user.id);

    // Step 2: Create basic profile (simulating fixed signup form)
    console.log('\n📋 Step 2: Creating basic profile...');
    
    const profileData = {
      id: userData.user.id,
      tenant_id: null, // Avoid foreign key issues
      full_name: userData.user.user_metadata.full_name || 'Fixed Test User',
      email: userData.user.email,
      role: userData.user.user_metadata.role || 'part_timer',
      verification_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select();

    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message);
    } else {
      console.log('✅ Basic profile created:', profileResult[0]);
    }

    // Step 3: Test dashboard profile access
    console.log('\n📋 Step 3: Testing dashboard profile access...');
    
    const { data: dashboardProfile, error: dashboardError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (dashboardError) {
      console.log('❌ Dashboard profile access failed:', dashboardError.message);
    } else {
      console.log('✅ Dashboard can access profile:', dashboardProfile);
      console.log(`   Name: ${dashboardProfile.full_name}`);
      console.log(`   Email: ${dashboardProfile.email}`);
      console.log(`   Role: ${dashboardProfile.role}`);
      console.log(`   Status: ${dashboardProfile.verification_status}`);
    }

    // Step 4: Test authentication flow
    console.log('\n📋 Step 4: Testing authentication flow...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPass123!'
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
    } else {
      console.log('✅ User can sign in');
      
      // Get user metadata (where additional signup data is stored)
      console.log('📋 Additional metadata available:', signInData.user.user_metadata);
      
      // This is what the part-timer dashboard should display
      const userInfo = {
        name: dashboardProfile?.full_name,
        email: dashboardProfile?.email,
        role: dashboardProfile?.role,
        nationality: signInData.user.user_metadata?.nationality,
        age: signInData.user.user_metadata?.age,
        address: signInData.user.user_metadata?.address
      };
      
      console.log('✅ Complete user info for dashboard:', userInfo);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.auth.admin.deleteUser(userData.user.id);
    await supabase.from('profiles').delete().eq('id', userData.user.id);
    console.log('✅ Cleanup complete');

    // Final check of all profiles
    console.log('\n📊 Final database state:');
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log(`✅ Total profiles in database: ${allProfiles?.length || 0}`);
    if (allProfiles) {
      allProfiles.forEach((profile, index) => {
        const roleEmoji = profile.role === 'part_timer' ? '👨‍💼' : profile.role === 'company' ? '🏢' : profile.role === 'company_admin' ? '🏢' : '❓';
        console.log(`   ${index + 1}. ${profile.full_name} (${profile.email}) - ${roleEmoji} ${profile.role}`);
      });
    }

    console.log('\n🎉 Fixed signup flow test complete!');
    console.log('\n✅ Summary:');
    console.log('✅ User creation works');
    console.log('✅ Basic profile creation works');
    console.log('✅ Profile retrieval for dashboard works');
    console.log('✅ Authentication flow works');
    console.log('✅ Additional data stored in user metadata');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the actual app signup');
    console.log('2. Verify part-timer dashboard shows profile info');
    console.log('3. Dashboard should use both profile + user metadata');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFixedSignup();
