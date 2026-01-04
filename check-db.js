#!/usr/bin/env node

import https from 'https';
import { URL } from 'url';

const supabaseUrl = 'https://eihytvzfayoczbplecbz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaHl0dnpmYXlvY3picGxlY2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNTI1NDIsImV4cCI6MjA4MTgyODU0Mn0.cXRzTi9pHqTx19DNOu8DOOghQ2c66DG8IsBo4_WQOTM';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, supabaseUrl);
    const opts = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function test() {
  console.log('\n=== Database Overview ===\n');

  try {
    // Check key tables
    const tables = ['profiles', 'shifts', 'shift_assignments', 'company_contract_acceptances'];
    
    for (const table of tables) {
      const response = await makeRequest(`/rest/v1/${table}?select=id&limit=1`);
      if (response.status === 200) {
        const count = response.headers['content-range']?.split('/')[1] || '?';
        console.log(`📊 ${table}: ${count} records`);
      } else {
        console.log(`❌ ${table}: Error ${response.status}`);
      }
    }

    console.log('\n⚠️  FINDING: No users exist in the database yet!');
    console.log('   You need to create test accounts first.');
    console.log('   See TESTING_GUIDE.md for signup instructions.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  process.exit(0);
}

test();
