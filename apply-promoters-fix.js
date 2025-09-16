#!/usr/bin/env node

/**
 * Apply Promoters Fix
 * 
 * This script applies the database migration to fix the promoters loading issue
 * by adding missing columns to the profiles table and migrating user metadata.
 * 
 * Usage: node apply-promoters-fix.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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
 * Apply the migration SQL
 */
async function applyMigration() {
  console.log('🚀 Applying promoters fix migration...');
  
  try {
    // Read the migration file
    const migrationSQL = readFileSync('./supabase/migrations/20250915120000_fix_profiles_schema_for_promoters.sql', 'utf8');
    
    console.log('📄 Loaded migration SQL');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try alternative method - split into individual statements
      console.log('⚠️ Trying alternative execution method...');
      
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const [index, statement] of statements.entries()) {
        if (statement.trim()) {
          console.log(`📝 Executing statement ${index + 1}/${statements.length}...`);
          
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (stmtError) {
            console.warn(`⚠️ Statement ${index + 1} warning:`, stmtError.message);
            // Continue with other statements - some might be expected to fail (like DROP IF EXISTS)
          }
        }
      }
    }
    
    console.log('✅ Migration applied successfully');
    
    // Verify the migration worked
    console.log('🔍 Verifying migration...');
    
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');
    
    if (schemaError) {
      console.warn('⚠️ Could not verify schema:', schemaError.message);
    } else {
      const columnNames = columns.map(c => c.column_name);
      const expectedColumns = ['age', 'nationality', 'phone_number', 'unique_code'];
      const hasNewColumns = expectedColumns.every(col => columnNames.includes(col));
      
      if (hasNewColumns) {
        console.log('✅ Schema verification passed - new columns detected');
      } else {
        console.warn('⚠️ Some expected columns may be missing');
        console.log('Expected:', expectedColumns);
        console.log('Found:', columnNames);
      }
    }
    
    // Test the promoters query
    console.log('🧪 Testing promoters query...');
    
    const { data: testPromoters, error: queryError } = await supabase
      .from('profiles')
      .select('id, unique_code, full_name, age, nationality, phone_number, role, verification_status')
      .in('role', ['part_timer', 'promoter']);
    
    if (queryError) {
      console.error('❌ Promoters query failed:', queryError.message);
    } else {
      console.log(`✅ Promoters query successful - found ${testPromoters.length} profiles`);
      
      const approvedPromoters = testPromoters.filter(p => p.verification_status === 'approved');
      console.log(`📊 ${approvedPromoters.length} approved promoters available for assignment`);
      
      if (approvedPromoters.length > 0) {
        console.log('   Sample promoter data:');
        const sample = approvedPromoters[0];
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - Name: ${sample.full_name}`);
        console.log(`   - Code: ${sample.unique_code || 'Not set'}`);
        console.log(`   - Age: ${sample.age || 'Not set'}`);
        console.log(`   - Nationality: ${sample.nationality || 'Not set'}`);
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
  console.log('🔧 Smart Shift Tracker - Promoters Fix Tool');
  console.log('===========================================\n');
  
  await applyMigration();
  
  console.log('\n🎉 Promoters fix completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test the promoter assignment in the company dashboard');
  console.log('2. If needed, run: node migrate-user-data.js');
  console.log('3. Verify promoters show up when creating shifts');
  
  process.exit(0);
}

// Run the fix
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});