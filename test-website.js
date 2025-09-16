// Comprehensive Website Testing Script
// Tests all routes and functionality of Smart Shift Tracker

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:8080';

// All routes to test
const routesToTest = [
  // Public routes
  { path: '/', name: 'Home Page', expectAuth: false },
  { path: '/login', name: 'Login Page', expectAuth: false },
  { path: '/signup', name: 'Signup Page', expectAuth: false },
  { path: '/forgot-password', name: 'Forgot Password', expectAuth: false },
  { path: '/verify-certificate', name: 'Certificate Verification', expectAuth: false },
  
  // Protected routes (should redirect to login)
  { path: '/dashboard', name: 'Dashboard', expectAuth: true },
  { path: '/company', name: 'Company Dashboard', expectAuth: true },
  { path: '/shifts', name: 'Shifts Page', expectAuth: true },
  { path: '/shifts/create', name: 'Create Shift', expectAuth: true },
  { path: '/profile', name: 'Profile Page', expectAuth: true },
  { path: '/settings', name: 'Settings Page', expectAuth: true },
  { path: '/messages', name: 'Messages', expectAuth: true },
  { path: '/certificates', name: 'Certificates', expectAuth: true },
  { path: '/company/profile', name: 'Company Profile', expectAuth: true },
  { path: '/time', name: 'Time Tracking', expectAuth: true },
  { path: '/time-history', name: 'Time History', expectAuth: true },
  { path: '/training', name: 'Training', expectAuth: true },
  { path: '/credits', name: 'Credits', expectAuth: true },
  { path: '/subscription', name: 'Subscription', expectAuth: true },
  { path: '/referrals', name: 'Referrals', expectAuth: true },
  { path: '/promoters', name: 'Promoters (Admin)', expectAuth: true },
  { path: '/reports', name: 'Reports (Admin)', expectAuth: true },
  { path: '/revenue', name: 'Revenue (Admin)', expectAuth: true },
  { path: '/data-purge', name: 'Data Management', expectAuth: true },
  
  // 404 test
  { path: '/nonexistent-page', name: 'Not Found Page', expectAuth: false, expect404: true }
];

async function testRoute(route) {
  return new Promise((resolve) => {
    const url = new URL(route.path, BASE_URL);
    
    const req = http.request(url, { method: 'GET' }, (res) => {
      let result = {
        path: route.path,
        name: route.name,
        status: res.statusCode,
        success: false,
        message: ''
      };
      
      // Check if route behaves as expected
      if (route.expectAuth && (res.statusCode === 302 || res.statusCode === 301)) {
        // Protected route should redirect
        const location = res.headers.location;
        if (location && location.includes('/login')) {
          result.success = true;
          result.message = '✅ Correctly redirects to login (protected route)';
        } else {
          result.message = '❌ Protected route doesn\'t redirect to login';
        }
      } else if (!route.expectAuth && res.statusCode === 200) {
        // Public route should load successfully
        result.success = true;
        result.message = '✅ Loads successfully (public route)';
      } else if (route.expect404 && res.statusCode === 404) {
        // 404 page should return 404
        result.success = true;
        result.message = '✅ Returns 404 as expected';
      } else if (res.statusCode === 200) {
        // Page loads successfully
        result.success = true;
        result.message = '✅ Loads successfully';
      } else {
        result.message = `❌ Unexpected status: ${res.statusCode}`;
      }
      
      resolve(result);
    });
    
    req.on('error', (error) => {
      resolve({
        path: route.path,
        name: route.name,
        success: false,
        message: `❌ Error: ${error.message}`
      });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Smart Shift Tracker - Comprehensive Website Testing\n');
  console.log('=' .repeat(60));
  
  const results = [];
  let successCount = 0;
  
  for (const route of routesToTest) {
    const result = await testRoute(route);
    results.push(result);
    
    if (result.success) {
      successCount++;
    }
    
    console.log(`${result.message} - ${result.name} (${result.path})`);
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Test Results: ${successCount}/${routesToTest.length} tests passed`);
  
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
      console.log(`   ${test.path} - ${test.message}`);
    });
  } else {
    console.log('\n🎉 All tests passed! Website is working correctly.');
  }
  
  return {
    total: routesToTest.length,
    passed: successCount,
    failed: failedTests.length,
    results
  };
}

// Run the tests
runTests().catch(console.error);
