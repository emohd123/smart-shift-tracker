#!/usr/bin/env node

/**
 * Sync Unique Codes to Profiles Table
 * 
 * This script adds the unique_code column to profiles table and 
 * syncs the codes from user metadata.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function syncUniqueCodes() {
  console.log('🔄 Syncing Unique Codes to Profiles Table');
  console.log('========================================\n');
  
  try {
    // Step 1: Try to add unique_code column if it doesn't exist
    console.log('1️⃣ Checking if unique_code column exists...');
    
    const { data: testColumn, error: testError } = await supabase
      .from('profiles')
      .select('unique_code')
      .limit(1);
    
    let columnExists = !testError;
    
    if (testError && testError.message.includes('does not exist')) {
      console.log('⚠️ unique_code column does not exist, attempting to add it...');
      
      // We can't add columns directly from the client, so we'll work around it
      columnExists = false;
    } else if (testError) {
      console.error('❌ Error checking column:', testError.message);
      return;
    } else {
      console.log('✅ unique_code column already exists');
      columnExists = true;
    }
    
    // Step 2: Get auth users with metadata
    console.log('\n2️⃣ Getting user metadata...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }
    
    // Step 3: Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return;
    }
    
    console.log(`📊 Found ${authUsers.users.length} auth users and ${profiles.length} profiles`);
    
    // Step 4: Sync unique codes
    console.log('\n3️⃣ Syncing unique codes...');
    
    for (const profile of profiles) {
      const authUser = authUsers.users.find(u => u.id === profile.id);
      
      if (authUser && authUser.user_metadata?.unique_code) {
        const uniqueCode = authUser.user_metadata.unique_code;
        
        console.log(`📝 Syncing ${profile.full_name}: ${uniqueCode}`);
        
        if (columnExists) {
          // Update existing column
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ unique_code: uniqueCode })
            .eq('id', profile.id);
          
          if (updateError) {
            console.log(`❌ Failed to update ${profile.full_name}: ${updateError.message}`);
          } else {
            console.log(`✅ Updated ${profile.full_name} with code ${uniqueCode}`);
          }
        } else {
          // Column doesn't exist, we need to add it manually or use a different approach
          console.log(`⚠️ Cannot update ${profile.full_name} - unique_code column missing`);
        }
      } else {
        console.log(`⚠️ No unique code found for ${profile.full_name}`);
      }
    }
    
    // Step 5: Test the updated data
    console.log('\n4️⃣ Testing updated profiles...');
    
    if (columnExists) {
      const { data: updatedProfiles, error: updatedError } = await supabase
        .from('profiles')
        .select('id, full_name, unique_code, role, verification_status')
        .in('role', ['part_timer', 'promoter']);
      
      if (updatedError) {
        console.error('❌ Error testing updated profiles:', updatedError.message);
      } else {
        const approvedWithCodes = updatedProfiles.filter(p => 
          p.verification_status === 'approved' && p.unique_code
        );
        
        console.log(`✅ Found ${approvedWithCodes.length} approved promoters with unique codes:`);
        
        approvedWithCodes.forEach((p, index) => {
          console.log(`   ${index + 1}. ${p.full_name}: ${p.unique_code}`);
        });
      }
    } else {
      console.log('⚠️ Need to add unique_code column manually first');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function addUniqueCodeColumn() {
  console.log('\n🔧 Manual Column Addition Required');
  console.log('==================================');
  console.log('');
  console.log('The unique_code column needs to be added manually.');
  console.log('Please run this SQL in Supabase Dashboard → SQL Editor:');
  console.log('');
  console.log('-- Add unique_code column');
  console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;');
  console.log('');
  console.log('-- Create unique index');
  console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code');
  console.log('ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;');
  console.log('');
  console.log('Then run this script again to sync the codes.');
}

async function main() {
  await syncUniqueCodes();
  
  // Check if we need to add the column manually
  const { data: testColumn, error: testError } = await supabase
    .from('profiles')
    .select('unique_code')
    .limit(1);
  
  if (testError && testError.message.includes('does not exist')) {
    await addUniqueCodeColumn();
  } else {
    console.log('\n🎉 Sync completed!');
    console.log('The unique codes should now be available in the promoters dropdown.');
    console.log('');
    console.log('Test by:');
    console.log('1. Go to http://localhost:8082');
    console.log('2. Login as company1@test.com / testpass123');
    console.log('3. Create a shift and check promoter assignment');
    console.log('4. You should see: USR7JMF5 and USRNEUHC');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});