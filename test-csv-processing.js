const fs = require('fs')
const path = require('path')

// Test the enhanced CSV processing
async function testCSVProcessing() {
  console.log('🧪 Testing Enhanced CSV Processing...\n')
  
  try {
    // Read the test CSV file
    const csvPath = path.join(__dirname, 'test-data.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    console.log('📄 CSV Content:')
    console.log(csvContent)
    console.log('\n' + '='.repeat(50) + '\n')
    
    // Test the file processor
    const { fileProcessor } = require('./lib/file-processor')
    
    // Create a mock File object
    const mockFile = {
      name: 'test-data.csv',
      type: 'text/csv',
      size: csvContent.length,
      arrayBuffer: async () => Buffer.from(csvContent).buffer
    }
    
    console.log('🔍 Testing CSV extraction...')
    const result = await fileProcessor.extractContent(mockFile)
    
    console.log('✅ Extraction Result:')
    console.log('Success:', result.success)
    console.log('Error:', result.error)
    console.log('Content Length:', result.content.length)
    console.log('CSV Metadata:', JSON.stringify(result.metadata?.csvMetadata, null, 2))
    
    console.log('\n📊 Formatted Content:')
    console.log(result.content)
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // Test the RAG system chunking
    const { ragSystem } = require('./lib/rag-minimal')
    
    console.log('🔍 Testing CSV chunking...')
    const chunks = ragSystem.chunkDocument(
      result.content,
      'test_doc_123',
      'test-data.csv',
      'test_user',
      1000,
      200,
      result.metadata?.csvMetadata
    )
    
    console.log(`✅ Created ${chunks.length} chunks:`)
    chunks.forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1} (${chunk.metadata.chunkType}):`)
      console.log(`Text: ${chunk.text.substring(0, 200)}...`)
      console.log(`Metadata:`, JSON.stringify(chunk.metadata, null, 2))
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCSVProcessing()
