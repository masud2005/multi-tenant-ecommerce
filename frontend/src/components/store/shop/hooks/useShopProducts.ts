'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { analyticsService } from '@/services/analytics-service';
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

  const getInitialCategories = (): string[] => {
    const cat = searchParams.get('category');
    if (!cat) return [];
    return cat.includes(',') ? cat.split(',').map((s) => s.trim()).filter(Boolean) : [cat];
  };

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...emptyFilters,
    categories: getInitialCategories(),
    onSale: searchParams.get('sale') === '1',
  }));
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
      categories: getInitialCategories(),
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

  const selectedCatObj =
    filters.categories.length === 1
      ? categories.find(
          (c) =>
            c.key === filters.categories[0] ||
            c.key.toLowerCase() === filters.categories[0].toLowerCase() ||
            c.name.toLowerCase() === filters.categories[0].toLowerCase()
        )
      : undefined;

  const category =
    mode === 'category'
      ? dbCategory || categories.find((c) => c.key === slug)
      : selectedCatObj;
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
    if (category && mode === 'category')
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

  // Record customer search query event for analytics exactly ONCE per intentional search submission
  const lastLoggedSearchRef = useRef<string>('');
  useEffect(() => {
    const cleanQ = q.trim().toLowerCase();
    if (mode === 'search' && cleanQ.length >= 2 && lastLoggedSearchRef.current !== cleanQ) {
      lastLoggedSearchRef.current = cleanQ;
      analyticsService.logCustomerSearch(cleanQ, base.length);
    }
  }, [mode, q, base.length]);

  // 2. Compute dynamic facets counts contextualized by active filters
  const facets = useMemo(() => {
    // 1. Filter base products by selected Categories (for Brand, Size, Color facets)
    const categoryFiltered = base.filter((p) => {
      if (!filters.categories.length) return true;
      const pCat = (p.category || '').toLowerCase();
      const pSub = (p.subcategory || '').toLowerCase();

      return filters.categories.some((c) => {
        const cLower = c.toLowerCase();
        if (pCat === cLower || pSub === cLower) return true;
        const matchedCat = categories.find(
          (cat) => cat.key.toLowerCase() === cLower || cat.name.toLowerCase() === cLower
        );
        if (matchedCat) {
          if (
            pCat === matchedCat.key.toLowerCase() ||
            pCat === matchedCat.name.toLowerCase()
          ) {
            return true;
          }
          if (
            matchedCat.subcategories?.some(
              (s) => s.toLowerCase() === pSub || s.toLowerCase() === pCat
            )
          ) {
            return true;
          }
        }
        return false;
      });
    });

    // 2. Filter further by selected Brands (for Size & Color facets)
    const catBrandFiltered = categoryFiltered.filter((p) => {
      if (!filters.brands.length) return true;
      const pBrand = (p.brand || '').toLowerCase();
      return filters.brands.some((b) => b.toLowerCase() === pBrand);
    });

    // 3. Category Counts (from base)
    const catCountMap = new Map<string, number>();
    base.forEach((p) => {
      const pCat = p.category;
      if (pCat) catCountMap.set(pCat, (catCountMap.get(pCat) ?? 0) + 1);
    });

    const categoryFacets = categories
      .filter((c) => catCountMap.has(c.key) || catCountMap.has(c.name as any))
      .map((c) => ({
        key: c.key,
        label: c.name,
        count: catCountMap.get(c.key) ?? catCountMap.get(c.name as any) ?? 0,
      }));

    // 4. Brand Counts (contextualized by active category filter)
    const brandCountMap = new Map<string, number>();
    categoryFiltered.forEach((p) => {
      if (p.brand) {
        brandCountMap.set(p.brand, (brandCountMap.get(p.brand) ?? 0) + 1);
      }
    });
    const brandFacets = Array.from(brandCountMap.entries()).map(([key, count]) => ({
      key,
      count,
    }));

    // 5. Size Counts (contextualized by active Category AND Brand filters)
    const sizeCountMap = new Map<string, number>();
    catBrandFiltered.forEach((p) => {
      const productSizes = new Set<string>();
      if (p.sizes && Array.isArray(p.sizes)) {
        p.sizes.forEach((s) => {
          if (s && s.trim()) productSizes.add(s.trim());
        });
      }
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach((v) => {
          if (v.size && (v.enabled ?? true)) {
            productSizes.add(v.size.trim());
          }
        });
      }
      productSizes.forEach((s) => {
        sizeCountMap.set(s, (sizeCountMap.get(s) ?? 0) + 1);
      });
    });

    // Standard ordering for common sizes
    const standardOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
    const sortedSizeKeys = Array.from(sizeCountMap.keys()).sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const sizeFacets = sortedSizeKeys.map((s) => ({
      size: s,
      count: sizeCountMap.get(s) ?? 0,
    }));

    // 6. Color Counts (contextualized by Category and Brand)
    const colorMap = new Map<string, { name: string; hex: string; count: number }>();
    catBrandFiltered.forEach((p) => {
      p.colors?.forEach((c) => {
        const existing = colorMap.get(c.name);
        if (existing) {
          existing.count += 1;
        } else {
          colorMap.set(c.name, { name: c.name, hex: c.hex, count: 1 });
        }
      });
    });
    const colorFacets = Array.from(colorMap.values());

    // 7. Stock & Sale Counts
    const inStockCount = catBrandFiltered.filter(
      (p) => productStock(p) > 0 || p.preorder
    ).length;
    const onSaleCount = catBrandFiltered.filter(
      (p) => !!p.salePrice && p.salePrice < p.price
    ).length;

    return {
      categories: categoryFacets,
      brands: brandFacets,
      sizes: sizeFacets,
      colors: colorFacets,
      inStockCount,
      onSaleCount,
    };
  }, [base, categories, filters.categories, filters.brands]);

  // 3. Compute filtered and sorted results
  const results = useMemo(() => {
    let list = base.filter((p) => {
      const price = productPrice(p);
      if (
        filters.categories.length &&
        !filters.categories.some(
          (c) =>
            p.category === c ||
            p.category?.toLowerCase() === c.toLowerCase() ||
            categories.some(
              (cat) =>
                (cat.key === c || cat.name?.toLowerCase() === c.toLowerCase()) &&
                (p.category === cat.key || p.category?.toLowerCase() === cat.name?.toLowerCase())
            )
        )
      ) {
        return false;
      }
      if (
        sub &&
        p.subcategory !== sub &&
        p.subcategory?.toLowerCase() !== sub.toLowerCase()
      ) {
        return false;
      }
      if (
        filters.brands.length &&
        !filters.brands.some((b) => b.toLowerCase() === (p.brand || '').toLowerCase())
      ) {
        return false;
      }
      if (filters.sizes.length) {
        const matchesProductSize = (p.sizes || []).some((s) =>
          filters.sizes.some((fs) => fs.toLowerCase() === s.toLowerCase())
        );
        const matchesVariantSize = (p.variants || []).some(
          (v) =>
            (v.enabled ?? true) &&
            filters.sizes.some((fs) => fs.toLowerCase() === (v.size || '').toLowerCase())
        );
        if (!matchesProductSize && !matchesVariantSize) {
          return false;
        }
      }
      if (
        filters.colors.length &&
        !p.colors.some((c) =>
          filters.colors.some((fc) => fc.toLowerCase() === c.name.toLowerCase())
        )
      ) {
        return false;
      }
      if (filters.minPrice && price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && price > Number(filters.maxPrice)) return false;
      if (filters.inStock && productStock(p) === 0 && !p.preorder) return false;
      if (filters.onSale && (!p.salePrice || p.salePrice >= p.price)) return false;
      if (filters.minRating && p.rating < filters.minRating) return false;
      return true;
    });

    // Helper to determine category selection order (index in filters.categories)
    const getCategoryPriority = (p: (typeof base)[number]) => {
      if (!filters.categories.length) return 0;
      const pCat = (p.category || '').toLowerCase();
      const pSub = (p.subcategory || '').toLowerCase();

      for (let i = 0; i < filters.categories.length; i++) {
        const c = filters.categories[i].toLowerCase();
        if (pCat === c || pSub === c) return i;

        const matchedCat = categories.find(
          (cat) => cat.key.toLowerCase() === c || cat.name.toLowerCase() === c
        );
        if (matchedCat) {
          if (
            pCat === matchedCat.key.toLowerCase() ||
            pCat === matchedCat.name.toLowerCase()
          ) {
            return i;
          }
          if (
            matchedCat.subcategories?.some(
              (s) => s.toLowerCase() === pSub || s.toLowerCase() === pCat
            )
          ) {
            return i;
          }
        }
      }
      return 999;
    };

    list = [...list].sort((a, b) => {
      // 1. Primary order: Category selection order (most recently selected category first)
      if (filters.categories.length > 1) {
        const priorityA = getCategoryPriority(a);
        const priorityB = getCategoryPriority(b);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
      }

      // 2. Secondary order: User's chosen sort order
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
  }, [base, filters, sort, categories, sub]);

  // 4. Compute active filter chips
  const activeChips: ActiveChip[] = useMemo(() => [
    ...filters.categories.map((c) => ({
      label: categories.find((x) => x.key === c || x.name.toLowerCase() === c.toLowerCase())?.name ?? c,
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
    { to: '/shop', label: 'Shop' },
    ...(category ? [{ to: `/shop?category=${category.key}`, label: category.name }] : []),
    ...(mode === 'collection' && collection ? [{ to: `/collections/${collection.slug}`, label: collection.name }] : []),
    ...(mode === 'brand' && brand ? [{ to: `/brands/${brand.slug}`, label: brand.name }] : []),
    ...(sub ? [{ to: `${pathname}?category=${category?.key || ''}&sub=${encodeURIComponent(sub)}`, label: sub }] : []),
  ], [mode, category, collection, brand, sub, pathname]);

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
