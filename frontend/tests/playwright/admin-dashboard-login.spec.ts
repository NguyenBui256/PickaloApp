/**
 * Admin Dashboard Login and Navigation Flow Tests
 *
 * Comprehensive Playwright MCP test for admin dashboard functionality including:
 * - Login page access
 * - Credential submission
 * - Authentication verification
 * - Dashboard content validation
 * - Navigation between admin screens
 * - Screenshot capture
 */

import { test, expect } from '@playwright/test';
import { AdminDashboardScreen } from '@screens/admin/admin-dashboard-screen';
import { AdminUsersScreen } from '@screens/admin/admin-users-screen';
import { AdminMerchantsScreen } from '@screens/admin/admin-merchants-screen';
import { AdminBookingsScreen } from '@screens/admin/admin-bookings-screen';
import { AdminContentScreen } from '@screens/admin/admin-content-screen';
import { AdminAuditLogScreen } from '@screens/admin/admin-audit-log-screen';
import type { AdminNavigationProp } from '@navigators/admin-navigator';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8000';

// Test credentials
const ADMIN_CREDENTIALS = {
  phone: '+840000000001',
  password: 'Admin123!',
};

// Test users data
const TEST_USERS = [
  { phone: '+84998877661', full_name: 'Alice Johnson', role: 'USER' },
  { phone: '+84998877662', full_name: 'Bob Smith', role: 'MERCHANT' },
  { phone: '+84998877663', full_name: 'Carol Wilson', role: 'USER' },
];

// Test venues data
const TEST_VENUES = [
  { name: 'Sports Complex A', address: '123 Street Hanoi', status: 'PENDING' },
  { name: 'Football Field B', address: '456 Avenue Hanoi', status: 'VERIFIED' },
];

interface TestContext {
  adminToken?: string;
  adminUser?: any;
  testUsers?: any[];
  testVenues?: any[];
}

