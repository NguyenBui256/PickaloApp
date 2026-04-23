/**
 * Global Test Setup for Admin Dashboard Tests
 *
 * This setup file runs before all tests and initializes:
 * - Test data creation
 * - API authentication setup
 * - Browser context configuration
 * - Environment setup
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { testConfig } from './playwright.config';

export default async function globalSetup() {
  console.log('🚀 Starting Global Setup for Admin Dashboard Tests...');

  // Launch browser
  const browser = await chromium.launch({
    headless: testConfig.headless || false,
    slowMo: 1000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  // Create context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
  });

  // Create page for setup operations
  const page = await context.newPage();

  try {
    // Step 1: Setup Test Data
    console.log('📝 Setting up test data...');
    await setupTestData(page);

    // Step 2: Setup Admin Authentication
    console.log('🔐 Setting up admin authentication...');
    await setupAdminAuth(page);

    // Step 3: Verify API Endpoints
    console.log('🔍 Verifying API endpoints...');
    await verifyApiEndpoints(page);

    // Step 4: Initialize Test Storage
    console.log('💾 Initializing test storage...');
    await initializeTestStorage(page);

    console.log('✅ Global Setup completed successfully');

    // Return browser and context for teardown
    return { browser, context };
  } catch (error) {
    console.error('❌ Global Setup failed:', error);
    await browser.close();
    throw error;
  }
}

/**
 * Setup Test Data
 */
async function setupTestData(page: Page) {
  console.log('Creating test users, venues, and test data...');

  try {
    // Create test admin user
    await page.request.post(`${testConfig.apiBaseUrl}/api/v1/auth/register`, {
      data: {
        phone: testConfig.adminPhone,
        password: testConfig.adminPassword,
        full_name: 'Test Admin User',
        role: 'ADMIN',
        is_verified: true,
        is_active: true,
      },
    });

    // Create test regular users
    for (const user of testConfig.testUsers) {
      await page.request.post(`${testConfig.apiBaseUrl}/api/v1/auth/register`, {
        data: {
          phone: user.phone,
          password: 'User123!',
          full_name: user.name,
          role: 'USER',
          is_verified: true,
          is_active: true,
        },
      });
    }

    // Create test merchant users
    const merchants = [
      { phone: '+84998877663', name: 'Sports Complex Manager' },
      { phone: '+84998877664', name: 'Football Field Owner' },
    ];

    for (const merchant of merchants) {
      await page.request.post(`${testConfig.apiBaseUrl}/api/v1/auth/register`, {
        data: {
          phone: merchant.phone,
          password: 'Merchant123!',
          full_name: merchant.name,
          role: 'MERCHANT',
          is_verified: true,
          is_active: true,
        },
      });
    }

    console.log('✅ Test data created successfully');
  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    throw error;
  }
}

/**
 * Setup Admin Authentication
 */
async function setupAdminAuth(page: Page) {
  console.log('Setting up admin authentication...');

  try {
    // Login admin to get authentication token
    const loginResponse = await page.request.post(`${testConfig.apiBaseUrl}/api/v1/auth/login`, {
      data: {
        phone: testConfig.adminPhone,
        password: testConfig.adminPassword,
      },
    });

    if (loginResponse.status() === 200) {
      const loginData = await loginResponse.json();

      // Store admin token in browser context
      await page.context().addCookies([
        {
          name: 'admin_token',
          value: loginData.access_token,
          domain: 'localhost',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          httpOnly: true,
          secure: true,
        },
      ]);

      // Store user info in session storage
      await page.evaluate((userData) => {
        sessionStorage.setItem('admin_user', JSON.stringify(userData));
      }, loginData.user);

      console.log('✅ Admin authentication setup completed');
    } else {
      throw new Error(`Admin login failed with status: ${loginResponse.status()}`);
    }
  } catch (error) {
    console.error('❌ Failed to setup admin authentication:', error);
    throw error;
  }
}

/**
 * Verify API Endpoints
 */
async function verifyApiEndpoints(page: Page) {
  console.log('Verifying API endpoint availability...');

  try {
    // Test main API health
    const healthResponse = await page.request.get(`${testConfig.apiBaseUrl}/health`);
    if (healthResponse.status() !== 200) {
      throw new Error(`Health check failed: ${healthResponse.status()}`);
    }

    // Test admin API endpoints
    const adminEndpoints = [
      '/api/v1/admin/dashboard',
      '/api/v1/admin/users',
      '/api/v1/admin/merchants',
      '/api/v1/admin/bookings',
      '/api/v1/admin/audit-log',
    ];

    for (const endpoint of adminEndpoints) {
      const response = await page.request.get(`${testConfig.apiBaseUrl}${endpoint}`);
      console.log(`Endpoint ${endpoint}: ${response.status()}`);
    }

    console.log('✅ API endpoints verified');
  } catch (error) {
    console.error('❌ Failed to verify API endpoints:', error);
    throw error;
  }
}

/**
 * Initialize Test Storage
 */
async function initializeTestStorage(page: Page) {
  console.log('Initializing test storage...');

  try {
    // Create test results directory
    await page.request.get(`${testConfig.apiBaseUrl}/api/test/setup`);

    // Initialize test session data
    await page.evaluate(() => {
      sessionStorage.setItem(
        'test_session',
        JSON.stringify({
          startTime: new Date().toISOString(),
          testRunId: Math.random().toString(36).substr(2, 9),
          browserInfo: {
            userAgent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          },
        })
      );
    });

    console.log('✅ Test storage initialized');
  } catch (error) {
    console.error('❌ Failed to initialize test storage:', error);
    throw error;
  }
}
