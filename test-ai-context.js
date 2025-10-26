// Test AI responses with document context
const { execSync } = require('child_process');

async function testAIWithDocumentContext() {
  console.log('🤖 TESTING AI RESPONSES WITH DOCUMENT CONTEXT');
  console.log('=' .repeat(60));
  
  const userId = 'test_user_1761509032482';
  const businessDocId = 'doc_test_user_1761509032482_1761509037013';
  const customerDocId = 'doc_test_user_1761509032482_1761509056299';
  
  const testCases = [
    {
      question: "What is our revenue target for Q4 2025?",
      documentId: businessDocId,
      expectedKeywords: ["revenue", "target", "Q4", "2025", "12.0M", "ARR"],
      description: "Revenue target from business strategy"
    },
    {
      question: "What are our main competitive advantages?",
      documentId: businessDocId,
      expectedKeywords: ["competitive", "advantage", "AI-Powered", "Analytics", "Integration"],
      description: "Competitive advantages from business strategy"
    },
    {
      question: "What is our current customer satisfaction score?",
      documentId: customerDocId,
      expectedKeywords: ["satisfaction", "score", "4.7", "4.3", "4.1"],
      description: "Customer satisfaction from insights"
    },
    {
      question: "What are the top customer complaints?",
      documentId: customerDocId,
      expectedKeywords: ["complaint", "feedback", "learning curve", "customization", "mobile"],
      description: "Customer feedback from insights"
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.description}`);
    console.log(`❓ Question: ${testCase.question}`);
    console.log(`📄 Document ID: ${testCase.documentId}`);
    
    try {
      // Create the curl command with proper escaping
      const payload = JSON.stringify({
        messages: [testCase.question],
        userId: userId,
        selectedDocuments: [testCase.documentId],
        currentFilters: {}
      });
      
      const curlCommand = `curl -s -X POST http://localhost:3000/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
      
      console.log('⏳ Sending request...');
      const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
      
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
      
      if (fullResponse.length > 0) {
        console.log(`✅ AI Response (${fullResponse.length} chars):`);
        console.log(`"${fullResponse}"`);
        
        // Check if response contains expected keywords
        const responseLower = fullResponse.toLowerCase();
        const foundKeywords = testCase.expectedKeywords.filter(keyword => 
          responseLower.includes(keyword.toLowerCase())
        );
        
        console.log(`🔍 Found keywords: ${foundKeywords.join(', ')}`);
        console.log(`📊 Relevance score: ${foundKeywords.length}/${testCase.expectedKeywords.length}`);
        
        if (foundKeywords.length >= testCase.expectedKeywords.length / 2) {
          console.log('✅ Response appears to use document context effectively');
        } else {
          console.log('⚠️  Response may not be using document context effectively');
        }
      } else {
        console.log('❌ No response received');
      }
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
    
    console.log('-'.repeat(40));
  }
  
  // Test without document context for comparison
  console.log('\n🔬 COMPARISON: Testing without document context');
  console.log('❓ Question: What is our revenue target for Q4 2025?');
  
  try {
    const payload = JSON.stringify({
      messages: ["What is our revenue target for Q4 2025?"],
      userId: userId,
      selectedDocuments: [],
      currentFilters: {}
    });
    
    const curlCommand = `curl -s -X POST http://localhost:3000/api/chat-streaming -H "Content-Type: application/json" -d '${payload}'`;
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 30000 });
    
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
    
    if (fullResponse.length > 0) {
      console.log(`📝 Response without context (${fullResponse.length} chars):`);
      console.log(`"${fullResponse}"`);
    } else {
      console.log('❌ No response received');
    }
    
  } catch (error) {
    console.error(`❌ Comparison test failed: ${error.message}`);
  }
}

testAIWithDocumentContext().catch(console.error);
