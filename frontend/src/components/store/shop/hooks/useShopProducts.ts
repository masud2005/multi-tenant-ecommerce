'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import { brands, collections } from '@/data/products';
import { emptyFilters, type FilterState } from '../ShopFilters';
import type { Sort, ActiveChip } from '../view';
import { searchProducts } from '@/utils/search';
import { productPrice, productStock } from '@/utils/pricing';
import { collectionService } from '@/services/collection-service';
import { brandService } from '@/services/brand-service';
import { categoryService } from '@/services/category-service';
import { images } from '@/data/images';
import type { CollectionItem } from '@/types/collection';
import type { BrandItem } from '@/types/brand';
import type { CategoryItemData } from '@/types/commerce';

const PAGE_SIZE = 8;

export type ShopMode = 'shop' | 'category' | 'collection' | 'brand' | 'search';

export function useShopProducts(mode: ShopMode = 'shop', slug?: string) {
  const { products, categories, collections: storeCollections } = useStore();
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

  // Reset filters on route/query change
  useEffect(() => {
    setFilters({
      ...emptyFilters,
      onSale: searchParams.get('sale') === '1',
    });
    setVisible(PAGE_SIZE);
  }, [pathname, q, searchParams]);

  // Load detailed database metadata for category, collection, or brand
  const [dbCategory, setDbCategory] = useState<CategoryItemData | null>(null);
  const [dbCollection, setDbCollection] = useState<CollectionItem | null>(null);
  const [dbBrand, setDbBrand] = useState<BrandItem | null>(null);

  useEffect(() => {
    if (mode === 'category' && slug) {
      categoryService
        .getCategoryBySlugOrId(slug)
        .then((res) => {
          if (res?.data) {
            const d = res.data;
            setDbCategory({
              key: d.slug || d.id,
              name: d.name,
              image: d.image || images.kurta,
              blurb: d.description || '',
              subcategories: (d.children || []).map((ch: any) => ch.name),
              seoTitle: d.seoTitle || undefined,
              seoDescription: d.seoDescription || undefined,
            });
          }
        })
        .catch((err) => console.error('Failed to load category details from backend:', err));
    }

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
        .catch((err) => console.error('Failed to load collection details from backend:', err));
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
        .catch((err) => console.error('Failed to load brand details from backend:', err));
    }
  }, [mode, slug]);

  const category =
    mode === 'category'
      ? dbCategory || categories.find((c) => c.key === slug)
      : undefined;
  const collection: CollectionItem | undefined =
    mode === 'collection'
      ? dbCollection || (storeCollections || (collections as CollectionItem[])).find((c) => c.slug === slug)
      : undefined;
  const brand: BrandItem | undefined =
    mode === 'brand'
      ? dbBrand || (brands as BrandItem[]).find((b) => b.slug === slug)
      : undefined;

  // 1. Filter base products list based on view mode
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

  // 2. Compute dynamic facets counts for filters sidebar
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
    const inStockCount = base.filter(
      (p) => productStock(p) > 0 || p.preorder
    ).length;
    const onSaleCount = base.filter(
      (p) => !!p.salePrice && p.salePrice < p.price
    ).length;

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
      inStockCount,
      onSaleCount,
    };
  }, [base, categories]);

  // 3. Compute filtered and sorted results
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
      if (filters.inStock && productStock(p) === 0 && !p.preorder) return false;
      if (filters.onSale && (!p.salePrice || p.salePrice >= p.price)) return false;
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

  // 4. Compute active filter chips
  const activeChips: ActiveChip[] = useMemo(() => [
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
          label: `৳${filters.minPrice || 0} – ${filters.maxPrice ? `৳${filters.maxPrice}` : 'any'}`,
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
  ], [filters, categories]);

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

  const bestsellers = useMemo(
    () => products.filter((p) => p.isBestseller && p.status === 'published').slice(0, 4),
    [products]
  );

  const breadcrumbs = useMemo(() => [
    { to: '/', label: 'Home' },
    ...(mode === 'category'
      ? [{ to: `/category/${slug}`, label: category?.name ?? '' }]
      : []),
    ...(mode === 'collection' ? [{ to: '/shop', label: 'Collections' }] : []),
    ...(mode === 'brand' ? [{ to: '/shop', label: 'Brands' }] : []),
    ...(sub ? [{ to: `${pathname}?sub=${sub}`, label: sub }] : []),
  ], [mode, slug, category, sub, pathname]);

  return {
    filters,
    setFilters,
    sort,
    setSort,
    view,
    setView,
    visible,
    setVisible,
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
  };
}
