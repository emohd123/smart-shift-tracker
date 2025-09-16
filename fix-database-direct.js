#!/usr/bin/env node

/**
 * Direct Database Fix for Promoters
 * 
 * This script directly applies the database schema changes using individual queries
 * to fix the promoters loading issue.
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
 * Generate unique code
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
 * Check if columns exist and add them if needed
 */
async function addMissingColumns() {
  console.log('🔧 Adding missing columns to profiles table...');
  
  try {
    // First, let's see what columns currently exist
    const { data: existingColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('❌ Could not check existing columns:', columnsError.message);
      return false;
    }
    
    const columnNames = existingColumns.map(c => c.column_name);
    console.log('📋 Existing columns:', columnNames.join(', '));
    
    // Check which columns are missing
    const requiredColumns = ['age', 'nationality', 'phone_number', 'unique_code', 'gender', 'address', 'is_student'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All required columns already exist');
      return true;
    }
    
    console.log('📝 Missing columns that need to be added:', missingColumns.join(', '));
    
    // Add missing columns manually using direct column updates
    // Since we can't execute DDL directly, let's check what we can do
    
    console.log('⚠️ Cannot add columns directly via client. Schema needs manual update.');
    console.log('\n📋 Required SQL to run manually:');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT \'\';');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT \'Male\';');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT DEFAULT \'\';');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false;');
    
    return false;
    
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    return false;
  }
}

/**
 * Update existing profiles with metadata
 */
async function migrateExistingData() {
  console.log('\n📦 Migrating existing user data...');
  
  try {
    // Get all users with metadata
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError.message);
      return;
    }
    
    console.log(`👥 Found ${users.users.length} users`);
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, unique_code, age');
    
    if (profilesError) {
      console.error('❌ Failed to fetch profiles:', profilesError.message);
      return;
    }
    
    console.log(`📄 Found ${profiles.length} profiles`);
    
    let updatedCount = 0;
    
    for (const user of users.users) {
      if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
        const profile = profiles.find(p => p.id === user.id);
        
        if (profile) {
          const metadata = user.user_metadata;
          
          // Check if columns exist by trying to update with available data
          const updates = {};
          
          // Add only the columns that exist in the current schema
          if (metadata.full_name) {
            updates.full_name = metadata.full_name;
          }
          
          // Add unique code from metadata or generate new one
          if (!profile.unique_code && metadata.unique_code) {
            updates.unique_code = metadata.unique_code;
          } else if (!profile.unique_code) {
            updates.unique_code = generateUniqueCode();
          }
          
          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                ...updates,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
            
            if (updateError) {
              // Check if error is about missing columns
              if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
                console.log(`   ⚠️ Column missing for ${user.id}: ${updateError.message}`);
              } else {
                console.log(`   ❌ Failed to update ${user.id}: ${updateError.message}`);
              }
            } else {
              updatedCount++;
              console.log(`   ✅ Updated profile for ${user.id}`);
            }
          }
        }
      }
    }
    
    console.log(`📊 Updated ${updatedCount} profiles`);
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

/**
 * Test promoters query
 */
async function testPromotersQuery() {
  console.log('\n🧪 Testing promoters query...');
  
  try {
    // Try the basic query first
    const { data: basicProfiles, error: basicError } = await supabase
      .from('profiles')
      .select('id, full_name, role, verification_status')
      .in('role', ['part_timer', 'promoter']);
    
    if (basicError) {
      console.error('❌ Basic profiles query failed:', basicError.message);
      return;
    }
    
    console.log(`✅ Basic query successful - found ${basicProfiles.length} promoter profiles`);
    
    // Try the enhanced query with all columns
    const { data: enhancedProfiles, error: enhancedError } = await supabase
      .from('profiles')
      .select('id, unique_code, full_name, age, nationality, phone_number, role, verification_status')
      .in('role', ['part_timer', 'promoter']);
    
    if (enhancedError) {
      console.error('❌ Enhanced query failed:', enhancedError.message);
      console.log('   This indicates missing columns in the profiles table');
      
      // Show which columns are missing
      const errorMsg = enhancedError.message;
      const columnMatch = errorMsg.match(/column "([^"]+)" does not exist/);
      if (columnMatch) {
        console.log(`   Missing column: ${columnMatch[1]}`);
      }
      
      return false;
    }
    
    console.log(`✅ Enhanced query successful - found ${enhancedProfiles.length} profiles with full data`);
    
    const approvedPromoters = enhancedProfiles.filter(p => p.verification_status === 'approved');
    console.log(`📊 ${approvedPromoters.length} approved promoters available for assignment`);
    
    if (approvedPromoters.length > 0) {
      const sample = approvedPromoters[0];
      console.log(`   Sample: ${sample.full_name} (${sample.unique_code || 'No code'})`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Smart Shift Tracker - Direct Database Fix');
  console.log('=============================================\n');
  
  // Step 1: Check and add missing columns
  const columnsAdded = await addMissingColumns();
  
  // Step 2: Migrate existing data
  await migrateExistingData();
  
  // Step 3: Test the query
  const queryWorks = await testPromotersQuery();
  
  console.log('\n📊 Fix Summary:');
  console.log(`   Columns: ${columnsAdded ? '✅' : '❌'} Schema updated`);
  console.log(`   Query: ${queryWorks ? '✅' : '❌'} Promoters query working`);
  
  if (!queryWorks) {
    console.log('\n🛠️ Manual Steps Required:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Run the SQL commands shown above');
    console.log('3. Run this script again to test');
  } else {
    console.log('\n🎉 Database fix completed successfully!');
    console.log('   Promoters should now load correctly in the web app.');
  }
}

// Run the fix
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});