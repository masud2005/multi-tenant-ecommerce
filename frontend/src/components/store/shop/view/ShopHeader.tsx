'use client';

import React from 'react';
import Link from 'next/link';
import type { CollectionItem } from '@/types/collection';
import type { BrandItem } from '@/types/brand';
import type { CategoryItemData } from '@/types/commerce';
import { cn } from '@/utils/cn';

export interface ShopHeaderProps {
  collection?: CollectionItem;
  brand?: BrandItem;
  category?: CategoryItemData;
  breadcrumbs: { to: string; label: string }[];
  title: string;
  sub: string | null;
  description?: string;
  suggestion?: string | null;
  q: string;
}

export function ShopHeader({
  collection,
  brand,
  category,
  breadcrumbs,
  title,
  sub,
  description,
  suggestion,
  q,
}: ShopHeaderProps) {
  if (collection) {
    return (
      <div className="relative -mx-4 mb-10 overflow-hidden sm:mx-0 sm:mt-6 sm:rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={collection.image}
          alt=""
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 bg-ink/35" aria-hidden />
        <div className="absolute bottom-0 p-6 text-canvas sm:p-10">
          <p className="text-sm text-canvas/80">Collection</p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl text-canvas">
            {collection.name}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-canvas/90">
            {collection.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <header className="pb-8 pt-8">
      <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
        <ol className="flex flex-wrap gap-1.5">
          {breadcrumbs.map((b, i) => (
            <li key={b.label + i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span aria-current="page" className="text-ink font-medium">
                  {b.label}
                </span>
              ) : (
                <Link href={b.to} className="hover:text-ink">
                  {b.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {brand && brand.logo ? (
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-line bg-surface overflow-hidden shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-clay">
              Brand Showcase
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-ink font-semibold">
              {brand.name}
            </h1>
          </div>
        </div>
      ) : (
        <h1 className="mt-3 font-display text-4xl text-ink">
          {sub ?? title}
        </h1>
      )}

      {description && (
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          {description}
        </p>
      )}

      {category && (
        <div className="scrollbar-none mt-5 flex gap-2 overflow-x-auto">
          <Link
            href={`/shop?category=${category.key}`}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm cursor-pointer transition-colors',
              !sub
                ? 'border-ink bg-ink text-canvas font-semibold'
                : 'border-line-strong hover:border-ink text-ink'
            )}
          >
            All
          </Link>
          {category.subcategories.map((s) => (
            <Link
              key={s}
              href={`/shop?category=${category.key}&sub=${encodeURIComponent(s)}`}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm cursor-pointer transition-colors',
                sub === s
                  ? 'border-ink bg-ink text-canvas font-semibold'
                  : 'border-line-strong hover:border-ink text-ink'
              )}
            >
              {s}
            </Link>
          ))}
        </div>
      )}

      {suggestion && (
        <p className="mt-3 text-sm text-ink-muted">
          No exact matches for “{q}” — showing results for “{suggestion}”.
        </p>
      )}
    </header>
  );
}
