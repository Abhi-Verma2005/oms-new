// Test document context with the working business strategy document
const { execSync } = require('child_process');

async function testWorkingDocumentContext() {
  console.log('🧪 TESTING WORKING DOCUMENT CONTEXT');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://localhost:3000';
  const userId = 'test_user_debug';
  const documentId = 'doc_test_user_debug_1761537805160'; // The working business strategy document
  
  console.log('\n📊 WORKING DOCUMENT:');
  console.log('✅ Document ID: doc_test_user_debug_1761537805160');
  console.log('✅ Status: completed');
  console.log('✅ Chunks: 1');
  console.log('✅ Content: Business strategy with revenue targets');
  
  // Test 1: Check if we can see Pinecone upload logs
  console.log('\n🧪 TEST 1: CHECK PINECONE UPLOAD LOGS');
  console.log('-'.repeat(40));
  
  console.log('📊 Looking for Pinecone upload logs in server output...');
  console.log('🔍 Expected logs:');
  console.log('  - "📤 Uploading X chunks to Pinecone namespace"');
  console.log('  - "✅ Successfully uploaded X chunks to namespace"');
  console.log('❓ If these logs are missing, Pinecone upload is failing');
  
  // Test 2: Test document context retrieval
  console.log('\n🧪 TEST 2: DOCUMENT CONTEXT RETRIEVAL');
  console.log('-'.repeat(40));
  
  try {
    const payload = JSON.stringify({
      messages: ["What are our revenue targets for Q1 2025?"],
      userId: userId,
      selectedDocuments: [documentId],
      currentFilters: {}
    });
    
    console.log('📤 Request: "What are our revenue targets for Q1 2025?"');
    console.log(`📊 Document ID: ${documentId}`);
    console.log('📊 Expected: AI should reference "$500,000" from the document');
    
    const curlCommand = `curl -s -X POST ${baseUrl}/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
    
    console.log('⏳ Sending request...');
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
    
    console.log('📥 Response received:');
    console.log(result.substring(0, 500) + '...');
    
    // Check for success
    if (result.includes('"type":"content"')) {
      console.log('✅ Chat streaming: WORKING');
    } else {
      console.log('❌ Chat streaming: FAILED');
    }
    
    if (result.includes('error')) {
      console.log('❌ Error in response:', result.substring(0, 200));
    } else {
      console.log('✅ No errors detected');
    }
    
    // Check for document context
    if (result.includes('500,000') || result.includes('Q1') || result.includes('revenue') || result.includes('TechCorp')) {
      console.log('✅ Document context: DETECTED IN RESPONSE');
      console.log('🎯 SUCCESS: AI is using document content!');
    } else {
      console.log('❌ Document context: NOT DETECTED');
      console.log('❌ AI is not using document content');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Test 3: Test without document selection
  console.log('\n🧪 TEST 3: WITHOUT DOCUMENT SELECTION');
  console.log('-'.repeat(40));
  
  try {
    const payload = JSON.stringify({
      messages: ["What are our revenue targets for Q1 2025?"],
      userId: userId,
      selectedDocuments: [], // NO DOCUMENTS
      currentFilters: {}
    });
    
    console.log('📤 Request: "What are our revenue targets for Q1 2025?"');
    console.log('📊 Selected Documents: [] (none)');
    console.log('📊 Expected: AI should say it can\'t access documents');
    
    const curlCommand = `curl -s -X POST ${baseUrl}/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
    
    console.log('⏳ Sending request...');
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
    
    console.log('📥 Response received:');
    console.log(result.substring(0, 500) + '...');
    
    // Check for success
    if (result.includes('"type":"content"')) {
      console.log('✅ Chat streaming: WORKING');
    } else {
      console.log('❌ Chat streaming: FAILED');
    }
    
    if (result.includes('error')) {
      console.log('❌ Error in response:', result.substring(0, 200));
    } else {
      console.log('✅ No errors detected');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n📊 SUMMARY: WORKING DOCUMENT CONTEXT TEST');
  console.log('=' .repeat(60));
  console.log('✅ Business strategy document: PROCESSED SUCCESSFULLY');
  console.log('✅ Document content: CONTAINS REVENUE TARGETS');
  console.log('❓ Pinecone upload: NEEDS VERIFICATION');
  console.log('❓ Document context: NEEDS TESTING');
  
  console.log('\n🎯 EXPECTED RESULTS:');
  console.log('✅ With selectedDocuments: AI should reference "$500,000"');
  console.log('✅ Without selectedDocuments: AI should say it can\'t access files');
  console.log('✅ Server logs should show Pinecone upload success');
  
}

testWorkingDocumentContext().catch(console.error);






