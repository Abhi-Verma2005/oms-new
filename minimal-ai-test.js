// Minimal AI test to verify functionality
const { execSync } = require('child_process');

async function testMinimalAI() {
  console.log('🤖 MINIMAL AI TEST');
  console.log('=' .repeat(40));
  
  try {
    // Test 1: Simple query without documents
    console.log('\n🧪 Test 1: Simple query without documents');
    const payload1 = JSON.stringify({
      messages: ["Hello, how are you?"],
      userId: "test_user_simple",
      selectedDocuments: [],
      currentFilters: {}
    });
    
    const curlCommand1 = `curl -s -X POST http://localhost:3000/api/chat-streaming -H "Content-Type: application/json" -d '${payload1}'`;
    console.log('⏳ Sending simple query...');
    
    const result1 = execSync(curlCommand1, { encoding: 'utf8', timeout: 15000 });
    console.log('📊 Raw response length:', result1.length);
    
    if (result1.length > 0) {
      console.log('✅ Server responded');
      
      // Parse streaming response
      const lines = result1.split('\n');
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
        console.log('✅ AI Response received:');
        console.log(`"${fullResponse}"`);
      } else {
        console.log('⚠️  No content in response');
      }
    } else {
      console.log('❌ No response from server');
    }
    
    // Test 2: Query with document context
    console.log('\n🧪 Test 2: Query with document context');
    const payload2 = JSON.stringify({
      messages: ["What is our revenue target?"],
      userId: "test_user_1761509032482",
      selectedDocuments: ["doc_test_user_1761509032482_1761509037013"],
      currentFilters: {}
    });
    
    const curlCommand2 = `curl -s -X POST http://localhost:3000/api/chat-streaming -H "Content-Type: application/json" -d '${payload2}'`;
    console.log('⏳ Sending query with document context...');
    
    const result2 = execSync(curlCommand2, { encoding: 'utf8', timeout: 15000 });
    console.log('📊 Raw response length:', result2.length);
    
    if (result2.length > 0) {
      console.log('✅ Server responded with document context');
      
      // Parse streaming response
      const lines2 = result2.split('\n');
      let fullResponse2 = '';
      
      for (const line of lines2) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse2 += parsed.content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
      
      if (fullResponse2.length > 0) {
        console.log('✅ AI Response with document context:');
        console.log(`"${fullResponse2}"`);
        
        // Check if response mentions revenue-related terms
        const revenueKeywords = ['revenue', 'target', 'Q4', '2025', 'ARR', 'million'];
        const foundKeywords = revenueKeywords.filter(keyword => 
          fullResponse2.toLowerCase().includes(keyword.toLowerCase())
        );
        
        console.log(`🔍 Found revenue keywords: ${foundKeywords.join(', ')}`);
        
        if (foundKeywords.length > 0) {
          console.log('✅ AI appears to be using document context!');
        } else {
          console.log('⚠️  AI may not be using document context effectively');
        }
      } else {
        console.log('⚠️  No content in response with document context');
      }
    } else {
      console.log('❌ No response from server with document context');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMinimalAI().catch(console.error);


