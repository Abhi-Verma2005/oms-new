import type { Buffer } from 'buffer'

export interface ExtractionResult {
  text: string
  metadata?: {
    pageCount?: number
    title?: string
  }
  success: boolean
  method: string
}

/**
 * Main extraction router
 */
export async function extractDocumentContent(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ExtractionResult> {
  const extension = filename.split('.').pop()?.toLowerCase()

  try {
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return await extractPdfContent(buffer, filename)
    }
    
    if (mimeType.includes('word') || ['doc', 'docx'].includes(extension!)) {
      return await extractWordContent(buffer)
    }
    
    if (mimeType.startsWith('image/')) {
      console.log('🖼️ Processing image file...')
      return await extractImageContent(buffer)
    }
    
    if (mimeType.startsWith('text/') || extension === 'md' || extension === 'txt') {
      return extractTextContent(buffer)
    }
    
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || ['xlsx', 'xls'].includes(extension!)) {
      return await extractExcelContent(buffer)
    }
    
    return {
      text: '',
      success: false,
      method: 'unsupported'
    }
  } catch (error) {
    console.error(`❌ Extraction failed:`, error)
    return {
      text: '',
      success: false,
      method: 'error'
    }
  }
}

/**
 * PDF Extraction - FIXED VERSION
 */
async function extractPdfContent(buffer: Buffer, filename: string): Promise<ExtractionResult> {
  console.log('🔍 Starting PDF extraction...')
  
  // METHOD 1: Try pdf-parse (best for text-based PDFs)
  try {
    console.log('📄 Trying pdf-parse method...')
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js')
    const data = await pdfParse.default(buffer)
    
    if (data.text && data.text.trim().length > 100) {
      const cleanedText = cleanExtractedText(data.text)
      
      if (cleanedText.length > 50) {
        console.log('✅ pdf-parse success:', {
          originalLength: data.text.length,
          cleanedLength: cleanedText.length,
          pages: data.numpages
        })
        
        return {
          text: cleanedText,
          metadata: {
            pageCount: data.numpages,
            title: data.info?.Title
          },
          success: true,
          method: 'pdf-parse'
        }
      }
    }
    console.log('⚠️ pdf-parse returned insufficient text')
  } catch (error) {
    console.log('⚠️ pdf-parse failed:', error instanceof Error ? error.message : 'Unknown error')
  }

  // METHOD 2: Try alternative PDF parsing
  try {
    console.log('📄 Trying alternative PDF parsing...')
    const result = await extractWithAlternativeMethod(buffer)
    
    if (result && result.length > 50) {
      console.log('✅ Alternative method success:', result.length, 'chars')
      return {
        text: result,
        success: true,
        method: 'alternative-parsing'
      }
    }
    console.log('⚠️ Alternative method returned insufficient text')
  } catch (error) {
    console.log('⚠️ Alternative method failed:', error instanceof Error ? error.message : 'Unknown error')
  }

  // METHOD 3: Advanced text extraction from PDF structure
  try {
    console.log('📄 Trying advanced structure extraction...')
    const result = extractTextFromPdfStructure(buffer)
    
    if (result && result.length > 50) {
      console.log('✅ Structure extraction success:', result.length, 'chars')
      return {
        text: result,
        success: true,
        method: 'structure-extraction'
      }
    }
    console.log('⚠️ Structure extraction returned insufficient text')
  } catch (error) {
    console.log('⚠️ Structure extraction failed:', error instanceof Error ? error.message : 'Unknown error')
  }

  console.log('❌ All PDF extraction methods failed')
  return {
    text: `Unable to extract text from ${filename}. The PDF may be image-based or encrypted.`,
    success: false,
    method: 'all-failed'
  }
}

/**
 * Alternative PDF parsing method (without canvas dependency)
 */
