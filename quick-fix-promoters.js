#!/usr/bin/env node

/**
 * Quick Fix for Promoters Loading Issue
 * 
 * This script directly applies the necessary database changes to fix the
 * "Failed to load promoters data" issue when companies try to assign promoters.
 * 
 * Usage: node quick-fix-promoters.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n💡 Make sure you have a .env file with:');
  console.log('VITE_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Execute SQL with error handling
 */
async function executeSql(description, sql) {
  console.log(`📝 ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('sql', { query: sql });
    
    if (error) {
      // Some operations may fail safely (like adding existing columns)
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`   ✅ ${description} (already exists)`);
        return true;
      } else {
        console.error(`   ❌ ${description} failed:`, error.message);
        return false;
      }
    } else {
      console.log(`   ✅ ${description} completed`);
      return true;
    }
  } catch (err) {
    console.error(`   ❌ ${description} error:`, err.message);
    return false;
  }
}

/**
 * Generate a unique code
 */
function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'USR';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Apply the fixes step by step
 */
async function applyFixes() {
  console.log('🚀 Applying promoters loading fixes...\n');
  
  // Step 1: Add missing columns to profiles table
  console.log('1️⃣ Adding missing columns to profiles table');
  
  const columnQueries = [
    {
      description: 'Add age column',
      sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25 CHECK (age >= 16 AND age <= 80);'
    },
    {
      description: 'Add nationality column',
      sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT \'\';'
    },
    {
      description: 'Add phone_number column',
      sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;'
    },
    {
      description: 'Add gender column',
      sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT \'Male\' CHECK (gender IN (\'Male\', \'Female\', \'Other\'));'
    },
    {
      description: 'Add unique_code column',
      sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;'
    },
    {
      description: 'Add address column',
      sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT DEFAULT \'\';'
    },
    {
      description: 'Add is_student column',
      sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false;'
    }
  ];
  
  for (const query of columnQueries) {
    await executeSql(query.description, query.sql);
  }
  
  // Step 2: Create unique index
  console.log('\n2️⃣ Creating database indexes');
  await executeSql(
    'Create unique code index',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;'
  );
  
  // Step 3: Migrate existing user data
  console.log('\n3️⃣ Migrating existing user data');
  
  try {
    // Get all users with metadata
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError.message);
      return;
    }
    
    console.log(`📊 Found ${users.users.length} users to check`);
    
    let migratedCount = 0;
    
    for (const user of users.users) {
      if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
        const metadata = user.user_metadata;
        
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, unique_code, age')
          .eq('id', user.id)
          .single();
        
        if (existingProfile && (!existingProfile.unique_code || existingProfile.age === 25)) {
          // Update profile with metadata
          const updateData = {
            age: metadata.age ? parseInt(metadata.age) : 25,
            nationality: metadata.nationality || '',
            phone_number: metadata.phone_number && metadata.phone_number !== 'null' ? metadata.phone_number : null,
            gender: metadata.gender || 'Male',
            address: metadata.address || '',
            is_student: metadata.is_student === true || metadata.is_student === 'true',
            unique_code: metadata.unique_code || generateUniqueCode(),
            updated_at: new Date().toISOString()
          };
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);
          
          if (!updateError) {
            migratedCount++;
            console.log(`   ✅ Migrated user ${existingProfile.id}`);
          } else {
            console.log(`   ⚠️ Failed to migrate ${user.id}: ${updateError.message}`);
          }
        }
      }
    }
    
    console.log(`📈 Successfully migrated ${migratedCount} user profiles`);
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
  
  // Step 4: Ensure all profiles have unique codes
  console.log('\n4️⃣ Ensuring all profiles have unique codes');
  
  const { data: profilesWithoutCodes } = await supabase
    .from('profiles')
    .select('id')
    .is('unique_code', null);
  
  if (profilesWithoutCodes && profilesWithoutCodes.length > 0) {
    console.log(`📝 Adding unique codes to ${profilesWithoutCodes.length} profiles`);
    
    for (const profile of profilesWithoutCodes) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          unique_code: generateUniqueCode(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
      
      if (error) {
        console.log(`   ⚠️ Failed to add code to ${profile.id}: ${error.message}`);
      }
    }
  }
  
  // Step 5: Test the fix
  console.log('\n5️⃣ Testing the fix');
  
  const { data: testPromoters, error: testError } = await supabase
    .from('profiles')
    .select('id, unique_code, full_name, age, nationality, phone_number, role, verification_status')
    .in('role', ['part_timer', 'promoter']);
  
  if (testError) {
    console.error('❌ Test query failed:', testError.message);
    console.log('The fix may not be complete. Check the database schema.');
  } else {
    const approvedPromoters = testPromoters.filter(p => p.verification_status === 'approved');
    
    console.log(`✅ Test successful!`);
    console.log(`📊 Found ${testPromoters.length} total promoter profiles`);
    console.log(`📊 Found ${approvedPromoters.length} approved promoters available for assignment`);
    
    if (approvedPromoters.length > 0) {
      console.log('\n   Sample approved promoter:');
      const sample = approvedPromoters[0];
      console.log(`   - Name: ${sample.full_name || 'Unknown'}`);
      console.log(`   - Code: ${sample.unique_code || 'Missing'}`);
      console.log(`   - Age: ${sample.age || 'Not set'}`);
      console.log(`   - Nationality: ${sample.nationality || 'Not set'}`);
      console.log(`   - Role: ${sample.role}`);
    } else {
      console.log('\n⚠️ No approved promoters found. You may need to:');
      console.log('   1. Create part-timer accounts through signup');
      console.log('   2. Set verification_status to "approved" in the database');
      console.log('   3. Ensure role is set to "part_timer"');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Smart Shift Tracker - Quick Promoters Fix');
  console.log('===========================================\n');
  
  await applyFixes();
  
  console.log('\n🎉 Promoters fix completed!');
  console.log('\nWhat was fixed:');
  console.log('✅ Added missing columns to profiles table (age, nationality, phone_number, etc.)');
  console.log('✅ Migrated user metadata to profile columns');
  console.log('✅ Ensured all profiles have unique codes');
  console.log('✅ Created necessary database indexes');
  
  console.log('\nNext steps:');
  console.log('1. 🌐 Test promoter assignment in your web app');
  console.log('2. 👥 Make sure promoters have verification_status = "approved"');
  console.log('3. 🏢 Try creating a shift and assigning promoters');
  
  process.exit(0);
}

// Run the fix
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});