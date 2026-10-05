'use client';

import React from 'react';
import { SectionHeading } from '@/components/store/shared/SectionHeading';
import { ProductCard } from '@/components/store/product/ProductCard';
import { Product } from '@/types';

export interface RecommendedProps {
  products: Product[];
  recentlyViewed: string[];
  limit?: number;
}

export function Recommended({
  products,
  recentlyViewed,
  limit = 4,
}: RecommendedProps) {
  if (!recentlyViewed.length) return null;

  const live = products.filter((p) => p.status === 'published');
  const recommended = live
    .filter(
      (p) =>
        !recentlyViewed.includes(p.id) &&
        recentlyViewed.some(
          (id) => live.find((x) => x.id === id)?.category === p.category
        )
    )
    .slice(0, limit);

  if (recommended.length === 0) return null;

  return (
    <section
      className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="rec-h"
    >
      <SectionHeading
        id="rec-h"
        title="Picked for you"
        subtitle="Based on what you’ve been browsing"
      />
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {recommended.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

// Alias for backward-compatibility
export const RecommendedSection = Recommended;
