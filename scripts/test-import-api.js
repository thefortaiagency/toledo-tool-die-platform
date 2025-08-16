const fs = require('fs');

// Test data for API import
const testHitTrackerData = {
  type: 'hit-tracker',
  source: 'Test Import',
  data: [
    {
      machine: '600 Ton',
      date: '2025-08-16',
      shift: 1,
      hits: 45000,
      efficiency: 92.5,
      downtime_minutes: 15,
      operator: 'John Smith',
      part_number: 'PART-001',
      comments: 'Running smoothly'
    },
    {
      machine: '600 Ton',
      date: '2025-08-16',
      shift: 2,
      hits: 48000,
      efficiency: 95.2,
      downtime_minutes: 10,
      operator: 'Jane Doe',
      part_number: 'PART-001',
      comments: 'Minor adjustment needed'
    },
    {
      machine: '1500-1 Ton',
      date: '2025-08-16',
      shift: 1,
      hits: 32000,
      efficiency: 88.0,
      downtime_minutes: 25,
      operator: 'Bob Johnson',
      part_number: 'PART-002'
    }
  ]
};

const testOEEData = {
  type: 'oee-metrics',
  source: 'OEE Calculator',
  data: [
    {
      machine: '600 Ton',
      date: '2025-08-16',
      availability: 92.5,
      performance: 88.3,
      quality: 97.2
    },
    {
      machine: '1500-1 Ton',
      date: '2025-08-16',
      availability: 85.0,
      performance: 82.0,
      quality: 96.5
    },
    {
      machine: '1400 Ton',
      date: '2025-08-16',
      availability: 88.5,
      performance: 91.2,
      quality: 98.1
    }
  ]
};

// Test invalid data for validation
const testInvalidData = {
  type: 'hit-tracker',
  source: 'Invalid Test',
  data: [
    {
      // Missing required fields
      machine: '600 Ton',
      shift: 1
    },
    {
      // Invalid shift number
      machine: '1500-1 Ton',
      date: '2025-08-16',
      shift: 5,
      hits: 1000
    },
    {
      // Invalid efficiency
      machine: '1400 Ton',
      date: '2025-08-16',
      shift: 2,
      hits: 2000,
      efficiency: 250
    }
  ]
};

async function testAPI(endpoint, data, testName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testName}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Test passed');
    } else {
      console.log('⚠️ Test completed with errors');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

async function testGET(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `http://localhost:3000${endpoint}${queryString ? '?' + queryString : ''}`;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`GET Request: ${url}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests\n');
  
  // Test 1: Import valid hit tracker data
  await testAPI(
    '/api/reports/hit-tracker-import',
    testHitTrackerData,
    'Valid Hit Tracker Import'
  );
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Import OEE metrics
  await testAPI(
    '/api/reports/hit-tracker-import',
    testOEEData,
    'OEE Metrics Import'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Import invalid data (should show validation errors)
  await testAPI(
    '/api/reports/hit-tracker-import',
    testInvalidData,
    'Invalid Data Import (Validation Test)'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: GET recent imports
  await testGET('/api/reports/hit-tracker-import', {
    limit: 10,
    machine: '600 Ton'
  });
  
  console.log('\n✅ All tests completed!');
  console.log('\n📋 API Documentation:');
  console.log('='.repeat(60));
  console.log(`
POST /api/reports/hit-tracker-import
  Import Types:
    - 'hit-tracker': Production hit tracking data
    - 'oee-metrics': OEE calculation results
    - 'batch-update': Update existing records

  Request Format:
    {
      type: 'hit-tracker',
      source: 'Excel Import',
      data: [
        {
          machine: string (required),
          date: string YYYY-MM-DD (required),
          shift: 1-3 (required),
          hits: number (required),
          efficiency: 0-200 (optional),
          downtime_minutes: number (optional),
          operator: string (optional),
          part_number: string (optional),
          comments: string (optional)
        }
      ]
    }

GET /api/reports/hit-tracker-import
  Query Parameters:
    - limit: number (default: 100)
    - offset: number (default: 0)
    - machine: string (filter by machine)
    - startDate: YYYY-MM-DD
    - endDate: YYYY-MM-DD

  Response includes:
    - data: array of records
    - stats: summary statistics
    - pagination: paging information
  `);
}

// Run the tests
runTests().catch(console.error);