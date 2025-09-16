#!/usr/bin/env node

/**
 * Debug Promoters Loading Issue
 * 
 * This script diagnoses exactly why "Failed to load promoters data" occurs
 * by simulating the exact same queries the frontend makes.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create both clients to test permissions
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugPromotersIssue() {
  console.log('🐛 Debugging Promoters Loading Issue');
  console.log('===================================\n');
  
  try {
    // Step 1: Check database schema with admin client
    console.log('1️⃣ Checking database schema (admin)...');
    
    const { data: schemaCheck, error: schemaError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message);
      return;
    }
    
    if (schemaCheck && schemaCheck.length > 0) {
      const columns = Object.keys(schemaCheck[0]);
      console.log('✅ Available columns:', columns.join(', '));
      
      const hasUniqueCode = columns.includes('unique_code');
      console.log(`   unique_code column: ${hasUniqueCode ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (!hasUniqueCode) {
        console.log('🚨 ISSUE FOUND: unique_code column is missing!');
        console.log('   This will cause the enhanced query to fail.');
      }
    }
    
    // Step 2: Test the exact query that usePromoters makes
    console.log('\n2️⃣ Testing exact usePromoters query...');
    
    // Simulate the enhancedQuery function
    const enhancedQuery = async (table, select) => {
      const { data, error } = await supabaseAnon
        .from(table)
        .select(select);
      
      if (error) throw error;
      return data;
    };
    
    try {
      console.log('   Trying enhanced query...');
      const enhancedData = await enhancedQuery(
        'profiles',
        'id, unique_code, full_name, age, nationality, phone_number, role, verification_status'
      );
      
      console.log('✅ Enhanced query succeeded!');
      console.log(`   Found ${enhancedData.length} records`);
      
      const promoters = enhancedData.filter(p => 
        (p.role === 'part_timer' || p.role === 'promoter') && 
        p.verification_status === 'approved'
      );
      
      console.log(`   Filtered to ${promoters.length} approved promoters`);
      
      if (promoters.length > 0) {
        console.log('   Promoters found:');
        promoters.forEach((p, i) => {
          console.log(`     ${i+1}. ${p.full_name} (${p.unique_code})`);
        });
      }
      
    } catch (enhancedError) {
      console.log('❌ Enhanced query failed:', enhancedError.message);
      
      // Try fallback query
      console.log('   Trying fallback query...');
      
      try {
        const basicData = await enhancedQuery(
          'profiles',
          'id, full_name, role, verification_status, email'
        );
        
        console.log('✅ Fallback query succeeded!');
        console.log(`   Found ${basicData.length} records`);
        
        const basicPromoters = basicData.filter(p => 
          (p.role === 'part_timer' || p.role === 'promoter') && 
          p.verification_status === 'approved'
        );
        
        console.log(`   Filtered to ${basicPromoters.length} approved promoters`);
        
        if (basicPromoters.length > 0) {
          console.log('   Basic promoters found:');
          basicPromoters.forEach((p, i) => {
            const fallbackCode = `USR${p.id.slice(-5).toUpperCase()}`;
            console.log(`     ${i+1}. ${p.full_name} (${fallbackCode} - generated)`);
          });
        }
        
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError.message);
        console.log('🚨 CRITICAL: Both queries failed - this explains the error!');
      }
    }
    
    // Step 3: Check RLS policies
    console.log('\n3️⃣ Checking RLS policies...');
    
    try {
      // Test with anonymous client (simulates unauthenticated user)
      const { data: anonTest, error: anonError } = await supabaseAnon
        .from('profiles')
        .select('id, full_name, role')
        .limit(1);
      
      if (anonError) {
        console.log('❌ Anonymous access failed:', anonError.message);
        console.log('   This suggests RLS policies are blocking access');
        console.log('   User must be authenticated to access profiles');
      } else {
        console.log('✅ Anonymous access works');
        console.log(`   Retrieved ${anonTest.length} records without auth`);
      }
      
    } catch (anonTestError) {
      console.log('❌ Anonymous test error:', anonTestError.message);
    }
    
    // Step 4: Check if we need to authenticate
    console.log('\n4️⃣ Testing with authentication...');
    
    try {
      // Try to sign in as the test company
      const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
        email: 'company1@test.com',
        password: 'testpass123'
      });
      
      if (authError) {
        console.log('❌ Authentication failed:', authError.message);
        console.log('   Cannot test authenticated queries');
      } else {
        console.log('✅ Authentication successful');
        console.log(`   Logged in as: ${authData.user.email}`);
        
        // Now test the query with authentication
        const { data: authTest, error: authTestError } = await supabaseAnon
          .from('profiles')
          .select('id, full_name, role, verification_status')
          .in('role', ['part_timer', 'promoter']);
        
        if (authTestError) {
          console.log('❌ Authenticated query failed:', authTestError.message);
          console.log('🚨 ISSUE: Even with authentication, query fails');
        } else {
          console.log('✅ Authenticated query succeeded!');
          console.log(`   Found ${authTest.length} part-timer records`);
          
          const approvedCount = authTest.filter(p => p.verification_status === 'approved').length;
          console.log(`   ${approvedCount} are approved and should show in dropdown`);
        }
        
        // Sign out
        await supabaseAnon.auth.signOut();
      }
      
    } catch (authTestError) {
      console.log('❌ Authentication test error:', authTestError.message);
    }
    
    // Step 5: Provide diagnosis
    console.log('\n📋 DIAGNOSIS SUMMARY');
    console.log('===================');
    
    // Check what we found
    const { data: finalCheck, error: finalError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (finalError) {
      console.log('❌ Cannot access database at all');
      console.log('   Problem: Database connection or permissions');
    } else {
      const columns = Object.keys(finalCheck[0] || {});
      const hasUniqueCode = columns.includes('unique_code');
      
      if (!hasUniqueCode) {
        console.log('🚨 ROOT CAUSE: Missing unique_code column');
        console.log('   Solution: Run the SQL fix to add the column');
      } else {
        console.log('✅ Database schema is correct');
        console.log('   Issue is likely: Authentication or RLS policies');
      }
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

async function main() {
  await debugPromotersIssue();
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. If unique_code column is missing: Run QUICK_SQL_FIX.sql');
  console.log('2. If RLS policies block access: Check authentication in browser');
  console.log('3. If both queries fail: Check Supabase connection');
  console.log('4. Open browser console (F12) when testing to see exact errors');
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});