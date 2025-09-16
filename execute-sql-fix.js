import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

async function executeSQLFix() {
  console.log('🚀 Starting direct PostgreSQL schema fix...');
  
  // Since direct PostgreSQL connection requires database password (not service key),
  // let's focus on providing clear manual instructions
  
  console.log('');
  console.log('🔧 DATABASE SCHEMA FIX REQUIRED');
  console.log('=====================================');
  console.log('');
  console.log('The unique_code column does not exist in your profiles table.');
  console.log('This is required for the promoter assignment feature to work.');
  console.log('');
  console.log('📋 MANUAL STEPS:');
  console.log('');
  console.log('1. Open your browser and go to:');
  console.log('   👉 https://znjtryqrqxjghvvdlvdg.supabase.co/project/znjtryqrqxjghvvdlvdg/sql');
  console.log('');
  console.log('2. Click "New Query" button');
  console.log('');
  console.log('3. Copy and paste this SQL:');
  console.log('');
  console.log('-- ==================================================');
  console.log('-- ADD MISSING COLUMNS TO PROFILES TABLE');
  console.log('-- ==================================================');
  console.log('');
  console.log('ALTER TABLE public.profiles ADD COLUMN unique_code TEXT;');
  console.log('ALTER TABLE public.profiles ADD COLUMN age INTEGER DEFAULT 25;');
  console.log('ALTER TABLE public.profiles ADD COLUMN nationality TEXT DEFAULT \'\';');
  console.log('ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;');
  console.log('');
  console.log('-- Create unique index');
  console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code');
  console.log('ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;');
  console.log('');
  console.log('-- ==================================================');
  console.log('-- UPDATE EXISTING PROFILES WITH UNIQUE CODES');
  console.log('-- ==================================================');
  console.log('');
  console.log('UPDATE public.profiles SET');
  console.log('  unique_code = \'USRNEUHC\',');
  console.log('  age = 25,');
  console.log('  nationality = \'Test Country\'');
  console.log('WHERE email = \'promoter1@test.com\';');
  console.log('');
  console.log('UPDATE public.profiles SET');
  console.log('  unique_code = \'USR7JMF5\',');
  console.log('  age = 25,');
  console.log('  nationality = \'Test Country\'');
  console.log('WHERE email = \'promoter2@test.com\';');
  console.log('');
  console.log('UPDATE public.profiles SET');
  console.log('  unique_code = \'USRB96Q6\',');
  console.log('  age = 30,');
  console.log('  nationality = \'Test Country\'');
  console.log('WHERE email = \'company1@test.com\';');
  console.log('');
  console.log('-- ==================================================');
  console.log('-- TEST THE RESULT');
  console.log('-- ==================================================');
  console.log('');
  console.log('SELECT');
  console.log('  full_name,');
  console.log('  unique_code,');
  console.log('  role,');
  console.log('  verification_status,');
  console.log('  age,');
  console.log('  nationality');
  console.log('FROM public.profiles');
  console.log('WHERE role IN (\'part_timer\', \'promoter\')');
  console.log('ORDER BY full_name;');
  console.log('');
  console.log('4. Click the "RUN" button to execute all the SQL');
  console.log('');
  console.log('5. You should see results showing:');
  console.log('   ✅ John Smith (USRNEUHC)');
  console.log('   ✅ Sarah Wilson (USR7JMF5)');
  console.log('');
  console.log('6. After running the SQL, test the fix by:');
  console.log('   - Going to http://localhost:8082');
  console.log('   - Login as: company1@test.com / testpass123');
  console.log('   - Navigate to shift creation');
  console.log('   - Open the promoter assignment dropdown');
  console.log('   - You should see both promoters with their unique codes');
  console.log('');
  console.log('🎯 EXPECTED RESULT:');
  console.log('After the SQL fix, the promoter dropdown should show:');
  console.log('  👥 John Smith (USRNEUHC) - 25 years • Test Country');
  console.log('  👥 Sarah Wilson (USR7JMF5) - 25 years • Test Country');
  console.log('');
  console.log('💡 The frontend code is already prepared to handle this!');
  console.log('   Once you run the SQL, everything should work immediately.');
  console.log('');
}

executeSQLFix();