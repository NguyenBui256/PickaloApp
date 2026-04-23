/**
 * Test Teardown Hook for Admin Dashboard Tests
 *
 * This hook runs after each test and performs:
 * - Cleanup
 * - Result collection
 * - Error handling
 * - Report generation
 */

import { Page } from 'playwright';

/**
 * Teardown function called after each test
 */
export async function teardown(page: Page) {
  console.log('🧹 Cleaning up after test...');

  try {
    // Cleanup test state
    await cleanupTestState(page);

    // Collect test results
    await collectTestResults(page);

    // Handle any remaining errors
    await handleRemainingErrors(page);

    console.log('✅ Test teardown completed');
  } catch (error) {
    console.error('❌ Test teardown failed:', error);
  }
}

/**
 * Cleanup Test State
 */
async function cleanupTestState(page: Page) {
  try {
    // Clear form data
    await page.fill('input[type="text"]', '');
    await page.fill('input[type="tel"]', '');
    await page.fill('input[type="password"]', '');
    await page.fill('input[type="email"]', '');
    await page.fill('textarea', '');

    // Reset form states
    await page.click('body'); // Click outside any focused elements

    // Clear any toast messages or notifications
    await page.evaluate(() => {
      const toastMessages = document.querySelectorAll('.toast, .notification, .alert');
      toastMessages.forEach((element) => element.remove());
    });

    // Reset navigation state
    await page.evaluate(() => {
      if (window.history.length > 1) {
        window.history.back();
      }
    });

    // Clear any active modals or popups
    await page.evaluate(() => {
      const modals = document.querySelectorAll('.modal, .popup, .dialog');
      modals.forEach((modal) => {
        const closeBtn = modal.querySelector('.close, .cancel, .btn-cancel');
        if (closeBtn) {
          closeBtn.dispatchEvent(new Event('click'));
        } else {
          modal.remove();
        }
      });
    });

    console.log('✅ Test state cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup test state:', error);
  }
}

/**
 * Collect Test Results
 */
async function collectTestResults(page: Page) {
  try {
    // Collect test metrics
    const testMetrics = await page.evaluate(() => {
      const navigationTiming = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      const paintTiming = performance.getEntriesByType('paint');

      return {
        loadTime: navigationTiming
          ? navigationTiming.loadEventEnd - navigationTiming.loadEventStart
          : 0,
        domContentLoaded: navigationTiming
          ? navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart
          : 0,
        firstPaint: paintTiming.find((entry) => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint:
          paintTiming.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };
    });

    // Save test metrics
    await saveTestMetrics(testMetrics);

    // Take screenshot of final state if test failed
    const isTestFailed = await checkIfTestFailed();
    if (isTestFailed) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await page.screenshot({
        path: `test-results/test-failure-${timestamp}.png`,
        fullPage: true,
      });
    }

    console.log('✅ Test results collected');
  } catch (error) {
    console.error('❌ Failed to collect test results:', error);
  }
}

/**
 * Handle Remaining Errors
 */
async function handleRemainingErrors(page: Page) {
  try {
    // Check for console errors
    const consoleErrors = await page.evaluate(() => {
      return (window as any).consoleErrors || [];
    });

    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors detected:', consoleErrors);
    }

    // Check for unhandled exceptions
    const unhandledExceptions = await page.evaluate(() => {
      return (window as any).unhandledExceptions || [];
    });

    if (unhandledExceptions.length > 0) {
      console.warn('⚠️ Unhandled exceptions detected:', unhandledExceptions);
    }

    // Clear error tracking
    await page.evaluate(() => {
      (window as any).consoleErrors = [];
      (window as any).unhandledExceptions = [];
    });

    console.log('✅ Remaining errors handled');
  } catch (error) {
    console.error('❌ Failed to handle remaining errors:', error);
  }
}

/**
 * Save Test Metrics
 */
async function saveTestMetrics(metrics: any) {
  try {
    // Create test results directory if it doesn't exist
    const fs = require('fs/promises');
    const path = require('path');

    const resultsDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(resultsDir, { recursive: true });

    // Read existing metrics
    const metricsPath = path.join(resultsDir, 'test-metrics.json');
    let allMetrics = [];

    try {
      const existingData = await fs.readFile(metricsPath, 'utf-8');
      allMetrics = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist or is empty
    }

    // Add new metrics
    allMetrics.push(metrics);

    // Save updated metrics
    await fs.writeFile(metricsPath, JSON.stringify(allMetrics, null, 2));
  } catch (error) {
    console.error('❌ Failed to save test metrics:', error);
  }
}

/**
 * Check if Test Failed
 */
async function checkIfTestFailed() {
  try {
    // This would be implemented based on the test framework
    // For now, return false as a fallback
    return false;
  } catch (error) {
    console.error('❌ Failed to check test status:', error);
    return false;
  }
}

/**
 * Helper functions that can be imported by test files
 */
export const teardownHelpers = {
  /**
   * Clean up after specific test actions
   */
  async cleanupAfterLogin(page: Page) {
    await page.fill('input[type="tel"]', '');
    await page.fill('input[type="password"]', '');
    await page.click('body'); // Click outside any focused elements
  },

  /**
   * Reset navigation state
   */
  async resetNavigation(page: Page) {
    await page.goto('/admin/login');
  },

  /**
   * Take final screenshot with timestamp
   */
  async takeFinalScreenshot(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `test-results/${name}-${timestamp}.png`;
    await page.screenshot({
      path: fileName,
      fullPage: true,
    });
    return fileName;
  },

  /**
   * Generate test summary
   */
  async generateTestSummary() {
    const fs = require('fs/promises');
    const path = require('path');

    try {
      const resultsDir = path.join(process.cwd(), 'test-results');
      const metricsPath = path.join(resultsDir, 'test-metrics.json');

      let metrics = [];
      try {
        const data = await fs.readFile(metricsPath, 'utf-8');
        metrics = JSON.parse(data);
      } catch (error) {
        // File doesn't exist
      }

      const summary = {
        totalTests: metrics.length,
        averageLoadTime:
          metrics.reduce((sum: number, m: any) => sum + (m.loadTime || 0), 0) / metrics.length || 0,
        averageDomContentLoaded:
          metrics.reduce((sum: number, m: any) => sum + (m.domContentLoaded || 0), 0) /
            metrics.length || 0,
        testResults: metrics,
      };

      return summary;
    } catch (error) {
      console.error('❌ Failed to generate test summary:', error);
      return {
        totalTests: 0,
        averageLoadTime: 0,
        averageDomContentLoaded: 0,
        testResults: [],
      };
    }
  },
};
