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

    return {
      id: payload.sub,
      name,
      email: payload.email,
      role: payload.role || 'OWNER',
      initials,
      title: payload.role === 'OWNER' ? 'Owner' : 'Staff',
      tenantId: payload.tenantId,
    };
  } catch {
    return undefined;
  }
}
