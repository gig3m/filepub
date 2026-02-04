import { list, del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    const { blobs } = await list();

    const files = blobs.map(blob => {
      const parts = blob.pathname.split('/');
      const category = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
      const name = parts[parts.length - 1];
      return {
        name,
        category,
        pathname: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      };
    });

    // Extract unique categories
    const categories = Array.from(new Set(files.map(f => f.category).filter(Boolean))) as string[];

    return NextResponse.json({ files, categories });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Only allow deletion if authenticated
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { url } = await request.json();
    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
