/**
 * Playwright Configuration for Admin Dashboard Tests
 *
 * Configuration file for Playwright testing framework with MCP integration
 * for comprehensive admin dashboard login and navigation testing.
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 */
export default defineConfig({
  // Test directory
  testDir: './playwright',

  // Run tests in files in parallel
  fullyParallel: true,

  // Reporter to use
  reporter: [
    [
      'html',
      {
        outputFolder: 'test-results/html-report',
        open: 'on-failure',
        suiteTitle: 'Admin Dashboard Tests Report',
      },
    ],
    [
      'json',
      {
        outputFile: 'test-results/test-results.json',
      },
    ],
    [
      'junit',
      {
        outputFile: 'test-results/junit-results.xml',
      },
    ],
  ],

  // Global setup and teardown
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // Web server configuration
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    stderr: 'pipe',
    stdout: 'pipe',
  },

  // Maximum timeout for each test
  timeout: 30000,

  // Maximum number of retry attempts for failing tests
  retries: 2,

  // Global test hooks
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3000',

    // Global viewport size
    viewport: { width: 1280, height: 720 },

    // Take screenshot on failure
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },

    // Trace on failure
    trace: 'on-first-retry',

    // Global timeout for actions
    actionTimeout: 10000,

    // Global navigation timeout
    navigationTimeout: 20000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Configure tests for mobile devices
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Global test hooks
  hooks: ['./hooks/setup.ts', './hooks/teardown.ts'],

  // Test file glob patterns
  testMatch: ['**/playwright/**/*.spec.ts', '**/playwright/**/*.test.ts'],

  // Exclude files from test run
  ignoreTestFiles: [
    '**/node_modules/**',
    '**/playwright/setup/**',
    '**/playwright/helpers/**',
    '**/playwright/examples/**',
  ],

  // Environment variables
  use: {
    // Environment-specific configuration
    headless: process.env.HEADLESS === 'true' ? true : false,
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});

/**
 * Test Environment Configuration
 */
export const testConfig = {
  // API URLs
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
  adminApiBaseUrl: process.env.ADMIN_API_BASE_URL || 'http://localhost:8000/api/v1/admin',

  // Test credentials
  adminPhone: process.env.ADMIN_PHONE || '+840000000001',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',

  // Test data
  testUsers: [
    { phone: '+84998877661', name: 'Alice Johnson' },
    { phone: '+84998877662', name: 'Bob Smith' },
  ],

  // Performance thresholds
  maxPageLoadTime: 5000,
  maxResponseTime: 10000,

  // Screenshot configuration
  screenshotDir: 'test-results/screenshots',
  screenshotOnFailure: true,
  screenshotOnSuccess: false,
};

/**
 * Browser Configuration
 */
export const browserConfig = {
  headless: process.env.HEADLESS === 'true',
  slowMo: parseInt(process.env.SLOW_MO || '0'),
  viewport: {
    width: 1280,
    height: 720,
  },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
};
