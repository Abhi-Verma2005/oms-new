// Deep investigation of RAG context not working
const { execSync } = require('child_process');

async function investigateRAGContext() {
  console.log('🔍 DEEP INVESTIGATION: RAG CONTEXT NOT WORKING');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://localhost:3000';
  const userId = 'anonymous'; // Using the same user from logs
  
  console.log('\n📊 FROM SERVER LOGS:');
  console.log('✅ AI responding: "I can\'t directly view or summarize the contents"');
  console.log('❌ No document context retrieval logs');
  console.log('❌ No "📄 Searching document context" messages');
  console.log('❌ No "✅ Found X relevant chunks" messages');
  
  // Step 1: Check if user has any documents
  console.log('\n🧪 STEP 1: CHECK USER DOCUMENTS');
  console.log('-'.repeat(40));
  
  try {
    const documentsCommand = `curl -s "${baseUrl}/api/user-documents?userId=${userId}"`;
    const documentsResult = execSync(documentsCommand, { encoding: 'utf8' });
    const documentsResponse = JSON.parse(documentsResult);
    
    console.log('📥 Documents response:');
    console.log(JSON.stringify(documentsResponse, null, 2));
    
    if (documentsResponse.success && documentsResponse.documents.length > 0) {
      console.log(`✅ User has ${documentsResponse.documents.length} documents`);
      
      // Check document statuses
      documentsResponse.documents.forEach((doc, i) => {
        console.log(`📄 Document ${i + 1}:`);
        console.log(`  - ID: ${doc.id}`);
        console.log(`  - Name: ${doc.original_name}`);
        console.log(`  - Status: ${doc.processing_status}`);
        console.log(`  - Chunks: ${doc.chunk_count}`);
        console.log(`  - Error: ${doc.error_message || 'None'}`);
      });
      
      // Step 2: Test document context retrieval directly
      console.log('\n🧪 STEP 2: TEST DOCUMENT CONTEXT RETRIEVAL');
      console.log('-'.repeat(40));
      
      const completedDocs = documentsResponse.documents.filter(doc => doc.processing_status === 'completed');
      
      if (completedDocs.length > 0) {
        const testDocId = completedDocs[0].id;
        console.log(`📤 Testing with document: ${testDocId}`);
        
        const payload = JSON.stringify({
          messages: ["What is in this document?"],
          userId: userId,
          selectedDocuments: [testDocId], // SELECT THE DOCUMENT
          currentFilters: {}
        });
        
        console.log('📊 Request payload:');
        console.log(JSON.stringify(JSON.parse(payload), null, 2));
        
        const curlCommand = `curl -s -X POST ${baseUrl}/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
        
        console.log('⏳ Sending request with selected document...');
        const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
        
        console.log('📥 Response received:');
        console.log(result.substring(0, 500) + '...');
        
        // Check for document context logs
        if (result.includes('"type":"content"')) {
          console.log('✅ Stage 1 streaming: WORKING');
        } else {
          console.log('❌ Stage 1 streaming: FAILED');
        }
        
        if (result.includes('error')) {
          console.log('❌ Error in response:', result.substring(0, 200));
        }
        
      } else {
        console.log('❌ No completed documents found');
      }
      
    } else {
      console.log('❌ User has no documents or API failed');
    }
    
  } catch (error) {
    console.log('❌ Documents check failed:', error.message);
  }
  
  // Step 3: Check Pinecone directly
  console.log('\n🧪 STEP 3: CHECK PINECONE INTEGRATION');
  console.log('-'.repeat(40));
  
  try {
    // Test Pinecone connection
    const pineconeTestCommand = `curl -s -X POST ${baseUrl}/api/test-pinecone -H "Content-Type: application/json" -d '{"userId":"${userId}"}'`;
    
    console.log('📤 Testing Pinecone connection...');
    const pineconeResult = execSync(pineconeTestCommand, { encoding: 'utf8', timeout: 10000 });
    
    console.log('📥 Pinecone response:');
    console.log(pineconeResult.substring(0, 300) + '...');
    
  } catch (error) {
    console.log('⚠️ Pinecone test endpoint not available (this is expected)');
  }
  
  // Step 4: Check document processing logs
  console.log('\n🧪 STEP 4: CHECK DOCUMENT PROCESSING');
  console.log('-'.repeat(40));
  
  console.log('📊 From server logs, we can see:');
  console.log('✅ Document uploads are working');
  console.log('✅ Documents are being processed');
  console.log('❌ But no document context retrieval in AI responses');
  
  console.log('\n🔍 POSSIBLE ISSUES:');
  console.log('1. Documents not being selected in frontend');
  console.log('2. selectedDocuments not being sent to API');
  console.log('3. Document context retrieval failing silently');
  console.log('4. Pinecone namespace issues');
  console.log('5. Document chunks not stored properly');
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Check if documents are actually selected in UI');
  console.log('2. Verify selectedDocuments are sent in API request');
  console.log('3. Add debug logging to document context retrieval');
  console.log('4. Test Pinecone search directly');
  console.log('5. Check document chunk storage');
  
}

investigateRAGContext().catch(console.error);

