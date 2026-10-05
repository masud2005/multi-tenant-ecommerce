import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopView } from '@/components/store/shop';

export const metadata: Metadata = {
  title: 'Shop All | Tanti Lifestyle',
  description: 'Explore handloom kurtas, panjabis, jamdani sarees, footwear and accessories.',
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-ink-muted">
          Loading catalog...
        </div>
      }
    >
      <ShopView mode="shop" />
    </Suspense>
  );
}
