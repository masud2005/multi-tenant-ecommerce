import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopView } from '@/components/store/shop';

export const metadata: Metadata = {
  title: 'Search Results | Tanti',
  description: 'Search results for products in Tanti collection.',
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-ink-muted">
          Searching pieces...
        </div>
      }
    >
      <ShopView mode="search" />
    </Suspense>
  );
}
