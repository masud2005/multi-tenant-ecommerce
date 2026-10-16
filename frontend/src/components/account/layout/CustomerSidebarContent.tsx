'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  RotateCcw,
  Heart,
  Star,
  MapPin,
  LifeBuoy,
  Bell,
  User,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/utils/cn';

interface CustomerNavItem {
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
  badge?: number;
  isLive?: boolean;
}

interface CustomerNavGroup {
  category?: string;
  items: CustomerNavItem[];
}

interface CustomerSidebarContentProps {
  onItemClick?: () => void;
  onLogoutClick?: () => void;
}

export function CustomerSidebarContent({
  onItemClick,
}: CustomerSidebarContentProps) {
  const pathname = usePathname();
  const { orders, returns, wishlist } = useStore();
  const { tenant } = useTenant();

  // Counts for badges
  const activeOrdersCount = orders.filter((o) =>
    ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status)
  ).length;

  const activeReturnsCount = returns.filter(
    (r) => !['refunded', 'exchanged', 'rejected'].includes(r.status)
  ).length;

  const wishlistCount = wishlist.length;

  // Nav Groups strictly matching Admin Dashboard structure
  const navGroups: CustomerNavGroup[] = [
    {
      category: '',
      items: [
        {
          label: 'Overview',
          href: '/account',
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      category: 'Orders & Purchases',
      items: [
        {
          label: 'Orders',
          href: '/account/orders',
          icon: Package,
          badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
        },
        {
          label: 'Returns & exchanges',
          href: '/account/returns',
          icon: RotateCcw,
          badge: activeReturnsCount > 0 ? activeReturnsCount : undefined,
        },
        {
          label: 'Wishlist',
          href: '/wishlist',
          icon: Heart,
          badge: wishlistCount > 0 ? wishlistCount : undefined,
        },
      ],
    },
    {
      category: 'Customer Activity',
      items: [
        {
          label: 'My reviews',
          href: '/account/reviews',
          icon: Star,
        },
        {
          label: 'Addresses',
          href: '/account/addresses',
          icon: MapPin,
        },
      ],
    },
    {
      category: 'Support & Settings',
      items: [
        {
          label: 'Live Chat & Support',
          href: '/account/support',
          icon: LifeBuoy,
          isLive: true,
        },
        {
          label: 'Notifications',
          href: '/account/notifications',
          icon: Bell,
        },
        {
          label: 'Profile',
          href: '/account/profile',
          icon: User,
        },
        {
          label: 'Login & security',
          href: '/account/security',
          icon: Shield,
        },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col bg-canvas text-ink select-none">
      {/* 1. Brand Header (Exact 1:1 match with Admin Dashboard) */}
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-4 shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink font-display text-lg font-medium text-canvas shrink-0">
          {tenant.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink leading-tight">
            {tenant.name}
          </p>
          <p className="truncate text-xs text-ink-muted leading-tight">
            {tenant.domain || 'Customer Portal'}
          </p>
        </div>
        <Link
          href="/"
          className="rounded p-1.5 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
          aria-label="View store"
          title="View store"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>


      {/* 3. Navigation Groups (Exact 1:1 match with Admin Sidebar: bg-surface text-ink shadow-sm) */}
      <nav aria-label="Customer Navigation" className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.category || 'main'} className="mb-4">
            {group.category ? (
              <p className="mb-1 px-2.5 text-xs font-medium text-ink-muted">
                {group.category}
              </p>
            ) : null}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== '/account' && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onItemClick}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-100',
                        isActive
                          ? 'bg-surface font-medium text-ink shadow-sm'
                          : 'text-ink-soft hover:bg-subtle hover:text-ink'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>

                      {/* Right Badges */}
                      <span className="flex items-center gap-1.5 shrink-0">
                        {item.isLive && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        )}
                        {item.badge !== undefined && (
                          <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-canvas leading-none">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* 4. Bottom View Public Storefront Link (Exact 1:1 match with Admin Sidebar footer) */}
      <div className="border-t border-line p-3 shrink-0">
        <Link
          href="/"
          className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-subtle hover:text-ink transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
            <span>Live Storefront</span>
          </div>
          <span className="text-xs text-ink-muted">{tenant.name}</span>
        </Link>
      </div>
    </div>
  );
}
