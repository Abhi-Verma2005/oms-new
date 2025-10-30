// Create test user and test document upload
const testUserId = 'test_user_' + Date.now();

async function createTestUser() {
  try {
    console.log('👤 Creating test user...');
    
    // First, let's try to create a user via a simple API call
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Test User'
      })
    });
    
    console.log('📝 Signup response:', response.status);
    
    // For now, let's use a simple approach - modify the upload API to handle missing users
    console.log('🔄 Testing upload with existing user ID...');
    
    // Try with a common test user ID
    const uploadResponse = await fetch('http://localhost:3000/api/upload-document', {
      method: 'POST',
      body: createFormData()
    });
    
    const result = await uploadResponse.json();
    console.log('📤 Upload Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

function createFormData() {
  const fs = require('fs');
  const FormData = require('form-data');
  
  const form = new FormData();
  form.append('file', fs.createReadStream('test-documents/test-marketing-strategy.txt'));
  form.append('userId', 'test_user_123');
  
  return form;
}

createTestUser();

