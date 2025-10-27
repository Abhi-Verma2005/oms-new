import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import PDFParser from 'pdf-parse/lib/pdf-parse'

export interface ExtractionResult {
  content: string
  success: boolean
  error?: string
  metadata?: {
    pageCount?: number
    wordCount?: number
    csvMetadata?: CSVMetadata
    xlsxMetadata?: XLSXMetadata
    docxMetadata?: DOCXMetadata
    pdfMetadata?: PDFMetadata
  }
}

export interface CSVRow {
  [key: string]: string | number | boolean
}

export interface CSVMetadata {
  headers: string[]
  rowCount: number
  columnTypes: { [key: string]: string }
  sampleData: CSVRow[]
}

export interface XLSXMetadata {
  sheets: Array<{
    name: string
    rowCount: number
    columnCount: number
    headers: string[]
    dataTypes: { [key: string]: string }
    hasFormulas: boolean
    hasCharts: boolean
    mergedCells: Array<{ range: string; value: any }>
  }>
  totalSheets: number
  hasFormulas: boolean
  hasCharts: boolean
  hasMacros: boolean
}

export interface PDFMetadata {
  documentInfo: {
    title?: string
    author?: string
    subject?: string
    creator?: string
    producer?: string
    creationDate?: Date
    modificationDate?: Date
    keywords?: string
    pageCount: number
  }
  structure: {
    pages: Array<{
      pageNumber: number
      text: string
      wordCount: number
      hasImages: boolean
      hasTables: boolean
      hasFormFields: boolean
    }>
    headings: Array<{
      level: number
      text: string
      pageNumber: number
      position: number
    }>
    paragraphs: Array<{
      text: string
      pageNumber: number
      position: number
      wordCount: number
    }>
    tables: Array<{
      pageNumber: number
      rows: number
      columns: number
      content: string
      position: number
    }>
    images: Array<{
      pageNumber: number
      description?: string
      position: number
    }>
    formFields: Array<{
      name: string
      type: string
      pageNumber: number
      value?: string
    }>
  }
  contentAnalysis: {
    language: string
    readabilityScore: number
    avgWordsPerPage: number
    totalWordCount: number
    topicKeywords: string[]
    documentType: string
    hasFootnotes: boolean
    hasReferences: boolean
    hasBibliography: boolean
  }
}

export interface DOCXMetadata {
  documentInfo: {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    created?: string
    modified?: string
    lastModifiedBy?: string
    revision?: number
    pages?: number
    words?: number
    characters?: number
    charactersWithSpaces?: number
    lines?: number
    paragraphs?: number
  }
  structure: {
    headings: Array<{
      level: number
      text: string
      style: string
      position: number
    }>
    paragraphs: Array<{
      text: string
      style: string
      position: number
      wordCount: number
      hasFormatting: boolean
    }>
    tables: Array<{
      rows: number
      columns: number
      content: string
      position: number
      hasHeaders: boolean
    }>
    lists: Array<{
      items: string[]
      type: 'ordered' | 'unordered'
      position: number
      level: number
    }>
    images: Array<{
      altText?: string
      position: number
      size?: { width: number; height: number }
    }>
    hyperlinks: Array<{
      text: string
      url: string
      position: number
    }>
  }
  formatting: {
    hasBold: boolean
    hasItalic: boolean
    hasUnderline: boolean
    hasStrikethrough: boolean
    hasHighlight: boolean
    hasSuperscript: boolean
    hasSubscript: boolean
    fontStyles: string[]
    fontSizeRanges: { min: number; max: number }
  }
  contentAnalysis: {
    language: string
    readabilityScore: number
    complexityLevel: 'simple' | 'moderate' | 'complex'
    topicKeywords: string[]
    documentType: 'report' | 'letter' | 'memo' | 'proposal' | 'manual' | 'other'
  }
}

export class FileProcessor {
  
  async extractContent(file: File): Promise<ExtractionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Determine file type by extension if MIME type is not specific
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      let fileType = file.type
      
      // Override MIME type based on file extension for better detection
      if (fileType === 'application/octet-stream' || !fileType) {
        switch (fileExtension) {
          case 'txt':
            fileType = 'text/plain'
            break
          case 'csv':
            fileType = 'text/csv'
            break
          case 'json':
            fileType = 'application/json'
            break
          case 'pdf':
            fileType = 'application/pdf'
            break
          case 'docx':
            fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            break
          case 'doc':
            fileType = 'application/msword'
            break
          case 'xlsx':
            fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            break
          case 'xls':
            fileType = 'application/vnd.ms-excel'
            break
        }
      }
      
