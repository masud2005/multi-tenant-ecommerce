'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, LogOut, Store, UserCheck } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { authService } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { AccountMobileNav, AccountSideNav } from './AccountSubnav';

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthLoading } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const role = (user?.role || authService.getUserRole() || '').toUpperCase();
    const isStaffOrOwner = [
      'OWNER',
      'ADMIN',
      'SUPER_ADMIN',
      'MANAGER',
      'STAFF',
    ].includes(role);
    if (isStaffOrOwner) {
      window.location.href = '/admin';
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setConfirmLogout(false);
    toast.success('Signed out');
    router.push('/');
  };

  if (isAuthLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-3 px-4 py-16 text-ink">
        <Loader2 className="h-7 w-7 animate-spin text-ink" aria-hidden />
        <p className="text-sm font-medium text-ink">Loading your account…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
        <div className="w-full rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-subtle text-ink">
            <UserCheck className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            View orders, manage addresses, and update your profile.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href={`/login?next=${encodeURIComponent(pathname || '/account')}`}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg bg-ink px-6 text-sm font-semibold text-canvas hover:bg-ink/90 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-ink hover:bg-subtle transition-colors"
            >
              <Store className="mr-2 h-4 w-4 text-ink-soft" /> Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isHome = pathname === '/account';
  const firstName =
    user.name?.trim().split(/\s+/)[0] ||
    user.email?.split('@')[0] ||
    '';

  return (
    <div className="bg-canvas text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:mb-8">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {isHome && firstName ? `Hi, ${firstName}` : 'Your account'}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Orders, addresses, returns, and profile — all in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-subtle transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        <div className="mb-6 lg:hidden">
          <AccountMobileNav onSignOut={() => setConfirmLogout(true)} />
        </div>

        <div className="lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[14.5rem_minmax(0,1fr)] xl:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <AccountSideNav />
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Sign out?"
        description="You’ll need to sign in again to view orders and account details."
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
