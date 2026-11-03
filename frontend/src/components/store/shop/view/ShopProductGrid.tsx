'use client';

import React from 'react';
import { SearchXIcon } from 'lucide-react';
import { ProductCard } from '@/components/store/product/ProductCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import type { Product } from '@/types';
import { cn } from '@/utils/cn';

export interface ShopProductGridProps {
  products: Product[];
  totalResults: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  layout: 'grid' | 'list';
  bestsellers: Product[];
  activeChipsCount: number;
  onClearFilters: () => void;
  mode?: string;
  query?: string;
  hasBaseProducts: boolean;
}

export function ShopProductGrid({
  products,
  totalResults,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  layout,
  bestsellers,
  activeChipsCount,
  onClearFilters,
  mode,
  query,
  hasBaseProducts,
}: ShopProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={SearchXIcon}
          title={
            mode === 'search' && !hasBaseProducts
              ? `Nothing found for “${query}”`
              : 'No pieces match these filters'
          }
          description={
            mode === 'search' && !hasBaseProducts
              ? 'Check the spelling or try a broader term like “kurta” or “linen”.'
              : 'Try removing a filter or widening the price range.'
          }
          action={
            activeChipsCount > 0 ? (
              <Button
                variant="secondary"
                onClick={onClearFilters}
                className="cursor-pointer"
              >
                Clear filters
              </Button>
            ) : (
              <Button href="/shop" className="cursor-pointer">
                Browse all
              </Button>
            )
          }
        />

        {bestsellers.length > 0 && (
          <div className="mt-12">
            <p className="mb-4 text-sm font-medium text-ink">You might like</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {bestsellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Slice products for the active page
  const startIndex = (currentPage - 1) * pageSize;
  const displayedProducts = products.slice(startIndex, startIndex + pageSize);

  return (
    <>
      <div
        className={cn(
          'pt-6',
          layout === 'grid'
            ? 'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4'
            : 'space-y-6'
        )}
      >
        {displayedProducts.map((p) => (
          <ProductCard key={p.id} product={p} layout={layout} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={totalResults}
        pageSize={pageSize}
      />
    </>
  );
}
