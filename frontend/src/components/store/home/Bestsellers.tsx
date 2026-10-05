'use client';

import React from 'react';
import { SectionHeading } from '@/components/store/shared/SectionHeading';
import { ProductCard } from '@/components/store/product/ProductCard';
import { Product } from '@/types';

export interface BestsellersProps {
  products: Product[];
  limit?: number;
}

export function Bestsellers({
  products,
  limit = 4,
}: BestsellersProps) {
  const live = products.filter((p) => p.status === 'published');
  const bestsellers = [...live].sort((a, b) => b.sold - a.sold).slice(0, limit);

  if (bestsellers.length === 0) return null;

  return (
    <section
      className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="best-h"
    >
      <SectionHeading
        id="best-h"
        title="Bestsellers"
        link={{ to: '/shop?sort=popular', label: 'View all' }}
      />
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {bestsellers.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

// Alias for backward-compatibility
export const BestsellersSection = Bestsellers;
