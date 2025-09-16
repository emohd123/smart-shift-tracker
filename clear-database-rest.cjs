// Simple database reset using REST API
const https = require('https');

const SUPABASE_URL = 'https://bsqwtvdmvcmucpkajhpv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXd0dmRtdmNtdWNwa2FqaHB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODM5OTI3NiwiZXhwIjoyMDUzOTc1Mjc2fQ.xxCrG0GYo1QElHHX4o3l9sQQacZUayEtGJ1oFYx4f-o';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function clearDatabase() {
  console.log('🧹 Clearing database using REST API...\n');

  try {
    // Step 1: Clear profiles
    console.log('📊 Step 1: Getting current profiles...');
    const profilesResult = await makeRequest('/rest/v1/profiles?select=*');
    console.log('Profiles response:', profilesResult.status);
    
    if (profilesResult.status === 200 && Array.isArray(profilesResult.data)) {
      console.log(`Found ${profilesResult.data.length} profiles to delete`);
      profilesResult.data.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email || 'no email'} - ${profile.role || 'no role'}`);
      });

      // Delete all profiles
      console.log('\n🗑️ Deleting all profiles...');
      const deleteResult = await makeRequest('/rest/v1/profiles?id=neq.00000000-0000-0000-0000-000000000000', 'DELETE');
      console.log('Delete profiles result:', deleteResult.status);
      
      if (deleteResult.status < 300) {
        console.log('✅ Profiles cleared successfully');
      } else {
        console.log('❌ Error clearing profiles:', deleteResult.data);
      }
    } else {
      console.log('❌ Cannot access profiles:', profilesResult.data);
    }

    // Step 2: Clear tenants
    console.log('\n🗑️ Step 2: Clearing tenants...');
    const tenantsResult = await makeRequest('/rest/v1/tenants?select=*');
    
    if (tenantsResult.status === 200 && Array.isArray(tenantsResult.data)) {
      console.log(`Found ${tenantsResult.data.length} tenants`);
      
      const deleteTenantResult = await makeRequest('/rest/v1/tenants?id=neq.00000000-0000-0000-0000-000000000000', 'DELETE');
      if (deleteTenantResult.status < 300) {
        console.log('✅ Tenants cleared');
      } else {
        console.log('⚠️ Tenants not cleared:', deleteTenantResult.data);
      }
    }

    // Step 3: Clear other tables
    const tablesToClear = ['tenant_memberships', 'shifts', 'certificates'];
    
    for (const table of tablesToClear) {
      console.log(`\n🗑️ Clearing ${table}...`);
      const clearResult = await makeRequest(`/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`, 'DELETE');
      
      if (clearResult.status < 300) {
        console.log(`✅ ${table} cleared`);
      } else {
        console.log(`⚠️ ${table} not cleared:`, clearResult.status);
      }
    }

    // Step 4: Verify cleanup
    console.log('\n📊 Step 4: Verifying cleanup...');
    const finalCheck = await makeRequest('/rest/v1/profiles?select=count');
    console.log('Final profiles count check:', finalCheck.status, finalCheck.data);

    console.log('\n🎉 Database cleanup attempt complete!');

  } catch (error) {
    console.error('💥 Error:', error.message);
  }

  console.log('\n📋 Next steps:');
  console.log('1. 🌐 Open http://localhost:8081/');
  console.log('2. ✍️ Try to sign up with a new email');
  console.log('3. 📝 Fill all form fields and submit');
  console.log('4. ✅ Check if signup works and redirects to dashboard');
  console.log('\n🚀 Ready for testing!');
}

clearDatabase();
