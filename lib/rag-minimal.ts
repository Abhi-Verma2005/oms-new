import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAI } from 'openai'
import { getNamespace } from './rag-namespace'
import { CSVRow, CSVMetadata, XLSXMetadata } from './file-processor'

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'test-key'
})

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || 'test-key'
})

export class MinimalRAG {
  private index: any
  private openai: OpenAI

  constructor() {
    this.openai = openai
  }

  async initialize() {
    try {
      console.log('🔍 Initializing Pinecone...')
      const indexName = 'oms-knowledge-base'
      
      // Get or create index
      const indexes = await pinecone.listIndexes()
      const existingIndex = indexes.indexes?.find(idx => idx.name === indexName)
      
      if (!existingIndex) {
        console.log('📦 Creating Pinecone index...')
        await pinecone.createIndex({
          name: indexName,
          dimension: 1536, // OpenAI ada-002 embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        })
        console.log('✅ Pinecone index created')
      } else {
        console.log('✅ Pinecone index found')
      }
      
      this.index = pinecone.index(indexName)
      console.log('🚀 RAG system initialized')
      
    } catch (error) {
      console.error('❌ RAG initialization failed:', error)
      throw error
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Updated to newer model
        input: text,
        dimensions: 1536
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.error('❌ Embedding generation failed:', error)
      throw error
    }
  }

  // Enhanced chunking with CSV and XLSX support
  chunkDocument(
    content: string, 
    documentId: string,
    documentName: string,
    userId: string,
    chunkSize: number = 1000,
    overlap: number = 200,
    csvMetadata?: CSVMetadata,
    xlsxMetadata?: XLSXMetadata
  ): Array<{text: string; index: number; metadata: any}> {
    // Check if this is CSV data
    if (csvMetadata && csvMetadata.headers && csvMetadata.headers.length > 0) {
      return this.chunkCSVDocument(content, csvMetadata, documentId, documentName, userId)
    }
    
    // Check if this is XLSX data
    if (xlsxMetadata && xlsxMetadata.sheets && xlsxMetadata.sheets.length > 0) {
      return this.chunkXLSXDocument(content, xlsxMetadata, documentId, documentName, userId)
    }
    
    // Default paragraph-based chunking for other documents
    const chunks = []
    let chunkIndex = 0
    
    // Split by paragraphs (double newlines)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
    let currentChunk = ''
    
    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim()
      
      // Check if adding this paragraph would exceed chunk size
      if ((currentChunk + '\n\n' + trimmedPara).length > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex,
          metadata: {
            documentId,
            documentName,
            userId,
            chunkIndex,
            chunkType: 'paragraph',
            totalChunks: 0 // Updated later
          }
        })
        
        // Create overlap: take last ~200 chars from current chunk
        const overlapText = currentChunk.slice(-overlap).trim()
        currentChunk = overlapText + '\n\n' + trimmedPara
        chunkIndex++
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        metadata: {
          documentId,
          documentName,
          userId,
          chunkIndex,
          chunkType: 'paragraph',
          totalChunks: 0
        }
      })
    }
    
    // Update total chunks count
    const totalChunks = chunks.length
    chunks.forEach(chunk => chunk.metadata.totalChunks = totalChunks)
    
    return chunks
  }

  // CSV-specific chunking with multiple strategies
  private chunkCSVDocument(
    csvContent: string, 
    csvMetadata: CSVMetadata, 
    documentId: string, 
    documentName: string, 
    userId: string
  ): Array<{text: string; index: number; metadata: any}> {
    const chunks = []
    let chunkIndex = 0
    
    // Parse the CSV content to get rows
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []
    
    const headers = csvMetadata.headers
    const rows: CSVRow[] = []
    
    // Parse rows from the content
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes('Row')) {
        // Extract row data from formatted line
        const values = line.split('Row')[1].split(':')[1]?.split('|').map(v => v.trim().replace(/"/g, '')) || []
        const row: CSVRow = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        rows.push(row)
      }
    }
    
    // Strategy 1: Summary chunk (for overview queries) - HIGHEST PRIORITY
    const summaryChunk = this.generateCSVSummary(headers, rows, csvMetadata)
    chunks.push({
      text: summaryChunk,
      index: chunkIndex,
      metadata: {
        documentId,
        documentName,
        userId,
        chunkIndex,
        chunkType: 'csv_summary',
        priority: 'high',
        totalChunks: 0
      }
    })
    chunkIndex++
    
    // Strategy 2: Column-based chunking (for analysis queries)
    headers.forEach((header, index) => {
      const columnData = rows.map(row => `${header}: ${row[header]}`).join('\n')
      const columnChunk = `Column Analysis: ${header}\n\n${columnData}`
      
      chunks.push({
        text: columnChunk,
        index: chunkIndex,
        metadata: {
          documentId,
          documentName,
          userId,
          chunkIndex,
          chunkType: 'csv_column',
          columnName: header,
          columnIndex: index,
          columnType: csvMetadata.columnTypes[header],
          priority: 'medium',
          totalChunks: 0
        }
      })
      chunkIndex++
    })
    
    // Strategy 3: Row-based chunking (for data queries)
    const rowsPerChunk = 20 // Increased for better context
    for (let i = 0; i < rows.length; i += rowsPerChunk) {
      const chunkRows = rows.slice(i, i + rowsPerChunk)
      const chunkText = this.formatRowsForChunk(headers, chunkRows, i === 0, csvMetadata)
      
      chunks.push({
        text: chunkText,
        index: chunkIndex,
        metadata: {
          documentId,
          documentName,
          userId,
          chunkIndex,
          chunkType: 'csv_rows',
          rowRange: `${i}-${i + chunkRows.length - 1}`,
          headers: i === 0 ? headers : undefined, // Include headers in first chunk
          priority: 'low',
          totalChunks: 0
        }
      })
      chunkIndex++
    }
    
    // Strategy 4: Statistical analysis chunks (for numeric columns)
    const numericColumns = headers.filter(header => 
      csvMetadata.columnTypes[header] === 'number' || 
      csvMetadata.columnTypes[header] === 'integer'
    )
    
    if (numericColumns.length > 0) {
      const statsChunk = this.generateStatisticalAnalysis(numericColumns, rows, csvMetadata)
      chunks.push({
        text: statsChunk,
        index: chunkIndex,
        metadata: {
          documentId,
          documentName,
          userId,
          chunkIndex,
          chunkType: 'csv_statistics',
          priority: 'medium',
          totalChunks: 0
        }
      })
      chunkIndex++
    }
    
    // Update total chunks count
    const totalChunks = chunks.length
    chunks.forEach(chunk => chunk.metadata.totalChunks = totalChunks)
    
    return chunks
  }

  private formatRowsForChunk(headers: string[], rows: CSVRow[], includeHeaders: boolean, csvMetadata?: CSVMetadata): string {
    let text = ''
    
    if (includeHeaders) {
      text += `CSV Data - Headers: ${headers.join(' | ')}\n\n`
    }
    
    text += `Data Rows:\n`
    rows.forEach((row, index) => {
      const values = headers.map(header => {
        const value = row[header] || ''
        // Format values based on type
        if (csvMetadata?.columnTypes?.[header] === 'number' || csvMetadata?.columnTypes?.[header] === 'integer') {
          return typeof value === 'number' ? value.toString() : value
        } else if (csvMetadata?.columnTypes?.[header] === 'date') {
          return value.toString()
        } else {
          return `"${value}"` // Quote string values
        }
      }).join(' | ')
      text += `Row ${index + 1}: ${values}\n`
    })
    
    return text
  }

  private generateCSVSummary(headers: string[], rows: CSVRow[], csvMetadata: CSVMetadata): string {
    let summary = `CSV Document Summary\n\n`
    summary += `Document: ${csvMetadata.headers.length} columns, ${csvMetadata.rowCount} rows\n\n`
    
    summary += `Columns:\n`
    headers.forEach(header => {
      const type = csvMetadata.columnTypes[header] || 'unknown'
      summary += `- ${header} (${type})\n`
    })
    
    summary += `\nSample Data:\n`
    const sampleRows = rows.slice(0, 3)
    sampleRows.forEach((row, index) => {
      const values = headers.map(header => row[header] || '').join(' | ')
      summary += `Row ${index + 1}: ${values}\n`
    })
    
    if (rows.length > 3) {
      summary += `... and ${rows.length - 3} more rows\n`
    }
    
    return summary
  }

  // XLSX-specific chunking with multiple strategies
  private chunkXLSXDocument(
    xlsxContent: string, 
    xlsxMetadata: XLSXMetadata, 
    documentId: string, 
    documentName: string, 
    userId: string
  ): Array<{text: string; index: number; metadata: any}> {
    const chunks = []
    let chunkIndex = 0
    
    // Strategy 1: Workbook summary chunk (HIGHEST PRIORITY)
    const workbookSummary = this.generateXLSXSummary(xlsxMetadata)
    chunks.push({
      text: workbookSummary,
      index: chunkIndex,
      metadata: {
        documentId,
        documentName,
        userId,
        chunkIndex,
        chunkType: 'xlsx_summary',
        priority: 'high',
        totalChunks: 0
      }
    })
    chunkIndex++
    
    // Strategy 2: Sheet-specific chunks
    xlsxMetadata.sheets.forEach((sheet, sheetIndex) => {
      // Sheet overview chunk
      const sheetOverview = this.generateSheetOverview(sheet, sheetIndex)
      chunks.push({
        text: sheetOverview,
        index: chunkIndex,
        metadata: {
          documentId,
          documentName,
          userId,
          chunkIndex,
          chunkType: 'xlsx_sheet_overview',
          sheetName: sheet.name,
          sheetIndex,
          priority: 'high',
          totalChunks: 0
        }
      })
      chunkIndex++
      
      // Column analysis chunks
      sheet.headers.forEach((header, colIndex) => {
        const columnAnalysis = this.generateColumnAnalysis(header, sheet, colIndex)
        chunks.push({
          text: columnAnalysis,
          index: chunkIndex,
          metadata: {
            documentId,
            documentName,
            userId,
            chunkIndex,
            chunkType: 'xlsx_column',
            sheetName: sheet.name,
            columnName: header,
            columnIndex: colIndex,
            columnType: sheet.dataTypes[header],
            priority: 'medium',
            totalChunks: 0
          }
        })
        chunkIndex++
      })
      
      // Statistical analysis for numeric columns
      const numericColumns = sheet.headers.filter(header => 
        sheet.dataTypes[header] === 'number' || sheet.dataTypes[header] === 'integer'
      )
      
      if (numericColumns.length > 0) {
        const statsAnalysis = this.generateXLSXStatisticalAnalysis(numericColumns, sheet)
        chunks.push({
          text: statsAnalysis,
          index: chunkIndex,
          metadata: {
            documentId,
            documentName,
            userId,
            chunkIndex,
            chunkType: 'xlsx_statistics',
            sheetName: sheet.name,
            priority: 'medium',
            totalChunks: 0
          }
        })
        chunkIndex++
      }
      
      // Merged cells analysis
      if (sheet.mergedCells.length > 0) {
        const mergedCellsAnalysis = this.generateMergedCellsAnalysis(sheet)
        chunks.push({
          text: mergedCellsAnalysis,
          index: chunkIndex,
          metadata: {
            documentId,
            documentName,
            userId,
            chunkIndex,
            chunkType: 'xlsx_merged_cells',
            sheetName: sheet.name,
            priority: 'low',
            totalChunks: 0
          }
        })
        chunkIndex++
      }
    })
    
    // Strategy 3: Cross-sheet analysis
    if (xlsxMetadata.sheets.length > 1) {
      const crossSheetAnalysis = this.generateCrossSheetAnalysis(xlsxMetadata)
      chunks.push({
        text: crossSheetAnalysis,
        index: chunkIndex,
        metadata: {
          documentId,
          documentName,
          userId,
          chunkIndex,
          chunkType: 'xlsx_cross_sheet',
          priority: 'medium',
          totalChunks: 0
        }
      })
      chunkIndex++
    }
    
    // Update total chunks count
    const totalChunks = chunks.length
    chunks.forEach(chunk => chunk.metadata.totalChunks = totalChunks)
    
    return chunks
  }

  private generateXLSXSummary(xlsxMetadata: XLSXMetadata): string {
    let summary = `Excel Workbook Summary\n\n`
    summary += `Document: ${xlsxMetadata.totalSheets} sheets\n\n`
    
    summary += `Workbook Features:\n`
    if (xlsxMetadata.hasFormulas) summary += `- Contains formulas\n`
    if (xlsxMetadata.hasCharts) summary += `- Contains charts\n`
    if (xlsxMetadata.hasMacros) summary += `- Contains macros\n`
    
    summary += `\nSheets Overview:\n`
    xlsxMetadata.sheets.forEach((sheet, index) => {
      summary += `${index + 1}. ${sheet.name}: ${sheet.rowCount} rows × ${sheet.columnCount} columns`
      if (sheet.hasFormulas) summary += ` (has formulas)`
      if (sheet.hasCharts) summary += ` (has charts)`
      if (sheet.mergedCells.length > 0) summary += ` (${sheet.mergedCells.length} merged cells)`
      summary += `\n`
    })
    
    return summary
  }

  private generateSheetOverview(sheet: XLSXMetadata['sheets'][0], sheetIndex: number): string {
    let overview = `Sheet: ${sheet.name}\n\n`
    overview += `Dimensions: ${sheet.rowCount} rows × ${sheet.columnCount} columns\n`
    overview += `Headers: ${sheet.headers.join(' | ')}\n\n`
    
    overview += `Data Types:\n`
    sheet.headers.forEach(header => {
      overview += `- ${header}: ${sheet.dataTypes[header]}\n`
    })
    
    if (sheet.hasFormulas) {
      overview += `\n⚠️ This sheet contains formulas\n`
    }
    if (sheet.hasCharts) {
      overview += `📊 This sheet contains charts\n`
    }
    if (sheet.mergedCells.length > 0) {
      overview += `🔗 This sheet has ${sheet.mergedCells.length} merged cells\n`
    }
    
    return overview
  }

  private generateColumnAnalysis(header: string, sheet: XLSXMetadata['sheets'][0], colIndex: number): string {
    let analysis = `Column Analysis: ${header}\n\n`
    analysis += `Type: ${sheet.dataTypes[header]}\n`
    analysis += `Position: Column ${colIndex + 1}\n`
    
    if (sheet.dataTypes[header] === 'number' || sheet.dataTypes[header] === 'integer') {
      analysis += `This is a numeric column suitable for calculations and statistical analysis.\n`
    } else if (sheet.dataTypes[header] === 'date') {
      analysis += `This is a date column for temporal analysis.\n`
    } else if (sheet.dataTypes[header] === 'formula') {
      analysis += `This column contains formulas for calculated values.\n`
    } else {
      analysis += `This is a text column for categorical analysis.\n`
    }
    
    return analysis
  }

  private generateXLSXStatisticalAnalysis(numericColumns: string[], sheet: XLSXMetadata['sheets'][0]): string {
    let stats = `Statistical Analysis for Sheet: ${sheet.name}\n\n`
    
    numericColumns.forEach(column => {
      stats += `${column}:\n`
      stats += `  Type: ${sheet.dataTypes[column]}\n`
      stats += `  Column Index: ${sheet.headers.indexOf(column) + 1}\n`
      stats += `  Suitable for: Mathematical operations, trend analysis, comparisons\n\n`
    })
    
    return stats
  }

  private generateMergedCellsAnalysis(sheet: XLSXMetadata['sheets'][0]): string {
    let analysis = `Merged Cells Analysis for Sheet: ${sheet.name}\n\n`
    
    sheet.mergedCells.forEach((mergedCell, index) => {
      analysis += `Merged Cell ${index + 1}:\n`
      analysis += `  Range: ${mergedCell.range}\n`
      analysis += `  Value: ${mergedCell.value}\n\n`
    })
    
    return analysis
  }

  private generateCrossSheetAnalysis(xlsxMetadata: XLSXMetadata): string {
    let analysis = `Cross-Sheet Analysis\n\n`
    analysis += `This workbook contains ${xlsxMetadata.totalSheets} sheets:\n\n`
    
    xlsxMetadata.sheets.forEach((sheet, index) => {
      analysis += `${index + 1}. ${sheet.name}\n`
      analysis += `   - ${sheet.rowCount} rows, ${sheet.columnCount} columns\n`
      analysis += `   - Headers: ${sheet.headers.slice(0, 3).join(', ')}${sheet.headers.length > 3 ? '...' : ''}\n`
    })
    
    analysis += `\nCross-sheet relationships and data consistency can be analyzed across these sheets.`
    
    return analysis
  }

  private generateStatisticalAnalysis(numericColumns: string[], rows: CSVRow[], csvMetadata: CSVMetadata): string {
    let stats = `Statistical Analysis\n\n`
    
    numericColumns.forEach(column => {
      const values = rows.map(row => Number(row[column])).filter(val => !isNaN(val))
      
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b)
        const min = sorted[0]
        const max = sorted[sorted.length - 1]
        const sum = values.reduce((acc, val) => acc + val, 0)
        const avg = sum / values.length
        const median = sorted.length % 2 === 0 
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
        
        // Calculate quartiles
        const q1Index = Math.floor(sorted.length * 0.25)
        const q3Index = Math.floor(sorted.length * 0.75)
        const q1 = sorted[q1Index]
        const q3 = sorted[q3Index]
        
        stats += `${column}:\n`
        stats += `  Count: ${values.length}\n`
        stats += `  Min: ${min}\n`
        stats += `  Max: ${max}\n`
        stats += `  Average: ${avg.toFixed(2)}\n`
        stats += `  Median: ${median}\n`
        stats += `  Q1: ${q1}\n`
        stats += `  Q3: ${q3}\n`
        stats += `  Range: ${max - min}\n\n`
      }
    })
    
    return stats
  }

  // FIXED: Batch embedding generation with consistent model
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Consistent model, cheaper than ada-002
        input: texts,
        dimensions: 1536 // Explicit dimension specification
      })
      
      return response.data.map(item => item.embedding)
    } catch (error) {
      console.error('❌ Embedding generation failed:', error)
      throw error
    }
  }

  // FIXED: Add document with proper namespace isolation and CSV/XLSX support
  async addDocumentWithChunking(
    content: string, 
    metadata: {
      documentId: string
      filename: string
      type: string
      size: number
      csvMetadata?: CSVMetadata
      xlsxMetadata?: XLSXMetadata
    },
    userId: string
  ): Promise<{ success: boolean; chunks: any[]; error?: string }> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`📄 Processing document: ${metadata.filename} for user ${userId}`)
      
      // 1. Chunk the document with metadata if available
      const chunks = this.chunkDocument(
        content, 
        metadata.documentId, 
        metadata.filename, 
        userId,
        1000, // chunkSize
        200,  // overlap
        metadata.csvMetadata, // Pass CSV metadata
        metadata.xlsxMetadata  // Pass XLSX metadata
      )
      
      if (chunks.length === 0) {
        throw new Error('No chunks created from document')
      }
      
      console.log(`✂️ Created ${chunks.length} chunks`)
      
      // 2. Generate embeddings for all chunks
      const chunkTexts = chunks.map(c => c.text)
      const embeddings = await this.generateEmbeddings(chunkTexts)
      
      // 3. Prepare vectors with rich metadata
      const vectors = chunks.map((chunk, i) => ({
        id: `${metadata.documentId}_chunk_${chunk.index}`,
        values: embeddings[i],
        metadata: {
          ...chunk.metadata,
          type: 'document_chunk', // Identify as document chunk
          text: chunk.text, // Store full text in Pinecone metadata
          timestamp: new Date().toISOString(),
          fileType: metadata.type,
          fileSize: metadata.size,
          isCSV: !!metadata.csvMetadata,
          isXLSX: !!metadata.xlsxMetadata
        }
      }))
      
      // 4. FIXED: Upsert to user's namespace
      const namespace = getNamespace('documents', userId)
      console.log(`📤 Uploading ${chunks.length} chunks to Pinecone namespace: ${namespace}`)
      
      try {
        await this.index.namespace(namespace).upsert(vectors)
        console.log(`✅ Successfully uploaded ${chunks.length} chunks to namespace: ${namespace}`)
      } catch (upsertError) {
        console.error('❌ Pinecone upsert failed:', upsertError)
        throw upsertError
      }
      
      return { success: true, chunks }
      
    } catch (error) {
      console.error('❌ Failed to add document:', error)
      return { 
        success: false, 
        chunks: [],
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // FIXED: Search with proper namespace and token limits
  async searchDocumentChunks(
    query: string, 
    userId: string, 
    limit: number = 5,
    maxTokens: number = 8000 // Increased token limit for better context
  ): Promise<Array<{
    id: string
    content: string
    score: number
    documentId: string
    documentName: string
    chunkIndex: number
    metadata: any
  }>> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`🔍 Searching documents for user ${userId}: "${query.substring(0, 50)}..."`)
      
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)
      
      // FIXED: Search in user's document namespace only
      const namespace = getNamespace('documents', userId)
      console.log(`🔍 Searching in Pinecone namespace: ${namespace}`)
      
      const results = await this.index.namespace(namespace).query({
        vector: queryEmbedding,
        topK: limit * 2, // Get more results for token filtering
        includeMetadata: true
      })
      
      console.log(`📊 Pinecone query results: ${results.matches?.length || 0} matches found`)
      
      // Extract and format chunks
      let chunks = results.matches?.map(match => ({
        id: match.id,
        content: match.metadata?.text as string || '',
        score: match.score || 0,
        documentId: match.metadata?.documentId as string,
        documentName: match.metadata?.documentName as string,
        chunkIndex: match.metadata?.chunkIndex as number,
        metadata: match.metadata || {}
      })) || []
      
      // FIXED: Token-aware filtering (rough estimate: 4 chars = 1 token)
      let totalTokens = 0
      const filteredChunks = []
      
      for (const chunk of chunks) {
        const estimatedTokens = Math.ceil(chunk.content.length / 4)
        if (totalTokens + estimatedTokens <= maxTokens) {
          filteredChunks.push(chunk)
          totalTokens += estimatedTokens
        } else {
          break // Stop adding chunks
        }
      }
      
      console.log(`✅ Found ${filteredChunks.length} relevant chunks (~${totalTokens} tokens)`)
      return filteredChunks
      
    } catch (error) {
      console.error('❌ Document search failed:', error)
      return []
    }
  }

  // FIXED: Proper document deletion from namespace
  async deleteUserDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`🗑️ Deleting document ${documentId} for user ${userId}`)
      
      const namespace = getNamespace('documents', userId)
      
      // Get all chunk IDs for this document
      const results = await this.index.namespace(namespace).query({
        vector: new Array(1536).fill(0),
        filter: { documentId: { $eq: documentId } },
        topK: 10000,
        includeMetadata: true
      })
      
      const chunkIds = results.matches?.map(m => m.id) || []
      
      if (chunkIds.length > 0) {
        // Delete all chunks
        await this.index.namespace(namespace).deleteMany(chunkIds)
        console.log(`✅ Deleted ${chunkIds.length} chunks from Pinecone`)
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Document deletion failed:', error)
      return false
    }
  }

  async addDocument(content: string, metadata: any, userId: string): Promise<boolean> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`📄 Adding document for user ${userId}...`)
      
      // Generate embedding
      const embedding = await this.generateEmbedding(content)
      
      // Create unique ID
      const id = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Upsert to Pinecone
      await this.index.upsert([{
        id,
        values: embedding,
        metadata: {
          ...metadata,
          userId,
          content: content.substring(0, 1000), // Store first 1000 chars
          timestamp: new Date().toISOString()
        }
      }])
      
      console.log(`✅ Document added with ID: ${id}`)
      return true
      
    } catch (error) {
      console.error('❌ Failed to add document:', error)
      return false
    }
  }

  async searchDocuments(query: string, userId: string, limit: number = 5): Promise<any[]> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`🔍 Searching documents for user ${userId}: "${query}"`)
      
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)
      
      // Search in Pinecone
      const results = await this.index.query({
        vector: queryEmbedding,
        filter: { userId: { $eq: userId } },
        topK: limit,
        includeMetadata: true
      })
      
      const documents = results.matches?.map(match => ({
        id: match.id,
        content: match.metadata?.content || '',
        score: match.score || 0,
        metadata: match.metadata || {}
      })) || []
      
      console.log(`✅ Found ${documents.length} documents`)
      return documents
      
    } catch (error) {
      console.error('❌ Document search failed:', error)
      return []
    }
  }

  async updateUserContext(userId: string, context: any): Promise<boolean> {
    try {
      console.log(`👤 Updating user context for ${userId}...`)
      
      // This would update the user_context field in the conversations table
      // For now, just log the context
      console.log('📊 User context:', JSON.stringify(context, null, 2))
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to update user context:', error)
      return false
    }
  }

  // Store conversation for user-specific training
  async storeConversation(userId: string, messages: any[], summary?: string): Promise<boolean> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`💬 Storing conversation for user ${userId}...`)
      
      // Create conversation summary for embedding
      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')
      
      // Generate embedding for the conversation
      const embedding = await this.generateEmbedding(conversationText)
      
      // Create unique ID for conversation
      const id = `conv_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Store in Pinecone with user isolation
      await this.index.upsert([{
        id,
        values: embedding,
        metadata: {
          userId,
          type: 'conversation',
          content: conversationText.substring(0, 2000), // Store first 2000 chars
          summary: summary || conversationText.substring(0, 500),
          messageCount: messages.length,
          timestamp: new Date().toISOString(),
          isPrivate: true // Ensure user isolation
        }
      }])
      
      console.log(`✅ Conversation stored with ID: ${id}`)
      return true
      
    } catch (error) {
      console.error('❌ Failed to store conversation:', error)
      return false
    }
  }

  // Get user-specific conversation history
  async getUserConversations(userId: string, limit: number = 10): Promise<any[]> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`📚 Retrieving conversations for user ${userId}...`)
      
      // Search for user's conversations only
      const results = await this.index.query({
        vector: new Array(1536).fill(0), // Dummy vector for metadata search
        filter: { 
          userId: { $eq: userId },
          type: { $eq: 'conversation' }
        },
        topK: limit,
        includeMetadata: true
      })
      
      const conversations = results.matches?.map(match => ({
        id: match.id,
        content: match.metadata?.content || '',
        summary: match.metadata?.summary || '',
        timestamp: match.metadata?.timestamp || '',
        messageCount: match.metadata?.messageCount || 0
      })) || []
      
      console.log(`✅ Found ${conversations.length} conversations for user ${userId}`)
      return conversations
      
    } catch (error) {
      console.error('❌ Failed to get user conversations:', error)
      return []
    }
  }

  // Delete user data (GDPR compliance)
  async deleteUserData(userId: string): Promise<boolean> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`🗑️ Deleting all data for user ${userId}...`)
      
      // Get all user's vectors
      const results = await this.index.query({
        vector: new Array(1536).fill(0),
        filter: { userId: { $eq: userId } },
        topK: 10000, // Large number to get all
        includeMetadata: true
      })
      
      // Delete all user's vectors
      if (results.matches && results.matches.length > 0) {
        const idsToDelete = results.matches.map(match => match.id)
        await this.index.deleteMany(idsToDelete)
        console.log(`✅ Deleted ${idsToDelete.length} vectors for user ${userId}`)
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to delete user data:', error)
      return false
    }
  }
}

// Export singleton instance
export const ragSystem = new MinimalRAG()
