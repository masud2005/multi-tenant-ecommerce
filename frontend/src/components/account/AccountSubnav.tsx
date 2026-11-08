'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/utils/cn';

type AccountLink = {
  href: string;
  label: string;
  exact?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  group: 'main' | 'settings';
};

export const accountNavLinks: AccountLink[] = [
  { href: '/account', label: 'Overview', exact: true, icon: Home, group: 'main' },
  { href: '/account/orders', label: 'Orders', icon: Package, group: 'main' },
  { href: '/account/returns', label: 'Returns', icon: RotateCcw, group: 'main' },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin, group: 'main' },
  { href: '/wishlist', label: 'Wishlist', icon: Heart, group: 'main' },
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
  onNavigate,
}: {
  links: AccountLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActive(pathname, link);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-ink text-canvas font-semibold'
                  : 'font-medium text-ink hover:bg-subtle'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{link.label}</span>
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
  const main = accountNavLinks.filter((l) => l.group === 'main');
  const settings = accountNavLinks.filter((l) => l.group === 'settings');

  return (
    <nav aria-label="Account sections" className="space-y-6">
      <div>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          Account
        </p>
        <NavList links={main} pathname={pathname} />
      </div>
      <div>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          Settings
        </p>
        <NavList links={settings} pathname={pathname} />
      </div>
    </nav>
  );
}

/** Mobile section picker */
export function AccountMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const current = useMemo(
    () =>
      accountNavLinks.find((link) => isActive(pathname, link))?.href ||
      '/account',
    [pathname]
  );

  return (
    <div className="lg:hidden">
      <label htmlFor="account-section" className="sr-only">
        Account section
      </label>
      <select
        id="account-section"
        value={current}
        onChange={(e) => router.push(e.target.value)}
        className="h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-clay/25"
      >
        <optgroup label="Account">
          {accountNavLinks
            .filter((l) => l.group === 'main')
            .map((link) => (
              <option key={link.href} value={link.href}>
                {link.label}
              </option>
            ))}
        </optgroup>
        <optgroup label="Settings">
          {accountNavLinks
            .filter((l) => l.group === 'settings')
            .map((link) => (
              <option key={link.href} value={link.href}>
                {link.label}
              </option>
            ))}
        </optgroup>
      </select>
    </div>
  );
}
