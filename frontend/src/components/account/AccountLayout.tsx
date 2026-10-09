'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  LayoutDashboardIcon,
  PackageIcon,
  RotateCcwIcon,
  MapPinIcon,
  HeartIcon,
  StarIcon,
  LifeBuoyIcon,
  BellIcon,
  UserIcon,
  ShieldIcon,
  LogOutIcon,
  ArrowLeftIcon,
  HomeIcon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { authService } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

const nav = [
  { to: '/account', label: 'Overview', icon: LayoutDashboardIcon, exact: true },
  { to: '/account/orders', label: 'Orders', icon: PackageIcon },
  { to: '/account/returns', label: 'Returns', icon: RotateCcwIcon },
  { to: '/wishlist', label: 'Wishlist', icon: HeartIcon },
  { to: '/account/reviews', label: 'My reviews', icon: StarIcon },
  { to: '/account/addresses', label: 'Addresses', icon: MapPinIcon },
  { to: '/account/support', label: 'Support', icon: LifeBuoyIcon },
  { to: '/account/profile', label: 'Profile', icon: UserIcon },
  { to: '/account/security', label: 'Login & security', icon: ShieldIcon },
  { to: '/account/notifications', label: 'Notifications', icon: BellIcon },
];

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Redirect staff / owner roles to admin dashboard
  useEffect(() => {
    const role = (user?.role || authService.getUserRole() || '').toUpperCase();
    const isStaffOrOwner = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role);
    if (isStaffOrOwner) {
      window.location.href = '/admin';
    }
  }, [user]);

  // Handle logout action with feedback toast and navigation to home
  const handleLogout = () => {
    logout();
    setConfirmLogout(false);
    toast.success('Logged out successfully');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-display text-2xl text-ink">Sign in to your account</p>
        <p className="mt-2 text-sm text-ink-muted">
          Access your orders, saved addresses and preferences.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/login?next=${encodeURIComponent(pathname || '/account')}`}
            className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md bg-ink px-6 text-sm font-medium text-canvas hover:bg-ink/90 cursor-pointer"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md border border-line bg-surface px-6 text-sm font-medium text-ink hover:bg-subtle cursor-pointer"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(
    (user.role || '').toUpperCase()
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Quick Bar: Breadcrumbs & Continue Shopping (Home) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            <HomeIcon className="h-3.5 w-3.5 text-clay" />
            <span>Home</span>
          </Link>
          <span className="text-xs text-ink-muted">/</span>
          <span className="text-xs font-medium text-ink">My Account</span>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/40 hover:bg-subtle transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span>Continue Shopping (Home)</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside>
          {/* User Name & Email */}
          <div className="hidden lg:block">
            <p className="font-display text-xl text-ink">{user.name}</p>
            <p className="text-xs text-ink-muted">{user.email}</p>
            {isOwnerOrAdmin && (
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-clay/10 text-clay uppercase tracking-wider">
                {user.role}
              </span>
            )}
          </div>

          {isOwnerOrAdmin && (
            <div className="mt-4 hidden lg:block">
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-md bg-clay px-3 py-2 text-xs font-semibold text-white hover:bg-clay/90 transition-colors shadow-xs"
              >
                <ShieldIcon className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            </div>
          )}

          {/* Navigation Menu */}
          <nav
            aria-label="Account"
            className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:mt-6 lg:flex-col lg:px-0"
          >
            {nav.map(({ to, label, icon: Icon, exact }) => {
              const isActive = exact ? pathname === to : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  href={to}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer',
                    isActive
                      ? 'bg-surface font-semibold text-ink shadow-xs border border-line'
                      : 'text-ink-soft hover:bg-subtle hover:text-ink'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              );
            })}

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-subtle hover:text-danger lg:mt-4 cursor-pointer transition-colors"
            >
              <LogOutIcon className="h-4 w-4" aria-hidden /> Sign out
            </button>

            {/* Continue Shopping (Home) at the very bottom */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-subtle hover:text-ink lg:mt-1 cursor-pointer transition-colors border-t border-line/60 pt-3"
            >
              <HomeIcon className="h-4 w-4 text-clay" aria-hidden />
              <span>Continue Shopping (Home)</span>
            </Link>
          </nav>
        </aside>

        {/* Main Account Content */}
        <div className="min-w-0">{children}</div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Sign out of your account?"
        description="You will need to sign back in to view your orders, saved addresses, or profile."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmLogout(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Sign out
            </Button>
          </>
        }
      />
    </div>
  );
}
