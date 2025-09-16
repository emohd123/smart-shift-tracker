import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Connecting to Supabase with service role key...');

// Create admin client
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

async function applySchemaFix() {
  console.log('🚀 Starting PostgreSQL schema fix...');
  
  try {
    // Execute SQL commands one by one using Supabase's query interface
    const sqlCommands = [
      // Add unique_code column
      "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;",
      
      // Add other missing columns
      "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;",
      "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT '';",
      "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;",
      
      // Create unique index
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;"
    ];
    
    console.log('📊 Adding missing columns to profiles table...');
    
    // Try alternative approach using raw SQL execution
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`${i + 1}/${sqlCommands.length}: ${sql.substring(0, 50)}...`);
      
      try {
        // Use the postgrest API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceKey
          },
          body: JSON.stringify({ sql })
        });
        
        if (!response.ok) {
          console.log(`⚠️ SQL API not available, trying alternative method...`);
          break;
        }
        
        const result = await response.json();
        console.log(`✅ Command ${i + 1} executed successfully`);
        
      } catch (error) {
        console.log(`⚠️ SQL execution method not available, continuing...`);
        break;
      }
    }
    
    // Alternative approach: Use INSERT/UPDATE operations that we know work
    console.log('🔄 Trying alternative approach using table operations...');
    
    // First, let's check the current table structure again
    const { data: currentData, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Cannot read profiles table:', readError);
      return;
    }
    
    const currentColumns = Object.keys(currentData[0] || {});
    console.log('📋 Current columns:', currentColumns);
    
    // Check if unique_code column was added
    if (currentColumns.includes('unique_code')) {
      console.log('✅ unique_code column already exists!');
      
      // Update profiles with unique codes
      const updates = [
        { email: 'promoter1@test.com', unique_code: 'USRNEUHC', name: 'John Smith' },
        { email: 'promoter2@test.com', unique_code: 'USR7JMF5', name: 'Sarah Wilson' },
        { email: 'company1@test.com', unique_code: 'USRB96Q6', name: 'Test Company' }
      ];
      
      console.log('📝 Updating profiles with unique codes...');
      for (const update of updates) {
        const updateData = { unique_code: update.unique_code };
        
        // Add other fields if they exist
        if (currentColumns.includes('age')) updateData.age = update.name === 'Test Company' ? 30 : 25;
        if (currentColumns.includes('nationality')) updateData.nationality = 'Test Country';
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('email', update.email);
        
        if (updateError) {
          console.error(`❌ Failed to update ${update.name}:`, updateError);
        } else {
          console.log(`✅ Updated ${update.name} with code ${update.unique_code}`);
        }
      }
      
    } else {
      console.log('❌ unique_code column still does not exist');
      console.log('');
      console.log('🚨 DIRECT SQL REQUIRED:');
      console.log('');
      console.log('Please run this SQL directly in Supabase Dashboard:');
      console.log('');
      console.log('1. Go to: https://znjtryqrqxjghvvdlvdg.supabase.co/project/znjtryqrqxjghvvdlvdg/sql');
      console.log('2. Copy and paste this SQL:');
      console.log('');
      console.log('-- Add missing columns to profiles table');
      console.log('ALTER TABLE public.profiles ADD COLUMN unique_code TEXT;');
      console.log('ALTER TABLE public.profiles ADD COLUMN age INTEGER DEFAULT 25;');
      console.log('ALTER TABLE public.profiles ADD COLUMN nationality TEXT DEFAULT \'\';');
      console.log('ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;');
      console.log('');
      console.log('-- Update existing profiles');
      console.log('UPDATE public.profiles SET unique_code = \'USRNEUHC\', age = 25, nationality = \'Test Country\' WHERE email = \'promoter1@test.com\';');
      console.log('UPDATE public.profiles SET unique_code = \'USR7JMF5\', age = 25, nationality = \'Test Country\' WHERE email = \'promoter2@test.com\';');
      console.log('UPDATE public.profiles SET unique_code = \'USRB96Q6\', age = 30, nationality = \'Test Country\' WHERE email = \'company1@test.com\';');
      console.log('');
      console.log('3. Click "RUN"');
      console.log('');
      return;
    }
    
    // Test the final result
    console.log('🧪 Testing promoter query after updates...');
    const { data: testPromoters, error: testError } = await supabase
      .from('profiles')
      .select('id, unique_code, full_name, age, nationality, phone_number, role, verification_status')
      .in('role', ['part_timer', 'promoter'])
      .eq('verification_status', 'approved');
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
      
      // Try basic query without new columns
      const { data: basicTest, error: basicError } = await supabase
        .from('profiles')
        .select('id, unique_code, full_name, role, verification_status')
        .in('role', ['part_timer', 'promoter'])
        .eq('verification_status', 'approved');
      
      if (basicError) {
        console.error('❌ Basic test also failed:', basicError);
      } else {
        console.log('✅ Basic test succeeded:', basicTest);
      }
    } else {
      console.log('🎯 Full test query succeeded!');
      console.log(`📈 Found ${testPromoters.length} approved promoters:`);
      testPromoters.forEach(p => {
        console.log(`  - ${p.full_name} (${p.unique_code})`);
      });
      
      console.log('');
      console.log('🎉 Schema fix completed successfully!');
      console.log('💡 Now test the promoter assignment in your app at http://localhost:8082');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

applySchemaFix();