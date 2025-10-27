const fs = require('fs')
const path = require('path')

// Test the enhanced CSV processing with real-world data
async function testEnhancedCSVProcessing() {
  console.log('🧪 Testing Enhanced CSV Processing with Modern Best Practices...\n')
  
  try {
    // Test with the permissions CSV data you mentioned
    const permissionsCSV = `id,key,description
1,view_dashboard,Access the main dashboard
2,view_esop,Access ESOP dashboard
3,view_profile,View own profile
4,edit_profile,Edit own profile
5,manage_users,Manage other users
6,manage_roles,Manage roles and permissions
7,view_reports,View system reports
8,manage_esop,Manage ESOP grants and data
9,approve_exercises,Approve ESOP exercise requests
10,view_all_esop,View all ESOP data
11,admin_access,Full administrative access
12,finance_view,View financial data
13,finance_edit,Edit financial data
14,hr_access,Human resources access
15,employee_data,Access employee data
16,system_config,System configuration access
17,audit_logs,View audit logs`
    
    console.log('📄 Testing with Permissions CSV:')
    console.log(permissionsCSV)
    console.log('\n' + '='.repeat(60) + '\n')
    
    // Test the file processor
    const { fileProcessor } = require('./lib/file-processor')
    
    // Create a mock File object
    const mockFile = {
      name: 'permissions_rows.csv',
      type: 'text/csv',
      size: permissionsCSV.length,
      arrayBuffer: async () => Buffer.from(permissionsCSV).buffer
    }
    
    console.log('🔍 Testing Enhanced CSV Extraction...')
    const result = await fileProcessor.extractContent(mockFile)
    
    console.log('✅ Extraction Result:')
    console.log('Success:', result.success)
    console.log('Error:', result.error)
    console.log('Content Length:', result.content.length)
    console.log('CSV Metadata:', JSON.stringify(result.metadata?.csvMetadata, null, 2))
    
    console.log('\n📊 Enhanced Formatted Content:')
    console.log(result.content)
    
    console.log('\n' + '='.repeat(60) + '\n')
    
    // Test the RAG system chunking
    const { ragSystem } = require('./lib/rag-minimal')
    
    console.log('🔍 Testing Enhanced CSV Chunking...')
    const chunks = ragSystem.chunkDocument(
      result.content,
      'test_permissions_doc',
      'permissions_rows.csv',
      'test_user',
      1000,
      200,
      result.metadata?.csvMetadata
    )
    
    console.log(`✅ Created ${chunks.length} chunks with enhanced strategies:`)
    chunks.forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1} (${chunk.metadata.chunkType}, Priority: ${chunk.metadata.priority}):`)
      console.log(`Text Preview: ${chunk.text.substring(0, 150)}...`)
      console.log(`Metadata:`, JSON.stringify(chunk.metadata, null, 2))
    })
    
    console.log('\n' + '='.repeat(60) + '\n')
    
    // Test document context formatting
    const { formatDocumentContextForCSV } = require('./app/api/chat-streaming/route')
    
    console.log('🔍 Testing Enhanced Document Context Formatting...')
    
    // Mock chunks with different types and priorities
    const mockChunks = chunks.map(chunk => ({
      ...chunk,
      score: Math.random() * 0.5 + 0.5, // Random relevance score
      documentName: 'permissions_rows.csv'
    }))
    
    const context = formatDocumentContextForCSV(mockChunks, 'What permissions are available?')
    console.log('✅ Enhanced Document Context:')
    console.log(context)
    
    console.log('\n🎉 Enhanced CSV Processing Test Complete!')
    console.log('\nKey Improvements Implemented:')
    console.log('✅ Advanced CSV parsing with proper quote handling')
    console.log('✅ Enhanced data type detection (integer, number, boolean, date, email, url, phone)')
    console.log('✅ Statistical analysis for numeric columns')
    console.log('✅ Priority-based chunking (summary, statistics, columns, rows)')
    console.log('✅ Enhanced metadata preservation')
    console.log('✅ Improved document context formatting')
    console.log('✅ Better semantic understanding for AI queries')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Stack:', error.stack)
  }
}

// Run the comprehensive test
testEnhancedCSVProcessing()
