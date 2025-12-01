import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const videoFile = formData.get('video');

    if (!videoFile || !(videoFile instanceof File)) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(videoFile.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: MP4, WebM, OGG, MOV' 
      }, { status: 400 });
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (videoFile.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 500MB' 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'videos', id);
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${videoFile.name}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return URL path (relative to public folder)
    const videoUrl = `/uploads/videos/${id}/${filename}`;

    return NextResponse.json({ 
      success: true,
      video_url: videoUrl,
      filename: filename
    });

  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

