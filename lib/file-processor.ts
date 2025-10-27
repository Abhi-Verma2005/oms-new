import PDFParser from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export interface ExtractionResult {
  content: string
  success: boolean
  error?: string
  metadata?: {
    pageCount?: number
    wordCount?: number
    csvMetadata?: CSVMetadata
    xlsxMetadata?: XLSXMetadata
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
      console.log('📄 Starting PDF extraction...')
      console.log('📊 Buffer size:', buffer.length)
      
      // Try to parse the PDF
      const data = await PDFParser(buffer)
      
      console.log('📄 PDF parser result:', {
        hasText: !!data.text,
        textLength: data.text?.length || 0,
        numPages: data.numpages,
        hasData: !!data
      })
      
      // Check if data is valid
      if (!data) {
        throw new Error('PDF parser returned null/undefined')
      }
      
      if (!data.text) {
        throw new Error('PDF parser returned no text content')
      }
      
      if (data.text.trim().length === 0) {
        throw new Error('PDF contains no readable text (might be image-based)')
      }
      
      return {
        content: data.text,
        success: true,
        metadata: {
          pageCount: data.numpages || 0,
          wordCount: data.text.split(/\s+/).length
        }
      }
    } catch (error) {
      console.error('❌ PDF extraction error:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Return a fallback result instead of throwing
      return {
        content: '',
        success: false,
        error: `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          pageCount: 0,
          wordCount: 0
        }
      }
    }
  }

  private async extractDOCX(buffer: Buffer): Promise<ExtractionResult> {
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
      throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
    const result = []
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
    return result.map(field => {
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
      if (workbook.Workbook && workbook.Workbook.VBAProject) {
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
          const sampleValues = []
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
          const rowData = []
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
            const values = []
            
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
}

export const fileProcessor = new FileProcessor()