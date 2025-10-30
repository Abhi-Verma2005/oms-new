// Test the fixed streaming route
const { execSync } = require('child_process');

async function testFixedStreaming() {
  console.log('🧪 TESTING FIXED STREAMING ROUTE');
  console.log('=' .repeat(50));
  
  const baseUrl = 'http://localhost:3000';
  const userId = 'test_user_fixed';
  
  console.log('\n📊 CHANGES MADE:');
  console.log('✅ Switched to gpt-4o-mini (more reliable)');
  console.log('✅ Reduced system message length');
  console.log('✅ Limited document context to 3 chunks, 2000 tokens');
  console.log('✅ Reduced conversation context to 1 message');
  
  // Test 1: Basic request without documents
  console.log('\n🧪 TEST 1: Basic Request (No Documents)');
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
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Test 2: Request with documents
  console.log('\n🧪 TEST 2: Request with Documents');
  console.log('-'.repeat(40));
  
  try {
    const payload = JSON.stringify({
      messages: ["What is our revenue target?"],
      userId: 'test_user_1761509032482', // Use existing user with documents
      selectedDocuments: ['doc_test_user_1761509032482_1761509037013'],
      currentFilters: {}
    });
    
    console.log('📤 Request: "What is our revenue target?"');
    console.log('📊 Documents: 1 selected');
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
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Test 3: Educational question
  console.log('\n🧪 TEST 3: Educational Question');
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
  
  console.log('\n📊 SUMMARY: FIXED STREAMING ROUTE');
  console.log('=' .repeat(50));
  console.log('✅ Model: gpt-4o-mini (more reliable)');
  console.log('✅ System message: Minimal and efficient');
  console.log('✅ Document context: Limited to 3 chunks, 2000 tokens');
  console.log('✅ Conversation context: Limited to 1 message');
  console.log('✅ Token management: Optimized for reliability');
  
  console.log('\n🎯 EXPECTED RESULTS:');
  console.log('✅ Filter requests → Execute applyFilters tool');
  console.log('✅ Educational questions → No tool execution');
  console.log('✅ Document context → Integrated when available');
  console.log('✅ Streaming → Reliable and fast');
  
}

testFixedStreaming().catch(console.error);

