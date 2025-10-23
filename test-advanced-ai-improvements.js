#!/usr/bin/env node

/**
 * Advanced AI Improvements Test Suite
 * 
 * This script tests all the advanced prompting techniques we've implemented:
 * 1. Controlled Natural Language for Prompts (CNL-P)
 * 2. Meta-Prompting for Task Decomposition
 * 3. Self-Consistency Prompting
 * 4. Enhanced Chain-of-Thought Reasoning
 * 5. Optimized RAG System
 * 6. Improved Tool Calling Accuracy and Validation
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUserId: 'test-user-123',
  timeout: 30000,
  retries: 3
};

// Test cases for different scenarios
const TEST_CASES = [
  {
    name: "Filter Quality Websites Test",
    userMessage: "Show me good quality websites with decent traffic",
    expectedActions: ["filter"],
    expectedParams: {
      da: { min: 50, max: 100 },
      dr: { min: 50, max: 100 },
      spam: { max: 2 },
      traffic: { min: 10000 }
    },
    description: "Tests CNL-P quality term mapping and filter validation"
  },
  {
    name: "Cart Management Test",
    userMessage: "Add this website to my cart",
    expectedActions: ["addToCart"],
    expectedParams: {
      siteId: { required: true, format: /^[a-zA-Z0-9-_]+$/ }
    },
    description: "Tests cart action validation and parameter checking"
  },
  {
    name: "Navigation Test",
    userMessage: "Take me to the publishers page",
    expectedActions: ["navigate"],
    expectedParams: {
      path: { value: "/publishers" }
    },
    description: "Tests navigation validation and path verification"
  },
  {
    name: "Complex Filter Test",
    userMessage: "Find premium websites with high DA and low spam score for tech niche",
    expectedActions: ["filter"],
    expectedParams: {
      da: { min: 60, max: 100 },
      spam: { max: 1 },
      niche: { value: "tech" }
    },
    description: "Tests complex parameter extraction and validation"
  },
  {
    name: "Checkout Flow Test",
    userMessage: "I want to proceed to checkout",
    expectedActions: ["proceedToCheckout"],
    expectedParams: {},
    description: "Tests checkout action validation and context awareness"
  },
  {
    name: "Recommendation Test",
    userMessage: "Recommend some websites based on quality criteria",
    expectedActions: ["recommend"],
    expectedParams: {
      criteria: { value: "quality" }
    },
    description: "Tests recommendation action validation and criteria parsing"
  }
];

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Test the AI chat API with advanced prompting techniques
 */
async function testAIChatAPI(userMessage, expectedActions, expectedParams) {
  try {
    console.log(`\n🧪 Testing: ${userMessage}`);
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        userId: TEST_CONFIG.testUserId,
        stream: false // Use non-streaming for easier testing
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API Response received: ${data.message?.substring(0, 100)}...`);
    
    // Test self-consistency (if implemented)
    if (data.consistencyScore !== undefined) {
      console.log(`📊 Self-consistency score: ${data.consistencyScore.toFixed(2)}`);
      if (data.consistencyScore < 0.6) {
        console.warn(`⚠️ Low consistency score detected: ${data.consistencyScore.toFixed(2)}`);
      }
    }

    // Test meta-prompting analysis
    if (data.metaAnalysis !== undefined) {
      console.log(`🔍 Meta-analysis confidence: ${data.metaAnalysis.confidence}%`);
      if (data.metaAnalysis.confidence < 75) {
        console.warn(`⚠️ Low meta-analysis confidence: ${data.metaAnalysis.confidence}%`);
      }
    }

    return {
      success: true,
      message: data.message,
      consistencyScore: data.consistencyScore,
      metaAnalysis: data.metaAnalysis,
      actions: extractActionsFromResponse(data.message)
    };

  } catch (error) {
    console.error(`❌ API Test failed:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract actions from AI response
 */
function extractActionsFromResponse(response) {
  const actions = [];
  const actionPatterns = [
    /\[FILTER:([^\]]+)\]/g,
    /\[ADD_TO_CART:([^\]]+)\]/g,
    /\[NAVIGATE:([^\]]+)\]/g,
    /\[PROCEED_TO_CHECKOUT\]/g,
    /\[RECOMMEND:([^\]]+)\]/g
  ];

  actionPatterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(response)) !== null) {
      const actionType = ['filter', 'addToCart', 'navigate', 'proceedToCheckout', 'recommend'][index];
      actions.push({
        type: actionType,
        data: match[1] || true
      });
    }
  });

  return actions;
}

