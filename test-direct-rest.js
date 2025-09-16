import 'dotenv/config';
import fetch from 'node-fetch';

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testDirectREST() {
  console.log('🧪 Testing direct REST endpoints...');
  console.log(`Base URL: ${url}`);

  // Test 1: Simple GET to /rest/v1/tenants
  try {
    const res = await fetch(`${url}/rest/v1/tenants`, {
      headers: {
        'apikey': anon,
        'Authorization': `Bearer ${anon}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`GET /tenants: ${res.status} ${res.statusText}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ tenants table accessible, ${data.length} rows`);
    } else {
      const text = await res.text();
      console.log(`❌ Error: ${text.slice(0, 200)}`);
    }
  } catch (e) {
    console.log(`❌ Request failed: ${e.message}`);
  }

  // Test 2: Try with service role
  if (svc) {
    try {
      const res = await fetch(`${url}/rest/v1/tenants`, {
        headers: {
          'apikey': svc,
          'Authorization': `Bearer ${svc}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`GET /tenants (service role): ${res.status} ${res.statusText}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ tenants accessible with service role, ${data.length} rows`);
      }
    } catch (e) {
      console.log(`❌ Service role request failed: ${e.message}`);
    }
  }

  // Test 3: Try POST to create tenant
  const testTenant = {
    name: `Test Company ${Date.now()}`,
    slug: `test-${Date.now()}`
  };

  try {
    const res = await fetch(`${url}/rest/v1/tenants`, {
      method: 'POST',
      headers: {
        'apikey': svc || anon,
        'Authorization': `Bearer ${svc || anon}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testTenant)
    });
    console.log(`POST /tenants: ${res.status} ${res.statusText}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Created tenant: ${data[0]?.name}`);
    } else {
      const text = await res.text();
      console.log(`❌ Insert failed: ${text.slice(0, 300)}`);
    }
  } catch (e) {
    console.log(`❌ POST request failed: ${e.message}`);
  }
}

testDirectREST();
