import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

function verify(signedValue: string, secret: string): string | null {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;
  
  const [value, signature] = parts;
  const expected = createHmac('sha256', secret).update(value).digest('hex');
  
  if (signature !== expected) return null;
  return value;
}

export function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const session = request.cookies.get('pub_session')?.value;
  const secret = process.env.SESSION_SECRET!;
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const payload = verify(session, secret);
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
