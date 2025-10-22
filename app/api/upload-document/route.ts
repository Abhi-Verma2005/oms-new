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
    let fileUrl: string;
    try {
      // Try to parse as JSON first
      const result = JSON.parse(uploadResult);
      console.log('Parsed JSON result:', result);
      
      if (result.url) {
        fileUrl = result.url;
      } else if (result.file_name) {
        // If no URL but has filename, construct URL
        fileUrl = `https://da.outreachdeal.com/OMS/${result.file_name}`;
      } else {
        throw new Error('No URL or filename in response');
      }
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      console.log('Treating as direct URL:', uploadResult);
      // If not JSON, treat as direct URL
      fileUrl = uploadResult.trim();
    }
    
    console.log('Final fileUrl:', fileUrl);

    // Store in database
    const document = await prisma.userDocument.create({
      data: {
        userId: session.user.id,
        originalName: file.name,
        fileName: fileName,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    console.log('Document created with data:', {
      id: document.id,
      originalName: document.originalName,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      fileSize: document.fileSize,
      mimeType: document.mimeType
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        originalName: document.originalName,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        uploadedAt: document.uploadedAt,
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

    const documents = await prisma.userDocument.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        ...(search && {
          OR: [
            { originalName: { contains: search, mode: 'insensitive' } },
            { fileName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { uploadedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        originalName: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        accessCount: true,
      },
    });

    return NextResponse.json({ documents });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

