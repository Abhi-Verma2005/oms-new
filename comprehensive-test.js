// COMPREHENSIVE DOCUMENT UPLOAD & AI INTEGRATION TEST
const fs = require('fs');
const FormData = require('form-data');

class DocumentUploadTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testUserId = 'test_user_' + Date.now();
    this.uploadedDocuments = [];
  }

  async runComprehensiveTest() {
    console.log('🚀 STARTING COMPREHENSIVE DOCUMENT UPLOAD & AI INTEGRATION TEST');
    console.log('=' .repeat(80));
    
    try {
      // Step 1: Upload multiple documents
      await this.testDocumentUploads();
      
      // Step 2: Verify RAG storage
      await this.verifyRAGStorage();
      
      // Step 3: Test AI responses with document context
      await this.testAIResponses();
      
      // Step 4: Test edge cases
      await this.testEdgeCases();
      
      // Step 5: Test user isolation
      await this.testUserIsolation();
      
      console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
      
    } catch (error) {
      console.error('❌ TEST FAILED:', error.message);
      throw error;
    }
  }

  async testDocumentUploads() {
    console.log('\n📤 STEP 1: TESTING DOCUMENT UPLOADS');
    console.log('-'.repeat(50));
    
    const testFiles = [
      'test-documents/business-strategy.txt',
      'test-documents/customer-insights.json',
      'test-documents/test-marketing-strategy.txt'
    ];
    
    for (const filePath of testFiles) {
      console.log(`\n📄 Uploading: ${filePath}`);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      form.append('userId', this.testUserId);
      
      const response = await fetch(`${this.baseUrl}/api/upload-document`, {
        method: 'POST',
        body: form
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Upload successful: ${result.document.id}`);
        this.uploadedDocuments.push({
          id: result.document.id,
          name: result.document.original_name,
          path: filePath
        });
        
        // Wait for processing
        await this.waitForProcessing(result.document.id);
      } else {
        throw new Error(`Upload failed: ${result.error}`);
      }
    }
    
    console.log(`\n✅ Uploaded ${this.uploadedDocuments.length} documents successfully`);
  }

  async waitForProcessing(documentId) {
    console.log(`⏳ Waiting for processing: ${documentId}`);
    
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (attempts < maxAttempts) {
      const response = await fetch(`${this.baseUrl}/api/document-status/${documentId}`);
      const result = await response.json();
      
      if (result.success) {
        const status = result.document.processing_status;
        console.log(`📊 Status: ${status} (attempt ${attempts + 1})`);
        
        if (status === 'completed') {
          console.log(`✅ Processing completed: ${result.document.chunk_count} chunks`);
          return;
        } else if (status === 'failed') {
          throw new Error(`Processing failed: ${result.document.error_message}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Processing timeout');
  }

  async verifyRAGStorage() {
    console.log('\n🔍 STEP 2: VERIFYING RAG STORAGE');
    console.log('-'.repeat(50));
    
    // List all documents for the user
    const response = await fetch(`${this.baseUrl}/api/user-documents?userId=${this.testUserId}`);
    const result = await response.json();
    
    if (result.success) {
      console.log(`📚 Found ${result.documents.length} documents in database:`);
      result.documents.forEach(doc => {
        console.log(`  - ${doc.original_name}: ${doc.chunk_count} chunks, Status: ${doc.processing_status}`);
      });
      
      // Verify all documents are processed
      const unprocessed = result.documents.filter(doc => doc.processing_status !== 'completed');
      if (unprocessed.length > 0) {
        throw new Error(`Unprocessed documents: ${unprocessed.map(d => d.original_name).join(', ')}`);
      }
      
      console.log('✅ All documents processed and stored in RAG system');
    } else {
      throw new Error('Failed to retrieve documents');
    }
  }

  async testAIResponses() {
    console.log('\n🤖 STEP 3: TESTING AI RESPONSES WITH DOCUMENT CONTEXT');
    console.log('-'.repeat(50));
    
    const testCases = [
      {
        question: "What is our company's revenue target for Q4 2025?",
        expectedContext: "business-strategy",
        description: "Revenue target question"
      },
      {
        question: "What are our main competitive advantages?",
        expectedContext: "business-strategy", 
        description: "Competitive advantages question"
      },
      {
        question: "What is our current customer satisfaction score?",
        expectedContext: "customer-insights",
        description: "Customer satisfaction question"
      },
      {
        question: "What are the top customer complaints?",
        expectedContext: "customer-insights",
        description: "Customer feedback question"
      },
      {
        question: "What is our marketing strategy for content creation?",
        expectedContext: "marketing-strategy",
        description: "Marketing strategy question"
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.description}`);
      console.log(`❓ Question: ${testCase.question}`);
      
      // Test with relevant document selected
      const relevantDoc = this.uploadedDocuments.find(doc => 
        doc.name.includes(testCase.expectedContext)
      );
      
      if (relevantDoc) {
        console.log(`📄 Using document: ${relevantDoc.name}`);
        
        const response = await this.sendAIQuery(testCase.question, [relevantDoc.id]);
        console.log(`🤖 AI Response: ${response.substring(0, 200)}...`);
        
        // Verify response contains relevant information
        if (this.verifyResponseRelevance(response, testCase.expectedContext)) {
          console.log('✅ Response appears relevant and useful');
        } else {
          console.log('⚠️  Response may not be using document context effectively');
        }
      } else {
        console.log('❌ Could not find relevant document');
      }
    }
  }

  async sendAIQuery(question, selectedDocuments = []) {
    const response = await fetch(`${this.baseUrl}/api/chat-streaming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [question],
        userId: this.testUserId,
        selectedDocuments: selectedDocuments,
        currentFilters: {}
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI query failed: ${response.status}`);
    }
    
    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
    
    return fullResponse;
  }

  verifyResponseRelevance(response, expectedContext) {
    const contextKeywords = {
      'business-strategy': ['revenue', 'target', 'strategy', 'market', 'competitive', 'advantage'],
      'customer-insights': ['customer', 'satisfaction', 'feedback', 'complaint', 'score', 'insights'],
      'marketing-strategy': ['marketing', 'content', 'strategy', 'campaign', 'audience']
    };
    
    const keywords = contextKeywords[expectedContext] || [];
    const responseLower = response.toLowerCase();
    
    return keywords.some(keyword => responseLower.includes(keyword));
  }

  async testEdgeCases() {
    console.log('\n🔬 STEP 4: TESTING EDGE CASES');
    console.log('-'.repeat(50));
    
    // Test 1: Empty document selection
    console.log('\n🧪 Test: AI query without document selection');
    const response1 = await this.sendAIQuery("What is our revenue target?", []);
    console.log(`🤖 Response length: ${response1.length} characters`);
    
    // Test 2: Multiple document selection
    console.log('\n🧪 Test: AI query with multiple documents');
    const allDocIds = this.uploadedDocuments.map(doc => doc.id);
    const response2 = await this.sendAIQuery("Summarize our business strategy and customer insights", allDocIds);
    console.log(`🤖 Response length: ${response2.length} characters`);
    
    // Test 3: Non-existent document ID
    console.log('\n🧪 Test: AI query with invalid document ID');
    try {
      const response3 = await this.sendAIQuery("Test query", ['invalid_doc_id']);
      console.log(`🤖 Response length: ${response3.length} characters`);
    } catch (error) {
      console.log(`⚠️  Expected error: ${error.message}`);
    }
    
    console.log('✅ Edge case testing completed');
  }

  async testUserIsolation() {
    console.log('\n🔒 STEP 5: TESTING USER ISOLATION');
    console.log('-'.repeat(50));
    
    // Create another test user
    const otherUserId = 'test_user_other_' + Date.now();
    
    // Upload a document for the other user
    console.log('\n📄 Uploading document for different user');
    const form = new FormData();
    form.append('file', fs.createReadStream('test-documents/business-strategy.txt'));
    form.append('userId', otherUserId);
    
    const uploadResponse = await fetch(`${this.baseUrl}/api/upload-document`, {
      method: 'POST',
      body: form
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (uploadResult.success) {
      await this.waitForProcessing(uploadResult.document.id);
      
      // Try to access other user's documents
      console.log('\n🔍 Testing document access isolation');
      const listResponse = await fetch(`${this.baseUrl}/api/user-documents?userId=${this.testUserId}`);
      const listResult = await listResponse.json();
      
      if (listResult.success) {
        const otherUserDocs = listResult.documents.filter(doc => 
          doc.id === uploadResult.document.id
        );
        
        if (otherUserDocs.length === 0) {
          console.log('✅ User isolation working correctly');
        } else {
          throw new Error('User isolation failed - can access other user documents');
        }
      }
    }
    
    console.log('✅ User isolation testing completed');
  }
}

// Run the comprehensive test
async function runTest() {
  const tester = new DocumentUploadTester();
  await tester.runComprehensiveTest();
}

runTest().catch(console.error);
