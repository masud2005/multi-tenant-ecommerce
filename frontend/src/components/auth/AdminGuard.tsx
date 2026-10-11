'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService, clearAuthSession } from '@/services/auth';
import { Loader2 } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const verifyingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (verifyingRef.current) return;
      verifyingRef.current = true;

      try {
        let storedUser = authService.getStoredUser();
        let isAuthed = authService.isAuthenticated();

        // If access token is expired or missing, attempt silent token refresh
        if (!isAuthed && authService.hasValidRefreshToken()) {
          try {
            const newToken = await authService.refreshToken();
            if (newToken) {
              isAuthed = true;
              storedUser = authService.getStoredUser();
            }
          } catch {
            clearAuthSession();
            isAuthed = false;
          }
        }

        // 1. Unauthenticated users -> redirect to login
        if (!isAuthed || !storedUser) {
          clearAuthSession();
          if (isMounted) {
            router.replace(`/login?next=${encodeURIComponent(pathname || '/admin')}`);
          }
          return;
        }

        const role = (storedUser?.role || authService.getUserRole() || '').toUpperCase();
        const isOwner = Boolean(
          storedUser?.isOwner ||
          role === 'OWNER' ||
          role === 'SUPER_ADMIN'
        );

        const isStaff = !isOwner && (
          Boolean(storedUser?.staffRole) ||
          (storedUser?.permissions && Object.keys(storedUser.permissions).length > 0) ||
          ['STAFF', 'MANAGER', 'ADMIN'].includes(role)
        );

        const isStaffOrOwner = isOwner || isStaff;

        // 2. Customers -> redirect to customer account portal
        if (!isStaffOrOwner) {
          if (isMounted) {
            router.replace('/account');
          }
          return;
        }

        // 3. Owners -> full access to all admin modules
        if (isOwner) {
          if (isMounted) setIsVerifying(false);
          return;
        }

        // 4. Staff members -> check module-level permissions
        if (storedUser?.permissions && typeof storedUser.permissions === 'object') {
          const perms = storedUser.permissions as Record<string, string[]>;

          const routeModuleMap: Record<string, string> = {
            '/admin/orders': 'orders',
            '/admin/returns': 'returns',
            '/admin/payments': 'payments',
            '/admin/products': 'products',
            '/admin/categories': 'products',
            '/admin/collections': 'products',
            '/admin/brands': 'products',
            '/admin/inventory': 'inventory',
            '/admin/customers': 'customers',
            '/admin/reviews': 'reviews',
            '/admin/discounts': 'discounts',
            '/admin/marketing': 'marketing',
            '/admin/shipping': 'shipping',
            '/admin/theme': 'theme',
            '/admin/content': 'content',
            '/admin/media': 'media',
            '/admin/seo': 'content',
            '/admin/domains': 'domains',
            '/admin/analytics': 'analytics',
            '/admin/reports': 'reports',
            '/admin/staff': 'staff',
            '/admin/notifications': 'notifications',
            '/admin/integrations': 'integrations',
            '/admin/settings': 'settings',
            '/admin/audit': 'audit',
            '/admin/billing': 'billing',
            '/admin': 'dashboard',
          };

          let currentModule = 'dashboard';
          for (const [route, mod] of Object.entries(routeModuleMap)) {
            if (route !== '/admin' && (pathname === route || pathname?.startsWith(`${route}/`))) {
              currentModule = mod;
              break;
            }
          }

          const hasAccess = currentModule === 'billing'
            ? false
            : (perms[currentModule]?.includes('view') ?? false);

          if (!hasAccess) {
            let firstAllowedRoute = '';
            if (perms.payments?.includes('view')) firstAllowedRoute = '/admin/payments';
            else if (perms.orders?.includes('view')) firstAllowedRoute = '/admin/orders';
            else if (perms.returns?.includes('view')) firstAllowedRoute = '/admin/returns';
            else if (perms.products?.includes('view')) firstAllowedRoute = '/admin/products';
            else if (perms.inventory?.includes('view')) firstAllowedRoute = '/admin/inventory';
            else if (perms.customers?.includes('view')) firstAllowedRoute = '/admin/customers';
            else if (perms.reviews?.includes('view')) firstAllowedRoute = '/admin/reviews';
            else if (perms.discounts?.includes('view')) firstAllowedRoute = '/admin/discounts';
            else if (perms.marketing?.includes('view')) firstAllowedRoute = '/admin/marketing';
            else if (perms.shipping?.includes('view')) firstAllowedRoute = '/admin/shipping';
            else if (perms.theme?.includes('view')) firstAllowedRoute = '/admin/theme';
            else if (perms.content?.includes('view')) firstAllowedRoute = '/admin/content';
            else if (perms.media?.includes('view')) firstAllowedRoute = '/admin/media';
            else if (perms.analytics?.includes('view')) firstAllowedRoute = '/admin/analytics';
            else if (perms.reports?.includes('view')) firstAllowedRoute = '/admin/reports';
            else if (perms.staff?.includes('view')) firstAllowedRoute = '/admin/staff';
            else if (perms.settings?.includes('view')) firstAllowedRoute = '/admin/settings';
            else if (perms.notifications?.includes('view')) firstAllowedRoute = '/admin/notifications';
            else if (perms.integrations?.includes('view')) firstAllowedRoute = '/admin/integrations';
            else if (perms.dashboard?.includes('view')) firstAllowedRoute = '/admin';

            if (firstAllowedRoute && pathname !== firstAllowedRoute) {
              if (isMounted) router.replace(firstAllowedRoute);
              return;
            } else if (!firstAllowedRoute) {
              if (isMounted) router.replace('/account');
              return;
            }
          }
        }

        if (isMounted) setIsVerifying(false);
      } catch {
        if (isMounted) {
          router.replace('/login');
        }
      } finally {
        verifyingRef.current = false;
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
      verifyingRef.current = false;
    };
  }, [pathname, router]);

  if (isVerifying) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-clay" />
          <p className="text-sm font-medium text-ink-muted">Verifying session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
