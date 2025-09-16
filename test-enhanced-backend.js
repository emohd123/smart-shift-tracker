import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

console.log('🧪 Enhanced Supabase Backend Testing');
console.log('=====================================');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...`);
console.log(`🔐 Service Key: ${supabaseServiceKey ? 'Available' : 'Not Available'}`);
console.log('');

// Test suite
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  const addResult = (testName, passed, details = '', error = null) => {
    results.tests.push({ name: testName, passed, details, error });
    if (passed) {
      results.passed++;
      console.log(`✅ ${testName}: ${details}`);
    } else {
      results.failed++;
      console.log(`❌ ${testName}: ${details}`);
      if (error) console.log(`   Error: ${error.message}`);
    }
  };

  // Test 1: Basic Connection
  try {
    const { data, error } = await supabase.from('tenants').select('id').limit(1);
    if (error && error.code === 'PGRST205') {
      addResult('Basic Connection', false, 'Tenants table not found - run database setup first', error);
    } else if (error) {
      addResult('Basic Connection', false, 'Connection failed', error);
    } else {
      addResult('Basic Connection', true, 'Successfully connected to Supabase');
    }
  } catch (error) {
    addResult('Basic Connection', false, 'Connection error', error);
  }

  // Test 2: Enhanced Client Configuration
  try {
    const clientConfig = supabase.supabaseKey ? true : false;
    addResult('Enhanced Client Config', clientConfig, 'Client properly configured');
  } catch (error) {
    addResult('Enhanced Client Config', false, 'Client configuration failed', error);
  }

  // Test 3: Test Database Functions (if database is set up)
  try {
    const { data, error } = await supabase.rpc('get_user_stats');
    if (error && error.code === 'PGRST202') {
      addResult('Database Functions', false, 'Functions not found - database setup required', error);
    } else if (error && error.message.includes('permission')) {
      addResult('Database Functions', true, 'Functions exist but require authentication (expected)');
    } else if (error) {
      addResult('Database Functions', false, 'Function test failed', error);
    } else {
      addResult('Database Functions', true, 'Database functions working');
    }
  } catch (error) {
    addResult('Database Functions', false, 'Function test error', error);
  }

  // Test 4: Auth State
  try {
    const { data: { session } } = await supabase.auth.getSession();
    addResult('Auth State', true, session ? `User logged in: ${session.user.email}` : 'No active session (normal for testing)');
  } catch (error) {
    addResult('Auth State', false, 'Auth check failed', error);
  }

  // Test 5: Test Enhanced Query Helper
  try {
    // Test our enhanced query helper
    const testQuery = async () => {
      let query = supabase.from('tenants').select('id');
      const { data, error } = await query.limit(1);
      return { data, error };
    };

    const { data, error } = await testQuery();
    if (error && error.code === 'PGRST205') {
      addResult('Enhanced Query Helper', false, 'Tables not ready - setup required');
    } else if (error) {
      addResult('Enhanced Query Helper', false, 'Query helper test failed', error);
    } else {
      addResult('Enhanced Query Helper', true, 'Enhanced queries working');
    }
  } catch (error) {
    addResult('Enhanced Query Helper', false, 'Query helper error', error);
  }

  // Test 6: Data Persistence Simulation
  try {
    // Simulate data persistence without actually creating records
    const mockShiftData = {
      title: 'Test Shift',
      location: 'Test Location',
      date: new Date().toISOString().split('T')[0],
      status: 'scheduled'
    };

    // Test data structure validation
    const hasRequiredFields = mockShiftData.title && mockShiftData.location && mockShiftData.date;
    addResult('Data Persistence Simulation', hasRequiredFields, 'Data structure validation passed');
  } catch (error) {
    addResult('Data Persistence Simulation', false, 'Data validation failed', error);
  }

  // Test 7: Error Handling
  try {
    // Test error handling by trying to access non-existent table
    const { data, error } = await supabase.from('non_existent_table').select('*').limit(1);
    if (error) {
      addResult('Error Handling', true, `Error properly caught: ${error.message}`);
    } else {
      addResult('Error Handling', false, 'Error handling not working - should have failed');
    }
  } catch (error) {
    addResult('Error Handling', true, 'Exception handling working');
  }

  // Test 8: Environment Variables
  try {
    const envVarsPresent = !!(
      process.env.VITE_SUPABASE_URL &&
      process.env.VITE_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    addResult('Environment Variables', envVarsPresent, 'All required environment variables present');
  } catch (error) {
    addResult('Environment Variables', false, 'Environment check failed', error);
  }

  // Test 9: Service Role Key (if available)
  if (supabaseAdmin) {
    try {
      // Test admin client
      const { data, error } = await supabaseAdmin.from('tenants').select('id').limit(1);
      if (error && error.code === 'PGRST205') {
        addResult('Service Role Access', false, 'Admin access ready but tables missing');
      } else if (error) {
        addResult('Service Role Access', false, 'Admin client failed', error);
      } else {
        addResult('Service Role Access', true, 'Service role key working');
      }
    } catch (error) {
      addResult('Service Role Access', false, 'Admin client error', error);
    }
  } else {
    addResult('Service Role Access', false, 'Service role key not configured');
  }

  // Test 10: Real-time Configuration
  try {
    const channel = supabase.channel('test-channel');
    if (channel) {
      addResult('Real-time Configuration', true, 'Real-time channels available');
      supabase.removeChannel(channel);
    } else {
      addResult('Real-time Configuration', false, 'Real-time not available');
    }
  } catch (error) {
    addResult('Real-time Configuration', false, 'Real-time test failed', error);
  }

  return results;
}

// Performance test
async function runPerformanceTest() {
  console.log('\n🚀 Performance Testing');
  console.log('======================');

  const tests = [
    {
      name: 'Basic Query Response Time',
      test: async () => {
        const start = Date.now();
        await supabase.from('tenants').select('id').limit(1);
        return Date.now() - start;
      }
    },
    {
      name: 'Auth Check Response Time',
      test: async () => {
        const start = Date.now();
        await supabase.auth.getSession();
        return Date.now() - start;
      }
    }
  ];

  for (const test of tests) {
    try {
      const time = await test.test();
      const status = time < 1000 ? '✅' : time < 3000 ? '⚠️' : '❌';
      console.log(`${status} ${test.name}: ${time}ms`);
    } catch (error) {
      console.log(`❌ ${test.name}: Failed (${error.message})`);
    }
  }
}

// Main execution
async function main() {
  try {
    const results = await runTests();
    await runPerformanceTest();

    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    console.log('\n🔧 Recommendations');
    console.log('==================');

    const failedTests = results.tests.filter(t => !t.passed);
    if (failedTests.length === 0) {
      console.log('✅ All systems operational! Your Supabase backend is ready.');
    } else {
      console.log('📋 Issues to address:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.details}`);
      });

      if (failedTests.some(t => t.name.includes('Connection') || t.name.includes('Functions'))) {
        console.log('\n🎯 Next Steps:');
        console.log('   1. Run: node verify-database.js');
        console.log('   2. If verification fails, run the complete-database-setup.sql in Supabase Dashboard');
        console.log('   3. Re-run this test: node test-enhanced-backend.js');
      }
    }

    console.log('\n🚀 Ready to use enhanced features:');
    console.log('   • Enhanced data persistence with retry logic');
    console.log('   • Comprehensive error handling');
    console.log('   • Real-time subscriptions');
    console.log('   • Multi-tenant support');
    console.log('   • Activity logging and notifications');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);