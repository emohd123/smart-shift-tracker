#!/usr/bin/env node

/**
 * Test Current Database Data
 * 
 * This script checks what part-timer/promoter data currently exists
 * and helps debug the promoters loading issue.
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

async function testCurrentData() {
  console.log('🔍 Testing Current Database Data');
  console.log('================================\n');
  
  try {
    // Test 1: Check what columns exist in profiles table
    console.log('1️⃣ Checking profiles table structure...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error accessing profiles:', profilesError.message);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Profiles table columns:', Object.keys(profiles[0]).join(', '));
    } else {
      console.log('⚠️ No profiles found in database');
    }
    
    // Test 2: Check all profiles
    console.log('\n2️⃣ Checking all profiles...');
    
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*');
    
    if (allError) {
      console.error('❌ Error fetching all profiles:', allError.message);
    } else {
      console.log(`📊 Total profiles: ${allProfiles.length}`);
      
      if (allProfiles.length > 0) {
        console.log('\n📋 Profile details:');
        allProfiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ID: ${profile.id.slice(0, 8)}...`);
          console.log(`      Name: ${profile.full_name || 'Not set'}`);
          console.log(`      Email: ${profile.email || 'Not set'}`);
          console.log(`      Role: ${profile.role || 'Not set'}`);
          console.log(`      Status: ${profile.verification_status || 'Not set'}`);
          console.log(`      Created: ${profile.created_at || 'Not set'}`);
          console.log('');
        });
      }
    }
    
    // Test 3: Check specifically for part-timers
    console.log('3️⃣ Checking for part-timers...');
    
    const { data: partTimers, error: partTimersError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['part_timer', 'promoter']);
    
    if (partTimersError) {
      console.error('❌ Error fetching part-timers:', partTimersError.message);
    } else {
      console.log(`📊 Part-timer profiles: ${partTimers.length}`);
      
      if (partTimers.length > 0) {
        console.log('\n👥 Part-timer details:');
        partTimers.forEach((pt, index) => {
          console.log(`   ${index + 1}. ${pt.full_name || 'Unknown'} (${pt.role})`);
          console.log(`      Status: ${pt.verification_status || 'pending'}`);
          console.log(`      Email: ${pt.email || 'Not set'}`);
        });
      } else {
        console.log('⚠️ No part-timer profiles found');
      }
    }
    
    // Test 4: Check auth users
    console.log('\n4️⃣ Checking auth users...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
    } else {
      console.log(`📊 Total auth users: ${authUsers.users.length}`);
      
      if (authUsers.users.length > 0) {
        console.log('\n👤 Auth user details:');
        authUsers.users.forEach((user, index) => {
          console.log(`   ${index + 1}. Email: ${user.email}`);
          console.log(`      ID: ${user.id.slice(0, 8)}...`);
          console.log(`      Created: ${user.created_at}`);
          if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
            console.log(`      Metadata: ${Object.keys(user.user_metadata).join(', ')}`);
          }
        });
      }
    }
    
    // Test 5: Try the exact query that usePromoters uses
    console.log('\n5️⃣ Testing usePromoters query...');
    
    try {
      const { data: promotersData, error: promotersError } = await supabase
        .from('profiles')
        .select('id, unique_code, full_name, age, nationality, phone_number, role, verification_status')
        .in('role', ['part_timer', 'promoter']);
      
      if (promotersError) {
        console.log('❌ Enhanced query failed:', promotersError.message);
        
        // Try basic query
        const { data: basicData, error: basicError } = await supabase
          .from('profiles')
          .select('id, full_name, role, verification_status, email')
          .in('role', ['part_timer', 'promoter']);
        
        if (basicError) {
          console.log('❌ Basic query also failed:', basicError.message);
        } else {
          console.log('✅ Basic query succeeded');
          console.log(`📊 Found ${basicData.length} part-timer records`);
          
          if (basicData.length > 0) {
            console.log('\n📝 Basic data available:');
            basicData.forEach((record, index) => {
              console.log(`   ${index + 1}. ${record.full_name || 'Unknown'}`);
              console.log(`      Role: ${record.role}`);
              console.log(`      Status: ${record.verification_status}`);
            });
          }
        }
      } else {
        console.log('✅ Enhanced query succeeded');
        console.log(`📊 Found ${promotersData.length} promoter records with full data`);
      }
    } catch (error) {
      console.error('❌ Query test failed:', error.message);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

async function main() {
  await testCurrentData();
  
  console.log('\n📋 Summary:');
  console.log('- This test shows what data currently exists');
  console.log('- Check if any part-timers have verification_status = "approved"');
  console.log('- Missing columns will cause the enhanced query to fail');
  console.log('- The app should work with basic data using fallbacks');
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});