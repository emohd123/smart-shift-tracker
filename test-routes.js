#!/usr/bin/env node

/**
 * Comprehensive Route Testing Script
 * Tests all routes for 404 errors, proper connections, and navigation flow
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Route definitions (matching routes.ts)
const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_CERTIFICATE: '/verify-certificate',
  DEBUG: '/debug',
  CERTIFICATE_PAYMENT_SUCCESS: '/certificates/payment/success',
  CERTIFICATE_PAYMENT_CANCELLED: '/certificates/payment/cancelled',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  COMPANY: '/company',
  COMPANY_PROFILE: '/company/profile',
  SHIFTS: '/shifts',
  SHIFTS_CREATE: '/shifts/create',
  SHIFTS_DETAIL: '/shifts/123', // Test with sample ID
  PROFILE: '/profile',
  SETTINGS: '/settings',
  MESSAGES: '/messages',
  CERTIFICATES: '/certificates',
  CERTIFICATES_REQUEST: '/certificates/request',
  
  // Part-timer routes
  TIME_TRACKING: '/time',
  TIME_HISTORY: '/time-history',
  TRAINING: '/training',
  CREDITS: '/credits',
  SUBSCRIPTION: '/subscription',
  REFERRALS: '/referrals',
  
  // Admin routes
  PROMOTERS: '/promoters',
  REPORTS: '/reports',
  REVENUE: '/revenue',
  DATA_PURGE: '/data-purge',
};

const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  headless: true,
  timeout: 10000,
  viewport: { width: 1280, height: 720 }
};

class RouteTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    this.devServer = null;
  }

  async initialize() {
    console.log('🚀 Starting Smart Shift Tracker Route Testing');
    console.log('==============================================\n');

    // Start development server
    await this.startDevServer();
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport(TEST_CONFIG.viewport);
    
    // Set up error logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Page Error: ${msg.text()}`);
      }
    });

    this.page.on('pageerror', error => {
      console.error(`Page Error: ${error.message}`);
    });
  }

  async startDevServer() {
    return new Promise((resolve, reject) => {
      console.log('📦 Starting development server...');
      
      this.devServer = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        shell: true
      });

      let serverStarted = false;

      this.devServer.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Dev Server: ${output.trim()}`);
        
        if (output.includes('Local:') && !serverStarted) {
          serverStarted = true;
          setTimeout(resolve, 2000); // Give server time to fully start
        }
      });

      this.devServer.stderr.on('data', (data) => {
        console.error(`Dev Server Error: ${data.toString()}`);
      });

      this.devServer.on('close', (code) => {
        if (code !== 0 && !serverStarted) {
          reject(new Error(`Dev server failed to start with code ${code}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!serverStarted) {
          reject(new Error('Dev server start timeout'));
        }
      }, 30000);
    });
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
    if (this.devServer) {
      this.devServer.kill();
      console.log('🛑 Development server stopped');
    }
  }

  async testRoute(route, routeName, options = {}) {
    const {
      expectRedirect = false,
      expectedStatus = 200,
      requiresAuth = false,
      roleRequired = null
    } = options;

    console.log(`\n🧪 Testing: ${routeName} (${route})`);

    try {
      const response = await this.page.goto(`${TEST_CONFIG.baseUrl}${route}`, {
        waitUntil: 'networkidle0',
        timeout: TEST_CONFIG.timeout
      });

      const actualStatus = response.status();
      const finalUrl = this.page.url();

      // Check for 404 errors
      if (actualStatus === 404) {
        this.addResult(routeName, false, `404 Not Found - Route does not exist`, { route, status: actualStatus });
        return false;
      }

      // Check for server errors
      if (actualStatus >= 500) {
        this.addResult(routeName, false, `Server Error (${actualStatus})`, { route, status: actualStatus });
        return false;
      }

      // Check if page loaded successfully
      const pageTitle = await this.page.title();
      const hasErrorBoundary = await this.page.$('.error-boundary') !== null;
      
      if (hasErrorBoundary) {
        this.addResult(routeName, false, `Error boundary triggered`, { route, title: pageTitle });
        return false;
      }

      // Check for authentication redirects
      if (requiresAuth && finalUrl.includes('/login')) {
        this.addResult(routeName, true, `Correctly redirected to login (auth required)`, {
          route,
          redirectUrl: finalUrl,
          status: actualStatus
        });
        return true;
      }

      // Check for role-based redirects
      if (finalUrl !== `${TEST_CONFIG.baseUrl}${route}` && !expectRedirect) {
        this.addResult(routeName, true, `Redirected to ${finalUrl} (likely role-based)`, {
          route,
          redirectUrl: finalUrl,
          status: actualStatus
        }, 'warning');
        return true;
      }

      // Check page content
      const bodyText = await this.page.evaluate(() => document.body.innerText);
      
      if (bodyText.toLowerCase().includes('page not found') || 
          bodyText.toLowerCase().includes('404') ||
          bodyText.toLowerCase().includes('not found')) {
        this.addResult(routeName, false, `Page shows 404 content but returned ${actualStatus}`, { route, status: actualStatus });
        return false;
      }

      // Test navigation elements
      const hasNavigation = await this.page.$('nav, .navigation, [role="navigation"]') !== null;
      if (requiresAuth && !hasNavigation) {
        this.addResult(routeName, false, `Missing navigation on authenticated page`, { route }, 'warning');
      }

      // Success
      this.addResult(routeName, true, `Route accessible, status ${actualStatus}`, {
        route,
        status: actualStatus,
        title: pageTitle,
        hasNavigation
      });

      return true;

    } catch (error) {
      this.addResult(routeName, false, `Test failed: ${error.message}`, { route, error: error.message });
      return false;
    }
  }

  async testNavigationFlow() {
    console.log('\n🧭 Testing Navigation Flow');
    console.log('===========================');

    try {
      // Go to home page
      await this.page.goto(`${TEST_CONFIG.baseUrl}/`, { waitUntil: 'networkidle0' });

      // Test navigation links (if any)
      const navLinks = await this.page.$$('nav a, .navigation a, [role="navigation"] a');
      
      if (navLinks.length === 0) {
        this.addResult('Navigation Flow', true, 'No navigation links found on home page (expected for landing page)', {}, 'warning');
        return;
      }

      let workingLinks = 0;
      let brokenLinks = 0;

      for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
        try {
          const link = navLinks[i];
          const href = await link.evaluate(el => el.getAttribute('href'));
          
          if (href && href.startsWith('/')) {
            const response = await this.page.goto(`${TEST_CONFIG.baseUrl}${href}`, {
              waitUntil: 'networkidle0',
              timeout: 5000
            });

            if (response.status() < 400) {
              workingLinks++;
            } else {
              brokenLinks++;
            }
          }
        } catch (error) {
          brokenLinks++;
        }
      }

      const success = brokenLinks === 0;
      this.addResult('Navigation Flow', success, 
        `${workingLinks} working links, ${brokenLinks} broken links`, {
          workingLinks,
          brokenLinks
        });

    } catch (error) {
      this.addResult('Navigation Flow', false, `Navigation test failed: ${error.message}`);
    }
  }

  async testBuildOptimization() {
    console.log('\n⚡ Testing Build Optimization');
    console.log('==============================');

    try {
      // Test lazy loading
      await this.page.goto(`${TEST_CONFIG.baseUrl}/`, { waitUntil: 'networkidle0' });
      
      const performanceEntries = await this.page.evaluate(() => {
        return performance.getEntriesByType('navigation').map(entry => ({
          loadEventEnd: entry.loadEventEnd,
          domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
          responseEnd: entry.responseEnd
        }));
      });

      const loadTime = performanceEntries[0]?.loadEventEnd || 0;
      const isOptimized = loadTime < 3000; // Less than 3 seconds

      this.addResult('Build Optimization', isOptimized, 
        `Page load time: ${Math.round(loadTime)}ms`, {
          loadTime: Math.round(loadTime),
          threshold: 3000
        });

      // Test chunk splitting
      const scriptTags = await this.page.$$('script[src]');
      const hasMultipleChunks = scriptTags.length > 2;
      
      this.addResult('Code Splitting', hasMultipleChunks,
        `${scriptTags.length} script chunks loaded`, {
          chunkCount: scriptTags.length
        });

    } catch (error) {
      this.addResult('Build Optimization', false, `Optimization test failed: ${error.message}`);
    }
  }

  addResult(testName, passed, details = '', data = {}, type = 'test') {
    const result = {
      name: testName,
      passed,
      details,
      data,
      type,
      timestamp: new Date().toISOString()
    };

    this.results.tests.push(result);
    
    if (type === 'warning') {
      this.results.warnings++;
      console.log(`⚠️  ${testName}: ${details}`);
    } else if (passed) {
      this.results.passed++;
      console.log(`✅ ${testName}: ${details}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${testName}: ${details}`);
    }
  }

  async runAllTests() {
    console.log('🔍 Testing All Routes');
    console.log('======================');

    // Test public routes
    await this.testRoute(ROUTES.HOME, 'Home Page');
    await this.testRoute(ROUTES.LOGIN, 'Login Page');
    await this.testRoute(ROUTES.SIGNUP, 'Signup Page');
    await this.testRoute(ROUTES.FORGOT_PASSWORD, 'Forgot Password');
    await this.testRoute(ROUTES.RESET_PASSWORD, 'Reset Password');
    await this.testRoute(ROUTES.VERIFY_CERTIFICATE, 'Verify Certificate');
    await this.testRoute(ROUTES.DEBUG, 'Debug Page');
    
    // Test protected routes (should redirect to login)
    await this.testRoute(ROUTES.DASHBOARD, 'Dashboard', { 
      requiresAuth: true, 
      expectRedirect: true 
    });
    await this.testRoute(ROUTES.SHIFTS, 'Shifts Page', { 
      requiresAuth: true, 
      expectRedirect: true 
    });
    await this.testRoute(ROUTES.MESSAGES, 'Messages Page', { 
      requiresAuth: true, 
      expectRedirect: true 
    });
    await this.testRoute(ROUTES.CERTIFICATES, 'Certificates Page', { 
      requiresAuth: true, 
      expectRedirect: true 
    });

    // Test role-specific routes
    await this.testRoute(ROUTES.COMPANY, 'Company Dashboard', { 
      requiresAuth: true, 
      roleRequired: 'company_admin' 
    });
    await this.testRoute(ROUTES.TIME_TRACKING, 'Time Tracking', { 
      requiresAuth: true, 
      roleRequired: 'part_timer' 
    });
    await this.testRoute(ROUTES.PROMOTERS, 'Promoters Management', { 
      requiresAuth: true, 
      roleRequired: 'admin' 
    });

    // Test edge cases
    await this.testRoute('/nonexistent-page', '404 Handling', { expectedStatus: 404 });
    await this.testRoute('/shifts/invalid-id', 'Invalid Shift ID');
    
    // Test navigation flow
    await this.testNavigationFlow();
    
    // Test performance
    await this.testBuildOptimization();
  }

  generateReport() {
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;

    const report = `
# Smart Shift Tracker - Route Testing Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Tests**: ${total}
- **Passed**: ${this.results.passed} ✅
- **Failed**: ${this.results.failed} ❌
- **Warnings**: ${this.results.warnings} ⚠️
- **Success Rate**: ${successRate}%

## Test Results
${this.results.tests.map(test => {
  const status = test.type === 'warning' ? '⚠️' : (test.passed ? '✅' : '❌');
  return `- ${status} **${test.name}**: ${test.details}`;
}).join('\n')}

## Recommendations
${this.generateRecommendations()}

---
*Report generated by Smart Shift Tracker Route Testing Suite*
`;

    fs.writeFileSync('route-test-report.md', report);
    console.log('\n📄 Report saved to route-test-report.md');
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.failed > 0) {
      recommendations.push('🔧 **Fix Failed Routes**: Address the routes that returned errors or 404s');
    }
    
    if (this.results.warnings > 5) {
      recommendations.push('⚠️ **Review Warnings**: Multiple warnings detected, review routing logic');
    }
    
    const optimizationTests = this.results.tests.filter(t => t.name.includes('Optimization'));
    if (optimizationTests.some(t => !t.passed)) {
      recommendations.push('⚡ **Optimize Performance**: Consider implementing code splitting and lazy loading');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 **Excellent!** All routes are working correctly with no major issues');
    }
    
    return recommendations.join('\n');
  }

  async run() {
    try {
      await this.initialize();
      await this.runAllTests();
      
      console.log('\n📊 Final Results');
      console.log('=================');
      console.log(`✅ Passed: ${this.results.passed}`);
      console.log(`❌ Failed: ${this.results.failed}`);
      console.log(`⚠️  Warnings: ${this.results.warnings}`);
      
      const total = this.results.passed + this.results.failed;
      const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
      console.log(`📈 Success Rate: ${successRate}%`);
      
      this.generateReport();
      
      return this.results.failed === 0;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new RouteTestRunner();
  const success = await runner.run();
  process.exit(success ? 0 : 1);
}

export default RouteTestRunner;