'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
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
  '/account': 'Overview',
  '/account/orders': 'Orders',
  '/account/returns': 'Returns & exchanges',
  '/account/reviews': 'My reviews',
  '/account/addresses': 'Addresses',
  '/account/support': 'Live Chat & Support',
  '/account/notifications': 'Notifications',
  '/account/profile': 'Profile',
  '/account/security': 'Login & security',
};

export function CustomerNavbar({
  onOpenMobileSidebar,
  onLogoutClick,
}: CustomerNavbarProps) {
  const pathname = usePathname();
  const { cart, storeCredit, setMiniCartOpen, setSearchOpen, categories } = useStore();

  const displayCategories =
    categories && categories.length > 0
      ? categories.slice(0, 4)
      : [
          { key: 'women', name: 'Women' },
          { key: 'men', name: 'Men' },
          { key: 'kids', name: 'Kids' },
          { key: 'home', name: 'Home & Living' },
        ];

  const currentTitle =
    routeTitles[pathname] ||
    (pathname.startsWith('/account/orders/')
      ? 'Order Details'
      : 'Customer Portal');

  const cartItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4">
      {/* Left: Mobile Drawer Trigger + Search Bar (Matching Admin Navbar) */}
      <div className="flex items-center gap-3 flex-1 max-w-sm xl:max-w-md">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden rounded-md p-1.5 text-ink hover:bg-subtle cursor-pointer transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar (Matching Admin Dashboard style exactly) */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="relative flex h-9 w-full items-center gap-2 rounded-md border border-line bg-canvas px-3 text-sm text-ink-muted hover:border-line-strong transition-colors cursor-pointer text-left"
        >
          <Search className="h-4 w-4 text-ink-muted shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate text-xs sm:text-sm">Search products, orders…</span>
          <kbd className="hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted sm:inline select-none">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Center: Store Category Navigation (All Products, Women, Men, Kids) */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 mx-2">
        <Link
          href="/shop"
          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-ink hover:text-clay hover:bg-canvas rounded-md transition-colors whitespace-nowrap"
        >
          All Products
        </Link>
        {displayCategories.map((cat) => (
          <Link
            key={cat.key}
            href={`/shop?category=${cat.key}`}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-ink-soft hover:text-ink hover:bg-canvas rounded-md transition-colors whitespace-nowrap"
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {/* Right: Store credit badge, Cart, Notification, Storefront Link & User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Store Credit Badge (Matching Admin's 'Growth plan' pill style exactly) */}
        <div className="hidden whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-soft sm:inline-block">
          Credit: <span className="font-semibold text-ink">{formatBDT(storeCredit || 500)}</span>
        </div>

        {/* Notification Bell (Matching Admin Navbar) */}
        <Link
          href="/account/notifications"
          className="relative rounded-md p-2 hover:bg-subtle text-ink cursor-pointer transition-all"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-ink ring-2 ring-surface" />
        </Link>

        {/* Mini-Cart Drawer Trigger */}
        <button
          type="button"
          onClick={() => setMiniCartOpen(true)}
          className="relative rounded-md p-2 hover:bg-subtle text-ink cursor-pointer transition-all"
          title="Shopping Cart"
          aria-label="Shopping Cart"
        >
          <ShoppingBag className="h-[18px] w-[18px]" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-canvas text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
              {cartItemsCount}
            </span>
          )}
        </button>

        {/* Live Storefront Link */}
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-subtle transition-colors cursor-pointer"
        >
          <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
          <span>Live Store</span>
        </Link>

        <div className="h-4 w-px bg-line" />

        {/* User Account Dropdown */}
        <CustomerUserDropdown onLogoutClick={onLogoutClick} />
      </div>
    </header>
  );
}
