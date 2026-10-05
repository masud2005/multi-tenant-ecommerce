'use client';

import React from 'react';
import { SectionHeading } from '@/components/store/shared';
import { useStore } from '@/contexts/StoreContext';
import { CategoryGrid } from './CategoryGrid';
import { CategoryCardProps } from './CategoryCard';

export interface CategorySectionProps {
  title?: string;
  className?: string;
}

export function CategorySection({
  title = 'Shop by category',
  className = 'mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8',
}: CategorySectionProps) {
  const { categories } = useStore();

  const mappedCategories: CategoryCardProps[] = categories.map((c) => ({
    id: c.key,
    slug: c.key,
    name: c.name,
    image: c.image || undefined,
    blurb: c.blurb,
  }));

  if (mappedCategories.length === 0) return null;

  return (
    <section className={className} aria-labelledby="cat-h">
      <SectionHeading id="cat-h" title={title} />
      <CategoryGrid categories={mappedCategories} />
    </section>
  );
}
