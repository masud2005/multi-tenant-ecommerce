'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  ShieldCheck,
  UserCheck,
  Store,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { authService } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import {
  CustomerSidebar,
  CustomerNavbar,
  CustomerMobileSidebar,
} from './layout';

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // If user is not authenticated, show modern sign-in card
  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-canvas p-4 text-ink">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-clay/10 text-clay ring-4 ring-clay/10 mb-5">
            <UserCheck className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Access your orders, live support chat, saved addresses, and loyalty credit.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href={`/login?next=${encodeURIComponent(pathname || '/account')}`}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg bg-ink px-6 text-sm font-semibold text-canvas hover:bg-ink/90 transition-all cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-ink hover:bg-subtle transition-all cursor-pointer"
            >
              <Store className="mr-2 h-4 w-4 text-ink-muted" /> Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-canvas text-ink overflow-hidden select-none">
      {/* 1. Left Fixed Sidebar (Desktop) */}
      <CustomerSidebar onLogoutClick={() => setConfirmLogout(true)} />

      {/* 2. Main Work Area (Top Navbar + Dynamic Content) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <CustomerNavbar
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onLogoutClick={() => setConfirmLogout(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* 3. Mobile Slide-out Drawer */}
      <CustomerMobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogoutClick={() => {
          setMobileOpen(false);
          setConfirmLogout(true);
        }}
      />

      {/* 4. Sign Out Confirmation Modal */}
      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Sign out of your account?"
        description="You will need to sign back in to view your orders, live support chat, or profile."
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
