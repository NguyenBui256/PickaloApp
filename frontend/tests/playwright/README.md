# Admin Dashboard Playwright Tests

Comprehensive end-to-end test suite for the Admin Dashboard functionality using Playwright MCP. This test suite covers login flow, authentication, navigation, and dashboard validation with detailed reporting capabilities.

## 🚀 Features

- **Comprehensive Coverage**: Tests admin login, authentication, navigation between admin screens, and dashboard content validation
- **Multiple Browsers**: Tests across Chrome, Firefox, and Safari
- **Screenshot Capture**: Automatic screenshots on failure and during key test steps
- **Detailed Reporting**: HTML, JSON, and JUnit reports with performance metrics
- **Mock Integration**: Realistic API responses and mock data
- **Performance Monitoring**: Track page load times and test execution performance
- **Cross-Platform**: Responsive testing across different viewport sizes

## 📁 Test Structure

```
frontend/tests/playwright/
├── admin-dashboard-login.spec.ts    # Main test suite
├── playwright.config.ts            # Playwright configuration
├── run-admin-tests.ts              # Test runner script
├── global-setup.ts                 # Global setup
├── global-teardown.ts              # Global cleanup
├── hooks/
│   ├── setup.ts                    # Test setup hook
│   └── teardown.ts                 # Test cleanup hook
└── README.md                       # This file
```

## 🧪 Test Cases

### TC001: Access Admin Login Page
- Verify login page UI elements
- Test accessibility attributes
- Take screenshot of login page

### TC002: Admin Login with Valid Credentials
- Successful authentication
- Dashboard navigation
- User session verification

### TC003: Admin Login with Invalid Credentials
- Authentication failure handling
- Error message display
- Session state validation

### TC004: Admin Login with Non-Admin User
- Access denied testing
- Role-based access control
- Error handling

### TC005: Admin Dashboard Content Validation
- Dashboard element verification
- Tab content validation
- Metrics display testing

### TC006: Admin Dashboard Navigation
- Tab switching functionality
- Navigation state preservation
- Screen content validation

### TC007: Admin Login Form Validation
- Empty fields validation
- Required field checking
- Error message display

### TC008: Admin Login Form Validation
- Invalid phone format testing
- Input validation logic
- Error message consistency

### TC009: Admin Login Security
- Rate limiting testing
- Security validation
- Error handling for multiple attempts

### TC010: Admin Dashboard Responsiveness
- Multiple viewport sizes
- Responsive layout testing
- Cross-browser compatibility

### TC011: Admin Login Session Persistence
- Session state management
- Navigation after login
- Authentication persistence

### TC012: Admin Login Error Handling
- Network failure handling
- Error state management
- User feedback

### TC013: Admin Dashboard Accessibility
- Keyboard navigation testing
- Focus management
- Accessibility compliance

### TC014: Admin Login Performance
- Page load time monitoring
- Performance thresholds
- Speed optimization

## 🛠️ Installation

### Prerequisites
- Node.js >= 18
- npm >= 9
- Playwright browsers

### Setup Commands

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Install Playwright Browsers**
```bash
npm run playwright:install
```

3. **Run Setup**
```bash
npm run test:setup
```

## 🚀 Running Tests

### Basic Usage

```bash
# Run all admin tests
npm run test:admin

# Run with debug mode
npm run test:admin:debug

# Run with headed mode (visible browser)
npm run test:admin:headed

# Run in headless mode
npm run test:admin:headless

# Run with specific browser
npm run test:admin -- --browser firefox
npm run test:admin -- --browser webkit
```

### Advanced Usage

```bash
# Run specific test pattern
npm run test:admin -- --grep "login"

# Set custom timeout
npm run test:admin -- --timeout 60

# Set number of retries
npm run test:admin -- --retries 3

# Enable video recording
npm run test:admin -- --video

# Enable screenshots on failure
npm run test:admin -- --screenshot
```

### Direct Playwright Commands

```bash
# Run with Playwright directly
npx playwright test tests/playwright --project=chromium

# Run specific test file
npx playwright test tests/playwright/admin-dashboard-login.spec.ts

# Run with different reporters
npx playwright test tests/playwright --reporter=list,html,json
```

## 🔧 Configuration

### Environment Variables

```bash
# Browser settings
BROWSER=chromium                # chromium, firefox, webkit
HEADLESS=true                  # true, false
SLOW_MO=100                    # milliseconds
VIDEO=true                     # record videos

# API settings
API_BASE_URL=http://localhost:8000
ADMIN_PHONE=+840000000001
ADMIN_PASSWORD=Admin123!

# Test settings
DEBUG=true                     # enable debug logging
RETRIES=2                      # number of retries
TIMEOUT=30                     # test timeout in seconds
```