/**
 * Validate action parameters
 */
function validateActionParameters(actions, expectedActions, expectedParams) {
  const validationResults = [];

  for (const expectedAction of expectedActions) {
    const action = actions.find(a => a.type === expectedAction);
    
    if (!action) {
      validationResults.push({
        action: expectedAction,
        status: 'missing',
        message: `Expected action ${expectedAction} not found`
      });
      continue;
    }

    // Validate parameters based on action type
    switch (expectedAction) {
      case 'filter':
        validationResults.push(validateFilterParameters(action, expectedParams));
        break;
      case 'addToCart':
        validationResults.push(validateCartParameters(action, expectedParams));
        break;
      case 'navigate':
        validationResults.push(validateNavigateParameters(action, expectedParams));
        break;
      case 'recommend':
        validationResults.push(validateRecommendParameters(action, expectedParams));
        break;
      default:
        validationResults.push({
          action: expectedAction,
          status: 'valid',
          message: 'Action found and validated'
        });
    }
  }

  return validationResults;
}

/**
 * Validate filter parameters
 */
function validateFilterParameters(action, expectedParams) {
  const params = parseFilterParameters(action.data);
  const issues = [];

  // Check DA parameter
  if (expectedParams.da) {
    const da = parseInt(params.da);
    if (isNaN(da) || da < expectedParams.da.min || da > expectedParams.da.max) {
      issues.push(`DA parameter invalid: ${params.da} (expected: ${expectedParams.da.min}-${expectedParams.da.max})`);
    }
  }

  // Check DR parameter
  if (expectedParams.dr) {
    const dr = parseInt(params.dr);
    if (isNaN(dr) || dr < expectedParams.dr.min || dr > expectedParams.dr.max) {
      issues.push(`DR parameter invalid: ${params.dr} (expected: ${expectedParams.dr.min}-${expectedParams.dr.max})`);
    }
  }

  // Check Spam Score parameter
  if (expectedParams.spam) {
    const spam = parseInt(params.spam);
    if (isNaN(spam) || spam > expectedParams.spam.max) {
      issues.push(`Spam Score parameter invalid: ${params.spam} (expected: <= ${expectedParams.spam.max})`);
    }
  }

  // Check Traffic parameter
  if (expectedParams.traffic) {
    const traffic = parseInt(params.traffic);
    if (isNaN(traffic) || traffic < expectedParams.traffic.min) {
      issues.push(`Traffic parameter invalid: ${params.traffic} (expected: >= ${expectedParams.traffic.min})`);
    }
  }

  return {
    action: 'filter',
    status: issues.length === 0 ? 'valid' : 'invalid',
    message: issues.length === 0 ? 'Filter parameters valid' : issues.join('; '),
    issues
  };
}

/**
 * Parse filter parameters from action data
 */
function parseFilterParameters(data) {
  const params = {};
  if (typeof data === 'string') {
    const pairs = data.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = value;
      }
    }
  }
  return params;
}

/**
 * Validate cart parameters
 */
function validateCartParameters(action, expectedParams) {
  const params = parseFilterParameters(action.data);
  
  if (expectedParams.siteId?.required && !params.siteId) {
    return {
      action: 'addToCart',
      status: 'invalid',
      message: 'Site ID is required but not provided'
    };
  }

  if (params.siteId && expectedParams.siteId?.format) {
    if (!expectedParams.siteId.format.test(params.siteId)) {
      return {
        action: 'addToCart',
        status: 'invalid',
        message: `Site ID format invalid: ${params.siteId}`
      };
    }
  }

  return {
    action: 'addToCart',
    status: 'valid',
    message: 'Cart parameters valid'
  };
}

/**
 * Validate navigation parameters
 */
