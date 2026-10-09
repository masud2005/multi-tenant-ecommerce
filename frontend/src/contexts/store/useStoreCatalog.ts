'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CategoryItemData, Product } from '@/types/commerce';
import type { CollectionItem } from '@/types/collection';
import {
  products as seedProducts,
  categories as seedCategories,
  collections as seedCollections,
} from '@/data/products';
import { images } from '@/data/images';
import {
  categoryService,
  productService,
  cartService,
  collectionService,
  type CategoryResponseData,
  type CollectionResponseData,
} from '@/services';
import { load } from './utils';

export function useStoreCatalog() {
  const [isStoreLoading, setIsStoreLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>(() =>
    load('tanti.products', seedProducts)
  );
  const [categories, setCategories] = useState<CategoryItemData[]>(() =>
    load('tanti.categories', seedCategories as CategoryItemData[])
  );
  const [collections, setCollections] = useState<CollectionItem[]>(() =>
    load('tanti.collections', seedCollections as CollectionItem[])
  );

  // Sync products, categories, and collections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tanti.products', JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('tanti.categories', JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('tanti.collections', JSON.stringify(collections));
    } catch {}
  }, [collections]);

  // Fetch real categories, products, and collections on mount
  useEffect(() => {
    let isMounted = true;
    async function initializeStore() {
      try {
        const [catRes, prodRes, colRes] = await Promise.allSettled([
          categoryService.getCategories(),
          productService.getProducts(),
          collectionService.getCollections(),
        ]);

        if (!isMounted) return;

        // 1. Process Categories
        if (catRes.status === 'fulfilled' && catRes.value?.data && catRes.value.data.length > 0) {
          const parentCategories = catRes.value.data.filter(
            (c: CategoryResponseData) => !c.parentId && c.isActive !== false
          );
          const targetList = parentCategories.length > 0 ? parentCategories : catRes.value.data;

          const mapped: CategoryItemData[] = targetList.map((c: CategoryResponseData) => {
            const childrenNames = (c.children || []).map((ch: any) => ch.name);
            return {
              key: c.slug || c.id,
              name: c.name,
              image: c.image || images.kurta,
              blurb: c.description || `${c.name} collection`,
              subcategories: childrenNames,
            };
          });

          if (mapped.length > 0) {
            setCategories(mapped);
          }
        }

        // 2. Process Products
        if (prodRes.status === 'fulfilled' && prodRes.value && prodRes.value.length > 0) {
          setProducts(prodRes.value);
        }

        // 3. Process Collections from Database
        if (colRes.status === 'fulfilled' && colRes.value?.data && colRes.value.data.length > 0) {
          const activeCols = colRes.value.data.filter(
            (c: CollectionResponseData) => c.isActive !== false
          );
          const mappedCols: CollectionItem[] = activeCols.map((c: CollectionResponseData) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            description: c.description || '',
            image: c.image || images.hero,
            type: (c.type?.toLowerCase() === 'rule' ? 'rule' : 'manual') as any,
            ruleDetails: c.rule || undefined,
            rule:
              c.rule && typeof c.rule === 'object'
                ? `${c.rule.field || 'Tag'} ${c.rule.op || c.rule.condition || 'contains'} "${c.rule.value || ''}"`
                : undefined,
            isFeatured: c.isFeatured,
            isActive: c.isActive,
            seoTitle: c.seoTitle || undefined,
            seoDescription: c.seoDescription || undefined,
            startsAt: c.startsAt || undefined,
            endsAt: c.endsAt || undefined,
          }));

          if (mappedCols.length > 0) {
            setCollections(mappedCols);
          }
        }
      } catch (err) {
        console.error('Failed to initialize store data:', err);
      } finally {
        if (isMounted) {
          setIsStoreLoading(false);
        }
      }
    }

    initializeStore();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveProduct = useCallback((p: Product) => {
    setProducts((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]
    );
  }, []);

  const adjustStock = useCallback((productId: string, variantId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== productId
          ? p
          : {
              ...p,
              variants: p.variants.map((v) =>
                v.id === variantId ? { ...v, stock: Math.max(0, v.stock + delta) } : v
              ),
            }
      )
    );
  }, []);

  const addCategory = useCallback((c: CategoryItemData) => {
    setCategories((prev) => {
      let updated = [...prev];
      if (c.parentKey && c.parentKey !== 'none') {
        updated = updated.map((p) => {
          if (p.key === c.parentKey && !p.subcategories.includes(c.name)) {
            return { ...p, subcategories: [...p.subcategories, c.name] };
          }
          return p;
        });
      }
      if (updated.some((x) => x.key === c.key)) {
        return updated.map((x) => (x.key === c.key ? c : x));
      }
      return [c, ...updated];
    });
  }, []);

  const saveCategory = useCallback((key: string, patch: Partial<CategoryItemData>) => {
    setCategories((prev) => {
      const current = prev.find((c) => c.key === key);
      const oldName = current?.name;
      return prev.map((c) => {
        if (c.key === key) {
          return { ...c, ...patch };
        }
        if (oldName && patch.name && oldName !== patch.name && c.subcategories.includes(oldName)) {
          return {
            ...c,
            subcategories: c.subcategories.map((s) => (s === oldName ? patch.name! : s)),
          };
        }
        return c;
      });
    });
  }, []);

  const deleteCategory = useCallback((key: string) => {
    setCategories((prev) => {
      const target = prev.find((c) => c.key === key);
      const targetName = target?.name;
      return prev
        .filter((c) => c.key !== key)
        .map((c) => {
          const updated = { ...c };
          if (c.parentKey === key) {
            updated.parentKey = undefined;
          }
          if (targetName && c.subcategories.includes(targetName)) {
            updated.subcategories = c.subcategories.filter((s) => s !== targetName);
          }
          return updated;
        });
    });
  }, []);

  const addSubcategory = useCallback((categoryKey: string, subcategoryName: string) => {
    const clean = subcategoryName.trim();
    if (!clean) return;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.key !== categoryKey) return c;
        if (c.subcategories.includes(clean)) return c;
        return { ...c, subcategories: [...c.subcategories, clean] };
      })
    );
  }, []);

  const removeSubcategory = useCallback((categoryKey: string, subcategoryName: string) => {
    const clean = subcategoryName.trim();
    setCategories((prev) =>
      prev.map((c) => {
        if (c.key !== categoryKey) return c;
        return {
          ...c,
          subcategories: c.subcategories.filter((s) => s !== clean),
        };
      })
    );
    setProducts((prev) =>
      prev.map((p) => {
        if (p.category === categoryKey && p.subcategory === clean) {
          return { ...p, subcategory: '' };
        }
        return p;
      })
    );
  }, []);

  const renameSubcategory = useCallback(
    (categoryKey: string, oldName: string, newName: string) => {
      const clean = newName.trim();
      if (!clean) return;
      setCategories((prev) =>
        prev.map((c) => {
          if (c.key !== categoryKey) return c;
          return {
            ...c,
            subcategories: c.subcategories.map((s) => (s === oldName ? clean : s)),
          };
        })
      );
      setProducts((prev) =>
        prev.map((p) => {
          if (p.category === categoryKey && p.subcategory === oldName) {
            return { ...p, subcategory: clean };
          }
          return p;
        })
      );
    },
    []
  );

  return {
    isStoreLoading,
    products,
    setProducts,
    categories,
    setCategories,
    collections,
    setCollections,
    saveProduct,
    adjustStock,
    addCategory,
    saveCategory,
    deleteCategory,
    addSubcategory,
    removeSubcategory,
    renameSubcategory,
  };
}
