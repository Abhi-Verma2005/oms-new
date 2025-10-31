# 🔍 DEEP ANALYSIS: CSV CONTENT EXTRACTION & VECTORIZATION

## 📊 **CURRENT IMPLEMENTATION ANALYSIS**

### **1. CSV Content Extraction (Current)**

**Location**: `/lib/file-processor.ts` - `extractCSV()` method

```typescript
private extractCSV(buffer: Buffer): ExtractionResult {
  const content = buffer.toString('utf-8')
  // Convert CSV to readable text format
  const lines = content.split('\n')
  const formatted = lines.map(line => line.replace(/,/g, ' | ')).join('\n')
  
  return {
    content: formatted,
    success: true,
    metadata: {
      wordCount: content.split(/\s+/).length
    }
  }
}
```

**❌ ISSUES WITH CURRENT IMPLEMENTATION:**
1. **Naive CSV parsing**: Simple comma replacement loses structure
2. **No header detection**: Headers not preserved for context
3. **No data type recognition**: All data treated as text
4. **No semantic chunking**: Rows split arbitrarily
5. **No metadata preservation**: Column names and data types lost

### **2. Document Chunking Process (Current)**

**Location**: `/lib/rag-minimal.ts` - `chunkDocument()` method

```typescript
chunkDocument(content: string, documentId: string, documentName: string, userId: string, chunkSize: number = 1000, overlap: number = 200) {
  // Split by paragraphs (double newlines)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
  // ... chunking logic
}
```

**❌ ISSUES WITH CURRENT CHUNKING:**
1. **Paragraph-based splitting**: Not suitable for CSV data
2. **No semantic boundaries**: Rows split mid-data
3. **No context preservation**: Related rows separated
4. **Fixed chunk size**: Doesn't adapt to CSV structure

### **3. Document Selection Logic (Current)**

**Location**: `/app/api/chat-streaming/route.ts`

```typescript
if (selectedDocuments && selectedDocuments.length > 0) {
  const relevantChunks = await ragSystem.searchDocumentChunks(userMessage, userId, 3, 2000)
  // ... context injection
}
```

**✅ WORKING CORRECTLY:**
- Only searches when documents are selected
- Limits token usage (2000 tokens)
- Injects context into AI prompt

### **4. Vector Deletion Process (Current)**

**Location**: `/lib/rag-minimal.ts` - `deleteUserDocument()` method

```typescript
async deleteUserDocument(documentId: string, userId: string): Promise<boolean> {
  const results = await this.index.namespace(namespace).query({
    vector: new Array(1536).fill(0),
    filter: { documentId: { $eq: documentId } },
    topK: 10000,
    includeMetadata: true
  })
  
  const chunkIds = results.matches?.map(m => m.id) || []
  await this.index.namespace(namespace).deleteMany(chunkIds)
}
```

**✅ WORKING CORRECTLY:**
- Finds all chunks by documentId
- Deletes from correct namespace
- Proper cleanup

## 🚀 **RESEARCH-BASED IMPROVEMENTS**

### **1. Advanced CSV Parsing Strategy**

Based on research, CSV files need specialized handling:

```typescript
interface CSVRow {
  [key: string]: string | number | boolean
}

interface CSVMetadata {
  headers: string[]
  rowCount: number
  columnTypes: { [key: string]: string }
  sampleData: CSVRow[]
}

private parseCSVAdvanced(buffer: Buffer): ExtractionResult {
  const content = buffer.toString('utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    return { content: '', success: false, error: 'Empty CSV file' }
  }
  
  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  // Parse data rows
  const rows: CSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: CSVRow = {}
    
    headers.forEach((header, index) => {
      const value = values[index] || ''
      // Try to parse as number
      if (!isNaN(Number(value)) && value !== '') {
        row[header] = Number(value)
      } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        row[header] = value.toLowerCase() === 'true'
      } else {
        row[header] = value
      }
    })
    
    rows.push(row)
  }
  
  // Generate metadata
  const metadata: CSVMetadata = {
    headers,
    rowCount: rows.length,
    columnTypes: this.detectColumnTypes(headers, rows),
    sampleData: rows.slice(0, 5) // First 5 rows as sample
  }
  
  return {
    content: this.formatCSVForRAG(headers, rows),
    success: true,
    metadata: {
      csvMetadata: metadata,
      wordCount: content.split(/\s+/).length
    }
  }
}
```

