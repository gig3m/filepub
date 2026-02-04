import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const pathname = slug.join('/');
  
  // Try with .html extension first
  const filename = pathname.endsWith('.html') ? pathname : `${pathname}.html`;
  
  try {
    const { blobs } = await list({ prefix: filename });
    const blob = blobs.find(b => b.pathname === filename);
    
    if (!blob) {
      return new NextResponse('Not found', { status: 404 });
    }
    
    // Fetch and return the HTML content
    const response = await fetch(blob.url);
    const html = await response.text();
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Error loading page', { status: 500 });
  }
}
