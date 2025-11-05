// Test the fixed RAG context integration
const { execSync } = require('child_process');

async function testFixedRAGContext() {
  console.log('🧪 TESTING FIXED RAG CONTEXT INTEGRATION');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://localhost:3000';
  const userId = 'anonymous';
  const documentId = 'doc_anonymous_1761537161815'; // The completed Excel document
  
  console.log('\n📊 FIXES APPLIED:');
  console.log('✅ Added selectedDocuments parameter to API');
  console.log('✅ Added document context retrieval logic');
  console.log('✅ Enhanced PDF extraction error handling');
  console.log('✅ Added document context to system message');
  
  // Test 1: Document context retrieval
  console.log('\n🧪 TEST 1: Document Context Retrieval');
  console.log('-'.repeat(40));
  
  try {
    const payload = JSON.stringify({
      messages: ["What is in this document?"],
      userId: userId,
      selectedDocuments: [documentId], // SELECT THE DOCUMENT
      currentFilters: {}
    });
    
    console.log('📤 Request: "What is in this document?"');
    console.log(`📊 Document ID: ${documentId}`);
    console.log('📊 Selected Documents: [documentId]');
    
    const curlCommand = `curl -s -X POST ${baseUrl}/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
    
    console.log('⏳ Sending request with selected document...');
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
    
    console.log('📥 Response received:');
    console.log(result.substring(0, 500) + '...');
    
    // Check for success
    if (result.includes('"type":"content"')) {
      console.log('✅ Stage 1 streaming: WORKING');
    } else {
      console.log('❌ Stage 1 streaming: FAILED');
    }
    
    if (result.includes('error')) {
      console.log('❌ Error in response:', result.substring(0, 200));
    } else {
      console.log('✅ No errors detected');
    }
    
    // Check for document context logs
    if (result.includes('document context') || result.includes('Document:')) {
      console.log('✅ Document context: DETECTED IN RESPONSE');
    } else {
      console.log('❌ Document context: NOT DETECTED');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Test 2: Test without document selection
  console.log('\n🧪 TEST 2: Without Document Selection');
  console.log('-'.repeat(40));
  
  try {
    const payload = JSON.stringify({
      messages: ["What is in this document?"],
      userId: userId,
      selectedDocuments: [], // NO DOCUMENTS SELECTED
      currentFilters: {}
    });
    
    console.log('📤 Request: "What is in this document?"');
    console.log('📊 Selected Documents: [] (none)');
    
    const curlCommand = `curl -s -X POST ${baseUrl}/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
    
    console.log('⏳ Sending request without selected document...');
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
    
    console.log('📥 Response received:');
    console.log(result.substring(0, 500) + '...');
    
    // Check for success
    if (result.includes('"type":"content"')) {
      console.log('✅ Stage 1 streaming: WORKING');
    } else {
      console.log('❌ Stage 1 streaming: FAILED');
    }
    
    if (result.includes('error')) {
      console.log('❌ Error in response:', result.substring(0, 200));
    } else {
      console.log('✅ No errors detected');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n📊 SUMMARY: FIXED RAG CONTEXT INTEGRATION');
  console.log('=' .repeat(60));
  console.log('✅ selectedDocuments parameter: ADDED');
  console.log('✅ Document context retrieval: ADDED');
  console.log('✅ PDF extraction: ENHANCED ERROR HANDLING');
  console.log('✅ System message: INCLUDES DOCUMENT CONTEXT');
  
  console.log('\n🎯 EXPECTED RESULTS:');
  console.log('✅ With selectedDocuments: AI should reference document content');
  console.log('✅ Without selectedDocuments: AI should say it can\'t view files');
  console.log('✅ No more Stage 1 API errors');
  console.log('✅ Document context logs in server console');
  
}

testFixedRAGContext().catch(console.error);






