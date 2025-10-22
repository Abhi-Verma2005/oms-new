import { prisma } from '@/lib/db';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

interface CachedDocument {
  id: string;
  content: string;
  lastFetched: Date;
  accessCount: number;
}

// In-memory cache for document content
const documentCache = new Map<string, CachedDocument>();

// Cache TTL: 1 hour
const CACHE_TTL = 60 * 60 * 1000;

export async function getDocumentContent(documentId: string, fileUrl: string): Promise<string> {
  // Check in-memory cache first
  const cached = documentCache.get(documentId);
  if (cached && (Date.now() - cached.lastFetched.getTime()) < CACHE_TTL) {
    cached.accessCount++;
    return cached.content;
  }

  try {
    // Validate URL format
    let validUrl: string;
    try {
      // Try to parse as JSON first (in case it's a JSON string)
      const parsed = JSON.parse(fileUrl);
      if (parsed.url) {
        validUrl = parsed.url;
      } else if (parsed.file_name) {
        validUrl = `https://da.outreachdeal.com/OMS/${parsed.file_name}`;
      } else {
        throw new Error('Invalid JSON response format');
      }
    } catch {
      // If not JSON, use as direct URL
      validUrl = fileUrl;
    }

    // Validate URL is properly formatted
    new URL(validUrl);

    // Fetch content from URL
    console.log('Fetching document from URL:', validUrl);
    const response = await fetch(validUrl);
    console.log('Document fetch response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      contentType: response.headers.get('content-type')
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    console.log('Document content type:', contentType);
    
    let content: string;
    
    if (contentType.includes('application/pdf')) {
      console.log('Document is PDF, extracting text...');
      try {
        const buffer = await response.arrayBuffer();
        const pdfData = await pdf.default(Buffer.from(buffer));
        content = pdfData.text;
        console.log('PDF text extracted, length:', content.length);
      } catch (error) {
        console.error('PDF extraction failed:', error);
        content = `[PDF Document: ${documentId}] - Text extraction failed.`;
      }
    } else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
               contentType.includes('application/msword')) {
      console.log('Document is Word, extracting text...');
      try {
        const buffer = await response.arrayBuffer();
        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
        content = result.value;
        console.log('Word text extracted, length:', content.length);
      } catch (error) {
        console.error('Word extraction failed:', error);
        content = `[Word Document: ${documentId}] - Text extraction failed.`;
      }
    } else if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
               contentType.includes('application/vnd.ms-excel')) {
      console.log('Document is Excel, extracting text...');
      try {
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(Buffer.from(buffer), { type: 'buffer' });
        const sheets = workbook.SheetNames;
        const extractedData: string[] = [];
        
        sheets.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          extractedData.push(`Sheet: ${sheetName}`);
          jsonData.forEach((row: any) => {
            if (Array.isArray(row)) {
              extractedData.push(row.join('\t'));
            }
          });
        });
        
        content = extractedData.join('\n');
        console.log('Excel text extracted, length:', content.length);
      } catch (error) {
        console.error('Excel extraction failed:', error);
        content = `[Excel Document: ${documentId}] - Text extraction failed.`;
      }
    } else if (contentType.includes('text/')) {
      content = await response.text();
      console.log('Text content extracted, length:', content.length);
    } else {
      // Try to extract as text anyway
      try {
        content = await response.text();
        console.log('Unknown content type, extracted as text, length:', content.length);
      } catch (error) {
        console.error('Text extraction failed:', error);
        content = `[Document: ${documentId}] - Content type ${contentType} not supported.`;
      }
    }
    
    // Update access count in database
    await prisma.userDocument.update({
      where: { id: documentId },
      data: {
        accessCount: { increment: 1 },
        lastAccessed: new Date(),
      },
    });

    // Cache the content
    documentCache.set(documentId, {
      id: documentId,
      content,
      lastFetched: new Date(),
      accessCount: 1,
    });

    return content;
  } catch (error) {
    console.error('Error fetching document content:', error);
    throw new Error('Failed to fetch document content');
  }
}

export async function getMultipleDocumentContents(documents: Array<{
  id: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}>): Promise<Array<{ id: string; name: string; content: string }>> {
  const results = await Promise.allSettled(
    documents.map(async (doc) => {
      const content = await getDocumentContent(doc.id, doc.fileUrl);
      return {
        id: doc.id,
        name: doc.originalName,
        content,
      };
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<{ id: string; name: string; content: string }> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

// Clean up expired cache entries
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of documentCache.entries()) {
    if (now - value.lastFetched.getTime() > CACHE_TTL) {
      documentCache.delete(key);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupCache, 30 * 60 * 1000);

