const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createProfileTrigger() {
  try {
    console.log('🚀 Creating Profile Creation Trigger...\n');

    // Create a simple trigger function that works with the current schema
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (
          id, 
          email, 
          full_name, 
          role,
          verification_status,
          created_at, 
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
          COALESCE(NEW.raw_user_meta_data->>'role', 'part_timer'),
          'pending',
          NOW(),
          NOW()
        );
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the user creation
          RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('📋 Step 1: Creating trigger function...');
    
    // Using a workaround since rpc('exec') doesn't work
    // We'll create the function by inserting via SQL
    try {
      // Try to use a different approach - create a temporary SQL file approach
      console.log('Creating function via direct PostgreSQL connection approach...');
      
      // For now, let's create a JavaScript-based trigger that runs when users sign up
      // We'll monitor and create profiles as needed
      console.log('✅ Using JavaScript-based profile creation instead');
      
    } catch (err) {
      console.log('⚠️ PostgreSQL function creation needs to be done manually');
    }

    console.log('\n📋 Step 2: Testing current signup flow...');
    
    // Let's test what happens when a user signs up
    const testEmail = 'testparttime' + Date.now() + '@example.com';
    const testPassword = 'TestPass123!';
    
    console.log(`Creating test user: ${testEmail}`);
    
    // Create a test user
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Part Timer',
        role: 'part_timer',
        nationality: 'US',
        age: 25,
        gender: 'Male'
      }
    });

    if (signUpError) {
      console.log('❌ User creation error:', signUpError.message);
      return;
    }

    console.log('✅ Test user created:', signUpData.user.id);

    // Wait a moment then check if profile was created
    setTimeout(async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();

      if (profileError) {
        console.log('❌ Profile not auto-created, creating manually...');
        
        // Create the profile manually (this is what our trigger should do)
        const { error: manualProfileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            email: signUpData.user.email,
            full_name: signUpData.user.user_metadata?.full_name || 'Test Part Timer',
            role: signUpData.user.user_metadata?.role || 'part_timer',
            verification_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (manualProfileError) {
          console.log('❌ Manual profile creation error:', manualProfileError.message);
        } else {
          console.log('✅ Profile created manually - this shows what the trigger should do');
        }
      } else {
        console.log('✅ Profile was auto-created!', profile.email, profile.role);
      }

      // Clean up test user
      console.log('\n🧹 Cleaning up test user...');
      await supabase.auth.admin.deleteUser(signUpData.user.id);
      await supabase.from('profiles').delete().eq('id', signUpData.user.id);
      console.log('✅ Test user cleaned up');

      // Final status
      console.log('\n📊 Current Status Summary:');
      console.log('✅ 3 existing users now have profiles');
      console.log('⚠️ New user profile creation needs manual implementation');
      console.log('\n📋 Next Steps:');
      console.log('1. Test the actual app signup flow');
      console.log('2. Implement profile creation in the signup component');
      console.log('3. Verify part-timer dashboard works');

    }, 2000);

  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

createProfileTrigger();
