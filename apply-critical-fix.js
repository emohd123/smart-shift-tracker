import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyCriticalFix() {
  console.log('🔄 Applying critical database fix...');
  
  try {
    // Execute the SQL commands one by one using RPC
    const sqlCommands = [
      "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT",
      "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25", 
      "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Not specified'",
      "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT"
    ];

    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql}`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`⚠️  DDL command failed (expected): ${error.message}`);
      } else {
        console.log('✅ Command executed successfully');
      }
    }

    // Now try to update the profiles data directly
    console.log('\n🔄 Updating profile data...');
    
    const updates = [
      { 
        email: 'promoter1@test.com', 
        updates: { unique_code: 'USRNEUHC', age: 25, nationality: 'Test Country', phone_number: '+1-555-0101' }
      },
      { 
        email: 'promoter2@test.com', 
        updates: { unique_code: 'USR7JMF5', age: 25, nationality: 'Test Country', phone_number: '+1-555-0102' }
      },
      { 
        email: 'company1@test.com', 
        updates: { unique_code: 'USRB96Q6', age: 30, nationality: 'Test Country', phone_number: '+1-555-0100' }
      }
    ];

    for (const { email, updates } of updates) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('email', email)
        .select();
      
      if (error) {
        console.log(`❌ Failed to update ${email}:`, error.message);
      } else {
        console.log(`✅ Updated ${email} successfully`);
      }
    }

    // Test the fix
    console.log('\n🧪 Testing promoter query...');
    const { data: promoters, error: testError } = await supabase
      .from('profiles')
      .select('id, unique_code, full_name, role, verification_status, age, nationality')
      .in('role', ['part_timer', 'promoter'])
      .eq('verification_status', 'approved');
    
    if (testError) {
      console.log('❌ Test failed:', testError.message);
      console.log('\n🚨 MANUAL ACTION REQUIRED:');
      console.log('Go to: https://znjtryqrqxjghvvdlvdg.supabase.co/project/znjtryqrqxjghvvdlvdg/sql');
      console.log('Run this SQL:');
      console.log(`
ALTER TABLE public.profiles ADD COLUMN unique_code TEXT;
ALTER TABLE public.profiles ADD COLUMN age INTEGER DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN nationality TEXT DEFAULT 'Not specified';
ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;

UPDATE public.profiles SET unique_code = 'USRNEUHC', age = 25, nationality = 'Test Country' WHERE email = 'promoter1@test.com';
UPDATE public.profiles SET unique_code = 'USR7JMF5', age = 25, nationality = 'Test Country' WHERE email = 'promoter2@test.com';
UPDATE public.profiles SET unique_code = 'USRB96Q6', age = 30, nationality = 'Test Country' WHERE email = 'company1@test.com';
      `);
    } else {
      console.log('🎉 SUCCESS!');
      console.log(`Found ${promoters.length} approved promoters:`);
      promoters.forEach(p => {
        console.log(`  • ${p.full_name} (${p.unique_code}) - Age: ${p.age}, Nationality: ${p.nationality}`);
      });
      console.log('\n✅ Promoter assignment should now work!');
      console.log('Test at: http://localhost:8082');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    console.log('\n🚨 Please apply the fix manually in Supabase Dashboard');
  }
}

applyCriticalFix();