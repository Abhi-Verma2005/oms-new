// Debug Pinecone chunk storage and retrieval
const { execSync } = require('child_process');

async function debugPineconeChunks() {
  console.log('🔍 DEBUGGING PINECONE CHUNK STORAGE');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://localhost:3000';
  const userId = 'anonymous';
  const documentId = 'doc_anonymous_1761537161815';
  
  console.log('\n📊 ISSUE ANALYSIS:');
  console.log('✅ Document uploaded: Finance_Project.xlsx');
  console.log('✅ Document processed: 1 chunk created');
  console.log('✅ RAG search working: "Searching documents for user anonymous"');
  console.log('❌ Found 0 relevant chunks: Chunks not in Pinecone or wrong namespace');
  
  // Step 1: Check document processing logs
  console.log('\n🧪 STEP 1: CHECK DOCUMENT PROCESSING');
  console.log('-'.repeat(40));
  
  try {
    const statusCommand = `curl -s "${baseUrl}/api/document-status/${documentId}"`;
    const statusResult = execSync(statusCommand, { encoding: 'utf8' });
    const statusResponse = JSON.parse(statusResult);
    
    console.log('📥 Document status:');
    console.log(JSON.stringify(statusResponse, null, 2));
    
    if (statusResponse.success) {
      const doc = statusResponse.document;
      console.log(`📊 Document Details:`);
      console.log(`  - ID: ${doc.id}`);
      console.log(`  - Name: ${doc.original_name}`);
      console.log(`  - Status: ${doc.processing_status}`);
      console.log(`  - Chunks: ${doc.chunk_count}`);
      console.log(`  - Summary: ${doc.content_summary.substring(0, 100)}...`);
      
      if (doc.chunk_count > 0) {
        console.log('✅ Document has chunks in database');
      } else {
        console.log('❌ Document has no chunks in database');
      }
    }
    
  } catch (error) {
    console.log('❌ Status check failed:', error.message);
  }
  
  // Step 2: Check chunk metadata
  console.log('\n🧪 STEP 2: CHECK CHUNK METADATA');
  console.log('-'.repeat(40));
  
  try {
    // We need to check the database directly for chunk metadata
    console.log('📊 Checking chunk metadata in database...');
    console.log('⚠️ This requires direct database access or API endpoint');
    
    // Let's check if there's a way to query chunk metadata
    console.log('💡 Need to verify:');
    console.log('1. Are chunks stored in document_chunk_metadata table?');
    console.log('2. Are chunks stored in Pinecone with correct namespace?');
    console.log('3. Is the namespace matching between storage and retrieval?');
    
  } catch (error) {
    console.log('❌ Chunk metadata check failed:', error.message);
  }
  
  // Step 3: Test Pinecone namespace
  console.log('\n🧪 STEP 3: TEST PINECONE NAMESPACE');
  console.log('-'.repeat(40));
  
  console.log('📊 Namespace Analysis:');
  console.log('✅ Storage namespace: user_anonymous_docs');
  console.log('✅ Retrieval namespace: user_anonymous_docs');
  console.log('❓ Are they actually the same?');
  
  // Step 4: Check RAG system logs
  console.log('\n🧪 STEP 4: CHECK RAG SYSTEM LOGS');
  console.log('-'.repeat(40));
  
  console.log('📊 From server logs:');
  console.log('✅ "🔍 Searching documents for user anonymous"');
  console.log('✅ "✅ Found 0 relevant chunks (~0 tokens)"');
  console.log('❌ No "✅ Uploaded X chunks to namespace" logs');
  console.log('❌ No "✅ Pinecone index found" during upload');
  
  console.log('\n🔍 POSSIBLE ISSUES:');
  console.log('1. Chunks not stored in Pinecone during processing');
  console.log('2. Wrong namespace used for storage vs retrieval');
  console.log('3. Pinecone connection issues during upload');
  console.log('4. Document processing failed silently');
  console.log('5. Chunk metadata not created properly');
  
  console.log('\n💡 DEBUGGING STEPS:');
  console.log('1. Check if Pinecone is accessible during upload');
  console.log('2. Verify namespace consistency');
  console.log('3. Check document processing logs');
  console.log('4. Test Pinecone connection directly');
  console.log('5. Verify chunk storage in database');
  
  console.log('\n🎯 NEXT ACTION:');
  console.log('Need to check the document processing logs during upload');
  console.log('to see if chunks were actually stored in Pinecone');
  
}

debugPineconeChunks().catch(console.error);






