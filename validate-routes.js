// Quick Route Validation Script
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8080';

const ROUTES_TO_TEST = [
  { path: '/', name: 'Home Page', expect: 200 },
  { path: '/login', name: 'Login Page', expect: 200 },
  { path: '/signup', name: 'Signup Page', expect: 200 },
  { path: '/forgot-password', name: 'Forgot Password', expect: 200 },
  { path: '/verify-certificate', name: 'Verify Certificate', expect: 200 },
  { path: '/debug', name: 'Debug Page', expect: 200 },
  { path: '/dashboard', name: 'Dashboard (should redirect)', expect: 200 },
  { path: '/shifts', name: 'Shifts Page', expect: 200 },
  { path: '/messages', name: 'Messages Page', expect: 200 },
  { path: '/certificates', name: 'Certificates Page', expect: 200 },
  { path: '/nonexistent', name: '404 Test', expect: 200 }, // SPA returns 200 but shows 404 component
];

async function validateRoute(route) {
  try {
    const response = await fetch(`${BASE_URL}${route.path}`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Route-Validator/1.0'
      }
    });

    const success = response.status === route.expect;
    const status = response.status === route.expect ? '✅' : '❌';
    
    console.log(`${status} ${route.name} (${route.path}): ${response.status} ${response.statusText}`);
    
    // Check if it's actually an HTML page (not API endpoint)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const body = await response.text();
      
      // Check for common error indicators
      if (body.includes('Cannot GET') || body.includes('Not Found')) {
        console.log(`   ⚠️  Page contains error indicators`);
        return false;
      }
      
      // Check for React root element
      if (!body.includes('id="root"')) {
        console.log(`   ⚠️  Missing React root element`);
        return false;
      }
      
      console.log(`   ℹ️  Valid React application page`);
    }
    
    return success;
    
  } catch (error) {
    console.log(`❌ ${route.name} (${route.path}): ERROR - ${error.message}`);
    return false;
  }
}

async function validateAllRoutes() {
  console.log('🧪 Smart Shift Tracker Route Validation');
  console.log('=======================================\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const route of ROUTES_TO_TEST) {
    const success = await validateRoute(route);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Validation Results');
  console.log('=====================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All routes are accessible! No 404 errors detected.');
  } else {
    console.log('\n⚠️  Some routes may need attention.');
  }
  
  return failed === 0;
}

// Run validation
validateAllRoutes().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
});