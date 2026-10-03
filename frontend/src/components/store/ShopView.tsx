'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutGridIcon,
  ListIcon,
  SlidersHorizontalIcon,
  XIcon,
  SearchXIcon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { brands, collections } from '@/data/products';
import { ProductCard } from '@/components/store/ProductCard';
import {
  ShopFilters,
  emptyFilters,
  type FilterState,
} from '@/components/store/ShopFilters';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { searchProducts } from '@/utils/search';
import { productPrice, productStock } from '@/utils/pricing';
import { collectionService } from '@/services/collection-service';
import { brandService } from '@/services/brand-service';
import { images } from '@/data/images';
import type { CollectionItem } from '@/types/collection';
import type { BrandItem } from '@/types/brand';
import { cn } from '@/utils/cn';

type Sort =
  | 'relevance'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'popular'
  | 'rating';

const PAGE_SIZE = 8;

interface ShopViewProps {
  mode?: 'shop' | 'category' | 'collection' | 'brand' | 'search';
  slug?: string;
}

export function ShopView({ mode = 'shop', slug }: ShopViewProps) {
  const { products, categories } = useStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const sub = searchParams.get('sub');

  const [filters, setFilters] = useState<FilterState>({
    ...emptyFilters,
    onSale: searchParams.get('sale') === '1',
  });
  const [sort, setSort] = useState<Sort>(
    (searchParams.get('sort') as Sort) ?? (mode === 'search' ? 'relevance' : 'popular')
  );
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    setFilters({
      ...emptyFilters,
      onSale: searchParams.get('sale') === '1',
    });
    setVisible(PAGE_SIZE);
  }, [pathname, q, searchParams]);

  const [dbCollection, setDbCollection] = useState<CollectionItem | null>(null);
  const [dbBrand, setDbBrand] = useState<BrandItem | null>(null);

  useEffect(() => {
    if (mode === 'collection' && slug) {
      collectionService
        .getCollectionBySlugOrId(slug)
        .then((res) => {
          if (res?.data) {
            const d = res.data;
            setDbCollection({
              slug: d.slug,
              name: d.name,
              description: d.description || '',
              image: d.image || images.hero,
              type: (d.type?.toLowerCase() === 'rule' ? 'rule' : 'manual') as any,
              ruleDetails: d.rule || undefined,
              rule:
                d.rule && typeof d.rule === 'object'
                  ? `${d.rule.field || 'Tag'} ${d.rule.op || 'contains'} "${d.rule.value || ''}"`
                  : undefined,
              isFeatured: d.isFeatured,
              isActive: d.isActive,
              seoTitle: d.seoTitle || undefined,
              seoDescription: d.seoDescription || undefined,
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load collection details from backend:', err);
        });
    }

    if (mode === 'brand' && slug) {
      brandService
        .getBrandBySlugOrId(slug)
        .then((res) => {
          if (res?.data) {
            const d = res.data;
            setDbBrand({
              id: d.id,
              name: d.name,
              slug: d.slug,
              description: d.description || '',
              logo: d.logo,
              isActive: d.isActive,
              _count: d._count,
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load brand details from backend:', err);
        });
    }
  }, [mode, slug]);

  const category =
    mode === 'category' ? categories.find((c) => c.key === slug) : undefined;
  const collection: CollectionItem | undefined =
    mode === 'collection'
      ? dbCollection || (collections as CollectionItem[]).find((c) => c.slug === slug)
      : undefined;
  const brand: BrandItem | undefined =
    mode === 'brand'
      ? dbBrand || (brands as BrandItem[]).find((b) => b.slug === slug)
      : undefined;

  const { base, suggestion } = useMemo(() => {
    const live = products.filter((p) => p.status === 'published');
    if (mode === 'search') {
      const r = searchProducts(live, q);
      return { base: r.results, suggestion: r.suggestion };
    }
    let list = live;
    if (category)
      list = list.filter(
        (p) => p.category === category.key && (!sub || p.subcategory === sub)
      );
    if (collection) {
      if (collection.type === 'rule' && collection.ruleDetails) {
        const v = (collection.ruleDetails.value || '').toLowerCase().trim();
        list = list.filter((p) => {
          if (collection.ruleDetails!.field === 'Tag') {
            return p.tags?.some((t) => t.toLowerCase().includes(v));
          }
          if (collection.ruleDetails!.field === 'Price') {
            const num = Number(collection.ruleDetails!.value);
            if (isNaN(num)) return false;
            return (p.salePrice ?? p.price) < num;
          }
          return p.title.toLowerCase().includes(v);
        });
      } else {
        list = list.filter((p) => p.collections?.includes(collection.slug));
      }
    }
    if (brand) {
      list = list.filter(
        (p) =>
          p.brand?.toLowerCase() === brand.name.toLowerCase() ||
          p.brand?.toLowerCase() === brand.slug.toLowerCase()
      );
    }
    return { base: list, suggestion: null };
  }, [products, mode, q, category, collection, brand, sub]);

  const facets = useMemo(() => {
    const count = <K extends string>(key: (p: (typeof base)[number]) => K) => {
      const m = new Map<K, number>();
      base.forEach((p) => m.set(key(p), (m.get(key(p)) ?? 0) + 1));
      return m;
    };
    const cats = count((p) => p.category);
    const brs = count((p) => p.brand);
    const colors = new Map<string, string>();
    base.forEach((p) => p.colors.forEach((c) => colors.set(c.name, c.hex)));
    const sizes = Array.from(new Set(base.flatMap((p) => p.sizes))).filter(
      (s) => !['Free size', 'One size'].includes(s)
    );
    return {
      categories: categories
        .filter((c) => cats.has(c.key))
        .map((c) => ({
          key: c.key,
          label: c.name,
          count: cats.get(c.key)!,
        })),
      brands: Array.from(brs.entries()).map(([key, n]) => ({ key, count: n })),
      sizes,
      colors: Array.from(colors.entries()).map(([name, hex]) => ({ name, hex })),
    };
  }, [base, categories]);

  const results = useMemo(() => {
    let list = base.filter((p) => {
      const price = productPrice(p);
      if (filters.categories.length && !filters.categories.includes(p.category))
        return false;
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (
        filters.sizes.length &&
        !p.sizes.some((s) => filters.sizes.includes(s))
      )
        return false;
      if (
        filters.colors.length &&
        !p.colors.some((c) => filters.colors.includes(c.name))
      )
        return false;
      if (filters.minPrice && price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && price > Number(filters.maxPrice)) return false;
      if (filters.inStock && productStock(p) === 0) return false;
      if (filters.onSale && !p.salePrice) return false;
      if (filters.minRating && p.rating < filters.minRating) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.createdAt.localeCompare(a.createdAt);
        case 'price_asc':
          return productPrice(a) - productPrice(b);
        case 'price_desc':
          return productPrice(b) - productPrice(a);
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
          return b.sold - a.sold;
        default:
          return 0;
      }
    });
    return list;
  }, [base, filters, sort]);

  const activeChips: { label: string; clear: () => void }[] = [
    ...filters.categories.map((c) => ({
      label: categories.find((x) => x.key === c)?.name ?? c,
      clear: () =>
        setFilters((f) => ({
          ...f,
          categories: f.categories.filter((x) => x !== c),
        })),
    })),
    ...filters.brands.map((b) => ({
      label: b,
      clear: () =>
        setFilters((f) => ({ ...f, brands: f.brands.filter((x) => x !== b) })),
    })),
    ...filters.sizes.map((s) => ({
      label: `Size ${s}`,
      clear: () =>
        setFilters((f) => ({ ...f, sizes: f.sizes.filter((x) => x !== s) })),
    })),
    ...filters.colors.map((c) => ({
      label: c,
      clear: () =>
        setFilters((f) => ({ ...f, colors: f.colors.filter((x) => x !== c) })),
    })),
    ...(filters.minPrice || filters.maxPrice
      ? [
        {
          label: `৳${filters.minPrice || 0} – ${filters.maxPrice ? `৳${filters.maxPrice}` : 'any'
            }`,
          clear: () =>
            setFilters((f) => ({ ...f, minPrice: '', maxPrice: '' })),
        },
      ]
      : []),
    ...(filters.inStock
      ? [
        {
          label: 'In stock',
          clear: () => setFilters((f) => ({ ...f, inStock: false })),
        },
      ]
      : []),
    ...(filters.onSale
      ? [
        {
          label: 'On sale',
          clear: () => setFilters((f) => ({ ...f, onSale: false })),
        },
      ]
      : []),
    ...(filters.minRating
      ? [
        {
          label: `${filters.minRating}★ & up`,
          clear: () => setFilters((f) => ({ ...f, minRating: 0 })),
        },
      ]
      : []),
  ];

  const title =
    category?.name ??
    collection?.name ??
    brand?.name ??
    (mode === 'search'
      ? `Results for “${suggestion ?? q}”`
      : filters.onSale
        ? 'Sale'
        : 'Shop all');

  const description =
    collection?.description ??
    brand?.description ??
    (category ? category.blurb : undefined);

  const bestsellers = products
    .filter((p) => p.isBestseller && p.status === 'published')
    .slice(0, 4);

  const breadcrumbs = [
    { to: '/', label: 'Home' },
    ...(mode === 'category'
      ? [{ to: `/category/${slug}`, label: category?.name ?? '' }]
      : []),
    ...(mode === 'collection' ? [{ to: '/shop', label: 'Collections' }] : []),
    ...(mode === 'brand' ? [{ to: '/shop', label: 'Brands' }] : []),
    ...(sub ? [{ to: `${pathname}?sub=${sub}`, label: sub }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      {collection ? (
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
      ) : (
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
                href={`/category/${category.key}`}
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
                  href={`/category/${category.key}?sub=${encodeURIComponent(s)}`}
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
      )}

      <div className="grid gap-10 lg:grid-cols-[232px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-32">
            <ShopFilters
              value={filters}
              onChange={(f) => {
                setFilters(f);
                setVisible(PAGE_SIZE);
              }}
              facets={facets}
              hideCategory={mode === 'category'}
            />
          </div>
        </aside>

        <section aria-label="Products">
          <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
            <button
              onClick={() => setMobileFilters(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3 text-sm lg:hidden cursor-pointer text-ink hover:bg-subtle"
            >
              <SlidersHorizontalIcon className="h-4 w-4" aria-hidden /> Filters{' '}
              {activeChips.length > 0 && `(${activeChips.length})`}
            </button>
            <p className="text-sm text-ink-muted" aria-live="polite">
              {results.length} {results.length === 1 ? 'piece' : 'pieces'}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-clay focus:outline-none"
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
                  onClick={() => setView('grid')}
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
                  onClick={() => setView('list')}
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

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4">
              {activeChips.map((c) => (
                <button
                  key={c.label}
                  onClick={c.clear}
                  className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-xs hover:bg-line text-ink cursor-pointer"
                >
                  {c.label} <XIcon className="h-3 w-3" aria-hidden />
                  <span className="sr-only">Remove filter</span>
                </button>
              ))}
              <button
                onClick={() => setFilters(emptyFilters)}
                className="text-xs text-ink-muted underline hover:text-ink cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div>
              <EmptyState
                icon={SearchXIcon}
                title={
                  mode === 'search' && base.length === 0
                    ? `Nothing found for “${q}”`
                    : 'No pieces match these filters'
                }
                description={
                  mode === 'search' && base.length === 0
                    ? 'Check the spelling or try a broader term like “kurta” or “linen”.'
                    : 'Try removing a filter or widening the price range.'
                }
                action={
                  activeChips.length > 0 ? (
                    <Button
                      variant="secondary"
                      onClick={() => setFilters(emptyFilters)}
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
              <p className="mb-4 text-sm font-medium text-ink">You might like</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
                {bestsellers.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'pt-6',
                  view === 'grid'
                    ? 'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4'
                    : 'space-y-6'
                )}
              >
                {results.slice(0, visible).map((p) => (
                  <ProductCard key={p.id} product={p} layout={view} />
                ))}
              </div>
              {visible < results.length && (
                <div className="mt-12 flex flex-col items-center gap-3">
                  <p className="text-xs text-ink-muted">
                    Showing {Math.min(visible, results.length)} of{' '}
                    {results.length}
                  </p>
                  <div className="h-0.5 w-40 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full bg-ink"
                      style={{
                        width: `${(visible / results.length) * 100}%`,
                      }}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="cursor-pointer"
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Drawer
        open={mobileFilters}
        onClose={() => setMobileFilters(false)}
        title="Filters"
        side="left"
        width="max-w-sm"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setFilters(emptyFilters)}
              className="flex-1 cursor-pointer"
            >
              Clear
            </Button>
            <Button
              onClick={() => setMobileFilters(false)}
              className="flex-1 cursor-pointer"
            >
              Show {results.length}
            </Button>
          </div>
        }
      >
        <div className="px-5 py-5">
          <ShopFilters
            value={filters}
            onChange={setFilters}
            facets={facets}
            hideCategory={mode === 'category'}
          />
        </div>
      </Drawer>
    </div>
  );
}