### Playwright Configuration

The `playwright.config.ts` file contains:
- Test directory configuration
- Global timeout settings
- Browser project setup
- Reporter configuration
- Mock and interceptor setup

## 📊 Test Results

### Output Directories

- `test-results/` - Main results directory
- `test-results/screenshots/` - Screenshot captures
- `test-results/videos/` - Video recordings
- `test-results/reports/` - HTML and JSON reports
- `test-results/logs/` - Test execution logs

### Report Types

1. **HTML Report** (`admin-dashboard-report.html`)
   - Visual report with charts and metrics
   - Detailed test results
   - Performance analysis
   - Recommendations

2. **JSON Report** (`admin-dashboard-report.json`)
   - Structured test data
   - Machine-readable format
   - Integration ready

3. **JUnit Report** (`admin-dashboard-junit.xml`)
   - CI/CD integration ready
   - Standard test format
   - Jenkins, GitHub Actions compatible

4. **Performance Report** (`admin-dashboard-performance.json`)
   - Performance metrics
   - Speed analysis
   - Optimization recommendations

## 🔍 Test Scenarios

### Login Flow Testing

- **Positive Testing**: Valid credentials, successful login
- **Negative Testing**: Invalid credentials, access denied
- **Edge Cases**: Empty fields, invalid formats
- **Security Testing**: Rate limiting, multiple attempts

### Dashboard Validation

- **Content Testing**: Dashboard elements, metrics display
- **Navigation Testing**: Tab switching, screen transitions
- **Performance Testing**: Page load times, responsiveness
- **Accessibility Testing**: Keyboard navigation, focus management

### Error Handling

- **Network Errors**: Offline scenarios, API failures
- **Validation Errors**: Invalid inputs, format checking
- **Permission Errors**: Access denied, role validation
- **System Errors**: Timeout, server errors

## 🚨 Mock Data

The test suite uses realistic mock data:

- **Admin User**: `+840000000001` / `Admin123!`
- **Test Users**: Multiple user accounts for testing
- **Test Venues**: Sample venue data
- **API Responses**: Realistic dashboard metrics

## 🔧 Customization

### Adding New Tests

1. Create new test file in `tests/playwright/`
2. Follow existing test patterns
3. Use helper functions from `hooks/setup.ts`
4. Update configuration if needed

### Modifying Test Data

Update the mock data in:
- `global-setup.ts` - Test data setup
- `hooks/setup.ts` - Mock API responses
- Test files - Test-specific data

### Custom Configuration

Modify configuration files:
- `playwright.config.ts` - Test settings
- `package.json` - Test scripts
- Environment variables for different environments

## 🐛 Debugging

### Common Issues

1. **Browser Not Found**: Run `npm run playwright:install`
2. **Network Issues**: Check API server is running
3. **Element Not Found**: Verify selectors and page load
4. **Timing Issues**: Increase timeout or add waits

### Debugging Commands

```bash
# Run with debugging
npm run test:admin:debug

# Run with headed mode (visible)
npm run test:admin:headed

# Run slow motion
npm run test:admin -- --slow-mo 100

# Run specific test in debug mode
npx playwright test tests/playwright/admin-dashboard-login.spec.ts --debug
```

## 📈 Best Practices

### Writing Tests

- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Use realistic mock data
- Add appropriate assertions
- Include error scenarios

### Performance

- Use page.waitForTimeout() sparingly
- Implement proper waiting strategies
- Mock external APIs for faster execution
- Use headless mode for CI/CD

### Maintenance

- Update mock data regularly
- Review test results after each run
- Update screenshots when UI changes
- Add new test cases for new features

## 🚀 Integration

### CI/CD Integration

```yaml
# GitHub Actions Example
name: Admin Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run playwright:install
      - run: npm run test:admin:headless
```

### Monitoring

- Set up alerts for test failures
- Monitor test execution times
- Track report generation
- Review performance metrics

## 🔗 Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [React Native Testing](https://reactnative.dev/docs/testing)
- [Jest Testing Framework](https://jestjs.io/)
- [TypeScript Testing](https://www.typescriptlang.org/docs/handbook/testing.html)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add new tests
4. Update documentation
5. Run the full test suite
6. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review existing test cases
- Consult the Playwright documentation
- Contact the development team