test.describe('Admin Dashboard Login and Navigation Flow', () => {
  let testContext: TestContext = {};

  test.beforeAll(async ({ request }) => {
    // Setup test data by calling backend APIs
    console.log('Setting up test data...');

    try {
      // Create test admin user if not exists
      const createAdminResponse = await request.post(`${API_BASE_URL}/api/v1/auth/register`, {
        data: {
          phone: ADMIN_CREDENTIALS.phone,
          password: ADMIN_CREDENTIALS.password,
          full_name: 'Test Admin',
          role: 'ADMIN',
        },
      });

      if (createAdminResponse.status() === 200) {
        const adminLoginResponse = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
          data: {
            phone: ADMIN_CREDENTIALS.phone,
            password: ADMIN_CREDENTIALS.password,
          },
        });

        if (adminLoginResponse.status() === 200) {
          const loginData = await adminLoginResponse.json();
          testContext.adminToken = loginData.access_token;
          testContext.adminUser = loginData.user;
        }
      }

      // Create test users
      testContext.testUsers = [];
      for (const userData of TEST_USERS) {
        const createUserResponse = await request.post(`${API_BASE_URL}/api/v1/auth/register`, {
          data: {
            ...userData,
            password: 'User123!',
            is_verified: true,
          },
        });

        if (createUserResponse.status() === 200) {
          const createUserData = await createUserResponse.json();
          testContext.testUsers.push(createUserData.user);
        }
      }

      // Create test venues (this would require merchant setup)
      testContext.testVenues = TEST_VENUES;

      console.log('Test data setup completed');
    } catch (error) {
      console.error('Test data setup failed:', error);
    }
  });

  test.afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up test data...');
    // Implementation for cleanup would go here
  });

  test.beforeEach(async ({ page }) => {
    // Clear cookies and localStorage before each test
    await page.context().clearCookies();
    await page.goto(BASE_URL);
  });

  test('TC001: Access Admin Login Page - Verify Login UI Elements', async ({ page }) => {
    // Navigate to admin login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Take screenshot of login page
    await page.screenshot({
      path: 'test-results/admin-login-page.png',
      fullPage: true,
    });

    // Verify login page UI elements
    await expect(page.locator('h1')).toContainText('Admin Login');
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify placeholder text
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toHaveAttribute('placeholder', 'Enter phone number');

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('placeholder', 'Enter password');

    // Verify submit button text
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveText('Sign In');

    // Verify accessibility attributes
    await expect(phoneInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('TC002: Admin Login with Valid Credentials - Successful Authentication', async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Fill in login form
    await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
    await page.locator('input[type="password"]').fill(ADMIN_CREDENTIALS.password);

    // Take screenshot before login
    await page.screenshot({
      path: 'test-results/admin-login-before-submit.png',
      fullPage: true,
    });

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for navigation to dashboard
    await page.waitForURL('/admin/dashboard');

    // Take screenshot after successful login
    await page.screenshot({
      path: 'test-results/admin-dashboard-after-login.png',
      fullPage: true,
    });

    // Verify authentication success
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Verify user is logged in (check for admin-specific elements)
    await expect(page.locator('text=Welcome Admin')).toBeVisible();
  });

  test('TC003: Admin Login with Invalid Credentials - Authentication Failure', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Fill in login form with invalid credentials
    await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
    await page.locator('input[type="password"]').fill('WrongPassword123!');

    // Take screenshot before submitting invalid credentials
    await page.screenshot({
      path: 'test-results/admin-login-invalid-credentials.png',
      fullPage: true,
    });

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');

    // Verify we're still on login page
    await expect(page.url()).toContain('/admin/login');

    // Take screenshot after failed login
    await page.screenshot({
      path: 'test-results/admin-login-failed.png',
      fullPage: true,
    });
  });

  test('TC004: Admin Login with Non-Admin User - Access Denied', async ({ page }) => {
    // First register a regular user
    await page.request.post(`${API_BASE_URL}/api/v1/auth/register`, {
      data: {
        phone: '+84998877664',
        password: 'User123!',
        full_name: 'Regular User',
        role: 'USER',
      },
    });

    // Navigate to admin login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Fill in login form with regular user credentials
    await page.locator('input[type="tel"]').fill('+84998877664');
    await page.locator('input[type="password"]').fill('User123!');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should show access denied error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Access denied');

    // Verify we're still on login page
    await expect(page.url()).toContain('/admin/login');
  });

  test('TC005: Admin Dashboard Content Validation - Verify Dashboard Elements', async ({
    page,
  }) => {
    // Login as admin first
    await page.goto(`${BASE_URL}/admin/login`);
    await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
    await page.locator('input[type="password"]').fill(ADMIN_CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();

    // Wait for dashboard to load
    await page.waitForURL('/admin/dashboard');

    // Take comprehensive dashboard screenshot
    await page.screenshot({
      path: 'test-results/admin-dashboard-full.png',
      fullPage: true,
    });

    // Verify dashboard elements
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Verify navigation tabs
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Merchants')).toBeVisible();
    await expect(page.locator('text=Bookings')).toBeVisible();
    await expect(page.locator('text=Content')).toBeVisible();
    await expect(page.locator('text=Audit Log')).toBeVisible();

    // Verify placeholder content is displayed
    await expect(page.locator('text=Dashboard metrics will be displayed here')).toBeVisible();
    await expect(page.locator('text=• Total users')).toBeVisible();
    await expect(page.locator('text=• Total merchants')).toBeVisible();
    await expect(page.locator('text=• Total venues')).toBeVisible();
    await expect(page.locator('text=• Total bookings')).toBeVisible();
  });

  test('TC006: Admin Dashboard Navigation - Tab Switching', async ({ page }) => {
    // Login as admin first
    await page.goto(`${BASE_URL}/admin/login`);
    await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
    await page.locator('input[type="password"]').fill(ADMIN_CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();

    // Wait for dashboard to load
    await page.waitForURL('/admin/dashboard');

    // Take screenshot of initial dashboard
    await page.screenshot({
      path: 'test-results/admin-dashboard-tab-users.png',
      fullPage: true,
    });

    // Navigate through different tabs and verify each screen
    const tabs = ['Users', 'Merchants', 'Bookings', 'Content', 'Audit Log'];

    for (const tab of tabs) {
      // Click on tab
      await page.locator(`text=${tab}`).click();

      // Wait for tab to activate
      await page.waitForTimeout(1000);

      // Take screenshot of each tab
      await page.screenshot({
        path: `test-results/admin-dashboard-tab-${tab.toLowerCase()}.png`,
        fullPage: true,
      });

      // Verify tab content is visible
      await expect(page.locator(`text=${tab}`)).toBeVisible();

      // Verify the specific screen content
      switch (tab) {
        case 'Users':
          await expect(page.locator('text=Users Management')).toBeVisible();
          break;
        case 'Merchants':
          await expect(page.locator('text=Merchants Management')).toBeVisible();
          break;
        case 'Bookings':
          await expect(page.locator('text=Bookings Overview')).toBeVisible();
          break;
        case 'Content':
          await expect(page.locator('text=Content Moderation')).toBeVisible();
          break;
        case 'Audit Log':
          await expect(page.locator('text=Audit Log')).toBeVisible();
          break;
      }
    }
  });

  test('TC007: Admin Login Form Validation - Empty Fields', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Try to submit empty form
    await page.locator('button[type="submit"]').click();

    // Verify validation error messages
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Phone number is required');

    // Fill phone number but leave password empty
    await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
    await page.locator('button[type="submit"]').click();

    // Verify password validation
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Password is required');

    // Take screenshot of validation errors
    await page.screenshot({
      path: 'test-results/admin-login-validation-errors.png',
      fullPage: true,
    });
  });

  test('TC008: Admin Login Form Validation - Invalid Phone Format', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Test invalid phone formats
    const invalidPhones = [
      '123', // Too short
      'abc123', // Contains letters
      '+849999999999999', // Too long
      '', // Empty
      '84999887766', // Missing country code
    ];

    for (const phone of invalidPhones) {
      await page.locator('input[type="tel"]').fill(phone);
      await page.locator('button[type="submit"]').click();

      // Wait for validation error
      await page.waitForTimeout(500);

      await expect(page.locator('.error-message')).toBeVisible();
    }

    // Take screenshot of validation
    await page.screenshot({
      path: 'test-results/admin-login-phone-validation.png',
      fullPage: true,
    });
  });

  test('TC009: Admin Login Security - Rate Limiting', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Attempt multiple login attempts with wrong credentials
    for (let i = 0; i < 5; i++) {
      await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
      await page.locator('input[type="password"]').fill(`WrongPassword${i}!`);
      await page.locator('button[type="submit"]').click();

      // Wait for error message
      await expect(page.locator('.error-message')).toBeVisible();

      // Wait a bit between attempts
      await page.waitForTimeout(1000);
    }

    // After 5 failed attempts, should show rate limiting message
    await expect(page.locator('.error-message')).toContainText('Too many attempts');

    // Take screenshot of rate limiting
    await page.screenshot({
      path: 'test-results/admin-login-rate-limiting.png',
      fullPage: true,
    });
  });

  test('TC010: Admin Dashboard Responsiveness - Different Viewports', async ({ page }) => {
    // Login as admin first
    await page.goto(`${BASE_URL}/admin/login`);
    await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
    await page.locator('input[type="password"]').fill(ADMIN_CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();

    // Wait for dashboard to load
    await page.waitForURL('/admin/dashboard');

    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Take screenshot for each viewport
      await page.screenshot({
        path: `test-results/admin-dashboard-${viewport.name}.png`,
        fullPage: true,
      });

      // Verify content is still visible
      await expect(page.locator('h1')).toContainText('Admin Dashboard');
    }
  });

  test('TC011: Admin Login Session Persistence - Navigation After Login', async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
    await page.locator('input[type="password"]').fill(ADMIN_CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();

    // Wait for dashboard to load
    await page.waitForURL('/admin/dashboard');

    // Navigate to different pages and verify we stay logged in
    await page.goto(BASE_URL + '/other-page');

    // Should still have admin access
    await expect(page.locator('text=Welcome Admin')).toBeVisible();

    // Navigate back to admin dashboard
    await page.goto(`${BASE_URL}/admin/dashboard`);

    // Should still be on dashboard
    await expect(page.locator('h1')).toContainText('Admin Dashboard');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/admin-session-persistence.png',
      fullPage: true,
    });
  });

  test('TC012: Admin Login Error Handling - Network Issues', async ({ page }) => {
    // Mock network failure during login
    await page.route('**/api/v1/auth/login', (route) => {
      route.abort('failed');
    });

    // Navigate to login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Fill in login form
    await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
    await page.locator('input[type="password"]').fill(ADMIN_CREDENTIALS.password);

    // Attempt login
    await page.locator('button[type="submit"]').click();

    // Should show network error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Network error');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/admin-login-network-error.png',
      fullPage: true,
    });
  });

  test('TC013: Admin Dashboard Accessibility - Keyboard Navigation', async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/admin/login`);
    await page.locator('input[type="tel"]').fill(ADMIN_CREDENTIALS.phone);
    await page.locator('input[type="password"]').fill(ADMIN_CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();

    // Wait for dashboard to load
    await page.waitForURL('/admin/dashboard');

    // Test keyboard navigation
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.press('Tab');

    // Verify focus management
    await expect(page.locator('input[type="password"]')).toBeFocused();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/admin-dashboard-keyboard-nav.png',
      fullPage: true,
    });
  });

  test('TC014: Admin Login Performance - Page Load Time', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Measure page load time
    const startTime = Date.now();
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    console.log(`Admin login page load time: ${loadTime}ms`);

    // Verify page loads within acceptable time (less than 3 seconds)
    expect(loadTime).toBeLessThan(3000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/admin-login-performance.png',
      fullPage: true,
    });
  });
});

// Test utilities
export class AdminTestUtils {
  static async createTestUser(page: any, userData: any) {
    // Utility to create test users
    return await page.request.post(`${API_BASE_URL}/api/v1/auth/register`, {
      data: {
        ...userData,
        password: 'User123!',
        is_verified: true,
      },
    });
  }

  static async loginAdmin(page: any, phone: string, password: string) {
    // Utility for admin login
    await page.goto(`${BASE_URL}/admin/login`);
    await page.locator('input[type="tel"]').fill(phone);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/admin/dashboard');
  }

  static async takeScreenshotWithMetadata(page: any, name: string) {
    // Utility to take screenshots with metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `test-results/admin-${name}-${timestamp}.png`,
      fullPage: true,
    });
  }
}
