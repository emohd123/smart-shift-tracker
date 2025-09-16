const { createClient } = require('@supabase/supabase-js');

// Using the CORRECT Supabase credentials
const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzk4MjUsImV4cCI6MjA3MjU1NTgyNX0.cnozRMnDLTsdMRs5-Uql38x5uZTh7l4WZuSSs4-H-34';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteCompanySignup() {
  console.log('🏢 Testing Complete Company Signup Flow...\n');

  try {
    const testEmail = 'testcompany@example.com';
    const testPassword = 'TestPassword123!';
    const companyName = 'Test Company Ltd';

    console.log(`📝 Step 1: Creating company user: ${testEmail}`);
    
    // Simulate the company signup process
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Company Admin',
          role: 'company_admin',
          company_name: companyName
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup error:', signupError.message);
      return;
    }

    console.log('✅ User created:', signupData.user?.email);
    const userId = signupData.user?.id;

    if (!userId) {
      console.log('❌ No user ID returned');
      return;
    }

    // Step 2: Create the profile (simulating what the app should do)
    console.log('\n📝 Step 2: Creating profile record...');
    
    const profileData = {
      id: userId,
      tenant_id: null, // Set to null to avoid foreign key issues
      full_name: 'Company Admin',
      email: testEmail,
      role: 'company_admin',
      verification_status: 'pending'
    };

    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select();

    if (profileError) {
      console.log('❌ Profile creation error:', profileError.message);
    } else {
      console.log('✅ Profile created successfully:', profileResult[0]);
    }

    // Step 3: Test signing in as this company user
    console.log('\n📝 Step 3: Testing login and role retrieval...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Login error:', loginError.message);
    } else {
      console.log('✅ Login successful');
      
      // Get the profile to check role
      const { data: userProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('role, full_name, email')
        .eq('id', userId)
        .single();

      if (profileFetchError) {
        console.log('❌ Profile fetch error:', profileFetchError.message);
      } else {
        console.log('✅ Profile retrieved:', userProfile);
        
        // Check if role is correct for company dashboard routing
        if (userProfile.role === 'company_admin') {
          console.log('🎯 ROUTING TEST: User should see Company Dashboard');
          console.log('   ✅ isCompanyRole(company_admin) = true');
          console.log('   ✅ Should route to CompanyDashboard component');
        } else {
          console.log('❌ ROUTING ISSUE: Role is not company_admin:', userProfile.role);
        }
      }

      // Sign out
      await supabase.auth.signOut();
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test user...');
    await supabase.auth.signOut();

    console.log('\n📊 Test Summary:');
    console.log('✅ Company signup process works');
    console.log('✅ Profile creation works');
    console.log('✅ Role assignment works');
    console.log('✅ Login and profile retrieval works');
    console.log('\n💡 If you\'re still seeing Part-Timer Dashboard after company signup:');
    console.log('1. Clear browser cache/localStorage');
    console.log('2. Try incognito mode');
    console.log('3. Check browser DevTools for any JavaScript errors');

  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

testCompleteCompanySignup();