      switch (fileType) {
        case 'text/plain':
          return this.extractText(buffer)
        
        case 'application/pdf':
          return await this.extractPDF(buffer)
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractDOCX(buffer)
        
        case 'application/msword':
          return await this.extractDOC(buffer)
        
        case 'text/csv':
          return this.extractCSV(buffer)
        
        case 'application/json':
          return this.extractJSON(buffer)
        
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          return this.extractExcel(buffer)
        
        default:
          return {
            content: '',
            success: false,
            error: `Unsupported file type: ${file.type}`
          }
      }
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed'
      }
    }
  }

  private extractText(buffer: Buffer): ExtractionResult {
    const content = buffer.toString('utf-8')
    return {
      content,
      success: true,
      metadata: {
        wordCount: content.split(/\s+/).length
      }
    }
  }

  private async extractPDF(buffer: Buffer): Promise<ExtractionResult> {
    try {
      console.log('📄 Starting enhanced PDF extraction...')
      console.log('📊 Buffer size:', buffer.length)
      
      let data: any = null
      let extractionMethod = 'unknown'
      
      // Use pdf-parse for reliable PDF extraction
      console.log('🔄 Extracting PDF with pdf-parse...')
      data = await PDFParser(buffer)
      extractionMethod = 'pdf-parse'
      console.log('✅ pdf-parse extraction successful')
      
      console.log('📄 PDF extraction result:', {
        hasText: !!data.text,
        textLength: data.text?.length || 0,
        numPages: data.numpages,
        hasInfo: !!data.info,
        hasMetadata: !!data.metadata,
        extractionMethod
      })
      
      // Analyze PDF structure and extract metadata
      const pdfMetadata = await this.analyzePDFStructure(data, buffer)
      
      // Format PDF content for RAG
      const formattedContent = this.formatPDFForRAG(data, pdfMetadata)
      
      console.log('📄 PDF processing completed:', {
        pageCount: pdfMetadata.documentInfo.pageCount,
        totalWordCount: pdfMetadata.contentAnalysis.totalWordCount,
        headingsCount: pdfMetadata.structure.headings.length,
        tablesCount: pdfMetadata.structure.tables.length,
        imagesCount: pdfMetadata.structure.images.length
      })
      
      return {
        content: formattedContent,
        success: true,
        metadata: {
          pageCount: pdfMetadata.documentInfo.pageCount,
          wordCount: pdfMetadata.contentAnalysis.totalWordCount,
          pdfMetadata
        }
      }
    } catch (error) {
        console.error('❌ PDF extraction error:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        
        throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
  }


  private async extractDOCX(buffer: Buffer): Promise<ExtractionResult> {
    try {
      console.log('📄 Starting enhanced DOCX extraction...')
      
      // Extract raw text and HTML for structure analysis
      const textResult = await mammoth.extractRawText({ buffer })
      const htmlResult = await mammoth.convertToHtml({ buffer })
      
      console.log('📊 DOCX extraction results:', {
        textLength: textResult.value.length,
        htmlLength: htmlResult.value.length,
        hasMessages: textResult.messages.length > 0
      })
      
      if (textResult.value.trim().length === 0) {
        return {
          content: '',
          success: false,
          error: 'DOCX contains no readable text'
        }
      }
      
      // Analyze document structure and metadata
      const docxMetadata = this.analyzeDOCXStructure(textResult.value, htmlResult.value, textResult.messages)
      
      // Generate enhanced content for RAG
      const enhancedContent = this.formatDOCXForRAG(textResult.value, docxMetadata)
      
      return {
        content: enhancedContent,
        success: true,
        metadata: {
          wordCount: textResult.value.split(/\s+/).length,
          docxMetadata
        }
      }
    } catch (error) {
      return {
        content: '',
        success: false,
        error: `DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private analyzeDOCXStructure(text: string, html: string, messages: any[]): DOCXMetadata {
    const lines = text.split('\n').filter(line => line.trim())
    
    // Extract document info from messages
    const documentInfo = this.extractDocumentInfo(messages)
    
    // Analyze document structure
    const headings = this.detectDOCXHeadings(lines)
    const paragraphs = this.detectDOCXParagraphs(lines)
    const tables = this.detectDOCXTables(html)
    const lists = this.detectDOCXLists(lines)
    const images = this.detectDOCXImages(html)
    const hyperlinks = this.detectDOCXHyperlinks(html)
    
    // Analyze formatting
    const formatting = this.analyzeDOCXFormatting(html)
    
    // Analyze content
    const contentAnalysis = this.analyzeDOCXContent(text)
    
    return {
      documentInfo,
      structure: {
        headings,
        paragraphs,
        tables,
        lists,
        images,
        hyperlinks
      },
      formatting,
      contentAnalysis
    }
  }

  private extractDocumentInfo(messages: any[]): DOCXMetadata['documentInfo'] {
    const info: DOCXMetadata['documentInfo'] = {}
    
    // Extract basic stats from text analysis
    messages.forEach(message => {
      if (message.type === 'info' && message.message) {
        const msg = message.message.toLowerCase()
        if (msg.includes('pages')) {
          const match = msg.match(/(\d+)\s*pages/)
          if (match) info.pages = parseInt(match[1])
        }
        if (msg.includes('words')) {
          const match = msg.match(/(\d+)\s*words/)
          if (match) info.words = parseInt(match[1])
        }
        if (msg.includes('characters')) {
          const match = msg.match(/(\d+)\s*characters/)
          if (match) info.characters = parseInt(match[1])
        }
      }
    })
    
    return info
  }

  private detectDOCXHeadings(lines: string[]): DOCXMetadata['structure']['headings'] {
    const headings: DOCXMetadata['structure']['headings'] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Detect headings based on patterns
      if (line.length > 0 && line.length < 100) {
        let level = 1
        let style = 'Normal'
        
        // Numbered headings (1., 1.1., 1.1.1.)
        if (line.match(/^\d+\.?\s+[A-Z]/)) {
          level = line.match(/^\d+\.\d+\.\d+/) ? 3 : line.match(/^\d+\.\d+/) ? 2 : 1
          style = 'Heading ' + level
        }
        // All caps headings
        else if (line.match(/^[A-Z][A-Z\s]+$/) && line.length < 50) {
          level = 1
          style = 'Heading 1'
        }
        // Title case headings
        else if (line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/) && line.length < 80) {
          level = 2
          style = 'Heading 2'
        }
        // Short lines that might be headings
        else if (line.length < 50 && !line.includes('.') && !line.includes(',')) {
          level = 3
          style = 'Heading 3'
        }
        
        if (level <= 3) {
          headings.push({
            level,
            text: line,
            style,
            position: i
          })
        }
      }
    }
    
    return headings
  }

  private detectDOCXParagraphs(lines: string[]): DOCXMetadata['structure']['paragraphs'] {
    const paragraphs: DOCXMetadata['structure']['paragraphs'] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.length > 0) {
        const wordCount = line.split(/\s+/).length
        
        // Determine paragraph style
        let style = 'Normal'
        if (wordCount < 5) style = 'Short'
        else if (wordCount > 50) style = 'Long'
        
        paragraphs.push({
          text: line,
          style,
          position: i,
          wordCount,
          hasFormatting: this.hasFormatting(line)
        })
      }
    }
    
    return paragraphs
  }

  private detectDOCXTables(html: string): DOCXMetadata['structure']['tables'] {
    const tables: DOCXMetadata['structure']['tables'] = []
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi
    const matches = html.match(tableRegex) || []
    
    matches.forEach((tableHtml, index) => {
      const rows = (tableHtml.match(/<tr[^>]*>/g) || []).length
      const cells = (tableHtml.match(/<td[^>]*>/g) || []).length
      const columns = rows > 0 ? Math.floor(cells / rows) : 0
      
      // Extract table content
      const content = tableHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      
      tables.push({
        rows,
        columns,
        content,
        position: index,
        hasHeaders: tableHtml.includes('<th') || tableHtml.includes('header')
      })
    })
    
    return tables
  }

  private detectDOCXLists(lines: string[]): DOCXMetadata['structure']['lists'] {
    const lists: DOCXMetadata['structure']['lists'] = []
    let currentList: DOCXMetadata['structure']['lists'][0] | null = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Detect list items
      if (line.match(/^[\-\*•]\s+/) || line.match(/^\d+\.\s+/)) {
        if (!currentList) {
          currentList = {
            items: [],
            type: line.match(/^\d+\.\s+/) ? 'ordered' : 'unordered',
            position: i,
            level: 1
          }
        }
        
        currentList.items.push(line)
      } else if (currentList && line.length === 0) {
        // End of list
        if (currentList.items.length >= 2) {
          lists.push(currentList)
        }
        currentList = null
      }
    }
    
    // Add final list if exists
    if (currentList && currentList.items.length >= 2) {
      lists.push(currentList)
    }
    
    return lists
  }

  private detectDOCXImages(html: string): DOCXMetadata['structure']['images'] {
    const images: DOCXMetadata['structure']['images'] = []
    const imgRegex = /<img[^>]*>/g
    const matches = html.match(imgRegex) || []
    
    matches.forEach((imgTag, index) => {
      const altMatch = imgTag.match(/alt="([^"]*)"/)
      const widthMatch = imgTag.match(/width="([^"]*)"/)
      const heightMatch = imgTag.match(/height="([^"]*)"/)
      
      images.push({
        altText: altMatch ? altMatch[1] : undefined,
        position: index,
        size: widthMatch && heightMatch ? {
          width: parseInt(widthMatch[1]),
          height: parseInt(heightMatch[1])
        } : undefined
      })
    })
    
    return images
  }

  private detectDOCXHyperlinks(html: string): DOCXMetadata['structure']['hyperlinks'] {
    const hyperlinks: DOCXMetadata['structure']['hyperlinks'] = []
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g
    let match
    
    while ((match = linkRegex.exec(html)) !== null) {
      hyperlinks.push({
        text: match[2].replace(/<[^>]*>/g, '').trim(),
        url: match[1],
        position: hyperlinks.length
      })
    }
    
    return hyperlinks
  }

  private analyzeDOCXFormatting(html: string): DOCXMetadata['formatting'] {
    return {
      hasBold: html.includes('<b>') || html.includes('<strong>'),
      hasItalic: html.includes('<i>') || html.includes('<em>'),
      hasUnderline: html.includes('<u>'),
      hasStrikethrough: html.includes('<s>') || html.includes('<strike>'),
      hasHighlight: html.includes('background-color') || html.includes('highlight'),
      hasSuperscript: html.includes('<sup>'),
      hasSubscript: html.includes('<sub>'),
      fontStyles: this.extractFontStyles(html),
      fontSizeRanges: this.extractFontSizes(html)
    }
  }

  private extractFontStyles(html: string): string[] {
    const styles = new Set<string>()
    const fontFamilyRegex = /font-family:\s*([^;]+)/g
    let match
    
    while ((match = fontFamilyRegex.exec(html)) !== null) {
      styles.add(match[1].trim())
    }
    
    return Array.from(styles)
  }

  private extractFontSizes(html: string): { min: number; max: number } {
    const sizes: number[] = []
    const fontSizeRegex = /font-size:\s*(\d+(?:\.\d+)?)px/g
    let match
    
    while ((match = fontSizeRegex.exec(html)) !== null) {
      sizes.push(parseFloat(match[1]))
    }
    
    if (sizes.length === 0) {
      return { min: 12, max: 12 } // Default
    }
    
    return {
      min: Math.min(...sizes),
      max: Math.max(...sizes)
    }
  }

  private analyzeDOCXContent(text: string): DOCXMetadata['contentAnalysis'] {
    const words = text.toLowerCase().split(/\s+/)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Language detection
    const language = this.detectLanguage(text)
    
    // Readability score (simplified Flesch Reading Ease)
    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = this.calculateAvgSyllables(words)
    const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
    
    // Complexity level
    let complexityLevel: 'simple' | 'moderate' | 'complex' = 'moderate'
    if (readabilityScore > 70) complexityLevel = 'simple'
    else if (readabilityScore < 30) complexityLevel = 'complex'
    
    // Topic keywords (simplified)
    const topicKeywords = this.extractTopicKeywords(words)
    
    // Document type detection
    const documentType = this.detectDocumentType(text)
    
    return {
      language,
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      complexityLevel,
      topicKeywords,
      documentType
    }
  }

  private detectLanguage(text: string): string {
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le']
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour']
    
    const words = text.toLowerCase().split(/\s+/)
    const sampleSize = Math.min(1000, words.length)
    const sample = words.slice(0, sampleSize)
    
    const englishCount = sample.filter(word => englishWords.includes(word)).length
    const spanishCount = sample.filter(word => spanishWords.includes(word)).length
    const frenchCount = sample.filter(word => frenchWords.includes(word)).length
    
    if (englishCount > spanishCount && englishCount > frenchCount) return 'en'
    if (spanishCount > englishCount && spanishCount > frenchCount) return 'es'
    if (frenchCount > englishCount && frenchCount > spanishCount) return 'fr'
    
    return 'en' // Default to English
  }

  private calculateAvgSyllables(words: string[]): number {
    const sampleSize = Math.min(100, words.length)
    const sample = words.slice(0, sampleSize)
    
    const totalSyllables = sample.reduce((sum, word) => {
      return sum + this.countSyllables(word)
    }, 0)
    
    return totalSyllables / sampleSize
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase()
    if (word.length <= 3) return 1
    
    const vowels = 'aeiouy'
    let count = 0
    let previousWasVowel = false
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i])
      if (isVowel && !previousWasVowel) {
        count++
      }
      previousWasVowel = isVowel
    }
    
    if (word.endsWith('e')) count--
    return Math.max(1, count)
  }

  private extractTopicKeywords(words: string[]): string[] {
    // Simple keyword extraction based on frequency
    const wordFreq: { [key: string]: number } = {}
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'])
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase()
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1
      }
    })
    
    const entries = Object.entries(wordFreq)
    entries.sort((a, b) => b[1] - a[1])
    return entries.slice(0, 10).map(([word]) => word)
  }

  private detectDocumentType(text: string): DOCXMetadata['contentAnalysis']['documentType'] {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('dear') && lowerText.includes('sincerely')) return 'letter'
    if (lowerText.includes('memo') || lowerText.includes('memorandum')) return 'memo'
    if (lowerText.includes('proposal') || lowerText.includes('recommend')) return 'proposal'
    if (lowerText.includes('manual') || lowerText.includes('instructions')) return 'manual'
    if (lowerText.includes('report') || lowerText.includes('analysis')) return 'report'
    
    return 'other'
  }

  private hasFormatting(text: string): boolean {
    // Simple formatting detection
    return text.includes('**') || text.includes('__') || text.includes('*') || text.includes('_')
  }

  private formatDOCXForRAG(text: string, docxMetadata: DOCXMetadata): string {
    let content = `Word Document Analysis\n\n`
    
    // Document information
    content += `Document Information:\n`
    if (docxMetadata.documentInfo.title) content += `- Title: ${docxMetadata.documentInfo.title}\n`
    if (docxMetadata.documentInfo.author) content += `- Author: ${docxMetadata.documentInfo.author}\n`
    if (docxMetadata.documentInfo.pages) content += `- Pages: ${docxMetadata.documentInfo.pages}\n`
    if (docxMetadata.documentInfo.words) content += `- Words: ${docxMetadata.documentInfo.words}\n`
    if (docxMetadata.documentInfo.characters) content += `- Characters: ${docxMetadata.documentInfo.characters}\n`
    content += `\n`
    
    // Document structure
    content += `Document Structure:\n`
    content += `- Headings: ${docxMetadata.structure.headings.length}\n`
    content += `- Paragraphs: ${docxMetadata.structure.paragraphs.length}\n`
    content += `- Tables: ${docxMetadata.structure.tables.length}\n`
    content += `- Lists: ${docxMetadata.structure.lists.length}\n`
    content += `- Images: ${docxMetadata.structure.images.length}\n`
    content += `- Hyperlinks: ${docxMetadata.structure.hyperlinks.length}\n\n`
    
    // Content analysis
    content += `Content Analysis:\n`
    content += `- Language: ${docxMetadata.contentAnalysis.language}\n`
    content += `- Readability Score: ${docxMetadata.contentAnalysis.readabilityScore.toFixed(1)}\n`
    content += `- Complexity Level: ${docxMetadata.contentAnalysis.complexityLevel}\n`
    content += `- Document Type: ${docxMetadata.contentAnalysis.documentType}\n`
    content += `- Topic Keywords: ${docxMetadata.contentAnalysis.topicKeywords.join(', ')}\n\n`
    
    // Document outline
    if (docxMetadata.structure.headings.length > 0) {
      content += `Document Outline:\n`
      docxMetadata.structure.headings.forEach(heading => {
        const indent = '  '.repeat(heading.level - 1)
        content += `${indent}${heading.text}\n`
      })
      content += `\n`
    }
    
    // Sample content
    content += `Sample Content:\n`
    const sampleParagraphs = docxMetadata.structure.paragraphs.slice(0, 5)
    sampleParagraphs.forEach((paragraph, index) => {
      content += `Paragraph ${index + 1} (${paragraph.wordCount} words):\n`
      content += `${paragraph.text.substring(0, 200)}${paragraph.text.length > 200 ? '...' : ''}\n\n`
    })
    
    // Tables
    if (docxMetadata.structure.tables.length > 0) {
      content += `Tables Found:\n`
      docxMetadata.structure.tables.forEach((table, index) => {
        content += `Table ${index + 1}: ${table.rows} rows × ${table.columns} columns\n`
        content += `${table.content.substring(0, 300)}${table.content.length > 300 ? '...' : ''}\n\n`
      })
    }
    
    // Lists
    if (docxMetadata.structure.lists.length > 0) {
      content += `Lists Found:\n`
      docxMetadata.structure.lists.forEach((list, index) => {
        content += `${list.type === 'ordered' ? 'Numbered' : 'Bulleted'} List ${index + 1}:\n`
        list.items.slice(0, 3).forEach(item => {
          content += `  ${item}\n`
        })
        if (list.items.length > 3) {
          content += `  ... and ${list.items.length - 3} more items\n`
        }
        content += `\n`
      })
    }
    
    return content
  }

  private async extractDOC(buffer: Buffer): Promise<ExtractionResult> {
    // DOC format is complex, mammoth can handle some older formats
    try {
      const result = await mammoth.extractRawText({ buffer })
      return {
        content: result.value,
        success: true,
        metadata: {
          wordCount: result.value.split(/\s+/).length
        }
      }
    } catch (error) {
      throw new Error(`DOC extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private extractCSV(buffer: Buffer): ExtractionResult {
    try {
      const content = buffer.toString('utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        return { content: '', success: false, error: 'Empty CSV file' }
      }
      
      // Parse headers
      const headers = this.parseCSVLine(lines[0])
      
      // Parse data rows
      const rows: CSVRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i])
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
        content: this.formatCSVForRAG(headers, rows, metadata),
        success: true,
        metadata: {
          csvMetadata: metadata,
          wordCount: content.split(/\s+/).length
        }
      }
    } catch (error) {
      return {
        content: '',
        success: false,
        error: `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = '"'
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"' || char === "'") {
        if (!inQuotes) {
          quoteChar = char
          inQuotes = true
        } else if (char === quoteChar) {
          // Check if it's an escaped quote
          if (i + 1 < line.length && line[i + 1] === quoteChar) {
            current += char
            i++ // Skip next quote
          } else {
            inQuotes = false
          }
        } else {
          current += char
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result.map((field: string) => {
      // Remove surrounding quotes if they exist
      if ((field.startsWith('"') && field.endsWith('"')) || 
          (field.startsWith("'") && field.endsWith("'"))) {
        return field.slice(1, -1)
      }
      return field
    })
  }

  private detectColumnTypes(headers: string[], rows: CSVRow[]): { [key: string]: string } {
    const types: { [key: string]: string } = {}
    
    headers.forEach(header => {
      const values = rows.map(row => row[header]).filter(val => val !== '' && val !== null && val !== undefined)
      
      if (values.length === 0) {
        types[header] = 'empty'
        return
      }
      
      // Enhanced data type detection with validation
      const sampleSize = Math.min(values.length, 100) // Use sample for performance
      const sampleValues = values.slice(0, sampleSize)
      
      // Check for integers
      const allIntegers = sampleValues.every(val => {
        const num = Number(val)
        return !isNaN(num) && Number.isInteger(num) && num >= -2147483648 && num <= 2147483647
      })
      if (allIntegers) {
        types[header] = 'integer'
        return
      }
      
      // Check for floats/decimals
      const allNumbers = sampleValues.every(val => {
        const num = Number(val)
        return !isNaN(num) && isFinite(num)
      })
      if (allNumbers) {
        types[header] = 'number'
        return
      }
      
      // Check for booleans
      const allBooleans = sampleValues.every(val => {
        const str = val.toString().toLowerCase().trim()
        return str === 'true' || str === 'false' || str === '1' || str === '0' || 
               str === 'yes' || str === 'no' || str === 'y' || str === 'n'
      })
      if (allBooleans) {
        types[header] = 'boolean'
        return
      }
      
      // Check for dates (multiple formats)
      const allDates = sampleValues.every(val => {
        const str = val.toString().trim()
        // Check common date formats
        const dateFormats = [
          /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
          /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
          /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
          /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
          /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, // YYYY-MM-DD HH:MM:SS
        ]
        
        return dateFormats.some(format => format.test(str)) || !isNaN(Date.parse(str))
      })
      if (allDates) {
        types[header] = 'date'
        return
      }
      
      // Check for email addresses
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const allEmails = sampleValues.every(val => emailRegex.test(val.toString()))
      if (allEmails) {
        types[header] = 'email'
        return
      }
      
      // Check for URLs
      const urlRegex = /^https?:\/\/.+\..+/
      const allUrls = sampleValues.every(val => urlRegex.test(val.toString()))
      if (allUrls) {
        types[header] = 'url'
        return
      }
      
      // Check for phone numbers
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      const allPhones = sampleValues.every(val => phoneRegex.test(val.toString().replace(/[\s\-\(\)]/g, '')))
      if (allPhones) {
        types[header] = 'phone'
        return
      }
      
      // Default to string
      types[header] = 'string'
    })
    
    return types
  }

  private formatCSVForRAG(headers: string[], rows: CSVRow[], csvMetadata?: CSVMetadata): string {
    let content = `CSV Data Analysis\n\n`
    content += `Document Structure: ${headers.length} columns, ${rows.length} rows\n\n`
    
    // Add column metadata
    if (csvMetadata?.columnTypes) {
      content += `Column Information:\n`
      headers.forEach(header => {
        const type = csvMetadata.columnTypes[header] || 'unknown'
        content += `- ${header}: ${type}\n`
      })
      content += `\n`
    }
    
    // Add sample data with better formatting
    content += `Sample Data (First 10 rows):\n`
    content += `Headers: ${headers.join(' | ')}\n`
    
    const sampleRows = rows.slice(0, 10)
    sampleRows.forEach((row, index) => {
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
      content += `Row ${index + 1}: ${values}\n`
    })
    
    if (rows.length > 10) {
      content += `... and ${rows.length - 10} more rows\n`
    }
    
    // Add statistical summaries for numeric columns
    if (csvMetadata?.columnTypes) {
      content += `\nColumn Statistics:\n`
      headers.forEach(header => {
        const type = csvMetadata.columnTypes[header]
        if (type === 'number' || type === 'integer') {
          const values = rows.map(row => Number(row[header])).filter(val => !isNaN(val))
          if (values.length > 0) {
            const min = Math.min(...values)
            const max = Math.max(...values)
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length
            content += `${header}: Min=${min}, Max=${max}, Avg=${avg.toFixed(2)}, Count=${values.length}\n`
          }
        } else if (type === 'string') {
          const values = rows.map(row => row[header]).filter(val => val !== '')
          const uniqueValues = new Set(values).size
          content += `${header}: ${values.length} values, ${uniqueValues} unique\n`
        }
      })
    }
    
    return content
  }

  private extractJSON(buffer: Buffer): ExtractionResult {
    try {
      const jsonString = buffer.toString('utf-8')
      const jsonObj = JSON.parse(jsonString)
      // Convert JSON to readable text
      const content = JSON.stringify(jsonObj, null, 2)
      
      return {
        content,
        success: true
      }
    } catch (error) {
      throw new Error('Invalid JSON format')
    }
  }

  private extractExcel(buffer: Buffer): ExtractionResult {
    try {
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false,
        sheetStubs: false,
        bookDeps: false,
        bookSheets: false,
        bookProps: false,
        bookVBA: false
      })
      
      let content = ''
      const sheetsMetadata: XLSXMetadata['sheets'] = []
      let hasFormulas = false
      let hasCharts = false
      let hasMacros = false
      
      // Check for macros
      if (workbook.Workbook && (workbook.Workbook as any).VBAProject) {
        hasMacros = true
      }
      
      // Process each sheet
      workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        const sheet = workbook.Sheets[sheetName]
        
        // Get sheet dimensions
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1')
        const rowCount = range.e.r + 1
        const columnCount = range.e.c + 1
        
        // Detect headers (first row)
        const headers: string[] = []
        const dataTypes: { [key: string]: string } = {}
        const mergedCells: Array<{ range: string; value: any }> = []
        
        // Process merged cells
        if (sheet['!merges']) {
          sheet['!merges'].forEach(merge => {
            const startCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })
            const endCell = XLSX.utils.encode_cell({ r: merge.e.r, c: merge.e.c })
            const value = sheet[startCell]?.v || ''
            mergedCells.push({
              range: `${startCell}:${endCell}`,
              value: value
            })
          })
        }
        
        // Extract headers and detect data types
        for (let col = 0; col < columnCount; col++) {
          const headerCell = XLSX.utils.encode_cell({ r: 0, c: col })
          const headerValue = sheet[headerCell]?.v || `Column_${col + 1}`
          headers.push(headerValue.toString())
          
          // Detect data types by sampling first 10 rows
          const sampleValues: any[] = []
          for (let row = 1; row < Math.min(11, rowCount); row++) {
            const cell = XLSX.utils.encode_cell({ r: row, c: col })
            const cellValue = sheet[cell]?.v
            if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
              sampleValues.push(cellValue)
            }
          }
          
          dataTypes[headerValue.toString()] = this.detectExcelColumnType(sampleValues)
        }
        
        // Check for formulas and charts
        let sheetHasFormulas = false
        let sheetHasCharts = false
        
        // Check for formulas
        for (let row = 0; row < rowCount; row++) {
          for (let col = 0; col < columnCount; col++) {
            const cell = XLSX.utils.encode_cell({ r: row, c: col })
            if (sheet[cell] && sheet[cell].f) {
              sheetHasFormulas = true
              break
            }
          }
          if (sheetHasFormulas) break
        }
        
        // Check for charts (simplified detection)
        if (sheet['!charts'] && sheet['!charts'].length > 0) {
          sheetHasCharts = true
        }
        
        if (sheetHasFormulas) hasFormulas = true
        if (sheetHasCharts) hasCharts = true
        
        // Store sheet metadata
        sheetsMetadata.push({
          name: sheetName,
          rowCount,
          columnCount,
          headers,
          dataTypes,
          hasFormulas: sheetHasFormulas,
          hasCharts: sheetHasCharts,
          mergedCells
        })
        
        // Generate content for this sheet
        content += `\n=== Sheet: ${sheetName} ===\n`
        content += `Dimensions: ${rowCount} rows × ${columnCount} columns\n`
        content += `Headers: ${headers.join(' | ')}\n`
        
        if (sheetHasFormulas) {
          content += `⚠️ Contains formulas\n`
        }
        if (sheetHasCharts) {
          content += `📊 Contains charts\n`
        }
        if (mergedCells.length > 0) {
          content += `🔗 Contains ${mergedCells.length} merged cells\n`
        }
        
        content += `\nData Types:\n`
        headers.forEach(header => {
          content += `- ${header}: ${dataTypes[header]}\n`
        })
        
        // Add sample data (first 10 rows)
        content += `\nSample Data:\n`
        const sampleRows = Math.min(10, rowCount)
        for (let row = 1; row < sampleRows; row++) {
          const rowData: string[] = []
          for (let col = 0; col < columnCount; col++) {
            const cell = XLSX.utils.encode_cell({ r: row, c: col })
            const cellValue = sheet[cell]?.v || ''
            rowData.push(cellValue.toString())
          }
          content += `Row ${row}: ${rowData.join(' | ')}\n`
        }
        
        if (rowCount > 10) {
          content += `... and ${rowCount - 10} more rows\n`
        }
        
        // Add statistical analysis for numeric columns
        const numericColumns = headers.filter(header => 
          dataTypes[header] === 'number' || dataTypes[header] === 'integer'
        )
        
        if (numericColumns.length > 0) {
          content += `\nStatistical Analysis:\n`
          numericColumns.forEach(column => {
            const colIndex = headers.indexOf(column)
            const values: number[] = []
            
            for (let row = 1; row < rowCount; row++) {
              const cell = XLSX.utils.encode_cell({ r: row, c: colIndex })
              const cellValue = sheet[cell]?.v
              if (typeof cellValue === 'number' && !isNaN(cellValue)) {
                values.push(cellValue)
              }
            }
            
            if (values.length > 0) {
              const min = Math.min(...values)
              const max = Math.max(...values)
              const avg = values.reduce((sum, val) => sum + val, 0) / values.length
              content += `${column}: Min=${min}, Max=${max}, Avg=${avg.toFixed(2)}, Count=${values.length}\n`
            }
          })
        }
        
        content += `\n`
      })
      
      const xlsxMetadata: XLSXMetadata = {
        sheets: sheetsMetadata,
        totalSheets: workbook.SheetNames.length,
        hasFormulas,
        hasCharts,
        hasMacros
      }
      
      return {
        content,
        success: true,
        metadata: {
          xlsxMetadata,
          wordCount: content.split(/\s+/).length
        }
      }
    } catch (error) {
      return {
        content: '',
        success: false,
        error: `Excel extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private detectExcelColumnType(values: any[]): string {
    if (values.length === 0) return 'empty'
    
    // Check for integers
    const allIntegers = values.every(val => 
      typeof val === 'number' && Number.isInteger(val) && val >= -2147483648 && val <= 2147483647
    )
    if (allIntegers) return 'integer'
    
    // Check for numbers
    const allNumbers = values.every(val => 
      typeof val === 'number' && !isNaN(val) && isFinite(val)
    )
    if (allNumbers) return 'number'
    
    // Check for dates
    const allDates = values.every(val => 
      val instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)))
    )
    if (allDates) return 'date'
    
    // Check for booleans
    const allBooleans = values.every(val => 
      typeof val === 'boolean' || 
      val === 1 || val === 0 ||
      val === 'TRUE' || val === 'FALSE' ||
      val === 'true' || val === 'false'
    )
    if (allBooleans) return 'boolean'
    
    // Check for formulas
    const allFormulas = values.every(val => 
      typeof val === 'string' && val.startsWith('=')
    )
    if (allFormulas) return 'formula'
    
    // Default to string
    return 'string'
  }

  // PDF Analysis Methods
  private async analyzePDFStructure(data: any, buffer: Buffer): Promise<PDFMetadata> {
    const text = data.text || ''
    // Use pageTexts if available, otherwise split by form feed
    const pages = data.pageTexts || text.split('\f')
    
    // Extract document info
    const documentInfo = this.extractPDFDocumentInfo(data)
    
    // Analyze structure
    const structure = {
      pages: this.analyzePDFPages(pages),
      headings: this.detectPDFHeadings(text),
      paragraphs: this.detectPDFParagraphs(text),
      tables: this.detectPDFTables(text),
      images: this.detectPDFImages(text),
      formFields: this.detectPDFFormFields(text)
    }
    
    // Content analysis
    const contentAnalysis = this.analyzePDFContent(text, structure)
    
    return {
      documentInfo,
      structure,
      contentAnalysis
    }
  }

  private extractPDFDocumentInfo(data: any): PDFMetadata['documentInfo'] {
    const info = data.info || {}
    const metadata = data.metadata || {}
    
    return {
      title: info.Title || metadata.title || undefined,
      author: info.Author || metadata.author || undefined,
      subject: info.Subject || metadata.subject || undefined,
      creator: info.Creator || metadata.creator || undefined,
      producer: info.Producer || metadata.producer || undefined,
      creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info.ModDate ? new Date(info.ModDate) : undefined,
      keywords: info.Keywords || metadata.keywords || undefined,
      pageCount: data.numpages || 0
    }
  }

  private analyzePDFPages(pages: string[]): PDFMetadata['structure']['pages'] {
    return pages.map((pageText, index) => {
      const words = pageText.split(/\s+/).filter(word => word.length > 0)
      return {
        pageNumber: index + 1,
        text: pageText.trim(),
        wordCount: words.length,
        hasImages: this.detectPageImages(pageText),
        hasTables: this.detectPageTables(pageText),
        hasFormFields: this.detectPageFormFields(pageText)
      }
    })
  }

  private detectPDFHeadings(text: string): PDFMetadata['structure']['headings'] {
    const headings: PDFMetadata['structure']['headings'] = []
    const lines = text.split('\n')
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (trimmedLine.length === 0) return
      
      // Detect heading patterns
      const headingPatterns = [
        /^[A-Z][A-Z\s]+$/, // ALL CAPS
        /^\d+\.?\s+[A-Z]/, // Numbered headings
        /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/, // Title Case
        /^[IVX]+\.?\s+[A-Z]/, // Roman numerals
        /^[A-Z]\.\s+[A-Z]/, // Letter headings
      ]
      
      const isHeading = headingPatterns.some(pattern => pattern.test(trimmedLine))
      
      if (isHeading && trimmedLine.length < 100) {
        const level = this.determineHeadingLevel(trimmedLine)
        headings.push({
          level,
          text: trimmedLine,
          pageNumber: this.getPageNumberForPosition(text, index),
          position: index
        })
      }
    })
    
    return headings
  }

  private detectPDFParagraphs(text: string): PDFMetadata['structure']['paragraphs'] {
    const paragraphs: PDFMetadata['structure']['paragraphs'] = []
    const lines = text.split('\n')
    let currentParagraph = ''
    let paragraphStart = 0
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      if (trimmedLine.length === 0) {
        if (currentParagraph.trim().length > 0) {
          paragraphs.push({
            text: currentParagraph.trim(),
            pageNumber: this.getPageNumberForPosition(text, paragraphStart),
            position: paragraphStart,
            wordCount: currentParagraph.split(/\s+/).filter(w => w.length > 0).length
          })
          currentParagraph = ''
        }
      } else {
        if (currentParagraph.length === 0) {
          paragraphStart = index
        }
        currentParagraph += (currentParagraph.length > 0 ? ' ' : '') + trimmedLine
      }
    })
    
    // Add final paragraph
    if (currentParagraph.trim().length > 0) {
      paragraphs.push({
        text: currentParagraph.trim(),
        pageNumber: this.getPageNumberForPosition(text, paragraphStart),
        position: paragraphStart,
        wordCount: currentParagraph.split(/\s+/).filter(w => w.length > 0).length
      })
    }
    
    return paragraphs
  }

  private detectPDFTables(text: string): PDFMetadata['structure']['tables'] {
    const tables: PDFMetadata['structure']['tables'] = []
    const lines = text.split('\n')
    
    let currentTable: string[] = []
    let tableStart = 0
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      // Detect table patterns (multiple columns separated by spaces/tabs)
      const columns = trimmedLine.split(/\s{2,}|\t+/).filter(col => col.trim().length > 0)
      
      if (columns.length >= 2) {
        if (currentTable.length === 0) {
          tableStart = index
        }
        currentTable.push(trimmedLine)
      } else {
        if (currentTable.length >= 2) {
          tables.push({
            pageNumber: this.getPageNumberForPosition(text, tableStart),
            rows: currentTable.length,
            columns: Math.max(...currentTable.map(row => 
              row.split(/\s{2,}|\t+/).filter(col => col.trim().length > 0).length
            )),
            content: currentTable.join('\n'),
            position: tableStart
          })
        }
        currentTable = []
      }
    })
    
    // Add final table
    if (currentTable.length >= 2) {
      tables.push({
        pageNumber: this.getPageNumberForPosition(text, tableStart),
        rows: currentTable.length,
        columns: Math.max(...currentTable.map(row => 
          row.split(/\s{2,}|\t+/).filter(col => col.trim().length > 0).length
        )),
        content: currentTable.join('\n'),
        position: tableStart
      })
    }
    
    return tables
  }

  private detectPDFImages(text: string): PDFMetadata['structure']['images'] {
    const images: PDFMetadata['structure']['images'] = []
    
    // Look for image references in text
    const imagePatterns = [
      /Figure\s+\d+/gi,
      /Fig\.\s*\d+/gi,
      /Image\s+\d+/gi,
      /Picture\s+\d+/gi,
      /Photo\s+\d+/gi,
      /Chart\s+\d+/gi,
      /Diagram\s+\d+/gi
    ]
    
    const lines = text.split('\n')
    lines.forEach((line, index) => {
      imagePatterns.forEach(pattern => {
        const matches = line.match(pattern)
        if (matches) {
          matches.forEach(match => {
            images.push({
              pageNumber: this.getPageNumberForPosition(text, index),
              description: match,
              position: index
            })
          })
        }
      })
    })
    
    return images
  }

  private detectPDFFormFields(text: string): PDFMetadata['structure']['formFields'] {
    const formFields: PDFMetadata['structure']['formFields'] = []
    
    // Look for form field patterns
    const fieldPatterns = [
      /Name:\s*_+/gi,
      /Date:\s*_+/gi,
      /Signature:\s*_+/gi,
      /Email:\s*_+/gi,
      /Phone:\s*_+/gi,
      /Address:\s*_+/gi,
      /Check\s*box/gi,
      /Radio\s*button/gi
    ]
    
    const lines = text.split('\n')
    lines.forEach((line, index) => {
      fieldPatterns.forEach(pattern => {
        const matches = line.match(pattern)
        if (matches) {
          matches.forEach(match => {
            formFields.push({
              name: match.replace(/[:\s_]+$/, ''),
              type: this.determineFieldType(match),
              pageNumber: this.getPageNumberForPosition(text, index),
              value: undefined
            })
          })
        }
      })
    })
    
    return formFields
  }

  private analyzePDFContent(text: string, structure: PDFMetadata['structure']): PDFMetadata['contentAnalysis'] {
    const words = text.split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    return {
      language: this.detectLanguage(text),
      readabilityScore: this.calculateAvgSyllables(words),
      avgWordsPerPage: structure.pages.length > 0 ? 
        Math.round(words.length / structure.pages.length) : 0,
      totalWordCount: words.length,
      topicKeywords: this.extractTopicKeywords(words),
      documentType: this.detectPDFDocumentType(text, structure),
      hasFootnotes: this.detectFootnotes(text),
      hasReferences: this.detectReferences(text),
      hasBibliography: this.detectBibliography(text)
    }
  }

  private formatPDFForRAG(data: any, metadata: PDFMetadata): string {
    let content = '**📄 PDF Document Analysis**\n\n'
    
    // Document summary
    content += `**Document Information:**\n`
    content += `- Title: ${metadata.documentInfo.title || 'Untitled'}\n`
    content += `- Author: ${metadata.documentInfo.author || 'Unknown'}\n`
    content += `- Pages: ${metadata.documentInfo.pageCount}\n`
    content += `- Total Words: ${metadata.contentAnalysis.totalWordCount}\n`
    content += `- Document Type: ${metadata.contentAnalysis.documentType}\n`
    content += `- Language: ${metadata.contentAnalysis.language}\n\n`
    
    // Structure overview
    content += `**Document Structure:**\n`
    content += `- Headings: ${metadata.structure.headings.length}\n`
    content += `- Paragraphs: ${metadata.structure.paragraphs.length}\n`
    content += `- Tables: ${metadata.structure.tables.length}\n`
    content += `- Images: ${metadata.structure.images.length}\n`
    content += `- Form Fields: ${metadata.structure.formFields.length}\n\n`
    
    // Headings outline
    if (metadata.structure.headings.length > 0) {
      content += `**Document Outline:**\n`
      metadata.structure.headings.forEach(heading => {
        const indent = '  '.repeat(heading.level - 1)
        content += `${indent}${heading.level}. ${heading.text} (Page ${heading.pageNumber})\n`
      })
      content += '\n'
    }
    
    // Key paragraphs (first few and longest ones)
    const keyParagraphs = metadata.structure.paragraphs
      .sort((a, b) => b.wordCount - a.wordCount)
      .slice(0, 10)
    
    if (keyParagraphs.length > 0) {
      content += `**Key Content Sections:**\n`
      keyParagraphs.forEach((paragraph, index) => {
        content += `${index + 1}. [Page ${paragraph.pageNumber}] ${paragraph.text.substring(0, 200)}${paragraph.text.length > 200 ? '...' : ''}\n\n`
      })
    }
    
    // Tables
    if (metadata.structure.tables.length > 0) {
      content += `**Tables Found:**\n`
      metadata.structure.tables.forEach((table, index) => {
        content += `Table ${index + 1} (Page ${table.pageNumber}): ${table.rows} rows × ${table.columns} columns\n`
        content += `${table.content.substring(0, 300)}${table.content.length > 300 ? '...' : ''}\n\n`
      })
    }
    
    // Topic keywords
    if (metadata.contentAnalysis.topicKeywords.length > 0) {
      content += `**Key Topics:** ${metadata.contentAnalysis.topicKeywords.join(', ')}\n\n`
    }
    
    // Full text content
    content += `**Full Document Content:**\n${data.text}`
    
    return content
  }

  // Helper methods for PDF analysis
  private determineHeadingLevel(text: string): number {
    if (/^[IVX]+\.?\s+/.test(text)) return 1 // Roman numerals
    if (/^\d+\.?\s+/.test(text)) return 2 // Numbers
    if (/^[A-Z]\.\s+/.test(text)) return 3 // Letters
    if (/^[A-Z][A-Z\s]+$/.test(text)) return 1 // ALL CAPS
    return 2 // Default
  }

  private getPageNumberForPosition(text: string, position: number): number {
    const beforePosition = text.substring(0, position)
    const pageBreaks = (beforePosition.match(/\f/g) || []).length
    return pageBreaks + 1
  }

  private detectPageImages(pageText: string): boolean {
    const imagePatterns = [/Figure\s+\d+/gi, /Fig\.\s*\d+/gi, /Image\s+\d+/gi]
    return imagePatterns.some(pattern => pattern.test(pageText))
  }

  private detectPageTables(pageText: string): boolean {
    const lines = pageText.split('\n')
    const tableLines = lines.filter(line => {
      const columns = line.split(/\s{2,}|\t+/).filter(col => col.trim().length > 0)
      return columns.length >= 2
    })
    return tableLines.length >= 2
  }

  private detectPageFormFields(pageText: string): boolean {
    const fieldPatterns = [/Name:\s*_+/, /Date:\s*_+/, /Signature:\s*_+/, /Check\s*box/gi]
    return fieldPatterns.some(pattern => pattern.test(pageText))
  }

  private determineFieldType(fieldText: string): string {
    if (/name/i.test(fieldText)) return 'text'
    if (/date/i.test(fieldText)) return 'date'
    if (/signature/i.test(fieldText)) return 'signature'
    if (/email/i.test(fieldText)) return 'email'
    if (/phone/i.test(fieldText)) return 'phone'
    if (/check/i.test(fieldText)) return 'checkbox'
    if (/radio/i.test(fieldText)) return 'radio'
    return 'text'
  }

  private detectPDFDocumentType(text: string, structure: PDFMetadata['structure']): string {
    const lowerText = text.toLowerCase()
    
    if (structure.formFields.length > 0) return 'Form'
    if (structure.tables.length > 3) return 'Data Report'
    if (lowerText.includes('invoice') || lowerText.includes('bill')) return 'Invoice'
    if (lowerText.includes('contract') || lowerText.includes('agreement')) return 'Contract'
    if (lowerText.includes('resume') || lowerText.includes('cv')) return 'Resume'
    if (lowerText.includes('manual') || lowerText.includes('guide')) return 'Manual'
    if (lowerText.includes('report') || lowerText.includes('analysis')) return 'Report'
    if (lowerText.includes('presentation') || lowerText.includes('slides')) return 'Presentation'
    if (structure.headings.length > 5) return 'Structured Document'
    
    return 'General Document'
  }

  private detectFootnotes(text: string): boolean {
    return /\d+\.\s*[A-Z]/.test(text) || /\[\d+\]/.test(text)
  }

  private detectReferences(text: string): boolean {
    const refPatterns = [
      /references?/i,
      /bibliography/i,
      /works?\s+cited/i,
      /sources?/i
    ]
    return refPatterns.some(pattern => pattern.test(text))
  }

  private detectBibliography(text: string): boolean {
    return /bibliography/i.test(text) || /works?\s+cited/i.test(text)
  }
}

export const fileProcessor = new FileProcessor()