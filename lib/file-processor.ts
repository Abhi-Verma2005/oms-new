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
      const data = await PDFParser(buffer)
      return {
        content: data.text,
        success: true,
        metadata: {
          pageCount: data.numpages,
          wordCount: data.text.split(/\s+/).length
        }
      }
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      let content = ''
      
      // Extract all sheets
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        content += `\n=== Sheet: ${sheetName} ===\n`
        content += XLSX.utils.sheet_to_txt(sheet)
      })
      
      return {
        content,
        success: true
      }
    } catch (error) {
      throw new Error(`Excel extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const fileProcessor = new FileProcessor()