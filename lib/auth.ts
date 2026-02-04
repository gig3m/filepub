import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

const SESSION_COOKIE = 'pub_session';
const SESSION_DURATION = 60 * 60 * 24; // 24 hours

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET!;
  const signature = createHmac('sha256', secret).update(value).digest('hex');
  return `${value}.${signature}`;
}

function verify(signedValue: string): string | null {
  const [value, signature] = signedValue.split('.');
  if (!value || !signature) return null;
  
  const secret = process.env.SESSION_SECRET!;
  const expected = createHmac('sha256', secret).update(value).digest('hex');
  
  if (signature !== expected) return null;
  return value;
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  const expires = Date.now() + SESSION_DURATION * 1000;
  const value = sign(`authenticated:${expires}`);
  
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  
  if (!cookie?.value) return false;
  
  const payload = verify(cookie.value);
  if (!payload) return false;
  
  const [, expires] = payload.split(':');
  if (Date.now() > parseInt(expires)) return false;
  
  return true;
}

export function verifyPassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD;
}
