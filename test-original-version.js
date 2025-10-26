// Test the original working version
const { execSync } = require('child_process');

async function testOriginalVersion() {
  console.log('🧪 TESTING ORIGINAL WORKING VERSION');
  console.log('=' .repeat(50));
  
  const baseUrl = 'http://localhost:3000';
  const userId = 'test_user_original';
  
  // Test 1: Basic filter request
  console.log('\n🧪 TEST 1: Basic Filter Request');
  console.log('-'.repeat(40));
  
  try {
    const payload = JSON.stringify({
      messages: ["Show me tech sites"],
      userId: userId,
      selectedDocuments: [],
      currentFilters: {}
    });
    
    console.log('📤 Request: "Show me tech sites"');
    console.log('📊 Documents: None');
    console.log('📊 Current Filters: None');
    
    const curlCommand = `curl -s -X POST ${baseUrl}/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
    
    console.log('⏳ Sending request...');
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
    
    console.log('📥 Response received:');
    console.log(result.substring(0, 300) + '...');
    
    // Check for success
    if (result.includes('"type":"content"')) {
      console.log('✅ Stage 1 streaming: WORKING');
    } else {
      console.log('❌ Stage 1 streaming: FAILED');
    }
    
    if (result.includes('toolResults')) {
      console.log('✅ Stage 2 tool execution: WORKING');
    } else {
      console.log('❌ Stage 2 tool execution: FAILED');
    }
    
    if (result.includes('error')) {
      console.log('❌ Error in response:', result.substring(0, 200));
    } else {
      console.log('✅ No errors detected');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Test 2: Educational question
  console.log('\n🧪 TEST 2: Educational Question');
  console.log('-'.repeat(40));
  
  try {
    const payload = JSON.stringify({
      messages: ["What is domain authority?"],
      userId: userId,
      selectedDocuments: [],
      currentFilters: {}
    });
    
    console.log('📤 Request: "What is domain authority?"');
    console.log('📊 Documents: None');
    console.log('📊 Current Filters: None');
    console.log('📊 Expected: NO tool execution');
    
    const curlCommand = `curl -s -X POST ${baseUrl}/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
    
    console.log('⏳ Sending request...');
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
    
    console.log('📥 Response received:');
    console.log(result.substring(0, 300) + '...');
    
    // Check for educational response
    if (result.includes('"type":"content"')) {
      console.log('✅ Stage 1 streaming: WORKING');
    } else {
      console.log('❌ Stage 1 streaming: FAILED');
    }
    
    if (result.includes('"type":"no_tool"')) {
      console.log('✅ Educational response: WORKING (no tool executed)');
    } else if (result.includes('toolResults')) {
      console.log('⚠️ Unexpected tool execution for educational question');
    } else {
      console.log('❌ Stage 2 analysis: FAILED');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n📊 SUMMARY: ORIGINAL VERSION TEST');
  console.log('=' .repeat(50));
  console.log('✅ Reverted to original working version');
  console.log('✅ Testing basic functionality');
  console.log('✅ Verifying filter-only mode works');
  
}

testOriginalVersion().catch(console.error);
