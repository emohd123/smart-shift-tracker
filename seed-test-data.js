#!/usr/bin/env node
/**
 * Test Data Seeding Script
 * Creates test accounts for promoters, companies, and admins
 * 
 * Usage: node seed-test-data.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eihytvzfayoczbplecbz.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('⚠️  Missing SUPABASE_SERVICE_ROLE_KEY - using anon key (limited access)');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : supabase;

const testPromoters = [
  {
    email: 'promoter1@test.com',
    password: 'Test@123456',
    full_name: 'John Promoter',
    age: 28,
    gender: 'male',
    nationality: 'NG',
    phone_number: '+2348012345678',
  },
  {
    email: 'promoter2@test.com',
    password: 'Test@123456',
    full_name: 'Sarah Johnson',
    age: 25,
    gender: 'female',
    nationality: 'NG',
    phone_number: '+2348087654321',
  },
  {
    email: 'promoter3@test.com',
    password: 'Test@123456',
    full_name: 'Ahmed Hassan',
    age: 30,
    gender: 'male',
    nationality: 'NG',
    phone_number: '+2349012345678',
  },
];

const testCompanies = [
  {
    email: 'company1@test.com',
    password: 'Test@123456',
    company_name: 'Tech Solutions Ltd',
    business_registration_number: 'BRN123456',
    phone_number: '+2348000000001',
  },
  {
    email: 'company2@test.com',
    password: 'Test@123456',
    company_name: 'Marketing Experts Inc',
    business_registration_number: 'BRN789012',
    phone_number: '+2348000000002',
  },
];

async function seedTestData() {
  console.log('\n🌱 Starting test data seeding...\n');

  try {
    // Seed Promoters
    console.log('👥 Creating promoter accounts...');
    let promoterCount = 0;
    for (const promoter of testPromoters) {
      try {
        // Try to sign up the promoter
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: promoter.email,
          password: promoter.password,
          options: {
            data: {
              role: 'promoter',
              full_name: promoter.full_name,
            }
          }
        });

        if (authError && !authError.message.includes('already registered')) {
          console.error(`   ❌ ${promoter.full_name}: ${authError.message}`);
          continue;
        }

        if (authData.user) {
          // Update profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              full_name: promoter.full_name,
              age: promoter.age,
              gender: promoter.gender,
              nationality: promoter.nationality,
              phone_number: promoter.phone_number,
              verification_status: 'approved', // Auto-approve for testing
              role: 'promoter'
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error(`   ❌ ${promoter.full_name}: Profile update failed -${profileError.message}`);
          } else {
            console.log(`   ✅ ${promoter.full_name} (${promoter.email})`);
            promoterCount++;
          }
        }
      } catch (err) {
        console.error(`   ❌ ${promoter.full_name}: ${err.message}`);
      }
    }
    console.log(`   Created ${promoterCount}/${testPromoters.length} promoters\n`);

    // Seed Companies
    console.log('🏢 Creating company accounts...');
    let companyCount = 0;
    for (const company of testCompanies) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: company.email,
          password: company.password,
          options: {
            data: {
              role: 'company',
              company_name: company.company_name,
            }
          }
        });

        if (authError && !authError.message.includes('already registered')) {
          console.error(`   ❌ ${company.company_name}: ${authError.message}`);
          continue;
        }

        if (authData.user) {
          // Update profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              full_name: company.company_name,
              phone_number: company.phone_number,
              role: 'company',
              verification_status: 'approved'
            })
            .eq('id', authData.user.id);

          // Create company profile
          if (!profileError) {
            await supabaseAdmin
              .from('company_profiles')
              .upsert({
                company_id: authData.user.id,
                business_registration_number: company.business_registration_number,
                company_name: company.company_name,
              }, { onConflict: 'company_id' })
              .select();

            console.log(`   ✅ ${company.company_name} (${company.email})`);
            companyCount++;
          } else {
            console.error(`   ❌ ${company.company_name}: Profile update failed - ${profileError.message}`);
          }
        }
      } catch (err) {
        console.error(`   ❌ ${company.company_name}: ${err.message}`);
      }
    }
    console.log(`   Created ${companyCount}/${testCompanies.length} companies\n`);

    // Summary
    console.log('✅ Seeding complete!');
    console.log('\n📋 Test Credentials:');
    console.log('\nPromoters:');
    testPromoters.slice(0, 2).forEach(p => {
      console.log(`  Email: ${p.email} | Password: ${p.password}`);
    });
    console.log('\nCompanies:');
    testCompanies.slice(0, 1).forEach(c => {
      console.log(`  Email: ${c.email} | Password: ${c.password}`);
    });

    console.log('\n🧪 Next steps:');
    console.log('  1. Log in with a company account');
    console.log('  2. Go to Company Dashboard');
    console.log('  3. You should now see promoters in "Available Promoters"');
    console.log('  4. Create a shift and assign promoters\n');

  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run seeding
seedTestData();