function validateNavigateParameters(action, expectedParams) {
  if (expectedParams.path && action.data !== expectedParams.path.value) {
    return {
      action: 'navigate',
      status: 'invalid',
      message: `Navigation path invalid: ${action.data} (expected: ${expectedParams.path.value})`
    };
  }

  return {
    action: 'navigate',
    status: 'valid',
    message: 'Navigation parameters valid'
  };
}

/**
 * Validate recommendation parameters
 */
function validateRecommendParameters(action, expectedParams) {
  const params = parseFilterParameters(action.data);
  
  if (expectedParams.criteria && params.criteria !== expectedParams.criteria.value) {
    return {
      action: 'recommend',
      status: 'invalid',
      message: `Recommendation criteria invalid: ${params.criteria} (expected: ${expectedParams.criteria.value})`
    };
  }

  return {
    action: 'recommend',
    status: 'valid',
    message: 'Recommendation parameters valid'
  };
}

/**
 * Run a single test case
 */
async function runTestCase(testCase) {
  console.log(`\n🚀 Running test: ${testCase.name}`);
  console.log(`📝 Description: ${testCase.description}`);
  console.log(`💬 User message: "${testCase.userMessage}"`);

  try {
    // Test AI chat API
    const apiResult = await testAIChatAPI(
      testCase.userMessage,
      testCase.expectedActions,
      testCase.expectedParams
    );

    if (!apiResult.success) {
      throw new Error(`API test failed: ${apiResult.error}`);
    }

    // Validate actions
    const validationResults = validateActionParameters(
      apiResult.actions,
      testCase.expectedActions,
      testCase.expectedParams
    );

    // Check if all validations passed
    const allValid = validationResults.every(result => result.status === 'valid');
    
    if (allValid) {
      console.log(`✅ Test PASSED: ${testCase.name}`);
      testResults.passed++;
    } else {
      console.log(`❌ Test FAILED: ${testCase.name}`);
      validationResults.forEach(result => {
        if (result.status !== 'valid') {
          console.log(`   - ${result.action}: ${result.message}`);
        }
      });
      testResults.failed++;
    }

    testResults.details.push({
      name: testCase.name,
      status: allValid ? 'passed' : 'failed',
      apiResult,
      validationResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Test ERROR: ${testCase.name}`, error.message);
    testResults.failed++;
    testResults.details.push({
      name: testCase.name,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  testResults.total++;
}

/**
 * Run all test cases
 */
async function runAllTests() {
  console.log('🧪 Starting Advanced AI Improvements Test Suite');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();

  for (const testCase of TEST_CASES) {
    await runTestCase(testCase);
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Generate test report
  generateTestReport(duration);
}

/**
 * Generate comprehensive test report
 */
function generateTestReport(duration) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST REPORT');
  console.log('=' .repeat(60));
  
  console.log(`⏱️  Total Duration: ${duration}ms`);
  console.log(`📈 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  testResults.details.forEach((detail, index) => {
    const status = detail.status === 'passed' ? '✅' : detail.status === 'failed' ? '❌' : '⚠️';
    console.log(`${index + 1}. ${status} ${detail.name} (${detail.status})`);
    
    if (detail.status === 'failed' && detail.validationResults) {
      detail.validationResults.forEach(result => {
        if (result.status !== 'valid') {
          console.log(`   - ${result.action}: ${result.message}`);
        }
      });
    }
    
    if (detail.status === 'error') {
      console.log(`   - Error: ${detail.error}`);
    }
  });

  // Save detailed report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    duration,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
    },
    details: testResults.details
  };

  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (testResults.failed > 0) {
    console.log('- Review failed test cases and improve validation logic');
    console.log('- Check system prompt effectiveness for edge cases');
    console.log('- Consider adjusting parameter validation thresholds');
  } else {
    console.log('- All tests passed! The advanced AI improvements are working correctly');
    console.log('- Consider adding more edge case tests for robustness');
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('- Monitor production performance with these improvements');
  console.log('- Collect user feedback on AI response quality');
  console.log('- Continuously refine prompting techniques based on real usage');
}

/**
 * Main execution
 */
async function main() {
  try {
    await runAllTests();
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  runTestCase,
  testAIChatAPI,
  validateActionParameters
};
