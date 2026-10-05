'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { CategoryTree } from './CategoryTree';
import { CategoryDetailPanel } from './CategoryDetailPanel';
import { productService } from '@/services/product-service';
import { categoryService } from '@/services/category-service';
import { images } from '@/data/images';
import type { CategoryItemData } from '@/types/commerce';
import type { Product } from '@/types/product';

interface CategoryManagerProps {
  initialCategories?: CategoryItemData[];
  products?: Product[];
}

export function CategoryManager({ initialCategories = [], products = [] }: CategoryManagerProps) {
  const store = useStore();
  const [categoriesFromDb, setCategoriesFromDb] = useState<CategoryItemData[] | null>(null);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const [res, prodRes] = await Promise.allSettled([
        categoryService.getCategories(),
        productService.getProducts(),
      ]);

      if (res.status === 'fulfilled' && res.value?.data && Array.isArray(res.value.data)) {
        // Map backend categories (top-level categories with subcategories from children)
        const topLevel = res.value.data.filter((c: any) => !c.parentId);
        const mapped: CategoryItemData[] = (topLevel.length > 0 ? topLevel : res.value.data).map((c: any) => {
          const subs: string[] = Array.isArray(c.children) && c.children.length > 0
            ? c.children.map((ch: any) => ch.name)
            : res.value.data
                .filter((other: any) => other.parentId === c.id)
                .map((other: any) => other.name);

          return {
            key: c.slug || c.id,
            name: c.name,
            image: c.image || images.kurta,
            blurb: c.description || '',
            subcategories: subs,
            parentKey: c.parentId || undefined,
            status: c.status || 'published',
          };
        });

        setCategoriesFromDb(mapped);
      } else {
        setCategoriesFromDb([]);
      }

      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setLiveProducts(prodRes.value);
      }
    } catch (err) {
      console.error('Failed to fetch categories from DB:', err);
      setCategoriesFromDb([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categoriesList = useMemo(() => {
    if (categoriesFromDb !== null && categoriesFromDb.length > 0) {
      return categoriesFromDb;
    }
    if (store?.categories && store.categories.length > 0) {
      return store.categories;
    }
    if (initialCategories && initialCategories.length > 0) {
      return initialCategories;
    }
    return categoriesFromDb !== null ? categoriesFromDb : [];
  }, [categoriesFromDb, store?.categories, initialCategories]);

  const productsList = useMemo(() => {
    if (liveProducts.length > 0) return liveProducts;
    if (store?.products && store.products.length > 0) return store.products;
    return products;
  }, [liveProducts, store?.products, products]);

  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [activeKey, setActiveKey] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  // Sync activeKey when categories are loaded
  useEffect(() => {
    if (categoriesList.length > 0) {
      if (!activeKey || !categoriesList.some((c) => c.key === activeKey)) {
        setActiveKey(categoriesList[0].key);
        setActiveSubcategory(null);
      }
    } else {
      setActiveKey('');
      setActiveSubcategory(null);
    }
  }, [categoriesList, activeKey]);

  const activeCategory = useMemo(() => {
    return (
      categoriesList.find((c) => c.key === activeKey) ||
      categoriesList[0] || {
        key: 'default',
        name: 'Default',
        image: '',
        blurb: '',
        subcategories: [],
      }
    );
  }, [categoriesList, activeKey]);

  // If active subcategory is deleted or no longer belongs to active category
  useEffect(() => {
    if (
      activeSubcategory &&
      activeCategory &&
      !activeCategory.subcategories.includes(activeSubcategory)
    ) {
      setActiveSubcategory(null);
    }
  }, [activeCategory, activeSubcategory]);

  const getProductCount = (categoryKey: string, subcategory?: string) => {
    const catNorm = categoryKey.toLowerCase();
    const matchedCategory = categoriesList.find((c) => c.key === categoryKey);
    const catNameNorm = matchedCategory?.name.toLowerCase();

    return productsList.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      const matchesCategory = pCat === catNorm || (catNameNorm && pCat === catNameNorm);
      if (!matchesCategory) return false;
      if (!subcategory) return true;
      return (p.subcategory || '').toLowerCase() === subcategory.toLowerCase();
    }).length;
  };

  const handleToggleKey = (key: string) => {
    setOpenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectCategory = (key: string) => {
    setActiveKey(key);
    setActiveSubcategory(null);
    if (!openKeys.includes(key)) {
      setOpenKeys((prev) => [...prev, key]);
    }
  };

  const handleSelectSubcategory = (categoryKey: string, subcategory: string | null) => {
    setActiveKey(categoryKey);
    setActiveSubcategory(subcategory);
    if (!openKeys.includes(categoryKey)) {
      setOpenKeys((prev) => [...prev, categoryKey]);
    }
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Categories"
        description="Hierarchical categories power navigation, filters, product tagging and breadcrumbs."
        actions={
          <Button
            variant="primary"
            size="sm"
            href="/admin/categories/new"
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span>Add category</span>
          </Button>
        }
      />

      {isLoading && categoriesFromDb === null ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-line bg-surface">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-5 w-5 animate-spin text-clay" />
            <span>Loading categories...</span>
          </div>
        </div>
      ) : categoriesList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-12 text-center bg-surface">
          <p className="text-base font-medium text-ink">No categories found</p>
          <p className="mt-1 text-sm text-ink-muted">
            Get started by creating your first category for your store.
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              size="sm"
              href="/admin/categories/new"
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Add your first category</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
          {/* Left column: Tree navigation */}
          <div className="sticky top-6">
            <CategoryTree
              categories={categoriesList}
              activeKey={activeKey}
              onSelectCategory={handleSelectCategory}
              activeSubcategory={activeSubcategory}
              onSelectSubcategory={handleSelectSubcategory}
              openKeys={openKeys}
              onToggleKey={handleToggleKey}
              getProductCount={getProductCount}
              className="h-full min-h-[520px]"
            />
          </div>

          {/* Right column: Category / Subcategory Detail Panel */}
          <div className="w-full space-y-6">
            <CategoryDetailPanel
              key={`${activeCategory.key}-${activeSubcategory || 'main'}`}
              category={activeCategory}
              activeSubcategory={activeSubcategory}
              onSelectSubcategory={setActiveSubcategory}
              onSelectCategory={handleSelectCategory}
              allCategories={categoriesList}
              products={productsList}
              productCount={getProductCount(
                activeCategory.key,
                activeSubcategory || undefined
              )}
              getProductCount={getProductCount}
              onRefresh={fetchCategories}
            />
          </div>
        </div>
      )}
    </div>
  );
}