### **2. Semantic CSV Chunking Strategy**

```typescript
chunkCSVDocument(csvContent: string, headers: string[], rows: CSVRow[], documentId: string, documentName: string, userId: string): Array<{text: string; index: number; metadata: any}> {
  const chunks = []
  let chunkIndex = 0
  
  // Strategy 1: Header + Related Rows Chunking
  const rowsPerChunk = 10 // Configurable
  for (let i = 0; i < rows.length; i += rowsPerChunk) {
    const chunkRows = rows.slice(i, i + rowsPerChunk)
    const chunkText = this.formatRowsForChunk(headers, chunkRows, i === 0) // Include headers in first chunk
    
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
        totalChunks: 0
      }
    })
    chunkIndex++
  }
  
  // Strategy 2: Column-based Chunking (for analysis queries)
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
        totalChunks: 0
      }
    })
    chunkIndex++
  })
  
  // Strategy 3: Summary Chunk (for overview queries)
  const summaryChunk = this.generateCSVSummary(headers, rows)
  chunks.push({
    text: summaryChunk,
    index: chunkIndex,
    metadata: {
      documentId,
      documentName,
      userId,
      chunkIndex,
      chunkType: 'csv_summary',
      totalChunks: 0
    }
  })
  
  // Update total chunks count
  const totalChunks = chunks.length
  chunks.forEach(chunk => chunk.metadata.totalChunks = totalChunks)
  
  return chunks
}
```

### **3. Enhanced Context Injection**

```typescript
private formatDocumentContextForCSV(chunks: any[], userMessage: string): string {
  const csvChunks = chunks.filter(chunk => chunk.metadata.chunkType?.startsWith('csv_'))
  const otherChunks = chunks.filter(chunk => !chunk.metadata.chunkType?.startsWith('csv_'))
  
  let context = '**📄 RELEVANT DOCUMENT CONTEXT:**\n\n'
  
  // CSV-specific context
  if (csvChunks.length > 0) {
    context += '**📊 CSV Data Analysis:**\n'
    csvChunks.forEach((chunk, i) => {
      const chunkType = chunk.metadata.chunkType
      const relevance = (chunk.score * 100).toFixed(0)
      
      if (chunkType === 'csv_summary') {
        context += `[Summary - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'csv_column') {
        context += `[Column: ${chunk.metadata.columnName} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      } else if (chunkType === 'csv_rows') {
        context += `[Rows ${chunk.metadata.rowRange} - ${chunk.documentName}] (Relevance: ${relevance}%)\n${chunk.content}\n\n`
      }
    })
  }
  
  // Other document context
  if (otherChunks.length > 0) {
    context += '**📄 Other Document Content:**\n'
    otherChunks.forEach((chunk, i) => {
      context += `[${chunk.documentName} - Section ${chunk.chunkIndex + 1}] (Relevance: ${(chunk.score * 100).toFixed(0)}%)\n${chunk.content}\n\n`
    })
  }
  
  context += '**Instructions:** Use this document context to provide accurate, data-driven responses. Reference specific values, columns, and rows when relevant.'
  
  return context
}
```

## 🎯 **IMPLEMENTATION PLAN**

### **Phase 1: Enhanced CSV Parsing**
1. Implement advanced CSV parser with header detection
2. Add data type recognition (numbers, booleans, dates)
3. Preserve column metadata
4. Handle edge cases (quoted values, empty cells)

### **Phase 2: Semantic Chunking**
1. Implement multi-strategy chunking (rows, columns, summary)
2. Preserve data relationships
3. Add chunk metadata for better retrieval
4. Optimize chunk sizes for CSV data

### **Phase 3: Enhanced Retrieval**
1. Implement hybrid search (semantic + keyword)
2. Add column-specific search capabilities
3. Improve relevance scoring for tabular data
4. Add data aggregation capabilities

### **Phase 4: AI Integration**
1. Enhanced prompt engineering for CSV data
2. Data visualization suggestions
3. Statistical analysis capabilities
4. Query result formatting

## 📈 **EXPECTED OUTCOMES**

With these improvements:
- ✅ **100% accurate CSV data extraction**
- ✅ **Semantic understanding of tabular data**
- ✅ **Context-aware AI responses**
- ✅ **Proper data type handling**
- ✅ **Efficient vector storage and retrieval**
- ✅ **Complete cleanup on deletion**

This will transform the CSV handling from a basic text conversion to a sophisticated data-aware RAG system.


