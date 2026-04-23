#!/usr/bin/env node

/**
 * Simple Admin Dashboard Test
 * Uses HTTP requests to test the login flow without Playwright browser automation
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class SimpleAdminTest {
  constructor() {
    this.testConfig = {
      baseUrl: 'http://localhost:3000',
      apiBaseUrl: 'http://localhost:8000/api/v1',
      adminCredentials: {
        phone: '+84123456789',
        password: 'Admin@123',
      },
    };
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      screenshots: [],
    };
  }

  async log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async testLoginFlow() {
    await this.log('Starting admin dashboard login test...');

    try {
      // Test 1: Check if login page is accessible
      await this.log('Test 1: Checking login page accessibility...');
      const loginPageResponse = await axios.get(this.testConfig.baseUrl, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Accept all status codes less than 500
        },
      });

      if (loginPageResponse.status === 200) {
        await this.log('✅ Login page is accessible');
        this.testResults.passed++;
      } else {
        await this.log(`❌ Login page returned status: ${loginPageResponse.status}`);
        this.testResults.failed++;
      }

      // Test 2: Check admin login API endpoint
      await this.log('Test 2: Testing admin login API...');
      try {
        const loginResponse = await axios.post(
          `${this.testConfig.apiBaseUrl}/auth/login`,
          this.testConfig.adminCredentials,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        if (loginResponse.status === 200) {
          await this.log('✅ Admin login API successful');
          this.testResults.passed++;

          // Check if response contains required fields
          const { access_token, user } = loginResponse.data;
          if (access_token && user && user.role === 'ADMIN') {
            await this.log('✅ Login response contains JWT token and admin user data');
            this.testResults.passed++;
          } else {
            await this.log('❌ Login response missing required fields');
            this.testResults.failed++;
          }
        } else {
          await this.log(`❌ Admin login API returned status: ${loginResponse.status}`);
          this.testResults.failed++;
        }
      } catch (loginError) {
        await this.log(`❌ Admin login API failed: ${loginError.message}`);
        this.testResults.failed++;
        this.testResults.errors.push(loginError.message);
      }

      // Test 3: Check if dashboard metrics endpoint works with auth
      await this.log('Test 3: Testing dashboard metrics API...');
      try {
        // First get token
        const loginResponse = await axios.post(
          `${this.testConfig.apiBaseUrl}/auth/login`,
          this.testConfig.adminCredentials,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        const { access_token } = loginResponse.data;

        // Test some available endpoints with auth
        const endpointsToTest = [
          { path: '/', description: 'API Root' },
          { path: '/users', description: 'Users List' },
          { path: '/venues', description: 'Venues List' },
        ];

        for (const endpoint of endpointsToTest) {
          try {
            const response = await axios.get(`${this.testConfig.apiBaseUrl}${endpoint.path}`, {
              headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            });

            if (response.status === 200) {
              await this.log(`✅ ${endpoint.description} API successful`);
              this.testResults.passed++;
            } else {
              await this.log(`❌ ${endpoint.description} API returned status: ${response.status}`);
              this.testResults.failed++;
            }
          } catch (endpointError) {
            await this.log(`❌ ${endpoint.description} API failed: ${endpointError.message}`);
            this.testResults.failed++;
            this.testResults.errors.push(`${endpoint.description}: ${endpointError.message}`);
          }
        }
      } catch (metricsError) {
        await this.log(`❌ Dashboard metrics API setup failed: ${metricsError.message}`);
        this.testResults.failed++;
        this.testResults.errors.push(metricsError.message);
      }

      // Test 4: Check if application is running
      await this.log('Test 4: Checking application status...');
      try {
        const appResponse = await axios.get(this.testConfig.baseUrl, {
          timeout: 5000,
        });

        if (appResponse.status === 200) {
          await this.log('✅ Application is running');
          this.testResults.passed++;
        } else {
          await this.log(`❌ Application returned status: ${appResponse.status}`);
          this.testResults.failed++;
        }
      } catch (appError) {
        await this.log(`❌ Application is not accessible: ${appError.message}`);
        this.testResults.failed++;
        this.testResults.errors.push(appError.message);
      }
    } catch (error) {
      await this.log(`❌ Test execution failed: ${error.message}`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testConfig: this.testConfig,
      results: this.testResults,
      summary: {
        totalTests: this.testResults.passed + this.testResults.failed,
        passRate:
          (
            (this.testResults.passed / (this.testResults.passed + this.testResults.failed)) *
            100
          ).toFixed(2) + '%',
        status: this.testResults.failed === 0 ? 'PASS' : 'FAIL',
      },
    };

    // Save report
    const reportPath = path.join(__dirname, 'test-results', `simple-admin-test-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('ADMIN DASHBOARD TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`Status: ${report.summary.status}`);

    if (this.testResults.errors.length > 0) {
      console.log('\nErrors:');
      this.testResults.errors.forEach((error) => {
        console.log(`- ${error}`);
      });
    }

    console.log(`\nDetailed report saved to: ${reportPath}`);
    console.log('='.repeat(50));

    return report;
  }

  async execute() {
    await this.log('Starting simple admin dashboard test...');
    await this.testLoginFlow();
    await this.generateReport();
  }
}

// Execute the test
const test = new SimpleAdminTest();
test.execute().catch((error) => {
  console.error('Test execution failed:', error.message);
  process.exit(1);
});
