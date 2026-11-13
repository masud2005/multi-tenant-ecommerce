'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CategoryItemData, Product } from '@/types/commerce';
import type { CollectionItem } from '@/types/collection';
import {
  categoryService,
  productService,
  cartService,
  collectionService,
  type CategoryResponseData,
  type CollectionResponseData,
} from '@/services';

export function useStoreCatalog() {
  const [isStoreLoading, setIsStoreLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(true);

  // Initialize with strictly empty state - NO mock/fake seed data!
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItemData[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  // Fetch real categories, products, and collections dynamically from server
  useEffect(() => {
    let isMounted = true;

    async function initializeStore() {
      // 1. Fetch Categories independently so it displays as soon as ready
      const fetchCategories = async () => {
        try {
          const catRes = await categoryService.getCategories();
          if (!isMounted) return;

          if (catRes && catRes.data && Array.isArray(catRes.data) && catRes.data.length > 0) {
            const parentCategories = catRes.data.filter(
              (c: CategoryResponseData) => !c.parentId && c.isActive !== false
            );
            const targetList = parentCategories.length > 0 ? parentCategories : catRes.data;

            const mapped: CategoryItemData[] = targetList.map((c: CategoryResponseData) => {
              const childrenNames = (c.children || []).map((ch) => ch.name);
              return {
                key: c.slug || c.id,
                name: c.name,
                image: c.image || '',
                blurb: c.description || `${c.name} collection`,
                subcategories: childrenNames,
              };
            });

            if (mapped.length > 0) {
              setCategories(mapped);
            }
          }
        } catch (err) {
          console.error('Failed to load real categories:', err);
        } finally {
          if (isMounted) setIsCategoriesLoading(false);
        }
      };

      // 2. Fetch Products independently
      const fetchProducts = async () => {
        try {
          const prodRes = await productService.getProducts();
          if (!isMounted) return;

          if (prodRes && Array.isArray(prodRes) && prodRes.length > 0) {
            setProducts(prodRes);
          }
        } catch (err) {
          console.error('Failed to load real products:', err);
        } finally {
          if (isMounted) setIsProductsLoading(false);
        }
      };

      // 3. Fetch Collections independently
      const fetchCollections = async () => {
        try {
          const colRes = await collectionService.getCollections();
          if (!isMounted) return;

          if (colRes && colRes.data && Array.isArray(colRes.data) && colRes.data.length > 0) {
            const activeCols = colRes.data.filter(
              (c: CollectionResponseData) => c.isActive !== false
            );
            const mappedCols: CollectionItem[] = activeCols.map((c: CollectionResponseData) => ({
              id: c.id,
              slug: c.slug,
              name: c.name,
              description: c.description || '',
              image: c.image || '',
              type: c.type?.toLowerCase() === 'rule' ? 'rule' : 'manual',
              ruleDetails: c.rule && typeof c.rule === 'object' ? c.rule : undefined,
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
          console.error('Failed to load real collections:', err);
        } finally {
          if (isMounted) setIsCollectionsLoading(false);
        }
      };

      await Promise.allSettled([fetchCategories(), fetchProducts(), fetchCollections()]);
      if (isMounted) {
        setIsStoreLoading(false);
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
    isProductsLoading,
    isCategoriesLoading,
    isCollectionsLoading,
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
