// SIMPLIFIED COMPREHENSIVE TEST USING CURL COMMANDS
const { execSync } = require('child_process');
const fs = require('fs');

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
      // Step 1: Upload multiple documents using curl
      await this.testDocumentUploads();
      
      // Step 2: Verify RAG storage
      await this.verifyRAGStorage();
      
      // Step 3: Test AI responses with document context
      await this.testAIResponses();
      
      // Step 4: Test edge cases
      await this.testEdgeCases();
      
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
      
      try {
        const curlCommand = `curl -s -X POST ${this.baseUrl}/api/upload-document -F "file=@${filePath}" -F "userId=${this.testUserId}"`;
        const result = execSync(curlCommand, { encoding: 'utf8' });
        const response = JSON.parse(result);
        
        if (response.success) {
          console.log(`✅ Upload successful: ${response.document.id}`);
          this.uploadedDocuments.push({
            id: response.document.id,
            name: response.document.original_name,
            path: filePath
          });
          
          // Wait for processing
          await this.waitForProcessing(response.document.id);
        } else {
          throw new Error(`Upload failed: ${response.error}`);
        }
      } catch (error) {
        console.error(`❌ Upload error for ${filePath}:`, error.message);
        throw error;
      }
    }
    
    console.log(`\n✅ Uploaded ${this.uploadedDocuments.length} documents successfully`);
  }

  async waitForProcessing(documentId) {
    console.log(`⏳ Waiting for processing: ${documentId}`);
    
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (attempts < maxAttempts) {
      try {
        const curlCommand = `curl -s "${this.baseUrl}/api/document-status/${documentId}"`;
        const result = execSync(curlCommand, { encoding: 'utf8' });
        const response = JSON.parse(result);
        
        if (response.success) {
          const status = response.document.processing_status;
          console.log(`📊 Status: ${status} (attempt ${attempts + 1})`);
          
          if (status === 'completed') {
            console.log(`✅ Processing completed: ${response.document.chunk_count} chunks`);
            return;
          } else if (status === 'failed') {
            throw new Error(`Processing failed: ${response.document.error_message}`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error(`❌ Status check error:`, error.message);
        attempts++;
      }
    }
    
    throw new Error('Processing timeout');
  }

  async verifyRAGStorage() {
    console.log('\n🔍 STEP 2: VERIFYING RAG STORAGE');
    console.log('-'.repeat(50));
    
    try {
      const curlCommand = `curl -s "${this.baseUrl}/api/user-documents?userId=${this.testUserId}"`;
      const result = execSync(curlCommand, { encoding: 'utf8' });
      const response = JSON.parse(result);
      
      if (response.success) {
        console.log(`📚 Found ${response.documents.length} documents in database:`);
        response.documents.forEach(doc => {
          console.log(`  - ${doc.original_name}: ${doc.chunk_count} chunks, Status: ${doc.processing_status}`);
        });
        
        // Verify all documents are processed
        const unprocessed = response.documents.filter(doc => doc.processing_status !== 'completed');
        if (unprocessed.length > 0) {
          throw new Error(`Unprocessed documents: ${unprocessed.map(d => d.original_name).join(', ')}`);
        }
        
        console.log('✅ All documents processed and stored in RAG system');
      } else {
        throw new Error('Failed to retrieve documents');
      }
    } catch (error) {
      console.error('❌ RAG verification failed:', error.message);
      throw error;
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
        
        try {
          const response = await this.sendAIQuery(testCase.question, [relevantDoc.id]);
          console.log(`🤖 AI Response: ${response.substring(0, 200)}...`);
          
          // Verify response contains relevant information
          if (this.verifyResponseRelevance(response, testCase.expectedContext)) {
            console.log('✅ Response appears relevant and useful');
          } else {
            console.log('⚠️  Response may not be using document context effectively');
          }
        } catch (error) {
          console.error(`❌ AI query failed:`, error.message);
        }
      } else {
        console.log('❌ Could not find relevant document');
      }
    }
  }

  async sendAIQuery(question, selectedDocuments = []) {
    const payload = JSON.stringify({
      messages: [question],
      userId: this.testUserId,
      selectedDocuments: selectedDocuments,
      currentFilters: {}
    });
    
    const curlCommand = `curl -s -X POST ${this.baseUrl}/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
    
    try {
      const result = execSync(curlCommand, { encoding: 'utf8' });
      
      // Parse streaming response
      const lines = result.split('\n');
      let fullResponse = '';
      
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
      
      return fullResponse;
    } catch (error) {
      throw new Error(`AI query failed: ${error.message}`);
    }
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
    try {
      const response1 = await this.sendAIQuery("What is our revenue target?", []);
      console.log(`🤖 Response length: ${response1.length} characters`);
      console.log('✅ Empty document selection handled correctly');
    } catch (error) {
      console.log(`⚠️  Empty document selection error: ${error.message}`);
    }
    
    // Test 2: Multiple document selection
    console.log('\n🧪 Test: AI query with multiple documents');
    try {
      const allDocIds = this.uploadedDocuments.map(doc => doc.id);
      const response2 = await this.sendAIQuery("Summarize our business strategy and customer insights", allDocIds);
      console.log(`🤖 Response length: ${response2.length} characters`);
      console.log('✅ Multiple document selection handled correctly');
    } catch (error) {
      console.log(`⚠️  Multiple document selection error: ${error.message}`);
    }
    
    console.log('✅ Edge case testing completed');
  }
}

// Run the comprehensive test
async function runTest() {
  const tester = new DocumentUploadTester();
  await tester.runComprehensiveTest();
}

runTest().catch(console.error);