async function extractWithAlternativeMethod(buffer: Buffer): Promise<string> {
  // This is a simplified approach that doesn't require canvas
  // We'll use the structure extraction method as an alternative
  return extractTextFromPdfStructure(buffer)
}

/**
 * Extract text from PDF structure (fallback method)
 * This extracts actual text content, not binary data
 */
function extractTextFromPdfStructure(buffer: Buffer): string {
  const pdfString = buffer.toString('latin1')
  const textParts: string[] = []
  
  // Method 1: Extract from text objects (BT...ET blocks)
  const textObjectRegex = /BT\s+([\s\S]*?)\s+ET/g
  let match
  
  while ((match = textObjectRegex.exec(pdfString)) !== null) {
    const textBlock = match[1]
    
    // Extract strings from Tj, TJ, and ' operators
    const stringMatches = [
      ...textBlock.matchAll(/\(((?:[^()\\]|\\.)*?)\)\s*Tj/g),
      ...textBlock.matchAll(/\(((?:[^()\\]|\\.)*?)\)\s*'/g),
      ...textBlock.matchAll(/\[(.*?)\]\s*TJ/g)
    ]
    
    for (const strMatch of stringMatches) {
      let text = strMatch[1]
      
      // Decode escaped characters
      text = text
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\b/g, '\b')
        .replace(/\\f/g, '\f')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
      
      // Filter out obvious non-text content
      if (text.length > 2 && !/^[\x00-\x1F\x7F-\xFF]+$/.test(text)) {
        textParts.push(text)
      }
    }
  }
  
  // Method 2: Extract from stream objects
  const streamRegex = /stream\s+([\s\S]*?)\s+endstream/g
  while ((match = streamRegex.exec(pdfString)) !== null) {
    const streamContent = match[1]
    
    // Look for readable text in streams
    const readableText = streamContent.match(/[A-Za-z][A-Za-z0-9\s.,!?;:'"()\-]{15,}/g)
    if (readableText) {
      textParts.push(...readableText.filter(t => 
        !t.match(/^(Length|Filter|FlateDecode|Type|Font|Page|Catalog)/)
      ))
    }
  }
  
  const extractedText = textParts.join(' ')
  return cleanExtractedText(extractedText)
}

/**
 * Clean extracted text - remove PDF artifacts and normalize
 */
function cleanExtractedText(text: string): string {
  return text
    // Remove null bytes and control characters
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    
    // Remove PDF-specific markers
    .replace(/\/[A-Z][A-Za-z0-9]+/g, '') // Remove /Type, /Font, etc.
    .replace(/\d+\s+0\s+obj/g, '')
    .replace(/endobj/g, '')
    .replace(/stream\s+/g, '')
    .replace(/endstream/g, '')
    
    // Remove hex strings
    .replace(/<[0-9A-Fa-f\s]+>/g, '')
    
    // Remove encoding artifacts
    .replace(/\(\\[0-9]{3}\)/g, '')
    
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    
    // Remove leading/trailing whitespace
    .trim()
    
    // Remove lines that are just numbers or single characters
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      return trimmed.length > 3 && !/^[\d\s]+$/.test(trimmed)
    })
    .join('\n')
}

/**
 * Word Document Extraction
 */
