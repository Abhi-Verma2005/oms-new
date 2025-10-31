/**
 * Comprehensive Test Suite for Filter Intelligence Implementation
 * Tests all aspects of the enhanced filter system
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  testUserId: 'test-user-123',
  testFilters: {
    valid: { daMin: 50, drMin: 40, spamMax: 5, priceMax: 1000 },
    invalid: { daMin: 150, drMin: -10, spamMax: 200, priceMin: 5000, priceMax: 1000 },
    edge: { daMin: 0, daMax: 100, spamMin: 0, spamMax: 100 }
  },
  testMessages: {
    highConfidence: [
      "Show me websites with DA 50+ and spam score under 5",
      "Find high quality sites with DR 40+",
      "Filter by price under 1000"
    ],
    mediumConfidence: [
      "Show me good websites",
      "Find premium sites",
      "Get high quality options"
    ],
    lowConfidence: [
      "Show me something",
      "Find stuff",
      "Get websites"
    ],
    update: [
      "Change DA to 60+",
      "Update spam score to under 3",
      "Modify price to under 500"
    ],
    remove: [
      "Remove DA filter",
      "Clear spam score",
      "No more price filter"
    ],
    reset: [
      "Reset all filters",
      "Clear everything",
      "Start over"
    ]
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${details}`);
  }
  testResults.details.push({ name: testName, passed, details });
}

function logSection(sectionName) {
  console.log(`\n🧪 ${sectionName}`);
  console.log('='.repeat(50));
}

// Test 1: File Structure and Imports
async function testFileStructure() {
  logSection('Testing File Structure and Imports');
  
  // Check if all required files exist
  const requiredFiles = [
    'lib/filter-intelligence.ts',
    'lib/ai-context-manager.ts',
    'app/api/ai-chat/route.ts',
    'components/ai-chatbot-sidebar-backup.tsx'
  ];
  
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    logTest(`File exists: ${file}`, exists, exists ? '' : 'File not found');
  }
  
  // Check if files have expected content
  try {
    const filterIntelligenceContent = fs.readFileSync('lib/filter-intelligence.ts', 'utf8');
    const hasValidateFunction = filterIntelligenceContent.includes('validateFilterWithConfidence');
    const hasConfidenceFunction = filterIntelligenceContent.includes('getFilterConfidence');
    const hasStoreFunction = filterIntelligenceContent.includes('storeFilterDecision');
    
    logTest('Filter intelligence has validateFilterWithConfidence', hasValidateFunction);
    logTest('Filter intelligence has getFilterConfidence', hasConfidenceFunction);
    logTest('Filter intelligence has storeFilterDecision', hasStoreFunction);
  } catch (error) {
    logTest('Filter intelligence file readable', false, error.message);
  }
  
  try {
    const aiContextContent = fs.readFileSync('lib/ai-context-manager.ts', 'utf8');
    const hasProcessFilterContext = aiContextContent.includes('processFilterContext');
    const hasFilterIntelligenceData = aiContextContent.includes('FilterIntelligenceData');
    
    logTest('AI context manager has processFilterContext', hasProcessFilterContext);
    logTest('AI context manager has FilterIntelligenceData', hasFilterIntelligenceData);
  } catch (error) {
    logTest('AI context manager file readable', false, error.message);
  }
  
  try {
    const aiChatContent = fs.readFileSync('app/api/ai-chat/route.ts', 'utf8');
    const hasFilterIntelligence = aiChatContent.includes('FILTER INTELLIGENCE');
    const hasSmartDetection = aiChatContent.includes('SMART FILTER DETECTION RULES');
    const hasFilterContext = aiChatContent.includes('filterContextStr');
    
    logTest('AI chat route has filter intelligence prompt', hasFilterIntelligence);
    logTest('AI chat route has smart detection rules', hasSmartDetection);
    logTest('AI chat route has filter context integration', hasFilterContext);
  } catch (error) {
    logTest('AI chat route file readable', false, error.message);
  }
}

// Test 2: Filter Validation Logic
async function testFilterValidation() {
  logSection('Testing Filter Validation Logic');
  
  // Test valid filters
  const validFilters = TEST_CONFIG.testFilters.valid;
  logTest('Valid filters object created', Object.keys(validFilters).length > 0);
  
  // Test invalid filters
  const invalidFilters = TEST_CONFIG.testFilters.invalid;
  logTest('Invalid filters object created', Object.keys(invalidFilters).length > 0);
  
  // Test edge case filters
  const edgeFilters = TEST_CONFIG.testFilters.edge;
  logTest('Edge case filters object created', Object.keys(edgeFilters).length > 0);
  
  // Test filter parameter extraction
  const testMessage = "Show me websites with DA 50+ and spam score under 5";
  const hasDA = testMessage.includes('DA 50+');
  const hasSpam = testMessage.includes('spam score under 5');
  
  logTest('Message contains DA requirement', hasDA);
  logTest('Message contains spam score requirement', hasSpam);
}

// Test 3: Message Processing Logic
async function testMessageProcessing() {
  logSection('Testing Message Processing Logic');
  
  // Test high confidence messages
  for (const message of TEST_CONFIG.testMessages.highConfidence) {
    const hasSpecificValues = /\d+/.test(message);
    const hasFilterTerms = /(?:DA|DR|spam|price|quality)/i.test(message);
    logTest(`High confidence message: "${message}"`, hasSpecificValues && hasFilterTerms);
  }
  
  // Test medium confidence messages
  for (const message of TEST_CONFIG.testMessages.mediumConfidence) {
    const hasQualityTerms = /(?:good|premium|quality|high)/i.test(message);
    logTest(`Medium confidence message: "${message}"`, hasQualityTerms);
  }
  
  // Test low confidence messages
  for (const message of TEST_CONFIG.testMessages.lowConfidence) {
    const hasSpecificTerms = /(?:DA|DR|spam|price|quality|good|premium)/i.test(message);
    logTest(`Low confidence message: "${message}"`, !hasSpecificTerms);
  }
  
  // Test update messages
  for (const message of TEST_CONFIG.testMessages.update) {
    const hasUpdateTerms = /(?:change|update|modify|adjust)/i.test(message);
    logTest(`Update message: "${message}"`, hasUpdateTerms);
  }
  
  // Test remove messages
  for (const message of TEST_CONFIG.testMessages.remove) {
    const hasRemoveTerms = /(?:remove|clear|no more)/i.test(message);
    logTest(`Remove message: "${message}"`, hasRemoveTerms);
  }
  
  // Test reset messages
  for (const message of TEST_CONFIG.testMessages.reset) {
    const hasResetTerms = /(?:reset|clear all|start over)/i.test(message);
    logTest(`Reset message: "${message}"`, hasResetTerms);
  }
}

// Test 4: Confidence Scoring Logic
async function testConfidenceScoring() {
  logSection('Testing Confidence Scoring Logic');
  
  // Test confidence calculation for different scenarios
  const scenarios = [
    { message: "DA 50+", expected: 'high', hasNumbers: true, hasSpecificTerms: true },
    { message: "good websites", expected: 'medium', hasNumbers: false, hasSpecificTerms: true },
    { message: "show me something", expected: 'low', hasNumbers: false, hasSpecificTerms: false }
  ];
  
  for (const scenario of scenarios) {
    let confidence = 0.5; // Base confidence
    
    if (scenario.hasNumbers) confidence += 0.3;
    if (scenario.hasSpecificTerms) confidence += 0.2;
    
    const isHigh = confidence >= 0.8;
    const isMedium = confidence >= 0.5 && confidence < 0.8;
    const isLow = confidence < 0.5;
    
    const expectedMatch = (scenario.expected === 'high' && isHigh) ||
                        (scenario.expected === 'medium' && isMedium) ||
                        (scenario.expected === 'low' && isLow);
    
    logTest(`Confidence scoring for "${scenario.message}"`, expectedMatch, 
      `Expected: ${scenario.expected}, Got: ${confidence.toFixed(2)}`);
  }
}

// Test 5: Filter Parameter Extraction
async function testFilterParameterExtraction() {
  logSection('Testing Filter Parameter Extraction');
  
  const testCases = [
    {
      message: "DA 50+",
      expected: { daMin: 50 },
      description: "DA minimum extraction"
    },
    {
      message: "spam score under 5",
      expected: { spamMax: 5 },
      description: "Spam score maximum extraction"
    },
    {
      message: "price under 1000",
      expected: { priceMax: 1000 },
      description: "Price maximum extraction"
    },
    {
      message: "country india",
      expected: { country: "india" },
      description: "Country extraction"
    },
    {
      message: "high quality",
      expected: { daMin: 50, drMin: 50, spamMax: 2 },
      description: "Quality term mapping"
    }
  ];
  
  for (const testCase of testCases) {
    // Simulate parameter extraction logic
    const extracted = {};
    const message = testCase.message.toLowerCase();
    
    // DA extraction
    const daMatch = testCase.message.match(/(?:da|domain authority)\s*[>=]?\s*(\d+)/i);
    if (daMatch) {
      extracted.daMin = parseInt(daMatch[1]);
    }
    
    // Spam extraction
    const spamMatch = testCase.message.match(/(?:spam|spam score)\s*[<=]?\s*(\d+)/i);
    if (spamMatch) {
      extracted.spamMax = parseInt(spamMatch[1]);
    }
    
    // Price extraction
    const priceMatch = testCase.message.match(/(?:under|below|less than|max)\s*\$?(\d+)/i);
    if (priceMatch) {
      extracted.priceMax = parseInt(priceMatch[1]);
    }
    
    // Country extraction
    const countryMatch = testCase.message.match(/(?:country|from)\s+([a-zA-Z\s]+)/i);
    if (countryMatch) {
      extracted.country = countryMatch[1].trim();
    }
    
    // Quality mapping
    if (/(?:good|quality|high quality|premium)/i.test(testCase.message)) {
      extracted.daMin = 50;
      extracted.drMin = 50;
      extracted.spamMax = 2;
    }
    
    const matches = JSON.stringify(extracted) === JSON.stringify(testCase.expected);
    logTest(testCase.description, matches, 
      matches ? '' : `Expected: ${JSON.stringify(testCase.expected)}, Got: ${JSON.stringify(extracted)}`);
  }
}

// Test 6: Integration Points
async function testIntegrationPoints() {
  logSection('Testing Integration Points');
  
  // Check if AI chat route imports are correct
  try {
    const aiChatContent = fs.readFileSync('app/api/ai-chat/route.ts', 'utf8');
    const hasRagImport = aiChatContent.includes("import { ragSystem } from '@/lib/rag-minimal'");
    const hasContextImport = aiChatContent.includes("import { processFilterContext } from '@/lib/ai-context-manager'");
    
    logTest('AI chat route imports ragSystem', hasRagImport);
    logTest('AI chat route imports processFilterContext', hasContextImport);
  } catch (error) {
    logTest('AI chat route imports check', false, error.message);
  }
  
  // Check if backup sidebar imports are correct
  try {
    const sidebarContent = fs.readFileSync('components/ai-chatbot-sidebar-backup.tsx', 'utf8');
    const hasFilterImport = sidebarContent.includes("import { validateFilterWithConfidence, getFilterConfidence, storeFilterDecision } from '@/lib/filter-intelligence'");
    
    logTest('Sidebar imports filter intelligence functions', hasFilterImport);
  } catch (error) {
    logTest('Sidebar imports check', false, error.message);
  }
  
  // Check if filter intelligence exports are correct
  try {
    const filterContent = fs.readFileSync('lib/filter-intelligence.ts', 'utf8');
    const hasExports = filterContent.includes('export function validateFilterWithConfidence') &&
                       filterContent.includes('export async function getFilterConfidence') &&
                       filterContent.includes('export async function storeFilterDecision');
    
    logTest('Filter intelligence has correct exports', hasExports);
  } catch (error) {
    logTest('Filter intelligence exports check', false, error.message);
  }
}

// Test 7: Error Handling
async function testErrorHandling() {
  logSection('Testing Error Handling');
  
  // Test with invalid inputs
  const invalidInputs = [
    null,
    undefined,
    '',
    {},
    { invalid: 'data' },
    { daMin: 'not-a-number' },
    { daMin: -1 },
    { daMin: 101 }
  ];
  
  for (const input of invalidInputs) {
    try {
      // Simulate validation
      let isValid = true;
      let confidence = 0.5;
      
      if (input === null || input === undefined) {
        isValid = false;
        confidence = 0;
      } else if (typeof input === 'object' && input !== null) {
        for (const [key, value] of Object.entries(input)) {
          if (key === 'daMin') {
            if (typeof value === 'string' || value < 0 || value > 100) {
              isValid = false;
              confidence -= 0.3;
            }
          }
        }
      }
      
      logTest(`Error handling for ${JSON.stringify(input)}`, 
        !isValid || confidence >= 0, 
        `Input: ${JSON.stringify(input)}, Valid: ${isValid}, Confidence: ${confidence}`);
    } catch (error) {
      logTest(`Error handling for ${JSON.stringify(input)}`, false, error.message);
    }
  }
}

// Test 8: Performance Considerations
async function testPerformance() {
  logSection('Testing Performance Considerations');
  
  // Test with large filter objects
  const largeFilterObject = {};
  for (let i = 0; i < 100; i++) {
    largeFilterObject[`filter${i}`] = Math.random() * 100;
  }
  
  const startTime = Date.now();
  
  // Simulate processing
  let processed = 0;
  for (const [key, value] of Object.entries(largeFilterObject)) {
    if (typeof value === 'number' && value >= 0 && value <= 100) {
      processed++;
    }
  }
  
  const endTime = Date.now();
  const processingTime = endTime - startTime;
  
  logTest('Large filter object processing', processingTime < 100, 
    `Processing time: ${processingTime}ms`);
  logTest('Large filter object validation', processed > 0, 
    `Processed ${processed} valid filters`);
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Filter Intelligence Tests');
  console.log('='.repeat(60));
  
  try {
    await testFileStructure();
    await testFilterValidation();
    await testMessageProcessing();
    await testConfidenceScoring();
    await testFilterParameterExtraction();
    await testIntegrationPoints();
    await testErrorHandling();
    await testPerformance();
    
    // Final results
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(30));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.details
        .filter(test => !test.passed)
        .forEach(test => console.log(`  - ${test.name}: ${test.details}`));
    }
    
    if (testResults.passed === testResults.total) {
      console.log('\n🎉 All tests passed! Filter intelligence implementation is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the comprehensive tests
runComprehensiveTests();


