// Test if the application can connect to Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bsqwtvdmvcmucpkajhpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXd0dmRtdmNtdWNwa2FqaHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzOTkyNzYsImV4cCI6MjA1Mzk3NTI3Nn0.2e1QKHnLqRoqkdLhJKvnyxeB3b8_cCwcdmvQWGM-VJI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connectivity
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Connection error:', error.message);
      console.log('🚨 This might be why signup is failing.');
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Database is accessible from the application.');
      
      // If connection works, the issue might be that we need to manually clear existing users through the UI
      console.log('\n💡 Since scripts are failing but app might work:');
      console.log('1. Try using a completely different email (like yourname+fresh@gmail.com)');
      console.log('2. Or use the Supabase dashboard to manually delete users');
      console.log('3. The application connection is working, so signup should work with new emails');
    }
  } catch (err) {
    console.log('💥 Connection test failed:', err.message);
    console.log('🚨 Network connectivity issue - this explains the signup problem.');
  }
}

testConnection();
