#!/usr/bin/env node

/**
 * Create Test Promoter Data
 * 
 * This script creates a test part-timer profile directly in the database
 * so we can test the promoters assignment feature.
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

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'USR';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createTestPromoter() {
  console.log('🚀 Creating Test Promoter Data');
  console.log('==============================\n');
  
  try {
    // Step 1: Check if we can add missing columns
    console.log('1️⃣ Attempting to add missing columns...');
    
    // Try to add the unique_code column at least
    try {
      // First, just try to select with the basic columns to see what exists
      const { data: testSelect, error: testError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, verification_status')
        .limit(1);
      
      if (testError) {
        console.error('❌ Cannot access profiles table:', testError.message);
        return;
      }
      
      console.log('✅ Profiles table accessible');
      
    } catch (error) {
      console.error('❌ Error testing profiles table:', error.message);
      return;
    }
    
    // Step 2: Create test data with available columns
    console.log('\n2️⃣ Creating test promoter profile...');
    
    const testPromoterId = generateId();
    const uniqueCode = generateUniqueCode();
    
    // Create with only the columns that exist
    const profileData = {
      id: testPromoterId,
      full_name: 'Test Promoter',
      email: 'test.promoter@example.com',
      role: 'part_timer',
      verification_status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Creating profile:', profileData);
    
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating profile:', createError.message);
      
      // If there's a foreign key error, try with tenant_id
      if (createError.message.includes('tenant_id') || createError.message.includes('foreign key')) {
        console.log('⚠️ Trying without tenant_id constraint...');
        
        const modifiedData = { ...profileData };
        delete modifiedData.tenant_id;
        
        const { data: retryProfile, error: retryError } = await supabase
          .from('profiles')
          .insert(modifiedData)
          .select()
          .single();
        
        if (retryError) {
          console.error('❌ Retry also failed:', retryError.message);
          return;
        }
        
        console.log('✅ Profile created successfully (retry)');
      } else {
        return;
      }
    } else {
      console.log('✅ Profile created successfully');
    }
    
    // Step 3: Test the query that usePromoters uses
    console.log('\n3️⃣ Testing promoters query...');
    
    const { data: basicQuery, error: basicError } = await supabase
      .from('profiles')
      .select('id, full_name, role, verification_status, email')
      .in('role', ['part_timer', 'promoter']);
    
    if (basicError) {
      console.error('❌ Basic query failed:', basicError.message);
    } else {
      console.log(`✅ Basic query succeeded - found ${basicQuery.length} part-timers`);
      
      if (basicQuery.length > 0) {
        console.log('\n👥 Available part-timers:');
        basicQuery.forEach((pt, index) => {
          console.log(`   ${index + 1}. ${pt.full_name} (${pt.role})`);
          console.log(`      Status: ${pt.verification_status}`);
          console.log(`      Email: ${pt.email}`);
        });
      }
    }
    
    // Step 4: Create additional test promoters
    console.log('\n4️⃣ Creating additional test promoters...');
    
    const additionalPromoters = [
      {
        id: generateId(),
        full_name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        role: 'part_timer',
        verification_status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: generateId(),
        full_name: 'Mike Chen',
        email: 'mike.chen@example.com',
        role: 'part_timer',
        verification_status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: generateId(),
        full_name: 'Emily Davis',
        email: 'emily.davis@example.com',
        role: 'part_timer',
        verification_status: 'pending', // One pending to test filtering
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    for (const promoter of additionalPromoters) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(promoter);
      
      if (insertError) {
        console.log(`⚠️ Failed to create ${promoter.full_name}: ${insertError.message}`);
      } else {
        console.log(`✅ Created ${promoter.full_name} (${promoter.verification_status})`);
      }
    }
    
    // Step 5: Final test
    console.log('\n5️⃣ Final verification...');
    
    const { data: finalTest, error: finalError } = await supabase
      .from('profiles')
      .select('id, full_name, role, verification_status')
      .in('role', ['part_timer', 'promoter']);
    
    if (finalError) {
      console.error('❌ Final test failed:', finalError.message);
    } else {
      const approved = finalTest.filter(p => p.verification_status === 'approved');
      const pending = finalTest.filter(p => p.verification_status === 'pending');
      
      console.log(`✅ Final test passed!`);
      console.log(`📊 Total part-timers: ${finalTest.length}`);
      console.log(`📊 Approved: ${approved.length}`);
      console.log(`📊 Pending: ${pending.length}`);
      
      if (approved.length > 0) {
        console.log('\n🎉 Ready for testing!');
        console.log('The promoters should now show up in the shift assignment form.');
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function main() {
  await createTestPromoter();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Go to http://localhost:8082 in your browser');
  console.log('2. Login as a company user (or create company account)');
  console.log('3. Go to create shift page');
  console.log('4. Test the promoter assignment dropdown');
  console.log('5. You should see the test promoters listed');
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});