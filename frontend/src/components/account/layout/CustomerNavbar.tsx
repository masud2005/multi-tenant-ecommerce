'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  ShoppingBag,
  Store,
  ChevronRight,
  Wallet,
  Search,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { CustomerUserDropdown } from './CustomerUserDropdown';
import { formatBDT } from '@/utils/format';

interface CustomerNavbarProps {
  onOpenMobileSidebar: () => void;
  onLogoutClick?: () => void;
}

// Map pathnames to friendly titles
const routeTitles: Record<string, string> = {
  '/account': 'Dashboard Overview',
  '/account/orders': 'My Orders',
  '/account/returns': 'Returns & Exchanges',
  '/account/reviews': 'My Product Reviews',
  '/account/addresses': 'Delivery Addresses',
  '/account/support': 'Live Support & Chat',
  '/account/notifications': 'Notifications',
  '/account/profile': 'Profile Information',
  '/account/security': 'Password & Security',
};

export function CustomerNavbar({
  onOpenMobileSidebar,
  onLogoutClick,
}: CustomerNavbarProps) {
  const pathname = usePathname();
  const { cart, storeCredit, setMiniCartOpen, setSearchOpen } = useStore();

  const currentTitle =
    routeTitles[pathname] ||
    (pathname.startsWith('/account/orders/')
      ? 'Order Details'
      : 'Customer Dashboard');

  const cartItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
      {/* Left: Mobile Drawer Trigger + Breadcrumb Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden rounded-md p-1.5 text-ink hover:bg-subtle cursor-pointer transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb Hierarchy */}
        <div className="flex items-center gap-1.5 text-xs text-ink-muted truncate">
          <Link
            href="/account"
            className="hover:text-ink transition-colors hidden sm:inline"
          >
            My Account
          </Link>
          <ChevronRight className="h-3 w-3 text-ink-muted/60 hidden sm:inline" />
          <span className="font-semibold text-ink text-sm sm:text-xs truncate">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search shortcut button */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink-muted hover:border-line-strong hover:text-ink transition-colors cursor-pointer"
          title="Search store products"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search products…</span>
        </button>

        {/* Store Credit Pill (Desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-clay/30 bg-clay/5 px-2.5 py-1 text-xs font-semibold text-clay">
          <Wallet className="h-3.5 w-3.5" />
          <span>{formatBDT(storeCredit || 500)}</span>
        </div>

        {/* Notification Bell */}
        <Link
          href="/account/notifications"
          className="relative rounded-md p-1.5 text-ink-muted hover:bg-subtle hover:text-ink transition-colors cursor-pointer"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-clay ring-2 ring-surface" />
        </Link>

        {/* Shopping Cart Trigger */}
        <button
          type="button"
          onClick={() => setMiniCartOpen(true)}
          className="relative rounded-md p-1.5 text-ink-muted hover:bg-subtle hover:text-ink transition-colors cursor-pointer"
          title="View cart"
          aria-label="View cart"
        >
          <ShoppingBag className="h-4 w-4" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-canvas">
              {cartItemsCount}
            </span>
          )}
        </button>

        {/* Continue Shopping (Storefront link) */}
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:border-clay hover:text-clay transition-colors cursor-pointer"
        >
          <Store className="h-3.5 w-3.5 text-clay" />
          <span>Store</span>
        </Link>

        <div className="h-4 w-px bg-line" />

        {/* User Profile Dropdown */}
        <CustomerUserDropdown onLogoutClick={onLogoutClick} />
      </div>
    </header>
  );
}
