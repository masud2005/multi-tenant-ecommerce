// Session storage manager using access_token and refresh_token cookies
import { getCookie, setCookie, deleteCookie } from '@/utils/cookies';
import { parseJwtPayload } from '@/utils/jwt';
import type { StoredUser, UserRole } from '@/types';

// Re-export for compatibility
export { parseJwtPayload };

// Persist tokens in cookies exclusively
export function setAuthSession(session: {
  accessToken: string;
  refreshToken?: string;
  user?: StoredUser;
}) {
  if (typeof window === 'undefined') return;

  const { accessToken, refreshToken } = session;

  setCookie('access_token', accessToken, 30);

  if (refreshToken) {
    setCookie('refresh_token', refreshToken, 30);
  }

  // Remove any legacy cookies and localStorage entries
  deleteCookie('auth_token');
  deleteCookie('auth_role');
  deleteCookie('auth_user');

  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user');
  } catch {}
}

// Clear all authentication cookies
export function clearAuthSession() {
  if (typeof window === 'undefined') return;

  deleteCookie('access_token');
  deleteCookie('refresh_token');
  deleteCookie('auth_token');
  deleteCookie('auth_role');
  deleteCookie('auth_user');

  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user');
  } catch {}
}

// Read access token from cookie
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getCookie('access_token');
}

// Read refresh token from cookie
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getCookie('refresh_token');
}

// Extract user claims directly from access_token or refresh_token payload
export function getAuthUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const token = getAuthToken() || getRefreshToken();
  if (!token) return null;

  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const name = payload.name || payload.email?.split('@')[0] || 'User';
  const roleStr = (payload.role || '').toUpperCase();
  const isOwner = Boolean(payload.isOwner || roleStr === 'OWNER' || roleStr === 'SUPER_ADMIN');
  const isCustomer = (roleStr === 'CUSTOMER' || !roleStr) && !isOwner && !payload.staffRole;
  const isStaff = !isCustomer && !isOwner && Boolean(
    payload.staffRole ||
    (payload.permissions && Object.keys(payload.permissions).length > 0) ||
    ['STAFF', 'ADMIN', 'MANAGER'].includes(roleStr)
  );
  const effectiveRole = isOwner ? 'OWNER' : (isStaff ? 'STAFF' : 'CUSTOMER');

  return {
    id: payload.sub,
    name,
    email: payload.email,
    role: effectiveRole as UserRole,
    tenantId: payload.tenantId,
    isOwner,
    staffRole: isStaff ? (payload.staffRole || 'Staff') : undefined,
    permissions: isStaff ? (payload.permissions || {}) : {},
  };
}

// Extract user role directly from access_token or refresh_token payload
export function getAuthRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  const token = getAuthToken() || getRefreshToken();
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  if (payload.isOwner || (payload.role as any) === 'OWNER' || (payload.role as any) === 'SUPER_ADMIN') return 'OWNER' as UserRole;
  if (payload.staffRole || (payload.permissions && Object.keys(payload.permissions).length > 0) || (payload.role as any) === 'STAFF') {
    return 'STAFF' as UserRole;
  }
  return (payload?.role as UserRole) || 'CUSTOMER' as UserRole;
}

// Check if access_token exists and is not expired
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  const payload = parseJwtPayload(token);
  if (!payload) return false;

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    return false;
  }

  return true;
}

// Check if a valid, non-expired refresh token exists in cookies
export function hasValidRefreshToken(): boolean {
  const token = getRefreshToken();
  if (!token) return false;

  const payload = parseJwtPayload(token);
  if (!payload) return false;

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    return false;
  }

  return true;
}
