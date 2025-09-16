#!/usr/bin/env node

/**
 * Create Full Test User (Auth + Profile)
 * 
 * This script creates a complete test promoter with auth user and profile
 * to test the promoters assignment feature.
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

function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'USR';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createFullTestUser() {
  console.log('🚀 Creating Full Test Promoter (Auth + Profile)');
  console.log('===============================================\n');
  
  try {
    // Step 1: Create auth users
    console.log('1️⃣ Creating auth users...');
    
    const testUsers = [
      {
        email: 'promoter1@test.com',
        password: 'testpass123',
        full_name: 'John Smith',
        role: 'part_timer'
      },
      {
        email: 'promoter2@test.com',
        password: 'testpass123',
        full_name: 'Sarah Wilson',
        role: 'part_timer'
      },
      {
        email: 'company1@test.com',
        password: 'testpass123',
        full_name: 'Test Company',
        role: 'company_admin'
      }
    ];
    
    const createdUsers = [];
    
    for (const userData of testUsers) {
      console.log(`📝 Creating user: ${userData.email}`);
      
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
          age: 25,
          nationality: 'Test Country',
          unique_code: generateUniqueCode()
        }
      });
      
      if (authError) {
        console.log(`❌ Failed to create ${userData.email}: ${authError.message}`);
        continue;
      }
      
      console.log(`✅ Created auth user: ${authUser.user.email}`);
      createdUsers.push({ ...userData, authUser: authUser.user });
    }
    
    // Step 2: Create profiles for the users
    console.log('\n2️⃣ Creating profiles...');
    
    for (const user of createdUsers) {
      console.log(`📝 Creating profile for: ${user.email}`);
      
      const profileData = {
        id: user.authUser.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        verification_status: user.role === 'part_timer' ? 'approved' : 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (profileError) {
        console.log(`❌ Failed to create profile for ${user.email}: ${profileError.message}`);
      } else {
        console.log(`✅ Created profile: ${profile.full_name} (${profile.role})`);
      }
    }
    
    // Step 3: Test the promoters query
    console.log('\n3️⃣ Testing promoters query...');
    
    const { data: promotersTest, error: promotersError } = await supabase
      .from('profiles')
      .select('id, full_name, role, verification_status, email')
      .in('role', ['part_timer', 'promoter']);
    
    if (promotersError) {
      console.error('❌ Promoters query failed:', promotersError.message);
    } else {
      const approvedPromoters = promotersTest.filter(p => p.verification_status === 'approved');
      
      console.log(`✅ Promoters query succeeded!`);
      console.log(`📊 Total part-timers: ${promotersTest.length}`);
      console.log(`📊 Approved promoters: ${approvedPromoters.length}`);
      
      if (approvedPromoters.length > 0) {
        console.log('\n👥 Approved promoters:');
        approvedPromoters.forEach((promoter, index) => {
          console.log(`   ${index + 1}. ${promoter.full_name}`);
          console.log(`      Email: ${promoter.email}`);
          console.log(`      Status: ${promoter.verification_status}`);
        });
      }
    }
    
    // Step 4: Test the enhanced query (should fail gracefully)
    console.log('\n4️⃣ Testing enhanced query...');
    
    try {
      const { data: enhancedTest, error: enhancedError } = await supabase
        .from('profiles')
        .select('id, unique_code, full_name, age, nationality, phone_number, role, verification_status')
        .in('role', ['part_timer', 'promoter']);
      
      if (enhancedError) {
        console.log('⚠️ Enhanced query failed (expected):', enhancedError.message);
        console.log('   This is OK - the fallback query should work');
      } else {
        console.log('✅ Enhanced query succeeded!');
        console.log(`📊 Found ${enhancedTest.length} promoters with full data`);
      }
    } catch (error) {
      console.log('⚠️ Enhanced query error (expected):', error.message);
    }
    
    // Step 5: Show login credentials
    console.log('\n5️⃣ Test accounts created:');
    console.log('\n🔐 Login Credentials:');
    console.log('');
    
    const partTimers = createdUsers.filter(u => u.role === 'part_timer');
    const companies = createdUsers.filter(u => u.role === 'company_admin');
    
    if (partTimers.length > 0) {
      console.log('📱 Part-timer accounts:');
      partTimers.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Password: ${user.password}`);
        console.log(`      Name: ${user.full_name}`);
      });
      console.log('');
    }
    
    if (companies.length > 0) {
      console.log('🏢 Company accounts:');
      companies.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Password: ${user.password}`);
        console.log(`      Name: ${user.full_name}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function main() {
  await createFullTestUser();
  
  console.log('📋 Testing Steps:');
  console.log('1. Go to http://localhost:8082');
  console.log('2. Login with company1@test.com / testpass123');
  console.log('3. Go to create shift (or wherever promoter assignment is)');
  console.log('4. Check if promoters show up in the dropdown');
  console.log('5. You should see the approved part-timers listed');
  console.log('');
  console.log('🔧 If promoters still don\'t load:');
  console.log('- Check browser console for errors');
  console.log('- The app should use fallback query with basic data');
  console.log('- Each promoter will show with generated unique codes');
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});