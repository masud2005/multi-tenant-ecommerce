'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  RotateCcw,
  MapPin,
  Heart,
  Star,
  User,
  Shield,
  LifeBuoy,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Store,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useStore } from '@/contexts/StoreContext';
import { Drawer } from '@/components/ui/Drawer';

type AccountLink = {
  href: string;
  label: string;
  exact?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  group: 'main' | 'settings';
  getBadge?: (counts: { orders: number; wishlist: number; addresses: number }) => number | null;
};

export const accountNavLinks: AccountLink[] = [
  { href: '/account', label: 'Overview', exact: true, icon: Home, group: 'main' },
  {
    href: '/account/orders',
    label: 'Orders',
    icon: Package,
    group: 'main',
    getBadge: (c) => (c.orders > 0 ? c.orders : null),
  },
  { href: '/account/returns', label: 'Returns', icon: RotateCcw, group: 'main' },
  {
    href: '/account/addresses',
    label: 'Addresses',
    icon: MapPin,
    group: 'main',
    getBadge: (c) => (c.addresses > 0 ? c.addresses : null),
  },
  {
    href: '/wishlist',
    label: 'Wishlist',
    icon: Heart,
    group: 'main',
    getBadge: (c) => (c.wishlist > 0 ? c.wishlist : null),
  },
  { href: '/account/reviews', label: 'Reviews', icon: Star, group: 'main' },
  { href: '/account/profile', label: 'Profile', icon: User, group: 'settings' },
  { href: '/account/security', label: 'Login & security', icon: Shield, group: 'settings' },
  { href: '/account/support', label: 'Help & support', icon: LifeBuoy, group: 'settings' },
];

