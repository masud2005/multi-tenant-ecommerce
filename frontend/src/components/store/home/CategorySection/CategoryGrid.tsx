import React from 'react';
import { CategoryCard, CategoryCardProps } from './CategoryCard';

export interface CategoryGridProps {
  categories: CategoryCardProps[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories.length) {
    return (
      <div className="mt-6 py-8 text-center text-sm text-ink-muted">
        No categories available at this moment.
      </div>
    );
  }

  return (
    <div className="scrollbar-none -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
      {categories.map((c) => (
        <CategoryCard
          key={c.slug || c.id || c.name}
          id={c.id}
          slug={c.slug}
          name={c.name}
          image={c.image}
          blurb={c.blurb}
        />
      ))}
    </div>
  );
}
