import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename with userid_filename format
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueId = randomUUID();
    const fileName = `${session.user.id}_${uniqueId}.${fileExtension}`;
    
    // Create form data for external API
    const uploadFormData = new FormData();
    uploadFormData.append('file_name', file, fileName);

    // Upload to external API with timeout and retry
    let fileUrl: string;
    try {
      let uploadResponse;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          uploadResponse = await fetch('https://da.outreachdeal.com/upload.php', {
            method: 'POST',
            body: uploadFormData,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          if (retryCount > maxRetries) {
            throw new Error(`Upload failed after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.text();
      
      // Log the response to see the format
      console.log('Upload API Response:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        headers: Object.fromEntries(uploadResponse.headers.entries()),
        body: uploadResult
      });
      
      // Parse the response to get the file URL
      try {
        // Try to parse as JSON first
        const result = JSON.parse(uploadResult);
        console.log('Parsed JSON result:', result);
        
        if (result.error) {
          throw new Error(`Upload failed: ${result.error}`);
        } else if (result.url) {
          fileUrl = result.url;
        } else if (result.file_name) {
          // If no URL but has filename, construct URL
          fileUrl = `https://da.outreachdeal.com/OMS/${result.file_name}`;
        } else {
          throw new Error('No URL or filename in response');
        }
      } catch (parseError) {
        // Only treat as direct URL if it's not a JSON parse error from an error response
        if (parseError instanceof Error && parseError.message.includes('Upload failed:')) {
          throw parseError; // Re-throw upload errors
        }
        console.log('JSON parse error:', parseError);
        console.log('Treating as direct URL:', uploadResult);
        // If not JSON, treat as direct URL
        fileUrl = uploadResult.trim();
      }
      
      console.log('Final fileUrl:', fileUrl);
    } catch (uploadError) {
      console.error('External upload failed:', uploadError);
      // Return error response instead of continuing with invalid URL
      return NextResponse.json(
        { error: `File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Store in database
    let document: any
    try {
      document = await prisma.user_documents.create({
        data: {
          id: randomUUID(), // Generate ID explicitly
          user_id: session.user.id,
          original_name: file.name,
          file_name: fileName,
          file_url: fileUrl,
          file_size: file.size,
          mime_type: file.type,
        },
      })
    } catch (dbError) {
      console.error('Failed to create document in DB, returning ephemeral:', dbError)
      // Fallback: return an ephemeral document object so the UI can proceed
      document = {
        id: randomUUID(),
        original_name: file.name,
        file_name: fileName,
        file_url: fileUrl,
        uploaded_at: new Date().toISOString(),
      }
    }


    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        originalName: document.original_name,
        fileName: document.file_name,
        fileUrl: document.file_url,
        fileSize: document.file_size,
        mimeType: document.mime_type,
        uploadedAt: document.uploaded_at instanceof Date ? document.uploaded_at.toISOString() : document.uploaded_at,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    let documents: any[] = []
    try {
      const dbDocuments = await prisma.user_documents.findMany({
        where: {
          user_id: session.user.id,
          is_active: true,
          ...(search && {
            OR: [
              { original_name: { contains: search, mode: 'insensitive' } },
              { file_name: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        orderBy: { uploaded_at: 'desc' },
        take: limit,
        select: {
          id: true,
          original_name: true,
          file_name: true,
          file_url: true,
          file_size: true,
          mime_type: true,
          uploaded_at: true,
          access_count: true,
        },
      })
      
      // Transform snake_case to camelCase for frontend compatibility
      documents = dbDocuments.map(doc => ({
        id: doc.id,
        originalName: doc.original_name,
        fileName: doc.file_name,
        fileUrl: doc.file_url,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        uploadedAt: doc.uploaded_at.toISOString(),
        accessCount: doc.access_count,
      }))
    } catch (dbError) {
      console.error('Get documents error:', dbError);
      // Fallback: return empty array if DB query fails
      return NextResponse.json({ documents: [], warning: 'Failed to fetch documents from DB.' });
    }

    return NextResponse.json({ documents });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

