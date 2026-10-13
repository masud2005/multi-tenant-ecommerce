'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { StoreHeader, StoreFooter, SearchOverlay } from '@/components/store/layout';
import { MiniCart } from '@/components/store/cart';
import { QuickView } from '@/components/store/product';
import { CompareDrawer, CookieBanner } from '@/components/store/shared';

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAccountRoute = pathname?.startsWith('/account');

  // When inside the Customer Dashboard (/account), render a full-screen dedicated portal workspace
  if (isAccountRoute) {
    return (
      <div className="h-screen w-full bg-canvas text-ink overflow-hidden">
        {children}
        <MiniCart />
        <SearchOverlay />
      </div>
    );
  }

  // Standard Storefront pages with Header & Footer
  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-canvas"
      >
        Skip to content
      </a>
      <React.Suspense fallback={<header className="h-16 border-b border-line bg-surface" />}>
        <StoreHeader />
      </React.Suspense>
      <main id="main" className="flex-1">
        {children}
      </main>
      <StoreFooter />
      <MiniCart />
      <SearchOverlay />
      <QuickView />
      <CompareDrawer />
      <CookieBanner />
    </div>
  );
}
