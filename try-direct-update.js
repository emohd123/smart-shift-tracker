import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function tryDirectUpdate() {
  console.log('🔍 Checking if unique_code column already exists...');
  
  try {
    // Try to select unique_code to see if column exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id, unique_code')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('❌ unique_code column does not exist');
      console.log('📋 You must add it manually via Supabase Dashboard');
      console.log('');
      console.log('🚨 REQUIRED MANUAL STEPS:');
      console.log('1. Go to: https://znjtryqrqxjghvvdlvdg.supabase.co/project/znjtryqrqxjghvvdlvdg/sql');
      console.log('2. Click "New Query"');
      console.log('3. Paste this SQL:');
      console.log('');
      console.log('ALTER TABLE public.profiles ADD COLUMN unique_code TEXT;');
      console.log('ALTER TABLE public.profiles ADD COLUMN age INTEGER DEFAULT 25;');
      console.log('ALTER TABLE public.profiles ADD COLUMN nationality TEXT DEFAULT \'Not specified\';');
      console.log('ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;');
      console.log('');
      console.log('UPDATE public.profiles SET unique_code = \'USRNEUHC\', age = 25, nationality = \'Test Country\' WHERE email = \'promoter1@test.com\';');
      console.log('UPDATE public.profiles SET unique_code = \'USR7JMF5\', age = 25, nationality = \'Test Country\' WHERE email = \'promoter2@test.com\';');
      console.log('UPDATE public.profiles SET unique_code = \'USRB96Q6\', age = 30, nationality = \'Test Country\' WHERE email = \'company1@test.com\';');
      console.log('');
      console.log('4. Click "RUN"');
      console.log('5. Then test your app!');
      
    } else if (data) {
      console.log('✅ unique_code column exists!');
      console.log('🔄 Attempting to update existing profiles...');
      
      // Update profiles with unique codes
      const updates = [
        { email: 'promoter1@test.com', unique_code: 'USRNEUHC', name: 'John Smith' },
        { email: 'promoter2@test.com', unique_code: 'USR7JMF5', name: 'Sarah Wilson' },
        { email: 'company1@test.com', unique_code: 'USRB96Q6', name: 'Test Company' }
      ];
      
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            unique_code: update.unique_code,
            age: update.name === 'Test Company' ? 30 : 25,
            nationality: 'Test Country'
          })
          .eq('email', update.email);
        
        if (updateError) {
          console.log(`❌ Failed to update ${update.name}: ${updateError.message}`);
        } else {
          console.log(`✅ Updated ${update.name} with code ${update.unique_code}`);
        }
      }
      
      // Test the result
      console.log('');
      console.log('🧪 Testing promoter query...');
      const { data: promoters, error: testError } = await supabase
        .from('profiles')
        .select('id, unique_code, full_name, role, verification_status')
        .in('role', ['part_timer', 'promoter'])
        .eq('verification_status', 'approved');
      
      if (testError) {
        console.log('❌ Test failed:', testError.message);
      } else {
        console.log('🎉 SUCCESS!');
        console.log(`Found ${promoters.length} approved promoters:`);
        promoters.forEach(p => {
          console.log(`  • ${p.full_name} (${p.unique_code})`);
        });
        console.log('');
        console.log('✅ Your promoter assignment should now work!');
        console.log('Test at: http://localhost:8082');
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('');
    console.log('🚨 Please apply the SQL manually in Supabase Dashboard');
  }
}

tryDirectUpdate();