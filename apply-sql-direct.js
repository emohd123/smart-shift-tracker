import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Connecting to production Supabase:', supabaseUrl);

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function executeSQL(sql, description) {
  console.log(`📊 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error(`❌ ${description} failed:`, error);
      return false;
    }
    console.log(`✅ ${description} succeeded`);
    return true;
  } catch (err) {
    console.error(`💥 ${description} error:`, err);
    return false;
  }
}

async function applyDatabaseFix() {
  console.log('🚀 Starting database fix application...');
  
  try {
    // Check current schema first
    console.log('🔍 Checking current profiles table schema...');
    const { data: currentColumns, error: schemaError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public' ORDER BY ordinal_position;" 
      });
    
    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError);
      console.log('🔄 Trying alternative approach...');
    } else {
      console.log('✅ Current schema:', currentColumns);
    }
    
    // Alternative: Try direct table manipulation using supabase client
    console.log('🔧 Applying fixes using direct client methods...');
    
    // First, try to read current data to understand schema
    const { data: existingProfiles, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Cannot read profiles table:', readError);
      return;
    }
    
    console.log('📋 Current table structure detected:', Object.keys(existingProfiles[0] || {}));
    
    // Since we can't add columns directly, let's try updating existing unique_code field if it exists
    // or work with what we have
    
    // Try to update John Smith first to see what fields are available
    const { data: johnUpdate, error: johnError } = await supabase
      .from('profiles')
      .update({ 
        // Only update fields we know exist
        full_name: 'John Smith' // This should definitely exist
      })
      .eq('email', 'promoter1@test.com')
      .select();
    
    if (johnError) {
      console.error('❌ Cannot update John Smith:', johnError);
    } else {
      console.log('✅ John Smith record:', johnUpdate);
    }
    
    // Check if unique_code column exists by trying to select it
    const { data: uniqueCodeTest, error: uniqueCodeError } = await supabase
      .from('profiles')
      .select('id, unique_code')
      .limit(1);
    
    if (uniqueCodeError && uniqueCodeError.message.includes('does not exist')) {
      console.log('❌ unique_code column does not exist - need to add it via SQL');
      
      // Since we can't use exec_sql, we need to guide user to do this manually
      console.log('');
      console.log('🚨 MANUAL ACTION REQUIRED:');
      console.log('');
      console.log('The unique_code column does not exist in the profiles table.');
      console.log('You need to run this SQL manually in the Supabase Dashboard:');
      console.log('');
      console.log('1. Go to: https://znjtryqrqxjghvvdlvdg.supabase.co');
      console.log('2. Click "SQL Editor" in the left sidebar');
      console.log('3. Click "New Query"');
      console.log('4. Copy and paste the following SQL:');
      console.log('');
      console.log('-- Add unique_code column to profiles table');
      console.log('ALTER TABLE public.profiles ADD COLUMN unique_code TEXT;');
      console.log('');
      console.log('-- Add other missing columns');
      console.log('ALTER TABLE public.profiles ADD COLUMN age INTEGER DEFAULT 25;');
      console.log('ALTER TABLE public.profiles ADD COLUMN nationality TEXT DEFAULT \'\';');
      console.log('ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;');
      console.log('');
      console.log('-- Update existing profiles with unique codes');
      console.log('UPDATE public.profiles SET unique_code = \'USRNEUHC\', age = 25, nationality = \'Test Country\' WHERE email = \'promoter1@test.com\';');
      console.log('UPDATE public.profiles SET unique_code = \'USR7JMF5\', age = 25, nationality = \'Test Country\' WHERE email = \'promoter2@test.com\';');
      console.log('UPDATE public.profiles SET unique_code = \'USRB96Q6\', age = 30, nationality = \'Test Country\' WHERE email = \'company1@test.com\';');
      console.log('');
      console.log('5. Click "RUN" to execute the SQL');
      console.log('6. Then come back and test the promoter assignment');
      console.log('');
      
    } else if (uniqueCodeTest) {
      console.log('✅ unique_code column exists! Updating profiles...');
      
      // Update profiles with their unique codes
      const updates = [
        { email: 'promoter1@test.com', unique_code: 'USRNEUHC', name: 'John Smith' },
        { email: 'promoter2@test.com', unique_code: 'USR7JMF5', name: 'Sarah Wilson' },
        { email: 'company1@test.com', unique_code: 'USRB96Q6', name: 'Test Company' }
      ];
      
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ unique_code: update.unique_code })
          .eq('email', update.email);
        
        if (updateError) {
          console.error(`❌ Failed to update ${update.name}:`, updateError);
        } else {
          console.log(`✅ Updated ${update.name} with code ${update.unique_code}`);
        }
      }
      
      // Test the final result
      console.log('🧪 Testing promoter query...');
      const { data: finalTest, error: finalError } = await supabase
        .from('profiles')
        .select('id, unique_code, full_name, role, verification_status')
        .in('role', ['part_timer', 'promoter'])
        .eq('verification_status', 'approved');
      
      if (finalError) {
        console.error('❌ Final test failed:', finalError);
      } else {
        console.log('🎯 Final test succeeded!');
        console.log(`📈 Found ${finalTest.length} approved promoters:`);
        finalTest.forEach(p => {
          console.log(`  - ${p.full_name} (${p.unique_code})`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

applyDatabaseFix();