async function extractWordContent(buffer: Buffer): Promise<ExtractionResult> {
  try {
    console.log('📄 Trying Mammoth for Word document...')
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    
    console.log('📄 Mammoth result:', {
      hasText: !!result.value,
      textLength: result.value?.length || 0,
      preview: result.value?.substring(0, 100) || 'No text'
    })
    
    if (result.value && result.value.trim().length > 0) {
      return {
        text: result.value.trim(),
        success: true,
        method: 'mammoth'
      }
    } else {
      console.log('⚠️ Mammoth returned empty text, trying fallback...')
      // Fallback: try to extract as plain text
      const textContent = buffer.toString('utf-8')
      const cleanedText = textContent
        .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable characters
        .replace(/\s+/g, ' ')
        .trim()
      
      if (cleanedText.length > 10) {
        console.log('✅ Fallback text extraction successful:', cleanedText.length, 'chars')
        return {
          text: cleanedText,
          success: true,
          method: 'fallback-text'
        }
      }
      
      return {
        text: 'Unable to extract text from Word document. The file may be corrupted or in an unsupported format.',
        success: false,
        method: 'word-failed'
      }
    }
  } catch (error) {
    console.log('⚠️ Mammoth failed:', error instanceof Error ? error.message : 'Unknown error')
    
    // Fallback: try to extract as plain text
    try {
      const textContent = buffer.toString('utf-8')
      const cleanedText = textContent
        .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable characters
        .replace(/\s+/g, ' ')
        .trim()
      
      if (cleanedText.length > 10) {
        console.log('✅ Fallback text extraction successful:', cleanedText.length, 'chars')
        return {
          text: cleanedText,
          success: true,
          method: 'fallback-text'
        }
      }
    } catch (fallbackError) {
      console.log('⚠️ Fallback also failed:', fallbackError)
    }
    
    return {
      text: 'Unable to extract text from Word document. The file may be corrupted or in an unsupported format.',
      success: false,
      method: 'word-failed'
    }
  }
}

/**
 * Image Extraction with OCR
 */
async function extractImageContent(buffer: Buffer): Promise<ExtractionResult> {
  try {
    // Check if we're in a server environment that supports Tesseract
    if (typeof window !== 'undefined') {
      // Client-side: Use Tesseract.js
      const Tesseract = await import('tesseract.js')
      
      const { data } = await Tesseract.recognize(buffer, 'eng', {
        logger: () => {}
      })
      
      return {
        text: data.text.trim(),
        success: data.text.trim().length > 0,
        method: 'tesseract-ocr'
      }
    } else {
      // Server-side: Return a helpful message
      return {
        text: 'Image OCR is not available on the server. Please use a text-based document or try uploading from the client-side.',
        success: false,
        method: 'server-ocr-unavailable'
      }
    }
  } catch (error) {
    console.log('⚠️ OCR failed:', error instanceof Error ? error.message : 'Unknown error')
    return {
      text: 'Unable to extract text from image. OCR processing failed.',
      success: false,
      method: 'ocr-failed'
    }
  }
}

/**
 * Plain Text Extraction
 */
function extractTextContent(buffer: Buffer): ExtractionResult {
  const text = buffer.toString('utf-8')
  return {
    text: text.trim(),
    success: true,
    method: 'utf8'
  }
}

/**
 * Excel File Extraction
 */
async function extractExcelContent(buffer: Buffer): Promise<ExtractionResult> {
  try {
    console.log('📊 Processing Excel file...')
    const XLSX = await import('xlsx')
    
    // Read the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    let allText = ''
    const sheetNames = workbook.SheetNames
    
    console.log('📊 Excel sheets found:', sheetNames.length)
    
    // Extract text from all sheets
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      const sheetData = XLSX.utils.sheet_to_txt(worksheet)
      
      if (sheetData && sheetData.trim()) {
        allText += `\n--- Sheet: ${sheetName} ---\n`
        allText += sheetData.trim()
        allText += '\n'
      }
    }
    
    if (allText.trim()) {
      console.log('✅ Excel extraction successful:', allText.length, 'chars')
      return {
        text: allText.trim(),
        success: true,
        method: 'xlsx',
        metadata: {
          pageCount: sheetNames.length
        }
      }
    } else {
      return {
        text: 'No readable content found in Excel file.',
        success: false,
        method: 'xlsx-empty'
      }
    }
  } catch (error) {
    console.log('⚠️ Excel extraction failed:', error instanceof Error ? error.message : 'Unknown error')
    return {
      text: 'Unable to extract content from Excel file. The file may be corrupted or in an unsupported format.',
      success: false,
      method: 'xlsx-failed'
    }
  }
}