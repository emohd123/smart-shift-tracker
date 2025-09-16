const { createClient } = require('@supabase/supabase-js');

// Using the CORRECT Supabase credentials
const supabaseUrl = 'https://znjtryqrqxjghvvdlvdg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanRyeXFycXhqZ2h2dmRsdmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk3OTgyNSwiZXhwIjoyMDcyNTU1ODI1fQ.qPtvXftUtQ9zSMtGy52U1xI6d8V-5xrL7-2Mn3NFMQc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSignupDirectly() {
  console.log('🧪 Testing signup directly with the email that failed...\n');

  try {
    const testEmail = 'info@onestonead.com';
    const testPassword = 'TestPassword123!';

    console.log(`📝 Attempting to sign up: ${testEmail}`);
    
    // Try to sign up with the problematic email
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'part_timer',
        }
      }
    });

    if (error) {
      console.log('❌ Signup error:', error.message);
      console.log('🔍 Error code:', error.status);
      console.log('🔍 Error details:', JSON.stringify(error, null, 2));
      
      // If email already exists error, try to find and delete this specific user
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        console.log('\n🔍 This confirms the email still exists somewhere...');
        console.log('🗑️ Let me try to find and delete this specific user...');
        
        // Try to find users by email (this might not work with current permissions)
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (users) {
          const existingUser = users.find(u => u.email === testEmail);
          if (existingUser) {
            console.log(`🎯 Found user: ${existingUser.email} - Deleting...`);
            const { error: delError } = await supabase.auth.admin.deleteUser(existingUser.id);
            if (delError) {
              console.log('❌ Delete failed:', delError.message);
            } else {
              console.log('✅ User deleted! Try signup again.');
            }
          }
        }
      }
    } else {
      console.log('✅ Signup successful!');
      console.log('📊 User data:', data);
      
      // Clean up the test user
      if (data.user) {
        console.log('🧹 Cleaning up test user...');
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('✅ Test user cleaned up');
      }
    }

    console.log('\n💡 Recommendations:');
    console.log('1. Try a completely different email (e.g., yourname+fresh@gmail.com)');
    console.log('2. Clear browser cache/localStorage');
    console.log('3. Use incognito mode');
    console.log('4. The database is clean, so new emails should definitely work');

  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

testSignupDirectly();
