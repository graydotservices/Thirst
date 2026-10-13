import { NextRequest, NextResponse } from 'next/server';
import { contentSecurityPolicy } from './lib/security/csp';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = contentSecurityPolicy(nonce, process.env.NODE_ENV === 'development', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  if (request.nextUrl.pathname.startsWith('/admin')) response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|avif|mp4|ico)$).*)'],
};
