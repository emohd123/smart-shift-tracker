#!/usr/bin/env node

/**
 * Data Migration Script: User Metadata to Profiles
 * 
 * This script migrates user metadata from auth.users.raw_user_meta_data 
 * to the profiles table columns for better data structure and querying.
 * 
 * Usage: node migrate-user-data.js
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
 * Generate a unique 8-character alphanumeric code
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
 * Check if a unique code already exists
 */
async function isUniqueCodeExists(code) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('unique_code', code)
    .single();
  
  return !error && data;
}

/**
 * Generate a truly unique code
 */
async function generateTrulyUniqueCode() {
  let code;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateUniqueCode();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Failed to generate unique code after maximum attempts');
    }
  } while (await isUniqueCodeExists(code));
  
  return code;
}

/**
 * Migrate user metadata to profile columns
 */
async function migrateUserData() {
  console.log('🚀 Starting user data migration...');
  
  try {
    // First, check if the profiles table has the new columns
    console.log('📋 Checking profiles table schema...');
    const { data: columns, error: schemaError } = await supabase
      .rpc('information_schema_columns', {
        table_name: 'profiles',
        schema_name: 'public'
      });
    
    if (schemaError) {
      console.error('❌ Error checking schema:', schemaError.message);
      return;
    }
    
    const hasNewColumns = [
      'age', 'nationality', 'phone_number', 'gender', 
      'height', 'weight', 'address', 'unique_code'
    ].every(col => columns?.some(c => c.column_name === col));
    
    if (!hasNewColumns) {
      console.error('❌ Profiles table is missing required columns.');
      console.error('   Please run the database migration first:');
      console.error('   supabase db push');
      return;
    }
    
    console.log('✅ Schema check passed');
    
    // Fetch all users with their metadata and profiles
    console.log('📥 Fetching users and profiles...');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }
    
    console.log(`📊 Found ${users.users.length} users`);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} profiles`);
    
    // Create a map of user ID to metadata
    const userMetadataMap = {};
    users.users.forEach(user => {
      if (user.user_metadata) {
        userMetadataMap[user.id] = user.user_metadata;
      }
    });
    
    // Migrate each profile
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const profile of profiles) {
      try {
        const metadata = userMetadataMap[profile.id];
        
        // Skip if no metadata or if profile already has a unique code and age data
        if (!metadata || (profile.unique_code && profile.age !== 25)) {
          skippedCount++;
          continue;
        }
        
        console.log(`🔄 Migrating user ${profile.id} (${profile.full_name || 'Unknown'})...`);
        
        // Generate unique code if not exists
        let uniqueCode = profile.unique_code;
        if (!uniqueCode) {
          uniqueCode = metadata.unique_code || await generateTrulyUniqueCode();
        }
        
        // Prepare update data with metadata values or defaults
        const updateData = {
          age: metadata.age ? parseInt(metadata.age) : 25,
          nationality: metadata.nationality || '',
          phone_number: (metadata.phone_number && metadata.phone_number !== 'null') ? metadata.phone_number : null,
          gender: metadata.gender || 'Male',
          height: metadata.height ? parseInt(metadata.height) : 170,
          weight: metadata.weight ? parseInt(metadata.weight) : 70,
          address: metadata.address || '',
          is_student: metadata.is_student === true || metadata.is_student === 'true',
          bank_details: (metadata.bank_details && metadata.bank_details !== 'null') ? metadata.bank_details : null,
          unique_code: uniqueCode,
          id_card_url: (metadata.id_card_url && metadata.id_card_url !== 'null') ? metadata.id_card_url : null,
          profile_photo_url: (metadata.profile_photo_url && metadata.profile_photo_url !== 'null') ? metadata.profile_photo_url : null,
          updated_at: new Date().toISOString()
        };
        
        // Update the profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', profile.id);
        
        if (updateError) {
          console.error(`❌ Error updating profile ${profile.id}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Successfully migrated ${profile.id}`);
          migratedCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing profile ${profile.id}:`, error.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped (already migrated): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total profiles: ${profiles.length}`);
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('   Users now have complete profile data for promoter assignment.');
    } else if (skippedCount === profiles.length) {
      console.log('\n✅ All profiles already migrated - no action needed.');
    }
    
    // Verify migration by checking for promoters
    console.log('\n🔍 Verifying migration...');
    const { data: promoters, error: promotersError } = await supabase
      .from('profiles')
      .select('id, full_name, unique_code, role, verification_status')
      .in('role', ['part_timer', 'promoter'])
      .eq('verification_status', 'approved');
    
    if (promotersError) {
      console.error('❌ Error verifying migration:', promotersError.message);
    } else {
      console.log(`✅ Found ${promoters.length} approved promoters available for assignment`);
      
      if (promoters.length > 0) {
        console.log('   Sample promoters:');
        promoters.slice(0, 3).forEach(p => {
          console.log(`   - ${p.full_name} (${p.unique_code})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Smart Shift Tracker - User Data Migration Tool');
  console.log('===============================================\n');
  
  await migrateUserData();
  
  console.log('\n✨ Migration process completed!');
  process.exit(0);
}

// Run the migration
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});