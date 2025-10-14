import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // Guard admin routes
  if (pathname.startsWith('/admin')) {
    try {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      const isAdmin = Boolean(token && (token as any).isAdmin);

      if (!token || !isAdmin) {
        const callbackUrl = encodeURIComponent(pathname);
        return NextResponse.redirect(`${origin}/auth/login?redirect=${callbackUrl}`);
      }
    } catch {
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(`${origin}/auth/login?redirect=${callbackUrl}`);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};