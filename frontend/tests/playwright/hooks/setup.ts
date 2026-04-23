/**
 * Test Setup Hook for Admin Dashboard Tests
 *
 * This hook runs before each test and provides:
 * - Page setup
 * - Mock setup
 * - Environment configuration
 * - Helper functions
 */

import { Page } from 'playwright';
import { testConfig } from '../playwright.config';

/**
 * Setup function called before each test
 */
export async function setup(page: Page) {
  console.log('🔧 Setting up test environment...');

  // Set up page-specific configurations
  await setupPage(page);

  // Set up mocks and interceptors
  await setupMocks(page);

  // Set up test data
  await setupTestData(page);

  // Set up utilities
  await setupUtilities(page);

  console.log('✅ Test setup completed');
}

/**
 * Setup Page Configuration
 */
async function setupPage(page: Page) {
  // Set viewport size
  await page.setViewportSize({ width: 1280, height: 720 });

  // Enable request interception
  await page.route('**/*', (route) => {
    // Block unnecessary resources for faster test execution
    if (
      route.request().resourceType() === 'image' ||
      route.request().resourceType() === 'stylesheet' ||
      route.request().resourceType() === 'font'
    ) {
      route.abort();
    } else {
      route.continue();
    }
  });

  // Set default timeout
  page.setDefaultTimeout(10000);

  // Enable console logging for debugging
  page.on('console', (msg) => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  // Enable page error logging
  page.on('pageerror', (error) => {
    console.error(`[Page Error] ${error.message}`);
  });
}

/**
 * Setup Mocks and Interceptors
 */
async function setupMocks(page: Page) {
  // Mock API responses
  await page.route('**/api/v1/auth/login', (route) => {
    const request = route.request();
    const data = request.postDataJSON();

    if (data.phone === testConfig.adminPhone && data.password === testConfig.adminPassword) {
      // Mock successful admin login
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-admin-token-' + Date.now(),
          user: {
            id: '1',
            phone: data.phone,
            full_name: 'Test Admin',
            role: 'ADMIN',
            is_active: true,
            is_verified: true,
          },
        }),
      });
    } else {
      // Mock failed login
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Invalid credentials',
        }),
      });
    }
  });

  // Mock admin dashboard metrics
  await page.route('**/api/v1/admin/dashboard', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_users: 150,
        total_merchants: 45,
        total_venues: 78,
        total_bookings: 234,
        revenue: 125000000,
        active_users: 89,
      }),
    });
  });

  // Mock users list
  await page.route('**/api/v1/admin/users', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [
          {
            id: '1',
            phone: '+84998877661',
            full_name: 'Alice Johnson',
            role: 'USER',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            phone: '+84998877662',
            full_name: 'Bob Smith',
            role: 'MERCHANT',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString(),
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
      }),
    });
  });

  // Mock slow network conditions
  await page.route('**/api/v1/admin/**', (route) => {
    route.continue();
  });
}

/**
 * Setup Test Data
 */
async function setupTestData(page: Page) {
  // Set up test data in localStorage for reuse across tests
  await page.evaluate(() => {
    localStorage.setItem(
      'test_data',
      JSON.stringify({
        adminCredentials: {
          phone: '+840000000001',
          password: 'Admin123!',
        },
        testUsers: [
          { phone: '+84998877661', name: 'Alice Johnson' },
          { phone: '+84998877662', name: 'Bob Smith' },
        ],
      })
    );
  });

  // Set up test session data
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
}

/**
 * Setup Utilities and Helper Functions
 */
async function setupUtilities(page: Page) {
  // Add utility functions to page context
  await page.evaluate(() => {
    (window as any).testUtils = {
      /**
       * Helper to fill login form
       */
      fillLoginForm: (phone: string, password: string) => {
        const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
        const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

        if (phoneInput) phoneInput.value = phone;
        if (passwordInput) passwordInput.value = password;
      },

      /**
       * Helper to submit login form
       */
      submitLoginForm: () => {
        const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) submitButton.click();
      },

      /**
       * Helper to check if user is logged in
       */
      isLoggedIn: () => {
        return document.querySelector('text=Welcome Admin') !== null;
      },

      /**
       * Helper to get current URL
       */
      getCurrentUrl: () => {
        return window.location.href;
      },

      /**
       * Helper to wait for element
       */
      waitForElement: (selector: string, timeout = 5000) => {
        return new Promise((resolve, reject) => {
          const element = document.querySelector(selector);
          if (element) {
            resolve(element);
          } else {
            setTimeout(() => {
              const element = document.querySelector(selector);
              if (element) {
                resolve(element);
              } else {
                reject(new Error(`Element ${selector} not found`));
              }
            }, timeout);
          }
        });
      },

      /**
       * Helper to take screenshot (equivalent to page.screenshot)
       */
      takeScreenshot: (name: string) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const body = document.body;

        canvas.width = body.scrollWidth;
        canvas.height = body.scrollHeight;

        if (context) {
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(body, 0, 0);

          // Convert to base64
          return canvas.toDataURL('image/png');
        }

        return null;
      },
    };
  });
}

/**
 * Helper functions that can be imported by test files
 */
export const testHelpers = {
  /**
   * Login helper function
   */
  async loginAdmin(page: Page, phone: string, password: string) {
    await page.goto('/admin/login');
    await page.locator('input[type="tel"]').fill(phone);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/admin/dashboard');
  },

  /**
   * Wait for admin dashboard to load
   */
  async waitForDashboard(page: Page) {
    await page.waitForSelector('h1');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  },

  /**
   * Navigate to admin tab
   */
  async navigateToTab(page: Page, tabName: string) {
    await page.locator(`text=${tabName}`).click();
    await page.waitForTimeout(1000);
  },

  /**
   * Verify admin navigation state
   */
  async verifyNavigationState(page: Page, expectedTab: string) {
    await expect(page.locator(`text=${expectedTab}`)).toBeVisible();
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  },

  /**
   * Take test screenshot with timestamp
   */
  async takeTestScreenshot(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `test-results/admin-${name}-${timestamp}.png`;
    await page.screenshot({
      path: fileName,
      fullPage: true,
    });
    return fileName;
  },
};
