'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { authService } from '@/services/auth';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Non-blocking client-side verification on SPA transitions (server proxy already protects initial SSR)
    const isAuthed = authService.isAuthenticated();
    const role = (authService.getUserRole() || '').toUpperCase();
    const isStaffOrOwner = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role);

    if (!isAuthed) {
      window.location.href = `/login?next=${encodeURIComponent(pathname || '/admin')}`;
      return;
    }

    if (!isStaffOrOwner) {
      window.location.href = '/account';
      return;
    }
  }, [pathname]);

  return <>{children}</>;
}
