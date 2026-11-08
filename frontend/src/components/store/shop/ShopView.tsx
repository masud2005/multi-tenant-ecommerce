'use client';

import React from 'react';
import { useShopProducts, type ShopMode } from './hooks';
import { ShopFilters, emptyFilters } from './ShopFilters';
import {
  ShopHeader,
  ShopToolbar,
  ShopActiveChips,
  ShopProductGrid,
  ShopFilterDrawer,
} from './view';

export interface ShopViewProps {
  mode?: ShopMode;
  slug?: string;
}

export function ShopView({ mode = 'shop', slug }: ShopViewProps) {
  const {
    filters,
    setFilters,
    sort,
    setSort,
    view,
    setView,
    page,
    setPage,
    pageSize,
    totalPages,
    mobileFilters,
    setMobileFilters,
    collection,
    brand,
    category,
    facets,
    results,
    base,
    activeChips,
    title,
    sub,
    description,
    suggestion,
    q,
    bestsellers,
    breadcrumbs,
  } = useShopProducts(mode, slug);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* 1. Header, Banner & Breadcrumbs */}
      <ShopHeader
        collection={collection}
        brand={brand}
        category={category}
        breadcrumbs={breadcrumbs}
        title={title}
        sub={sub}
        description={description}
        suggestion={suggestion}
        q={q}
      />

      <div className="grid gap-10 lg:grid-cols-[232px_1fr] lg:items-start">
        {/* 2. Desktop filters — sticky viewport panel; wheel over sidebar scrolls filters only */}
        <aside
          aria-label="Filters"
          className="sticky top-28 hidden h-[calc(100vh-8rem)] self-start overflow-hidden lg:block"
        >
          <div className="scrollbar-none h-full overflow-y-auto overscroll-y-contain">
            <ShopFilters
              value={filters}
              onChange={(f) => {
                setFilters(f);
                setPage(1);
              }}
              facets={facets}
              hideCategory={mode === 'category'}
            />
          </div>
        </aside>

        {/* 3. Product Catalog Area */}
        <section aria-label="Products">
          <ShopToolbar
            totalCount={results.length}
            activeChipsCount={activeChips.length}
            onOpenMobileFilters={() => setMobileFilters(true)}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            mode={mode}
          />

          <ShopActiveChips
            chips={activeChips}
            onClearAll={() => setFilters(emptyFilters)}
          />

          <ShopProductGrid
            products={results}
            totalResults={results.length}
            currentPage={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            layout={view}
            bestsellers={bestsellers}
            activeChipsCount={activeChips.length}
            onClearFilters={() => setFilters(emptyFilters)}
            mode={mode}
            query={q}
            hasBaseProducts={base.length > 0}
          />
        </section>
      </div>

      {/* 4. Mobile Filters Slideout Drawer */}
      <ShopFilterDrawer
        open={mobileFilters}
        onClose={() => setMobileFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        facets={facets}
        hideCategory={mode === 'category'}
        resultsCount={results.length}
      />
    </div>
  );
}
