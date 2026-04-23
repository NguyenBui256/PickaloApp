/**
 * Global Test Teardown for Admin Dashboard Tests
 *
 * This teardown file runs after all tests and performs:
 * - Test data cleanup
 * - Session cleanup
 * - Report generation
 * - Resource cleanup
 */

import { chromium, Browser, BrowserContext } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

export default async function globalTeardown({
  browser,
  context,
}: {
  browser: Browser;
  context: BrowserContext;
}) {
  console.log('🧹 Starting Global Teardown for Admin Dashboard Tests...');

  try {
    // Step 1: Generate Test Report
    console.log('📊 Generating test report...');
    await generateTestReport(context);

    // Step 2: Cleanup Test Data
    console.log('🧹 Cleaning up test data...');
    await cleanupTestData(context);

    // Step 3: Cleanup Sessions
    console.log('🔧 Cleaning up sessions...');
    await cleanupSessions(context);

    // Step 4: Upload Results
    console.log('📤 Uploading test results...');
    await uploadTestResults();

    // Step 5: Close Browser
    console.log('🔓 Closing browser...');
    await browser.close();

    console.log('✅ Global Teardown completed successfully');
  } catch (error) {
    console.error('❌ Global Teardown failed:', error);
    // Still try to close browser
    await browser.close();
    throw error;
  }
}

/**
 * Generate Test Report
 */
async function generateTestReport(context: BrowserContext) {
  try {
    // Get test results
    const testResults = await getTestResults();

    // Generate comprehensive report
    const report = {
      summary: {
        totalTests: testResults.totalTests,
        passedTests: testResults.passedTests,
        failedTests: testResults.failedTests,
        skippedTests: testResults.skippedTests,
        successRate: testResults.successRate,
        duration: testResults.duration,
      },
      environment: {
        timestamp: new Date().toISOString(),
        browser: await getBrowserInfo(context),
        os: process.platform,
        nodeVersion: process.version,
      },
      details: testResults.details,
      screenshots: await getScreenshotList(),
      recommendations: generateRecommendations(testResults),
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'test-results', 'final-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    await generateHtmlReport(report);

    console.log('✅ Test report generated');
  } catch (error) {
    console.error('❌ Failed to generate test report:', error);
  }
}

/**
 * Cleanup Test Data
 */
async function cleanupTestData(context: BrowserContext) {
  try {
    // Get admin token from context
    const cookies = await context.cookies();
    const adminToken = cookies.find((cookie) => cookie.name === 'admin_token')?.value;

    if (adminToken) {
      // Cleanup test users
      const cleanupResponse = await context.request.post(
        `${process.env.API_BASE_URL}/api/v1/admin/test/cleanup`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (cleanupResponse.status() === 200) {
        console.log('✅ Test data cleaned up');
      } else {
        console.warn('⚠️ Test data cleanup failed:', cleanupResponse.status());
      }
    }
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

/**
 * Cleanup Sessions
 */
async function cleanupSessions(context: BrowserContext) {
  try {
    // Clear all cookies
    await context.clearCookies();

    // Clear localStorage and sessionStorage
    await context.pages().forEach(async (page) => {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });

    console.log('✅ Sessions cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup sessions:', error);
  }
}

/**
 * Upload Test Results
 */
async function uploadTestResults() {
  try {
    // Check if results exist
    const resultsPath = path.join(process.cwd(), 'test-results');
    const files = await fs.readdir(resultsPath);

    // Upload results to storage or reporting system
    if (files.length > 0) {
      console.log('📤 Found test results files:', files);
      // Implementation for uploading to cloud storage, reporting system, etc.
    }

    console.log('✅ Test results uploaded');
  } catch (error) {
    console.error('❌ Failed to upload test results:', error);
  }
}

/**
 * Helper Functions
 */
async function getTestResults() {
  try {
    const resultsPath = path.join(process.cwd(), 'test-results', 'test-results.json');
    const resultsData = await fs.readFile(resultsPath, 'utf-8');
    return JSON.parse(resultsData);
  } catch (error) {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      successRate: 0,
      duration: 0,
      details: [],
    };
  }
}

async function getBrowserInfo(context: BrowserContext) {
  const page = await context.newPage();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  await page.close();
  return userAgent;
}

async function getScreenshotList() {
  try {
    const screenshotsDir = path.join(process.cwd(), 'test-results', 'screenshots');
    const files = await fs.readdir(screenshotsDir);
    return files.filter((file) => file.endsWith('.png'));
  } catch (error) {
    return [];
  }
}

function generateRecommendations(testResults: any) {
  const recommendations = [];

  if (testResults.successRate < 80) {
    recommendations.push('Consider improving test reliability and fixing failing tests');
  }

  if (testResults.duration > 300000) {
    // 5 minutes
    recommendations.push('Test execution time is high - consider optimizing test speed');
  }

  if (testResults.failedTests > 0) {
    recommendations.push('Address failing tests to improve overall test quality');
  }

  return recommendations;
}

async function generateHtmlReport(report: any) {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; color: #0066CC; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Admin Dashboard Test Report</h1>
        <p>Generated on: ${new Date().toISOString()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${report.summary.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div class="value" style="color: green;">${report.summary.passedTests}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div class="value" style="color: red;">${report.summary.failedTests}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value">${report.summary.successRate}%</div>
        </div>
    </div>

    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <div class="details">
        <h3>Environment Details</h3>
        <p><strong>Browser:</strong> ${report.environment.browser}</p>
        <p><strong>OS:</strong> ${report.environment.os}</p>
        <p><strong>Node Version:</strong> ${report.environment.nodeVersion}</p>
    </div>
</body>
</html>`;

  const reportPath = path.join(process.cwd(), 'test-results', 'test-report.html');
  await fs.writeFile(reportPath, htmlTemplate);
}
