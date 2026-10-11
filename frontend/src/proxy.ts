import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseJwtPayload } from './utils/jwt';

// Staff roles permitted on the admin dashboard
const STAFF_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'];

// Helper to resolve first allowed route for staff based on JWT permissions
function resolveFirstAllowedRoute(perms?: Record<string, string[]>): string {
  if (!perms || typeof perms !== 'object') return '/admin';
  const priorityOrder: Array<[string, string]> = [
    ['payments', '/admin/payments'],
    ['orders', '/admin/orders'],
    ['returns', '/admin/returns'],
    ['products', '/admin/products'],
    ['categories', '/admin/categories'],
    ['collections', '/admin/collections'],
    ['brands', '/admin/brands'],
    ['inventory', '/admin/inventory'],
    ['customers', '/admin/customers'],
    ['reviews', '/admin/reviews'],
    ['discounts', '/admin/discounts'],
    ['marketing', '/admin/marketing'],
    ['shipping', '/admin/shipping'],
    ['theme', '/admin/theme'],
    ['content', '/admin/content'],
    ['media', '/admin/media'],
    ['analytics', '/admin/analytics'],
    ['reports', '/admin/reports'],
    ['staff', '/admin/staff'],
    ['settings', '/admin/settings'],
    ['notifications', '/admin/notifications'],
    ['integrations', '/admin/integrations'],
    ['dashboard', '/admin'],
  ];

  for (const [mod, route] of priorityOrder) {
    if (perms[mod] && perms[mod].includes('view')) {
      return route;
    }
  }
  return '/admin';
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Never intercept or block auth pages (/login, /register, /verify, /forgot-password, /reset-password)
  // Let the user always access login/register directly without forced redirects
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) {
    return NextResponse.next();
  }

  // Extract access token and refresh token
  const token = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const jwtPayload = token ? parseJwtPayload(token) : null;
  const isTokenExpired = Boolean(jwtPayload?.exp && Date.now() >= jwtPayload.exp * 1000);
  const isAuthenticated = Boolean(token && !isTokenExpired && jwtPayload);

  const refreshPayload = refreshToken ? parseJwtPayload(refreshToken) : null;
  const isRefreshTokenExpired = Boolean(
    refreshPayload?.exp && Date.now() >= refreshPayload.exp * 1000
  );
  const hasValidRefreshToken = Boolean(refreshToken && !isRefreshTokenExpired && refreshPayload);

  // Active session payload
  const activePayload = isAuthenticated ? jwtPayload : (hasValidRefreshToken ? refreshPayload : null);
  const userRole = (activePayload?.role || '').toUpperCase();

  const isOwner = Boolean(
    activePayload?.isOwner ||
    userRole === 'OWNER' ||
    userRole === 'SUPER_ADMIN'
  );

  const isCustomer = (userRole === 'CUSTOMER' || (!userRole && !isOwner)) && !activePayload?.staffRole && !activePayload?.isOwner;

  const isStaff = !isCustomer && !isOwner && Boolean(
    activePayload?.staffRole ||
    (activePayload?.permissions && Object.keys(activePayload.permissions).length > 0) ||
    STAFF_ROLES.includes(userRole)
  );

  const isStaffOrOwner = isOwner || isStaff;
  const defaultAdminRoute = isOwner ? '/admin' : resolveFirstAllowedRoute(activePayload?.permissions);

  const isAdminRoute = pathname.startsWith('/admin');
  const isAccountRoute = pathname.startsWith('/account');

  // Protected routes guard: redirect unauthenticated users to login
  if (isAdminRoute && !isAuthenticated && !hasValidRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    if (isTokenExpired || isRefreshTokenExpired) {
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
    }
    return response;
  }

  if (isAccountRoute && !isAuthenticated && !hasValidRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    if (isTokenExpired || isRefreshTokenExpired) {
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
    }
    return response;
  }

  // Cross-role boundary redirects for active authenticated users
  if (isAdminRoute && isAuthenticated && !isStaffOrOwner) {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  if (isAccountRoute && isAuthenticated && isStaffOrOwner) {
    return NextResponse.redirect(new URL(defaultAdminRoute, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};