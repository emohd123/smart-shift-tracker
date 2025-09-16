import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Connecting to Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyDatabaseFix() {
  try {
    console.log('🔧 Applying database fix for promoters loading issue...');
    
    // Step 1: Add missing unique_code column
    console.log('📊 Step 1: Adding unique_code column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;'
    });
    
    if (alterError && !alterError.message.includes('already exists')) {
      console.error('❌ Failed to add unique_code column:', alterError);
      // Continue anyway - might already exist
    } else {
      console.log('✅ unique_code column added successfully');
    }
    
    // Step 2: Add other missing columns
    console.log('📊 Step 2: Adding other missing columns...');
    const additionalColumns = [
      'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;',
      'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT \'\';',
      'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;'
    ];
    
    for (const sql of additionalColumns) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error && !error.message.includes('already exists')) {
        console.warn('⚠️ Warning adding column:', error.message);
      }
    }
    
    // Step 3: Update existing profiles with unique codes
    console.log('📊 Step 3: Updating existing profiles with unique codes...');
    
    // Update John Smith
    const { error: johnError } = await supabase
      .from('profiles')
      .update({
        unique_code: 'USRNEUHC',
        age: 25,
        nationality: 'Test Country'
      })
      .eq('email', 'promoter1@test.com')
      .eq('full_name', 'John Smith');
    
    if (johnError) {
      console.error('❌ Failed to update John Smith:', johnError);
    } else {
      console.log('✅ Updated John Smith with unique code USRNEUHC');
    }
    
    // Update Sarah Wilson
    const { error: sarahError } = await supabase
      .from('profiles')
      .update({
        unique_code: 'USR7JMF5',
        age: 25,
        nationality: 'Test Country'
      })
      .eq('email', 'promoter2@test.com')
      .eq('full_name', 'Sarah Wilson');
    
    if (sarahError) {
      console.error('❌ Failed to update Sarah Wilson:', sarahError);
    } else {
      console.log('✅ Updated Sarah Wilson with unique code USR7JMF5');
    }
    
    // Update Test Company
    const { error: companyError } = await supabase
      .from('profiles')
      .update({
        unique_code: 'USRB96Q6',
        age: 30,
        nationality: 'Test Country'
      })
      .eq('email', 'company1@test.com')
      .eq('full_name', 'Test Company');
    
    if (companyError) {
      console.error('❌ Failed to update Test Company:', companyError);
    } else {
      console.log('✅ Updated Test Company with unique code USRB96Q6');
    }
    
    // Step 4: Test the fix
    console.log('🧪 Step 4: Testing the fix...');
    
    const { data: promoters, error: testError } = await supabase
      .from('profiles')
      .select('id, unique_code, full_name, age, nationality, phone_number, role, verification_status')
      .in('role', ['part_timer', 'promoter'])
      .eq('verification_status', 'approved');
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
      console.log('🔄 Trying basic query...');
      
      // Try basic query
      const { data: basicData, error: basicError } = await supabase
        .from('profiles')
        .select('id, full_name, unique_code, role, verification_status')
        .in('role', ['part_timer', 'promoter']);
      
      if (basicError) {
        console.error('❌ Basic query also failed:', basicError);
      } else {
        console.log('✅ Basic query succeeded:', basicData);
      }
    } else {
      console.log('🎯 Test query succeeded!');
      console.log(`📈 Found ${promoters?.length || 0} approved promoters:`);
      
      if (promoters && promoters.length > 0) {
        promoters.forEach(p => {
          console.log(`  - ${p.full_name} (${p.unique_code || 'NO CODE'})`);
        });
      } else {
        console.log('ℹ️ No approved promoters found. Checking all promoters...');
        
        const { data: allPromoters } = await supabase
          .from('profiles')
          .select('id, full_name, unique_code, role, verification_status')
          .in('role', ['part_timer', 'promoter']);
        
        console.log('All promoter profiles:', allPromoters);
      }
    }
    
    // Step 5: Show summary
    console.log('\n📊 Summary:');
    const { data: totalProfiles } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' });
    
    const { data: promoterProfiles } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .in('role', ['part_timer', 'promoter']);
    
    const { data: approvedPromoters } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .in('role', ['part_timer', 'promoter'])
      .eq('verification_status', 'approved');
    
    console.log(`Total profiles: ${totalProfiles?.length || 0}`);
    console.log(`Part-timer profiles: ${promoterProfiles?.length || 0}`);
    console.log(`Approved promoters: ${approvedPromoters?.length || 0}`);
    
    console.log('\n🎉 Database fix completed! Now test the frontend.');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

applyDatabaseFix();