function isActive(pathname: string, link: AccountLink) {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function getActiveAccountLabel(pathname: string) {
  const match = accountNavLinks.find((link) => isActive(pathname, link));
  return match?.label || 'Your account';
}

function NavList({
  links,
  pathname,
  counts,
  onNavigate,
}: {
  links: AccountLink[];
  pathname: string;
  counts?: { orders: number; wishlist: number; addresses: number };
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActive(pathname, link);
        const badge = counts && link.getBadge ? link.getBadge(counts) : null;

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all',
                active
                  ? 'bg-ink text-canvas font-semibold shadow-xs'
                  : 'font-medium text-ink-soft hover:bg-subtle hover:text-ink'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn('h-4 w-4 shrink-0', active ? 'text-canvas' : 'text-ink-muted')}
                  aria-hidden
                />
                <span className="truncate">{link.label}</span>
              </div>
              {badge !== null && (
                <span
                  className={cn(
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                    active ? 'bg-canvas text-ink' : 'bg-subtle text-ink'
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop left column */
export function AccountSideNav() {
  const pathname = usePathname();
  const { orders, wishlist, addresses } = useStore();

  const counts = useMemo(
    () => ({
      orders: orders?.length || 0,
      wishlist: wishlist?.length || 0,
      addresses: addresses?.length || 0,
    }),
    [orders, wishlist, addresses]
  );

  const main = accountNavLinks.filter((l) => l.group === 'main');
  const settings = accountNavLinks.filter((l) => l.group === 'settings');

  return (
    <nav aria-label="Account sections" className="space-y-6">
      <div>
        <p className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Shopping & Orders
        </p>
        <NavList links={main} pathname={pathname} counts={counts} />
      </div>
      <div>
        <p className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Settings & Support
        </p>
        <NavList links={settings} pathname={pathname} counts={counts} />
      </div>
    </nav>
  );
}

/** Mobile section navigation with dedicated Side Menu Drawer & Quick Pill Scroller */
export function AccountMobileNav({ onSignOut }: { onSignOut?: () => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { user, orders, wishlist, addresses } = useStore();

  const counts = useMemo(
    () => ({
      orders: orders?.length || 0,
      wishlist: wishlist?.length || 0,
      addresses: addresses?.length || 0,
    }),
    [orders, wishlist, addresses]
  );

  const activeLink = useMemo(
    () => accountNavLinks.find((link) => isActive(pathname, link)) || accountNavLinks[0],
    [pathname]
  );
  const ActiveIcon = activeLink.icon;

  const main = accountNavLinks.filter((l) => l.group === 'main');
  const settings = accountNavLinks.filter((l) => l.group === 'settings');

  return (
    <div className="lg:hidden">
      {/* Clean Single Mobile Account Bar with Side Menu Trigger */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-canvas shadow-xs">
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              {pathname === '/account' ? 'Dashboard' : 'Account Section'}
            </span>
            <p className="truncate text-base font-semibold text-ink leading-tight mt-0.5">
              {activeLink.label}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-subtle/70 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-subtle hover:border-line-strong transition-all cursor-pointer shrink-0 shadow-2xs"
          aria-label="Open customer account side menu"
        >
          <LayoutGrid className="h-4 w-4 text-clay" />
          <span>Menu</span>
          <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
        </button>
      </div>

      {/* Dedicated Customer Account Side Menu Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="left"
        width="max-w-[85vw] sm:max-w-sm"
        title={
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-clay/15 text-clay font-bold text-xs">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink">Customer Account</h2>
              <p className="text-[11px] text-ink-muted truncate max-w-[170px]">{user?.email}</p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Link
              href="/shop"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
            >
              <Store className="h-3.5 w-3.5 text-ink-muted" />
              <span>Store Home</span>
            </Link>
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onSignOut();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        }
      >
        <div className="flex flex-col space-y-5 px-4 py-4 sm:px-5">
          {/* Profile Card Header */}
          <div className="rounded-2xl border border-line bg-subtle/30 p-3.5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-clay/15 text-clay font-bold text-base shadow-2xs">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{user?.name || 'Customer'}</p>
                <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                <span className="inline-block mt-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Verified Customer
                </span>
              </div>
            </div>

            {/* Quick Mini Stats Bar */}
            <div className="grid grid-cols-3 gap-2 border-t border-line/60 pt-3 text-center">
              <Link
                href="/account/orders"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl bg-surface p-2 hover:bg-subtle transition-colors border border-line/60"
              >
                <p className="text-base font-bold text-ink">{counts.orders}</p>
                <p className="text-[10px] text-ink-muted font-medium">Orders</p>
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl bg-surface p-2 hover:bg-subtle transition-colors border border-line/60"
              >
                <p className="text-base font-bold text-ink">{counts.wishlist}</p>
                <p className="text-[10px] text-ink-muted font-medium">Wishlist</p>
              </Link>
              <Link
                href="/account/addresses"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl bg-surface p-2 hover:bg-subtle transition-colors border border-line/60"
              >
                <p className="text-base font-bold text-ink">{counts.addresses}</p>
                <p className="text-[10px] text-ink-muted font-medium">Addresses</p>
              </Link>
            </div>
          </div>

          {/* Section 1: Shopping & Orders */}
          <div className="space-y-1.5">
            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Shopping & Orders
            </p>
            <div className="divide-y divide-line/40 rounded-xl border border-line bg-surface overflow-hidden shadow-2xs">
              {main.map((link) => {
                const Icon = link.icon;
                const active = isActive(pathname, link);
                const badge = link.getBadge ? link.getBadge(counts) : null;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-3 text-xs font-medium transition-colors',
                      active
                        ? 'bg-ink text-canvas font-semibold'
                        : 'text-ink hover:bg-subtle'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-canvas' : 'text-ink-muted')} />
                      <span className="truncate">{link.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {badge !== null && (
                        <span
                          className={cn(
                            'flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                            active ? 'bg-canvas text-ink' : 'bg-subtle text-ink-soft'
                          )}
                        >
                          {badge}
                        </span>
                      )}
                      <ChevronRight className={cn('h-3.5 w-3.5', active ? 'text-canvas/60' : 'text-ink-muted')} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section 2: Account Settings */}
          <div className="space-y-1.5">
            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Account Settings
            </p>
            <div className="divide-y divide-line/40 rounded-xl border border-line bg-surface overflow-hidden shadow-2xs">
              {settings.map((link) => {
                const Icon = link.icon;
                const active = isActive(pathname, link);
                const badge = link.getBadge ? link.getBadge(counts) : null;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-3 text-xs font-medium transition-colors',
                      active
                        ? 'bg-ink text-canvas font-semibold'
                        : 'text-ink hover:bg-subtle'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-canvas' : 'text-ink-muted')} />
                      <span className="truncate">{link.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {badge !== null && (
                        <span
                          className={cn(
                            'flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                            active ? 'bg-canvas text-ink' : 'bg-subtle text-ink-soft'
                          )}
                        >
                          {badge}
                        </span>
                      )}
                      <ChevronRight className={cn('h-3.5 w-3.5', active ? 'text-canvas/60' : 'text-ink-muted')} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section 3: Customer Care & Policies */}
          <div className="rounded-xl border border-line bg-subtle/30 p-2.5 space-y-1">
            <Link
              href="/policies/returns"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
            >
              <span>Return & Refund Policy</span>
              <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
            </Link>
            <Link
              href="/contact"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
            >
              <span>Contact Customer Support</span>
              <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
            </Link>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
