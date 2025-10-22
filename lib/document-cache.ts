import { prisma } from '@/lib/db';
import { extractDocumentContent } from '@/lib/document-extraction'
import https from 'node:https'
import fetch, { Response } from 'node-fetch'

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

    // Helper to fetch with normal TLS first, then retry with relaxed TLS if needed
    async function fetchDocument(validUrl: string): Promise<{ buffer: Buffer, contentType: string }> {
      try {
        const res = await fetch(validUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const ct = res.headers.get('content-type') || ''
        const ab = await res.arrayBuffer()
        return { buffer: Buffer.from(ab), contentType: ct }
      } catch (err: any) {
        if (/self-signed certificate/i.test(String(err?.message))) {
          console.warn('⚠️ TLS self-signed cert detected, retrying insecurely...')
          const agent = new https.Agent({ rejectUnauthorized: false })
          const res = await fetch(validUrl, { agent } as any)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const ct = res.headers.get('content-type') || ''
          const ab = await res.arrayBuffer()
          return { buffer: Buffer.from(ab), contentType: ct }
        }
        throw err
      }
    }

    console.log('Fetching document from URL:', validUrl);
    const { buffer: fileBuffer, contentType } = await fetchDocument(validUrl)
    console.log('Fetched file buffer size:', fileBuffer.byteLength)
    console.log('Document content type:', contentType)

    // Fetch metadata from DB to get originalName and mimeType
    const dbDoc = await prisma.user_documents.findUnique({
      where: { id: documentId },
      select: { original_name: true, mime_type: true }
    });
    const filename = dbDoc?.original_name || validUrl.split('/').pop() || 'document';
    const mimeType = dbDoc?.mime_type || contentType;
    console.log('Passing to extractor:', { filename, mimeType });

    const extraction = await extractDocumentContent(fileBuffer, filename, mimeType);
    console.log('Extraction result:', { success: extraction.success, method: extraction.method, length: extraction.text.length });

    const content = extraction.text || `[Document: ${filename}] - No extractable text.`;
    
    // Update access count in database
    await prisma.user_documents.update({
      where: { id: documentId },
      data: {
        access_count: { increment: 1 },
        last_accessed: new Date(),
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

