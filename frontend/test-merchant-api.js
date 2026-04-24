/**
 * Test script to check merchant venue API endpoints
 * Run this in the browser console or Node.js to debug API issues
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Test merchant venues endpoint
async function testMerchantVenues() {
  try {
    console.log('Testing GET /merchant/venues...');

    // You'll need to add your actual JWT token here
    const token = 'YOUR_JWT_TOKEN_HERE';

    const response = await fetch(`${API_BASE_URL}/merchant/venues`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    console.log('Number of venues:', data.length);

    return data;
  } catch (error) {
    console.error('Error testing merchant venues:', error);
    throw error;
  }
}

// Test all merchant endpoints
async function testAllMerchantEndpoints() {
  console.log('=== Testing Merchant Endpoints ===\n');

  // Test venues list
  await testMerchantVenues();

  console.log('\n=== End of tests ===');
}

// Run tests
testAllMerchantEndpoints();