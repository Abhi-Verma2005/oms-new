// Test document upload with enhanced logging
const { execSync } = require('child_process');

async function testDocumentUploadWithLogging() {
  console.log('🧪 TESTING DOCUMENT UPLOAD WITH ENHANCED LOGGING');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://localhost:3000';
  const userId = 'test_user_debug';
  
  console.log('\n📊 ENHANCED LOGGING ADDED:');
  console.log('✅ Pinecone upload logging');
  console.log('✅ Pinecone search logging');
  console.log('✅ Namespace verification');
  console.log('✅ Error handling for upsert failures');
  
  // Test 1: Upload a simple text file
  console.log('\n🧪 TEST 1: Upload Text File');
  console.log('-'.repeat(40));
  
  try {
    // Create a simple test file with clear content
    const testContent = `BUSINESS STRATEGY DOCUMENT
==========================

Company: TechCorp Solutions
Date: January 2025

REVENUE TARGETS:
- Q1 2025: $500,000
- Q2 2025: $750,000
- Q3 2025: $1,000,000
- Q4 2025: $1,250,000

MARKETING STRATEGY:
- Focus on tech startups
- Target DA 50+ websites
- Budget: $10,000/month
- Priority: High-quality backlinks

This document contains our business strategy and revenue targets for 2025.`;
    
    const curlCommand = `curl -s -X POST ${baseUrl}/api/upload-document -F "file=@-;filename=business-strategy.txt" -F "userId=${userId}" <<< "${testContent}"`;
    
    console.log('📤 Uploading business strategy document...');
    console.log('📊 Content preview:', testContent.substring(0, 100) + '...');
    
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
    
    console.log('📥 Upload response:');
    console.log(result.substring(0, 300) + '...');
    
    if (result.includes('"success":true')) {
      console.log('✅ Document upload: SUCCESS');
      
      // Extract document ID from response
      const response = JSON.parse(result);
      const documentId = response.document?.id;
      
      if (documentId) {
        console.log(`📊 Document ID: ${documentId}`);
        
        // Wait a moment for processing
        console.log('⏳ Waiting for document processing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Test document context retrieval
        console.log('\n🧪 TEST 2: Document Context Retrieval');
        console.log('-'.repeat(40));
        
        const payload = JSON.stringify({
          messages: ["What are our revenue targets?"],
          userId: userId,
          selectedDocuments: [documentId],
          currentFilters: {}
        });
        
        console.log('📤 Request: "What are our revenue targets?"');
        console.log(`📊 Document ID: ${documentId}`);
        
        const chatCommand = `curl -s -X POST ${baseUrl}/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
        
        console.log('⏳ Sending request with selected document...');
        const chatResult = execSync(chatCommand, { encoding: 'utf8', timeout: 30000 });
        
        console.log('📥 Chat response:');
        console.log(chatResult.substring(0, 500) + '...');
        
        // Check for success
        if (chatResult.includes('"type":"content"')) {
          console.log('✅ Chat streaming: WORKING');
        } else {
          console.log('❌ Chat streaming: FAILED');
        }
        
        if (chatResult.includes('error')) {
          console.log('❌ Error in response:', chatResult.substring(0, 200));
        } else {
          console.log('✅ No errors detected');
        }
        
        // Check for document context
        if (chatResult.includes('revenue') || chatResult.includes('500,000') || chatResult.includes('TechCorp')) {
          console.log('✅ Document context: DETECTED IN RESPONSE');
        } else {
          console.log('❌ Document context: NOT DETECTED');
        }
        
      }
    } else {
      console.log('❌ Document upload: FAILED');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n📊 SUMMARY: ENHANCED LOGGING TEST');
  console.log('=' .repeat(60));
  console.log('✅ Enhanced Pinecone logging: ADDED');
  console.log('✅ Namespace verification: ADDED');
  console.log('✅ Error handling: IMPROVED');
  
  console.log('\n🎯 EXPECTED LOGS:');
  console.log('📤 "Uploading X chunks to Pinecone namespace: user_test_user_debug_docs"');
  console.log('✅ "Successfully uploaded X chunks to namespace: user_test_user_debug_docs"');
  console.log('🔍 "Searching in Pinecone namespace: user_test_user_debug_docs"');
  console.log('📊 "Pinecone query results: X matches found"');
  
}

testDocumentUploadWithLogging().catch(console.error);




