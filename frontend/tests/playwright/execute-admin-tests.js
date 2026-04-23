#!/usr/bin/env node

/**
 * Comprehensive Admin Dashboard Test Execution Script
 *
 * This script orchestrates the complete admin dashboard test execution pipeline:
 * 1. Environment setup and dependency installation
 * 2. Test data preparation
 * 3. Test execution with multiple browsers
 * 4. Report generation and analysis
 * 5. Result summary and recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

class AdminTestExecutor {
  constructor() {
    this.testConfig = {
      projectRoot: process.cwd(),
      testDir: path.join(process.cwd(), 'tests', 'playwright'),
      resultsDir: path.join(process.cwd(), 'test-results'),
      browserDir: path.join(process.cwd(), 'test-results', 'screenshots'),
      timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
      parallelRuns: true,
      browsers: ['chromium', 'firefox'],
      timeout: 30000,
      retries: 2,
    };

    this.testResults = {
      summary: {
        totalBrowsers: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        executionTime: 0,
        startTime: null,
        endTime: null,
      },
      browserResults: {},
      screenshots: [],
      videos: [],
      errors: [],
      recommendations: [],
    };
  }

  /**
   * Main execution method
   */
  async execute() {
    console.log('🚀 Starting Admin Dashboard Test Execution...');
    console.log(`📅 Timestamp: ${this.testConfig.timestamp}`);

    try {
      this.testResults.summary.startTime = new Date();

      // Step 1: Environment Setup
      console.log('🔧 Setting up test environment...');
      await this.setupEnvironment();

      // Step 2: Install Dependencies
      console.log('📦 Installing dependencies...');
      await this.installDependencies();

      // Step 3: Prepare Test Data
      console.log('📝 Preparing test data...');
      await this.prepareTestData();

      // Step 4: Run Tests in Parallel
      console.log('🧪 Running tests...');
      await this.runTests();

      // Step 5: Generate Reports
      console.log('📊 Generating comprehensive reports...');
      await this.generateReports();

      // Step 6: Analyze Results
      console.log('🔍 Analyzing test results...');
      await this.analyzeResults();

      // Step 7: Display Summary
      this.displaySummary();

      this.testResults.summary.endTime = new Date();
      this.testResults.summary.executionTime =
        this.testResults.summary.endTime - this.testResults.summary.startTime;

      // Save final results
      await this.saveResults();

      // Exit with appropriate code
      const success = this.testResults.summary.failedTests === 0;
      console.log(success ? '✅ All tests passed!' : '❌ Some tests failed!');
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      this.testResults.errors.push(error.message);
      await this.saveResults();
      process.exit(1);
    }
  }

  /**
   * Setup Test Environment
   */
  async setupEnvironment() {
    try {
      // Create necessary directories
      const dirs = [
        this.testConfig.resultsDir,
        this.testConfig.browserDir,
        path.join(this.testConfig.resultsDir, 'reports'),
        path.join(this.testConfig.resultsDir, 'logs'),
        path.join(this.testConfig.resultsDir, 'videos'),
      ];

      for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
      }

      // Clean up previous results
      const existingFiles = await fs.readdir(this.testConfig.resultsDir);
      for (const file of existingFiles) {
        if (file.endsWith('.png') || file.endsWith('.mp4') || file.endsWith('.json')) {
          await fs.unlink(path.join(this.testConfig.resultsDir, file));
        }
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
  async installDependencies() {
    try {
      console.log('Installing Playwright browsers...');
      execSync('npx playwright install', {
        stdio: 'inherit',
        cwd: this.testConfig.projectRoot,
      });

      console.log('Installing npm dependencies...');
      execSync('npm install', {
        stdio: 'inherit',
        cwd: this.testConfig.projectRoot,
      });

      console.log('✅ Dependencies installed');
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error);
      throw error;
    }
  }

  /**
   * Prepare Test Data
   */
  async prepareTestData() {
    try {
      console.log('Setting up test data...');

      // Create admin test data
      const testData = {
        admin: {
          phone: '+840000000001',
          password: 'Admin123!',
          name: 'Test Admin User',
        },
        users: [
          { phone: '+84998877661', name: 'Alice Johnson', role: 'USER' },
          { phone: '+84998877662', name: 'Bob Smith', role: 'MERCHANT' },
          { phone: '+84998877663', name: 'Carol Wilson', role: 'USER' },
        ],
        venues: [
          { name: 'Sports Complex A', address: '123 Street Hanoi', status: 'PENDING' },
          { name: 'Football Field B', address: '456 Avenue Hanoi', status: 'VERIFIED' },
        ],
      };

      // Save test data
      const testDataPath = path.join(this.testConfig.resultsDir, 'test-data.json');
      await fs.writeFile(testDataPath, JSON.stringify(testData, null, 2));

      console.log('✅ Test data prepared');
    } catch (error) {
      console.error('❌ Failed to prepare test data:', error);
      throw error;
    }
  }

  /**
   * Run Tests
   */
  async runTests() {
    try {
      this.testResults.summary.totalBrowsers = this.testConfig.browsers.length;

      // Run tests for each browser
      for (const browser of this.testConfig.browsers) {
        console.log(`🔍 Running tests with ${browser}...`);
        await this.runBrowserTests(browser);
      }

      // Run cross-browser tests
      console.log('🌐 Running cross-browser compatibility tests...');
      await this.runCrossBrowserTests();

      // Run performance tests
      console.log('⚡ Running performance tests...');
      await this.runPerformanceTests();

      console.log('✅ All tests completed');
    } catch (error) {
      console.error('❌ Failed to run tests:', error);
      throw error;
    }
  }

  /**
   * Run Tests for Specific Browser
   */
  async runBrowserTests(browser) {
    try {
      const startTime = Date.now();

      // Build command
      const command = `npx playwright test tests/playwright --project=${browser} --headed=false --video=false --screenshot=only-on-failure --timeout=${this.testConfig.timeout} --retries=${this.testConfig.retries} --output=${this.testConfig.resultsDir}/results-${browser}.json`;

      console.log(`Running command: ${command}`);
      execSync(command, {
        stdio: 'inherit',
        cwd: this.testConfig.projectRoot,
        timeout: this.testConfig.timeout + 60000,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse results
      const results = await this.parseBrowserResults(browser);

      this.testResults.browserResults[browser] = {
        ...results,
        duration,
        timestamp: new Date().toISOString(),
      };

      // Update summary
      this.testResults.summary.totalTests += results.total;
      this.testResults.summary.passedTests += results.passed;
      this.testResults.summary.failedTests += results.failed;
      this.testResults.summary.skippedTests += results.skipped;

      console.log(`✅ ${browser} tests completed: ${results.passed}/${results.total} passed`);
    } catch (error) {
      console.error(`❌ ${browser} tests failed:`, error);
      this.testResults.errors.push(`${browser} tests failed: ${error.message}`);
    }
  }

  /**
   * Run Cross-Browser Tests
   */
  async runCrossBrowserTests() {
    try {
      const command = `npx playwright test tests/playwright --browser=all --headed=false --video=false --timeout=${this.testConfig.timeout}`;

      console.log(`Running cross-browser tests...`);
      execSync(command, {
        stdio: 'inherit',
        cwd: this.testConfig.projectRoot,
        timeout: this.testConfig.timeout + 60000,
      });

      console.log('✅ Cross-browser tests completed');
    } catch (error) {
      console.error('❌ Cross-browser tests failed:', error);
      this.testResults.errors.push(`Cross-browser tests failed: ${error.message}`);
    }
  }

  /**
   * Run Performance Tests
   */
  async runPerformanceTests() {
    try {
      const command = `npx playwright test tests/playwright --project=chromium --headed=false --video=false --timeout=${this.testConfig.timeout} --grep="Performance"`;

      console.log(`Running performance tests...`);
      execSync(command, {
        stdio: 'inherit',
        cwd: this.testConfig.projectRoot,
        timeout: this.testConfig.timeout + 60000,
      });

      console.log('✅ Performance tests completed');
    } catch (error) {
      console.error('❌ Performance tests failed:', error);
      this.testResults.errors.push(`Performance tests failed: ${error.message}`);
    }
  }

  /**
   * Parse Browser Test Results
   */
  async parseBrowserResults(browser) {
    try {
      const resultsPath = path.join(this.testConfig.resultsDir, `results-${browser}.json`);
      const data = await fs.readFile(resultsPath, 'utf-8');
      const results = JSON.parse(data);

      return {
        total: results.results.length,
        passed: results.results.filter((r) => r.status === 'passed').length,
        failed: results.results.filter((r) => r.status === 'failed').length,
        skipped: results.results.filter((r) => r.status === 'skipped').length,
        results: results.results,
      };
    } catch (error) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        results: [],
      };
    }
  }

  /**
   * Generate Comprehensive Reports
   */
  async generateReports() {
    try {
      // Generate HTML Report
      await this.generateHtmlReport();

      // Generate JSON Report
      await this.generateJsonReport();

      // Generate Summary Report
      await this.generateSummaryReport();

      // Generate Performance Report
      await this.generatePerformanceReport();

      console.log('✅ All reports generated');
    } catch (error) {
      console.error('❌ Failed to generate reports:', error);
      this.testResults.errors.push(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Generate HTML Report
   */
  async generateHtmlReport() {
    const htmlContent = `
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
        .browser-section { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .browser-section h2 { margin: 0 0 20px 0; color: #333; }
        .test-item { padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid; }
        .test-item.passed { border-left-color: #28a745; background: #f8fff8; }
        .test-item.failed { border-left-color: #dc3545; background: #fff8f8; }
        .test-item.skipped { border-left-color: #ffc107; background: #fffff8; }
        .recommendations { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 30px 0; }
        .recommendations h3 { margin: 0 0 15px 0; color: #1976d2; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .timeline { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .timeline h2 { margin: 0 0 20px 0; color: #333; }
        .timeline-item { padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #0066CC; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Admin Dashboard Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="value ${this.testResults.summary.failedTests === 0 ? 'passed' : 'failed'}">${this.testResults.summary.totalBrowsers}</div>
            <div class="label">Browsers Tested</div>
        </div>
        <div class="metric">
            <div class="value total">${this.testResults.summary.totalTests}</div>
            <div class="label">Total Tests</div>
        </div>
        <div class="metric">
            <div class="value passed">${this.testResults.summary.passedTests}</div>
            <div class="label">Passed</div>
        </div>
        <div class="metric">
            <div class="value failed">${this.testResults.summary.failedTests}</div>
            <div class="label">Failed</div>
        </div>
    </div>

    ${
      this.testResults.summary.failedTests > 0
        ? `
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            <li>Fix ${this.testResults.summary.failedTests} failing tests to improve overall quality</li>
            <li>Consider running tests with more browsers for better coverage</li>
            ${this.testResults.summary.executionTime > 300000 ? `<li>Test execution took ${Math.round(this.testResults.summary.executionTime / 1000)} seconds - optimize performance</li>` : ''}
            ${this.testResults.errors.length > 0 ? `<li>Address ${this.testResults.errors.length} configuration errors</li>` : ''}
        </ul>
    </div>
    `
        : ''
    }

    <div class="timeline">
        <h2>Execution Timeline</h2>
        <div class="timeline-item">
            <strong>Start:</strong> ${this.testResults.summary.startTime.toLocaleString()}
        </div>
        <div class="timeline-item">
            <strong>End:</strong> ${this.testResults.summary.endTime.toLocaleString()}
        </div>
        <div class="timeline-item">
            <strong>Total Duration:</strong> ${Math.round(this.testResults.summary.executionTime / 1000)} seconds
        </div>
    </div>

    ${Object.entries(this.testResults.browserResults)
      .map(
        ([browser, results]) => `
    <div class="browser-section">
        <h2>${browser.toUpperCase()} Results</h2>
        <div class="metric">
            <div class="value passed">${results.passed}</div>
            <div class="label">Passed</div>
        </div>
        <div class="metric">
            <div class="value failed">${results.failed}</div>
            <div class="label">Failed</div>
        </div>
        <div class="metric">
            <div class="value skipped">${results.skipped}</div>
            <div class="label">Skipped</div>
        </div>
        <div class="metric">
            <div class="value total">${results.total}</div>
            <div class="label">Total</div>
        </div>
    </div>
    `
      )
      .join('')}

</body>
</html>`;

    const reportPath = path.join(
      this.testConfig.resultsDir,
      `comprehensive-report-${this.testConfig.timestamp}.html`
    );
    await fs.writeFile(reportPath, htmlContent);
  }

  /**
   * Generate JSON Report
   */
  async generateJsonReport() {
    const report = {
      summary: this.testResults.summary,
      browserResults: this.testResults.browserResults,
      screenshots: this.testResults.screenshots,
      videos: this.testResults.videos,
      errors: this.testResults.errors,
      timestamp: this.testConfig.timestamp,
      projectPath: this.testConfig.projectRoot,
    };

    const reportPath = path.join(
      this.testConfig.resultsDir,
      `comprehensive-report-${this.testConfig.timestamp}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }

  /**
   * Generate Summary Report
   */
  async generateSummaryReport() {
    const summary = {
      executiveSummary: {
        totalBrowsers: this.testResults.summary.totalBrowsers,
        totalTests: this.testResults.summary.totalTests,
        passedTests: this.testResults.summary.passedTests,
        failedTests: this.testResults.summary.failedTests,
        successRate:
          this.testResults.summary.totalTests > 0
            ? (
                (this.testResults.summary.passedTests / this.testResults.summary.totalTests) *
                100
              ).toFixed(2) + '%'
            : '0%',
        executionTime: Math.round(this.testResults.summary.executionTime / 1000) + 's',
      },
      browserPerformance: Object.entries(this.testResults.browserResults).map(
        ([browser, results]) => ({
          browser,
          tests: results.total,
          passed: results.passed,
          failed: results.failed,
          duration: Math.round(results.duration / 1000) + 's',
        })
      ),
      recommendations: this.generateRecommendations(),
      nextSteps: this.generateNextSteps(),
    };

    const reportPath = path.join(
      this.testConfig.resultsDir,
      `summary-${this.testConfig.timestamp}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
  }

  /**
   * Generate Performance Report
   */
  async generatePerformanceReport() {
    const performance = {
      overall: {
        totalExecutionTime: this.testResults.summary.executionTime,
        averageTestTime:
          this.testResults.summary.totalTests > 0
            ? this.testResults.summary.executionTime / this.testResults.summary.totalTests
            : 0,
        browserComparison: Object.entries(this.testResults.browserResults).map(
          ([browser, results]) => ({
            browser,
            executionTime: results.duration,
            averageTestTime: results.total > 0 ? results.duration / results.total : 0,
          })
        ),
      },
      recommendations: [
        ...(this.testResults.summary.executionTime > 300000
          ? ['Optimize test execution speed']
          : []),
        ...(this.testResults.summary.failedTests > 0 ? ['Address failing tests'] : []),
        ['Consider parallel execution for faster results'],
      ],
    };

    const reportPath = path.join(
      this.testConfig.resultsDir,
      `performance-${this.testConfig.timestamp}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(performance, null, 2));
  }

  /**
   * Generate Recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.testResults.summary.failedTests > 0) {
      recommendations.push(`Fix ${this.testResults.summary.failedTests} failing tests`);
    }

    if (this.testResults.summary.successRate < 95) {
      recommendations.push('Improve test success rate');
    }

    if (this.testResults.summary.executionTime > 300000) {
      recommendations.push('Optimize test execution performance');
    }

    if (this.testResults.errors.length > 0) {
      recommendations.push('Address configuration errors');
    }

    return recommendations;
  }

  /**
   * Generate Next Steps
   */
  generateNextSteps() {
    const nextSteps = [];

    if (this.testResults.summary.failedTests > 0) {
      nextSteps.push('Review and fix failing tests');
    }

    if (this.testResults.summary.totalBrowsers < 3) {
      nextSteps.push('Add more browser coverage');
    }

    if (this.testResults.summary.executionTime > 300000) {
      nextSteps.push('Optimize test execution speed');
    }

    nextSteps.push('Schedule regular test runs');
    nextSteps.push('Integrate tests into CI/CD pipeline');

    return nextSteps;
  }

  /**
   * Analyze Results
   */
  async analyzeResults() {
    try {
      // Analyze browser performance
      const browserPerformance = Object.entries(this.testResults.browserResults).map(
        ([browser, results]) => ({
          browser,
          successRate:
            results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) + '%' : '0%',
          executionTime: Math.round(results.duration / 1000) + 's',
        })
      );

      // Analyze test categories
      const testCategories = {
        login: this.analyzeCategory('login'),
        dashboard: this.analyzeCategory('dashboard'),
        navigation: this.analyzeCategory('navigation'),
        performance: this.analyzeCategory('performance'),
      };

      // Save analysis
      const analysis = {
        browserPerformance,
        testCategories,
        recommendations: this.generateRecommendations(),
        insights: this.generateInsights(),
      };

      const analysisPath = path.join(
        this.testConfig.resultsDir,
        `analysis-${this.testConfig.timestamp}.json`
      );
      await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));

      console.log('✅ Results analysis completed');
    } catch (error) {
      console.error('❌ Failed to analyze results:', error);
    }
  }

  /**
   * Analyze Test Category
   */
  analyzeCategory(category) {
    const categoryTests = Object.entries(this.testResults.browserResults).flatMap(
      ([browser, results]) =>
        results.results.filter((test) => test.title.toLowerCase().includes(category))
    );

    return {
      total: categoryTests.length,
      passed: categoryTests.filter((test) => test.status === 'passed').length,
      failed: categoryTests.filter((test) => test.status === 'failed').length,
      successRate:
        categoryTests.length > 0
          ? (
              (categoryTests.filter((test) => test.status === 'passed').length /
                categoryTests.length) *
              100
            ).toFixed(2) + '%'
          : '0%',
    };
  }

  /**
   * Generate Insights
   */
  generateInsights() {
    const insights = [];

    if (this.testResults.summary.successRate >= 95) {
      insights.push('High test success rate - good reliability');
    }

    if (this.testResults.summary.executionTime > 300000) {
      insights.push('Test execution is slow - consider optimization');
    }

    if (Object.keys(this.testResults.browserResults).length < 3) {
      insights.push('Limited browser coverage - add more browsers');
    }

    return insights;
  }

  /**
   * Display Summary
   */
  displaySummary() {
    console.log('\n📊 Test Execution Summary');
    console.log('='.repeat(50));
    console.log(`📅 Start Time: ${this.testResults.summary.startTime.toLocaleString()}`);
    console.log(`📅 End Time: ${this.testResults.summary.endTime.toLocaleString()}`);
    console.log(
      `⏱️  Total Duration: ${Math.round(this.testResults.summary.executionTime / 1000)}s`
    );
    console.log(`🌐 Browsers Tested: ${this.testResults.summary.totalBrowsers}`);
    console.log(`📋 Total Tests: ${this.testResults.summary.totalTests}`);
    console.log(`✅ Passed: ${this.testResults.summary.passedTests}`);
    console.log(`❌ Failed: ${this.testResults.summary.failedTests}`);
    console.log(`⏸️  Skipped: ${this.testResults.summary.skippedTests}`);
    console.log(
      `📈 Success Rate: ${this.testResults.summary.totalTests > 0 ? ((this.testResults.summary.passedTests / this.testResults.summary.totalTests) * 100).toFixed(2) + '%' : '0%'}`
    );

    if (this.testResults.summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      Object.entries(this.testResults.browserResults).forEach(([browser, results]) => {
        results.results
          .filter((test) => test.status === 'failed')
          .forEach((test) => {
            console.log(`   ${browser}: ${test.title}`);
          });
      });
    }

    if (this.testResults.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.testResults.recommendations.forEach((rec) => {
        console.log(`   • ${rec}`);
      });
    }

    console.log('\n📁 Results saved to:', this.testConfig.resultsDir);
  }

  /**
   * Save Results
   */
  async saveResults() {
    const resultsPath = path.join(
      this.testConfig.resultsDir,
      `final-results-${this.testConfig.timestamp}.json`
    );
    await fs.writeFile(resultsPath, JSON.stringify(this.testResults, null, 2));
  }
}

// Execute the test runner
const executor = new AdminTestExecutor();
executor.execute().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
