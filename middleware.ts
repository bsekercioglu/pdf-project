import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const PUBLIC_API = ['/api/auth/login', '/api/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('pdf-auth')?.value;

  // API: sadece auth API'leri public
  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API.some((p) => pathname === p)) return NextResponse.next();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Oturum gerekli.' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Sayfalar: login/register public
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
