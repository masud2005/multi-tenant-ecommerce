'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, SparklesIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CollectionsPage() {
  const { collections, products, isStoreLoading } = useStore();

  if (isStoreLoading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center py-20">
        <LoadingSpinner size="lg" label="Loading collections..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-clay/10 px-3 py-1 text-xs font-semibold text-clay">
          <SparklesIcon className="h-3.5 w-3.5" />
          <span>Curated Editions</span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
          Store Collections
        </h1>
        <p className="mt-3 text-base text-ink-soft">
          Explore our seasonal edits, festive capsule lines, and handpicked artisan selections.
        </p>
      </div>

      {/* Collections Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((col) => {
          // Calculate active products count if applicable
          const count = products.filter((p) =>
            p.collections?.includes(col.slug)
          ).length;

          return (
            <Link
              key={col.slug}
              href={`/collections/${col.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-pop"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={col.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'}
                  alt={col.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
                {col.isFeatured && (
                  <span className="absolute top-3 right-3 rounded-full bg-clay px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                    Featured
                  </span>
                )}
                <div className="absolute bottom-3 left-3 right-3 text-canvas">
                  <p className="text-xs font-medium text-canvas/80">
                    {count > 0 ? `${count} items` : 'Curated collection'}
                  </p>
                  <h2 className="font-display text-xl font-semibold text-canvas">
                    {col.name}
                  </h2>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <p className="text-sm text-ink-soft line-clamp-2">
                  {col.description || 'Explore unique handpicked items in this collection.'}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-clay group-hover:underline">
                  <span>Explore collection</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
