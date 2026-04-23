#!/usr/bin/env node

/**
 * Admin Dashboard Test Runner
 *
 * This script runs comprehensive Playwright tests for the admin dashboard functionality.
 * It includes setup, execution, and reporting capabilities.
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { program } from 'commander';

// Configure CLI options
program
  .name('admin-test-runner')
  .description('Run comprehensive admin dashboard tests with Playwright')
  .version('1.0.0');

program
  .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
  .option('-h, --headless', 'Run tests in headless mode')
  .option('-g, --grep <pattern>', 'Run tests matching pattern')
  .option('-t, --timeout <timeout>', 'Test timeout in seconds', '30')
  .option('-r, --retries <retries>', 'Number of retries for failed tests', '2')
  .option('--debug', 'Run in debug mode with verbose logging')
  .option('--headed', 'Run tests with browser UI visible')
  .option('--slow-mo <ms>', 'Slow down execution by specified milliseconds', '0')
  .option('--video', 'Record video of test execution')
  .option('--screenshot', 'Take screenshots on failure')
  .option('--report <type>', 'Report type (html, json, junit)', 'html')
  .parse();

const options = program.opts();

/**
 * Test Runner Configuration
 */
const testConfig = {
  // Command paths
  playwrightCommand: 'npx playwright',
  nodeCommand: process.execPath,

  // Environment variables
  env: {
    ...process.env,
    HEADLESS: options.headless ? 'true' : 'false',
    DEBUG: options.debug ? 'true' : 'false',
    BROWSER: options.browser,
    SLOW_MO: options.slowMo,
    VIDEO: options.video ? 'true' : 'false',
    SCREENSHOT: options.screenshot ? 'true' : 'false',
  },

  // Test parameters
  timeout: parseInt(options.timeout) * 1000,
  retries: parseInt(options.retries),
  grep: options.grep || '',

  // Project configuration
  projectName: 'admin-dashboard-tests',
  testDir: path.join(__dirname, '../..', 'playwright'),
  resultsDir: path.join(process.cwd(), 'test-results'),

  // Browser configuration
  browsers: {
    chromium: { name: 'Chromium', command: 'npx playwright test --project=chromium' },
    firefox: { name: 'Firefox', command: 'npx playwright test --project=firefox' },
    webkit: { name: 'WebKit', command: 'npx playwright test --project=webkit' },
  },
};

/**
 * Main Test Runner Function
 */
