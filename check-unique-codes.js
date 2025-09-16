#!/usr/bin/env node

/**
 * Check Unique Codes in User Metadata
 * 
 * This script shows the actual unique codes stored in user metadata
 * to help debug the display issue.
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

async function checkUniqueCodes() {
  console.log('🔍 Checking Unique Codes in User Metadata');
  console.log('=========================================\n');
  
  try {
    // Get auth users with metadata
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }
    
    console.log(`📊 Found ${authUsers.users.length} auth users\n`);
    
    // Get profiles for comparison
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role, verification_status');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return;
    }
    
    // Show detailed info for each user
    authUsers.users.forEach((user, index) => {
      const profile = profiles.find(p => p.id === user.id);
      
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Profile: ${profile ? profile.full_name : 'No profile'} (${profile ? profile.role : 'N/A'})`);
      console.log(`   Status: ${profile ? profile.verification_status : 'N/A'}`);
      
      if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
        console.log(`   Metadata:`);
        Object.entries(user.user_metadata).forEach(([key, value]) => {
          if (key === 'unique_code') {
            console.log(`     🎯 ${key}: ${value} ← THIS IS THE UNIQUE CODE`);
          } else {
            console.log(`     ${key}: ${value}`);
          }
        });
      } else {
        console.log(`   Metadata: None`);
      }
      console.log('');
    });
    
    // Show only part-timers with their unique codes
    const partTimers = authUsers.users.filter(user => {
      const profile = profiles.find(p => p.id === user.id);
      return profile && profile.role === 'part_timer' && profile.verification_status === 'approved';
    });
    
    if (partTimers.length > 0) {
      console.log('👥 Approved Part-timers with Unique Codes:');
      console.log('==========================================');
      
      partTimers.forEach((user, index) => {
        const profile = profiles.find(p => p.id === user.id);
        const uniqueCode = user.user_metadata?.unique_code || `USR${user.id.slice(-5).toUpperCase()}`;
        
        console.log(`${index + 1}. ${profile.full_name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Unique Code: ${uniqueCode}`);
        console.log(`   Status: ${profile.verification_status}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function main() {
  await checkUniqueCodes();
  
  console.log('📋 What should happen in the app:');
  console.log('1. Go to http://localhost:8082');
  console.log('2. Login as company1@test.com / testpass123');
  console.log('3. Navigate to shift creation');
  console.log('4. Open promoter assignment dropdown');
  console.log('5. You should see the unique codes listed above');
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});