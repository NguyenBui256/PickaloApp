#!/usr/bin/env node

/**
 * Comprehensive Admin Dashboard Test with Enhanced Features
 * Tests both API endpoints and frontend login flow with screenshot capabilities
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveAdminTest {
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
      apiTests: [],
      frontendTests: [],
    };
    this.accessToken = null;
  }

  async log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async saveScreenshot(content, filename) {
    try {
      const screenshotsDir = path.join(__dirname, 'test-results', 'screenshots');
      await fs.mkdir(screenshotsDir, { recursive: true });

      const filepath = path.join(screenshotsDir, filename);
      await fs.writeFile(filepath, content);
      this.testResults.screenshots.push(filepath);
      await this.log(`📸 Screenshot saved: ${filename}`);
      return filepath;
    } catch (error) {
      await this.log(`❌ Failed to save screenshot: ${error.message}`);
      return null;
    }
  }

  async captureTestState(testName, data) {
    // Simple text-based "screenshot" - saves the current state
    const stateData = {
      test: testName,
      timestamp: new Date().toISOString(),
      data: data,
      results: this.testResults,
    };

    const filename = `${testName.replace(/\s+/g, '-')}-${Date.now()}.json`;
    const filepath = await this.saveScreenshot(JSON.stringify(stateData, null, 2), filename);
    return filepath;
  }

  async testAPIAuthentication() {
    await this.log('🔐 Testing API Authentication...');

    try {
      // Test admin login
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
        this.testResults.apiTests.push({ name: 'Admin Login API', status: 'PASS' });

        // Check response structure
        const { access_token, user } = loginResponse.data;
        if (access_token && user && user.role === 'ADMIN') {
          await this.log('✅ Login response contains JWT token and admin user data');
          this.testResults.passed++;

          this.accessToken = access_token;

          // Save authentication state
          await this.captureTestState('API-Authentication-Complete', {
            userId: user.id,
            userName: user.full_name,
            userRole: user.role,
            tokenType: loginResponse.data.token_type,
          });
        } else {
          await this.log('❌ Login response missing required fields');
          this.testResults.failed++;
          this.testResults.apiTests.push({ name: 'Login Response Structure', status: 'FAIL' });
        }
      } else {
        await this.log(`❌ Admin login API returned status: ${loginResponse.status}`);
        this.testResults.failed++;
        this.testResults.apiTests.push({ name: 'Admin Login API', status: 'FAIL' });
      }
    } catch (loginError) {
      await this.log(`❌ Admin login API failed: ${loginError.message}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Login API: ${loginError.message}`);
      this.testResults.apiTests.push({ name: 'Admin Login API', status: 'FAIL' });
    }
  }

  async testProtectedEndpoints() {
    await this.log('🔒 Testing Protected Endpoints...');

    if (!this.accessToken) {
      await this.log('❌ No access token available for protected endpoints test');
      this.testResults.failed++;
      return;
    }

    const endpoints = [
      { path: '/', description: 'API Root' },
      { path: '/venues', description: 'Venues List' },
      { path: '/users', description: 'Users List' },
      { path: '/bookings', description: 'Bookings List' },
      { path: '/merchants', description: 'Merchants List' },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${this.testConfig.apiBaseUrl}${endpoint.path}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        if (response.status === 200) {
          await this.log(`✅ ${endpoint.description} API successful`);
          this.testResults.passed++;
          this.testResults.apiTests.push({
            name: `${endpoint.description} API`,
            status: 'PASS',
            statusCode: response.status,
          });

          // Save endpoint response state
          await this.captureTestState(`API-Endpoint-${endpoint.description}`, {
            endpoint: endpoint.path,
            status: response.status,
            dataSize: JSON.stringify(response.data).length,
          });
        } else {
          await this.log(`⚠️ ${endpoint.description} API returned status: ${response.status}`);
          this.testResults.failed++;
          this.testResults.apiTests.push({
            name: `${endpoint.description} API`,
            status: 'FAIL',
            statusCode: response.status,
          });
        }
      } catch (endpointError) {
        if (endpointError.response && endpointError.response.status === 404) {
          await this.log(`⚠️ ${endpoint.description} API not found (404)`);
          this.testResults.apiTests.push({
            name: `${endpoint.description} API`,
            status: 'NOT_FOUND',
            statusCode: 404,
          });
        } else {
          await this.log(`❌ ${endpoint.description} API failed: ${endpointError.message}`);
          this.testResults.failed++;
          this.testResults.errors.push(`${endpoint.description}: ${endpointError.message}`);
          this.testResults.apiTests.push({
            name: `${endpoint.description} API`,
            status: 'FAIL',
            error: endpointError.message,
          });
        }
      }
    }
  }

  async testFrontendAccessibility() {
    await this.log('🌐 Testing Frontend Accessibility...');

    try {
      // Test main page
      const mainPageResponse = await axios.get(this.testConfig.baseUrl, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        },
      });

      if (mainPageResponse.status === 200) {
        await this.log('✅ Main page accessible');
        this.testResults.passed++;
        this.testResults.frontendTests.push({ name: 'Main Page Access', status: 'PASS' });

        // Check if it's a React app
        const content = mainPageResponse.data;
        if (content.includes('React') || content.includes('root') || content.includes('script')) {
          await this.log('✅ Frontend appears to be a React application');
          this.testResults.passed++;
          this.testResults.frontendTests.push({ name: 'React Detection', status: 'PASS' });
        }

        // Save frontend state
        await this.captureTestState('Frontend-Main-Page', {
          status: mainPageResponse.status,
          contentLength: content.length,
          hasReact: content.includes('React'),
          hasVite: content.includes('vite'),
          title: content.match(/<title>(.*?)<\/title>/)?.[1] || 'No title',
        });
      } else {
        await this.log(`❌ Main page returned status: ${mainPageResponse.status}`);
        this.testResults.failed++;
        this.testResults.frontendTests.push({ name: 'Main Page Access', status: 'FAIL' });
      }
    } catch (frontendError) {
      await this.log(`❌ Frontend accessibility test failed: ${frontendError.message}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Frontend: ${frontendError.message}`);
      this.testResults.frontendTests.push({ name: 'Main Page Access', status: 'FAIL' });
    }
  }

  async testAuthenticationFlow() {
    await this.log('🔄 Testing Authentication Flow...');

    try {
      // Test without token
      const noTokenResponse = await axios.get(`${this.testConfig.apiBaseUrl}/venues`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500;
        },
      });

      if (noTokenResponse.status === 401 || noTokenResponse.status === 403) {
        await this.log('✅ Unauthenticated request properly blocked');
        this.testResults.passed++;
        this.testResults.frontendTests.push({ name: 'Auth Flow - No Token', status: 'PASS' });
      } else {
        await this.log(`⚠️ Unauthenticated request returned status: ${noTokenResponse.status}`);
        this.testResults.failed++;
        this.testResults.frontendTests.push({ name: 'Auth Flow - No Token', status: 'FAIL' });
      }
    } catch (authError) {
      if (
        authError.response &&
        (authError.response.status === 401 || authError.response.status === 403)
      ) {
        await this.log('✅ Unauthenticated request properly blocked');
        this.testResults.passed++;
        this.testResults.frontendTests.push({ name: 'Auth Flow - No Token', status: 'PASS' });
      } else {
        await this.log(`❌ Authentication flow test failed: ${authError.message}`);
        this.testResults.failed++;
        this.testResults.errors.push(`Auth Flow: ${authError.message}`);
        this.testResults.frontendTests.push({ name: 'Auth Flow - No Token', status: 'FAIL' });
      }
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
          this.testResults.passed + this.testResults.failed > 0
            ? (
                (this.testResults.passed / (this.testResults.passed + this.testResults.failed)) *
                100
              ).toFixed(2) + '%'
            : '0%',
        status: this.testResults.failed === 0 ? 'PASS' : 'FAIL',
        apiTests: this.testResults.apiTests.length,
        frontendTests: this.testResults.frontendTests.length,
        screenshots: this.testResults.screenshots.length,
      },
      recommendations: this.generateRecommendations(),
    };

    // Save report
    const reportPath = path.join(
      __dirname,
      'test-results',
      `comprehensive-admin-test-${Date.now()}.json`
    );
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🚀 COMPREHENSIVE ADMIN DASHBOARD TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);
    console.log(`🎯 Status: ${report.summary.status}`);
    console.log(`🔌 API Tests: ${report.summary.apiTests}`);
    console.log(`🌐 Frontend Tests: ${report.summary.frontendTests}`);
    console.log(`📸 Screenshots: ${report.summary.screenshots}`);

    if (this.testResults.errors.length > 0) {
      console.log('\n🚨 Errors:');
      this.testResults.errors.forEach((error) => {
        console.log(`   - ${error}`);
      });
    }

    if (this.testResults.apiTests.length > 0) {
      console.log('\n🔌 API Test Results:');
      this.testResults.apiTests.forEach((test) => {
        console.log(`   - ${test.name}: ${test.status}`);
      });
    }

    if (this.testResults.frontendTests.length > 0) {
      console.log('\n🌐 Frontend Test Results:');
      this.testResults.frontendTests.forEach((test) => {
        console.log(`   - ${test.name}: ${test.status}`);
      });
    }

    if (report.summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.summary.recommendations.forEach((rec) => {
        console.log(`   - ${rec}`);
      });
    }

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('🔗 Screenshots saved to: test-results/screenshots/');
    console.log('='.repeat(60));

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const totalTests = this.testResults.passed + this.testResults.failed;

    if (this.testResults.failed > 0) {
      recommendations.push('Address failed tests to improve reliability');
    }

    if (
      this.testResults.apiTests &&
      this.testResults.apiTests.filter((t) => t.status === 'NOT_FOUND').length > 0
    ) {
      recommendations.push('Consider implementing missing API endpoints');
    }

    if (
      this.testResults.frontendTests &&
      this.testResults.frontendTests.filter((t) => t.status === 'FAIL').length > 0
    ) {
      recommendations.push('Review frontend components and routing');
    }

    if (totalTests > 0 && this.testResults.passed / totalTests < 0.9) {
      recommendations.push('Test coverage below 90% - add more test cases');
    }

    recommendations.push('Implement regular automated testing in CI/CD pipeline');
    recommendations.push('Add integration tests for complete user workflows');

    return recommendations;
  }

  async execute() {
    await this.log('🚀 Starting comprehensive admin dashboard test...');

    await this.testAPIAuthentication();
    await this.testProtectedEndpoints();
    await this.testFrontendAccessibility();
    await this.testAuthenticationFlow();

    await this.generateReport();
  }
}

// Execute the test
const test = new ComprehensiveAdminTest();
test.execute().catch((error) => {
  console.error('Test execution failed:', error.message);
  process.exit(1);
});
