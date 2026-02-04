import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function verify(signedValue: string, secret: string): Promise<string | null> {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;

  const [value, signature] = parts;

  // Use Web Crypto API for Edge Runtime compatibility
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  const expected = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (signature !== expected) return null;
  return value;
}

export async function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const session = request.cookies.get('pub_session')?.value;
  const secret = process.env.SESSION_SECRET!;

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verify(session, secret);
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const [, expires] = payload.split(':');
  if (Date.now() > parseInt(expires)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