async function main() {
  console.log('🚀 Starting Admin Dashboard Test Runner...');
  console.log(`📋 Configuration: ${JSON.stringify(options, null, 2)}`);

  try {
    // Step 1: Setup Environment
    console.log('🔧 Setting up test environment...');
    await setupEnvironment();

    // Step 2: Install Dependencies
    console.log('📦 Installing dependencies...');
    await installDependencies();

    // Step 3: Run Tests
    console.log(`🧪 Running tests with ${options.browser}...`);
    const testResults = await runTests();

    // Step 4: Generate Reports
    console.log('📊 Generating reports...');
    await generateReports(testResults);

    // Step 5: Display Results
    console.log('📋 Displaying test results...');
    displayResults(testResults);

    // Step 6: Exit with appropriate code
    process.exit(testResults.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

/**
 * Setup Test Environment
 */
async function setupEnvironment() {
  try {
    // Create test results directory
    await fs.mkdir(testConfig.resultsDir, { recursive: true });

    // Create subdirectories
    const subdirs = ['screenshots', 'videos', 'reports', 'logs'];
    for (const dir of subdirs) {
      await fs.mkdir(path.join(testConfig.resultsDir, dir), { recursive: true });
    }

    // Clean up previous results
    try {
      const existingFiles = await fs.readdir(testConfig.resultsDir);
      for (const file of existingFiles) {
        if (file.endsWith('.png') || file.endsWith('.mp4') || file.endsWith('.json')) {
          await fs.unlink(path.join(testConfig.resultsDir, file));
        }
      }
    } catch (error) {
      // Directory might not exist or be empty
    }

    console.log('✅ Environment setup completed');
  } catch (error) {
    console.error('❌ Failed to setup environment:', error);
    throw error;
  }
}

/**
 * Install Dependencies
 */
async function installDependencies() {
  try {
    console.log('Installing Playwright browsers...');
    execSync('npx playwright install', {
      stdio: 'inherit',
      env: testConfig.env,
    });

    console.log('Installing npm dependencies...');
    execSync('npm install', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: testConfig.env,
    });

    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error);
    throw error;
  }
}

/**
 * Run Tests
 */
async function runTests() {
  try {
    // Build Playwright test command
    let command = `${testConfig.playwrightCommand} test`;

    // Add browser project
    command += ` --project=${options.browser}`;

    // Add headless mode
    if (options.headless) {
      command += ' --headed';
    }

    // Add debugging options
    if (options.debug) {
      command += ' --debug';
    }

    // Add video recording
    if (options.video) {
      command += ' --video';
    }

    // Add screenshots on failure
    if (options.screenshot) {
      command += ' --screenshot-on-failure';
    }

    // Add grep filter
    if (options.grep) {
      command += ` --grep="${options.grep}"`;
    }

    // Add timeout
    command += ` --timeout=${testConfig.timeout}`;

    // Add retries
    command += ` --retries=${testConfig.retries}`;

    // Add output directory
    command += ` --output=${testConfig.resultsDir}/test-results.json`;

    // Add report options
    command += ` --reporter=list,json`;

    console.log(`Running command: ${command}`);

    // Execute tests
    const startTime = Date.now();
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: testConfig.env,
      timeout: testConfig.timeout + 60000, // Extra time for cleanup
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Parse test results
    const testResults = await parseTestResults();

    return {
      success: testResults.passed === testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      total: testResults.total,
      duration,
      timestamp: new Date().toISOString(),
      browser: options.browser,
      ...testResults,
    };
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  }
}

/**
 * Parse Test Results
 */
async function parseTestResults() {
  try {
    const resultsPath = path.join(testConfig.resultsDir, 'test-results.json');
    const resultsData = await fs.readFile(resultsPath, 'utf-8');
    const results = JSON.parse(resultsData);

    return {
      passed: results.results.filter((r: any) => r.status === 'passed').length,
      failed: results.results.filter((r: any) => r.status === 'failed').length,
      skipped: results.results.filter((r: any) => r.status === 'skipped').length,
      total: results.results.length,
      results: results.results,
    };
  } catch (error) {
    console.error('❌ Failed to parse test results:', error);
    return {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      results: [],
    };
  }
}

/**
 * Generate Reports
 */
async function generateReports(testResults: any) {
  try {
    // Generate HTML Report
    await generateHtmlReport(testResults);

    // Generate JSON Report
    await generateJsonReport(testResults);

    // Generate JUnit Report (if available)
    await generateJUnitReport(testResults);

    // Generate Performance Report
    await generatePerformanceReport(testResults);

    console.log('✅ Reports generated');
  } catch (error) {
    console.error('❌ Failed to generate reports:', error);
  }
}

/**
 * Generate HTML Report
 */
async function generateHtmlReport(testResults: any) {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #0066CC, #004499); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .metric h3 { margin: 0 0 15px 0; color: #333; font-size: 1.2em; }
        .metric .value { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .metric .label { color: #666; font-size: 0.9em; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .total { color: #0066CC; }
        .details { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .details h2 { margin: 0 0 20px 0; color: #333; }
        .test-list { margin: 0; padding: 0; list-style: none; }
        .test-item { padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid; }
        .test-item.passed { border-left-color: #28a745; background: #f8fff8; }
        .test-item.failed { border-left-color: #dc3545; background: #fff8f8; }
        .test-item.skipped { border-left-color: #ffc107; background: #fffff8; }
        .test-title { font-weight: bold; margin-bottom: 5px; }
        .test-duration { color: #666; font-size: 0.9em; }
        .recommendations { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 30px 0; }
        .recommendations h3 { margin: 0 0 15px 0; color: #1976d2; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .screenshot { margin: 10px 0; }
        .screenshot img { max-width: 100%; border-radius: 5px; }
        @media (max-width: 768px) {
            .header { padding: 20px; }
            .header h1 { font-size: 2em; }
            .summary { grid-template-columns: 1fr; }
            .metric .value { font-size: 2em; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Admin Dashboard Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()} using ${testResults.browser}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="value ${testResults.success ? 'passed' : 'failed'}">${testResults.passed}</div>
            <div class="label">Passed</div>
        </div>
        <div class="metric">
            <div class="value failed">${testResults.failed}</div>
            <div class="label">Failed</div>
        </div>
        <div class="metric">
            <div class="value skipped">${testResults.skipped}</div>
            <div class="label">Skipped</div>
        </div>
        <div class="metric">
            <div class="value total">${testResults.total}</div>
            <div class="label">Total</div>
        </div>
    </div>

    ${
      testResults.failed > 0
        ? `
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${testResults.failed > 0 ? `<li>Focus on fixing the ${testResults.failed} failing tests to improve overall test quality</li>` : ''}
            ${testResults.success ? `<li>Maintain good test coverage and add more edge case tests</li>` : ''}
            <li>Consider running tests with different browsers to ensure cross-browser compatibility</li>
            ${testResults.duration > 120000 ? `<li>Test execution took ${Math.round(testResults.duration / 1000)} seconds - consider optimizing test performance</li>` : ''}
        </ul>
    </div>
    `
        : ''
    }

    <div class="details">
        <h2>Test Details</h2>
        <ul class="test-list">
            ${testResults.results
              .map(
                (test: any) => `
                <li class="test-item ${test.status}">
                    <div class="test-title">${test.title}</div>
                    <div class="test-duration">Duration: ${Math.round(test.duration / 1000)}s</div>
                    ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
                </li>
            `
              )
              .join('')}
        </ul>
    </div>
</body>
</html>`;

  const reportPath = path.join(testConfig.resultsDir, 'admin-dashboard-report.html');
  await fs.writeFile(reportPath, htmlTemplate);
}

/**
 * Generate JSON Report
 */
async function generateJsonReport(testResults: any) {
  const reportPath = path.join(testConfig.resultsDir, 'admin-dashboard-report.json');
  await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
}

/**
 * Generate JUnit Report
 */
async function generateJUnitReport(testResults: any) {
  const junitTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="AdminDashboardTests" tests="${testResults.total}" failures="${testResults.failed}" time="${testResults.duration / 1000}">
    <testsuite name="AdminDashboard" tests="${testResults.total}" failures="${testResults.failed}" time="${testResults.duration / 1000}">
        ${testResults.results
          .map(
            (test: any) => `
        <testcase name="${test.title}" classname="${test.title}" time="${test.duration / 1000}">
            ${
              test.status === 'failed'
                ? `<failure message="${test.error || 'Test failed'}">
                ${test.error || ''}
            </failure>`
                : ''
            }
        </testcase>`
          )
          .join('')}
    </testsuite>
</testsuites>`;

  const reportPath = path.join(testConfig.resultsDir, 'admin-dashboard-junit.xml');
  await fs.writeFile(reportPath, junitTemplate);
}

/**
 * Generate Performance Report
 */
async function generatePerformanceReport(testResults: any) {
  const performanceTemplate = {
    summary: {
      totalTests: testResults.total,
      passedTests: testResults.passed,
      failedTests: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%',
      executionTime: testResults.duration,
      averageTimePerTest: (testResults.duration / testResults.total / 1000).toFixed(2) + 's',
    },
    recommendations: [
      ...(testResults.failed > 0 ? [`Fix ${testResults.failed} failing tests`] : []),
      ...(testResults.success ? ['Maintain current test coverage'] : []),
      ...(testResults.duration > 120000 ? ['Optimize test performance'] : []),
    ],
    timestamp: new Date().toISOString(),
    browser: options.browser,
  };

  const reportPath = path.join(testConfig.resultsDir, 'admin-dashboard-performance.json');
  await fs.writeFile(reportPath, JSON.stringify(performanceTemplate, null, 2));
}

/**
 * Display Results
 */
function displayResults(testResults: any) {
  console.log('\n📊 Test Results Summary:');
  console.log(`   Browser: ${testResults.browser}`);
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed} ✅`);
  console.log(`   Failed: ${testResults.failed} ❌`);
  console.log(`   Skipped: ${testResults.skipped} ⏸️`);
  console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  console.log(`   Duration: ${Math.round(testResults.duration / 1000)}s`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.results
      .filter((test: any) => test.status === 'failed')
      .forEach((test: any) => {
        console.log(`   • ${test.title}: ${test.error || 'Unknown error'}`);
      });
  }

  if (testResults.success) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the reports for details.');
  }
}

/**
 * Run the main function
 */
main().catch((error) => {
  console.error('❌ Test runner crashed:', error);
  process.exit(1);
});
