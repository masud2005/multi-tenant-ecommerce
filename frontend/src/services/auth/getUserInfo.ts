// Server-side user information retriever decoding real access_token claims
import { cookies } from 'next/headers';
import type { UserInfo } from '@/types/user';
import { parseJwtPayload } from './auth.storage';

export async function getUserInfo(): Promise<UserInfo | undefined> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return undefined;

    const payload = parseJwtPayload(token);
    if (!payload) return undefined;

    const name = payload.name || payload.email?.split('@')[0] || 'Store Owner';
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SO';

    const isOwner = Boolean(payload.isOwner || payload.role === 'OWNER');
    const isStaff = Boolean(
      payload.staffRole ||
      (payload.permissions && Object.keys(payload.permissions).length > 0) ||
      ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'STAFF', 'MANAGER'].includes(payload.role)
    );
    const effectiveRole = isOwner ? 'OWNER' : (isStaff ? 'STAFF' : payload.role || 'STAFF');

    return {
      id: payload.sub,
      name,
      email: payload.email,
      role: effectiveRole as any,
      initials,
      title: payload.staffRole || (isOwner ? 'Owner' : 'Staff'),
      tenantId: payload.tenantId,
      isOwner,
      staffRole: payload.staffRole,
      permissions: payload.permissions || {},
    };
  } catch {
    return undefined;
  }
}
