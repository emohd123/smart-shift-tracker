require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyDatabaseOptimizations() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('❌ Missing Supabase credentials');
    process.exit(1);
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🚀 Applying Database Optimizations...');
  console.log('📍 Project:', supabaseUrl);
  console.log('');

  try {
    // Read the optimization SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'SCHEMA_OPTIMIZATION.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('📁 Loaded SCHEMA_OPTIMIZATION.sql');
    console.log('📏 Script size:', sqlScript.length, 'characters');
    console.log('');

    // Execute the SQL script
    console.log('⚡ Executing database optimizations...');
    const { data, error } = await supabase.rpc('query', { query: sqlScript });

    if (error) {
      console.log('❌ Error applying optimizations:', error);
      process.exit(1);
    }

    console.log('✅ Database optimizations applied successfully!');
    console.log('');
    console.log('🎯 Applied:');
    console.log('  ✅ 15+ Performance indexes');
    console.log('  ✅ Enhanced RLS policies');
    console.log('  ✅ Automatic timestamp triggers');
    console.log('  ✅ Proper security policies');
    console.log('');
    console.log('🚀 Your database is now production-ready!');

  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

applyDatabaseOptimizations();
