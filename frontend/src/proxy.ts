import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Parse JWT payload without external dependencies
function parseJwtPayload(token: string): {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  exp?: number;
  tenantId?: string;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Next.js 16 Network Boundary Proxy handling RBAC and multi-tenancy
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost:3000';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';
  const hostWithoutPort = hostname.split(':')[0].toLowerCase();

  // Resolve tenant slug
  let tenantSlug = 'tanti';
  if (
    hostWithoutPort !== rootDomain &&
    hostWithoutPort !== `www.${rootDomain}` &&
    hostWithoutPort !== 'localhost' &&
    hostWithoutPort !== '127.0.0.1'
  ) {
    if (hostWithoutPort.endsWith(`.${rootDomain}`) || hostWithoutPort.endsWith('.localhost')) {
      const parts = hostWithoutPort.split('.');
      if (parts.length > 0 && parts[0] !== 'www') {
        tenantSlug = parts[0];
      }
    } else {
      tenantSlug = hostWithoutPort.replace(/\./g, '-');
    }
  }

  // Extract access token from cookie
  const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;

  const jwtPayload = token ? parseJwtPayload(token) : null;
  const isTokenExpired = Boolean(jwtPayload?.exp && Date.now() >= jwtPayload.exp * 1000);
  const isAuthenticated = Boolean(token && !isTokenExpired && jwtPayload);
  const userRole = (jwtPayload?.role || '').toUpperCase();

  // Allowed staff roles for admin dashboard
  const isStaffOrOwner = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(userRole);

  // Admin dashboard guard
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      const response = NextResponse.redirect(loginUrl);
      if (isTokenExpired) {
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        response.cookies.delete('auth_token');
        response.cookies.delete('auth_role');
        response.cookies.delete('auth_user');
      }
      return response;
    }

    if (!isStaffOrOwner) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  // Customer account guard
  if (pathname.startsWith('/account')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      const response = NextResponse.redirect(loginUrl);
      if (isTokenExpired) {
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        response.cookies.delete('auth_token');
        response.cookies.delete('auth_role');
        response.cookies.delete('auth_user');
      }
      return response;
    }
  }

  // Redirect already authenticated users from auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (isAuthenticated) {
      const nextParam = request.nextUrl.searchParams.get('next');
      if (nextParam && !nextParam.startsWith('/login') && !nextParam.startsWith('/register')) {
        if (nextParam.startsWith('/admin') && !isStaffOrOwner) {
          return NextResponse.redirect(new URL('/account', request.url));
        }
        return NextResponse.redirect(new URL(nextParam, request.url));
      }

      return NextResponse.redirect(new URL(isStaffOrOwner ? '/admin' : '/account', request.url));
    }
  }

  // Forward tenant and user metadata via headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', tenantSlug);
  requestHeaders.set('x-tenant-host', hostWithoutPort);

  if (isAuthenticated && jwtPayload) {
    if (jwtPayload.sub) requestHeaders.set('x-user-id', jwtPayload.sub);
    if (userRole) requestHeaders.set('x-user-role', userRole);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};