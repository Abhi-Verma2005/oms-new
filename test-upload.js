// Test script for document upload
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    console.log('🧪 Testing document upload...');
    
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream('test-documents/test-marketing-strategy.txt'));
    form.append('userId', 'test_user_123');
    
    // Make request
    const response = await fetch('http://localhost:3001/api/upload-document', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    console.log('📤 Upload Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Upload successful!');
      console.log('📄 Document ID:', result.document.id);
      
      // Test status check
      console.log('\n🔍 Testing status check...');
      const statusResponse = await fetch(`http://localhost:3001/api/document-status/${result.document.id}`);
      const statusResult = await statusResponse.json();
      console.log('📊 Status Response:', JSON.stringify(statusResult, null, 2));
      
    } else {
      console.log('❌ Upload failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

testUpload();
