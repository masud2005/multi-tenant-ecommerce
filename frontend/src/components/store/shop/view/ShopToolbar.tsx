'use client';

import React from 'react';
import {
  LayoutGridIcon,
  ListIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export type Sort =
  | 'relevance'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'popular'
  | 'rating';

export interface ShopToolbarProps {
  totalCount: number;
  activeChipsCount: number;
  onOpenMobileFilters: () => void;
  sort: Sort;
  onSortChange: (sort: Sort) => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  mode?: string;
}

export function ShopToolbar({
  totalCount,
  activeChipsCount,
  onOpenMobileFilters,
  sort,
  onSortChange,
  view,
  onViewChange,
  mode,
}: ShopToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
      <button
        onClick={onOpenMobileFilters}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3 text-sm lg:hidden cursor-pointer text-ink hover:bg-subtle"
      >
        <SlidersHorizontalIcon className="h-4 w-4" aria-hidden /> Filters{' '}
        {activeChipsCount > 0 && `(${activeChipsCount})`}
      </button>

      <p className="text-sm text-ink-muted" aria-live="polite">
        {totalCount} {totalCount === 1 ? 'piece' : 'pieces'}
      </p>

      <div className="ml-auto flex items-center gap-2">
        <label htmlFor="sort" className="sr-only">
          Sort by
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as Sort)}
          className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-clay focus:outline-none cursor-pointer"
        >
          {mode === 'search' && (
            <option value="relevance">Most relevant</option>
          )}
          <option value="popular">Most popular</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>

        <div
          className="hidden rounded-md border border-line-strong p-0.5 sm:flex"
          role="group"
          aria-label="Layout"
        >
          <button
            onClick={() => onViewChange('grid')}
            aria-pressed={view === 'grid'}
            aria-label="Grid view"
            className={cn(
              'rounded p-1.5 cursor-pointer',
              view === 'grid' && 'bg-subtle'
            )}
          >
            <LayoutGridIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewChange('list')}
            aria-pressed={view === 'list'}
            aria-label="List view"
            className={cn(
              'rounded p-1.5 cursor-pointer',
              view === 'list' && 'bg-subtle'
            )}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
