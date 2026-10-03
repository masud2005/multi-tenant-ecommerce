// Session storage manager using access_token and refresh_token cookies
import { getCookie, setCookie, deleteCookie } from '@/utils/cookies';
import type { StoredUser, UserRole, JwtPayload } from '@/types';

// Pure TypeScript JWT payload parser
export function parseJwtPayload(token: string): JwtPayload | null {
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

// Extract user claims directly from access_token payload
export function getAuthUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const token = getAuthToken();
  if (!token) return null;

  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const name = payload.name || payload.email?.split('@')[0] || 'User';

  return {
    id: payload.sub,
    name,
    email: payload.email,
    role: payload.role || 'CUSTOMER',
    tenantId: payload.tenantId,
  };
}

// Extract user role directly from access_token payload
export function getAuthRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  const token = getAuthToken();
  if (!token) return null;
  const payload = parseJwtPayload(token);
  return payload?.role || null;
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
