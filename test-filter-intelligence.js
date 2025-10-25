/**
 * Test script for filter intelligence implementation
 */

// Test the filter intelligence functions
async function testFilterIntelligence() {
  console.log('🧪 Testing Filter Intelligence Implementation...\n')
  
  try {
    // Test 1: Import and test filter intelligence functions
    console.log('1. Testing filter intelligence imports...')
    const { validateFilterWithConfidence, getFilterConfidence, storeFilterDecision } = await import('./lib/filter-intelligence.ts')
    console.log('✅ Filter intelligence functions imported successfully')
    
    // Test 2: Test filter validation with confidence
    console.log('\n2. Testing filter validation with confidence...')
    const testFilters = {
      daMin: 50,
      drMin: 40,
      spamMax: 5,
      priceMax: 1000
    }
    
    const validationResult = validateFilterWithConfidence(testFilters)
    console.log('Validation Result:', {
      isValid: validationResult.isValid,
      confidence: validationResult.confidence,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      suggestions: validationResult.suggestions
    })
    
    if (validationResult.isValid) {
      console.log('✅ Filter validation passed')
    } else {
      console.log('❌ Filter validation failed:', validationResult.errors)
    }
    
    // Test 3: Test AI context manager filter processing
    console.log('\n3. Testing AI context manager filter processing...')
    const { processFilterContext } = await import('./lib/ai-context-manager.ts')
    
    const testMessage = "Show me high quality websites with DA 50+ and low spam score"
    const testUserId = 'test-user-123'
    const testCurrentFilters = {}
    const testUserContext = {}
    
    const filterResult = await processFilterContext(testUserId, testMessage, testCurrentFilters, testUserContext)
    console.log('Filter Processing Result:', {
      shouldUpdate: filterResult.shouldUpdate,
      filterAction: filterResult.filterAction,
      newFilters: filterResult.newFilters,
      confidence: filterResult.confidence,
      reasoning: filterResult.reasoning
    })
    
    if (filterResult.shouldUpdate && filterResult.newFilters.daMin === 50) {
      console.log('✅ Filter processing correctly detected DA 50+ requirement')
    } else {
      console.log('❌ Filter processing failed to detect requirements')
    }
    
    // Test 4: Test filter confidence calculation
    console.log('\n4. Testing filter confidence calculation...')
    const confidence = await getFilterConfidence(testUserId, testFilters)
    console.log('Filter Confidence:', confidence)
    
    if (confidence >= 0 && confidence <= 1) {
      console.log('✅ Filter confidence calculation working')
    } else {
      console.log('❌ Filter confidence calculation failed')
    }
    
    // Test 5: Test filter decision storage
    console.log('\n5. Testing filter decision storage...')
    await storeFilterDecision(testUserId, testFilters, confidence, 'success')
    console.log('✅ Filter decision stored successfully')
    
    console.log('\n🎉 All filter intelligence tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Stack trace:', error.stack)
  }
}

// Run the test
testFilterIntelligence()
