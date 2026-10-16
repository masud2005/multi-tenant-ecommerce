'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { wishlistService } from '@/services';
import { getAuthToken } from '@/services/auth/auth.storage';
import type { Product } from '@/types/commerce';
import type { User } from './types';
import { load, loadWishlist } from './utils';

function mapWishlistProductToDomain(item: any): Product {
  const p = item.product || item;
  const imageUrls =
    Array.isArray(p.images) && p.images.length > 0
      ? p.images.map((img: any) => (typeof img === 'string' ? img : img.url))
      : [p.coverImage || '/placeholder.png'];

  const variants =
    Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants.map((v: any) => ({
          id: v.id || `${p.id}-v1`,
          sku: v.sku || '',
          color: v.color || 'Standard',
          size: v.size || 'Free Size',
          price: Number(v.price ?? p.price),
          salePrice: v.salePrice ? Number(v.salePrice) : undefined,
          stock: Number(v.stock ?? p.totalStock ?? 10),
          reserved: Number(v.reserved ?? 0),
          enabled: true,
        }))
      : [
          {
            id: `${p.id}-default`,
            sku: 'TN-DEFAULT',
            color: p.availableColors?.[0] || 'Standard',
            size: p.availableSizes?.[0] || 'Free Size',
            price: Number(p.price || 0),
            salePrice: p.salePrice ? Number(p.salePrice) : undefined,
            stock: Number(p.totalStock ?? 10),
            reserved: 0,
            enabled: true,
          },
        ];

  return {
    id: p.id,
    slug: p.slug || p.id,
    title: p.title || 'Product',
    brand: typeof p.brand === 'object' ? p.brand?.name || 'Tanti Studio' : p.brand || 'Tanti Studio',
    category: typeof p.category === 'object' ? p.category?.slug || p.category?.name || 'women' : p.category || 'women',
    subcategory: p.subcategory?.name || '',
    collections: [],
    tags: [],
    images: imageUrls,
    price: Number(p.price || 0),
    salePrice: p.salePrice ? Number(p.salePrice) : undefined,
    cost: 0,
    rating: Number(p.rating || 5),
    reviewCount: Number(p.reviewCount || 0),
    sold: 0,
    createdAt: item.savedAt || new Date().toISOString(),
    status: 'published',
    shortDescription: p.shortDescription || '',
    description: p.shortDescription || '',
    colors: (p.availableColors || ['Standard']).map((c: string) => ({ name: c, hex: '#000000' })),
    sizes: p.availableSizes && p.availableSizes.length > 0 ? p.availableSizes : ['Free Size'],
    variants,
    specs: [],
    weightGrams: 0,
    preorder: Boolean(p.preorder),
    isNew: Boolean(p.isNew),
    isBestseller: Boolean(p.isBestseller),
    barcode: p.barcode || '',
  };
}

export function useStoreWishlist(user: User | null) {
  // Initialize immediately from localStorage so wishlist never flashes empty on page refresh
  const [wishlist, setWishlist] = useState<string[]>(() => loadWishlist());
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>(() =>
    load<Product[]>('tanti.wishlist_products', [])
  );
  const [isWishlistLoading, setIsWishlistLoading] = useState<boolean>(false);

  // Keep localStorage continuously in sync with current wishlist state
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tanti.wishlist', JSON.stringify(wishlist));
      }
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tanti.wishlist_products', JSON.stringify(wishlistProducts));
      }
    } catch {}
  }, [wishlistProducts]);

  // Always fresh fetch function from backend database
  const loadWishlistFromBackend = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !user?.id) {
      setWishlist([]);
      setWishlistProducts([]);
      return;
    }

    setIsWishlistLoading(true);
    try {
      const res = await wishlistService.getWishlist();
      if (res?.data && Array.isArray(res.data)) {
        const dbWishlistIds = res.data
          .map((item) => item.product?.id)
          .filter(Boolean) as string[];
        const dbProducts = res.data
          .filter((item) => item.product?.id)
          .map((item) => mapWishlistProductToDomain(item));

        setWishlist(dbWishlistIds);
        setWishlistProducts(dbProducts);

        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('tanti.wishlist', JSON.stringify(dbWishlistIds));
            localStorage.setItem('tanti.wishlist_products', JSON.stringify(dbProducts));
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Failed to load wishlist from server on load:', err);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [user?.id]);

  // Sync wishlist from backend database whenever authenticated customer changes, logs in, or logs out
  useEffect(() => {
    if (user?.id) {
      loadWishlistFromBackend();
    } else {
      // User is logged out: clear wishlist state and cache
      setWishlist([]);
      setWishlistProducts([]);
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tanti.wishlist');
          localStorage.removeItem('tanti.wishlist_products');
        }
      } catch {}
    }
  }, [user?.id, loadWishlistFromBackend]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      if (!productId) return;

      if (!user?.id) {
        toast.error('Please log in to save items to your wishlist.');
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?next=${encodeURIComponent(currentPath || '/')}`;
        }
        return;
      }

      const isCurrentlyWished = wishlist.includes(productId);

      // 1. Optimistic UI update
      setWishlist((prev) =>
        isCurrentlyWished ? prev.filter((x) => x !== productId) : [...prev, productId]
      );
      if (isCurrentlyWished) {
        setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
      }

      // 2. Persist to backend database for this user
      wishlistService
        .toggleWishlist(productId)
        .then(() => {
          // Re-sync with backend to get latest product data
          loadWishlistFromBackend();
        })
        .catch((err) => {
          console.error('Failed to sync wishlist with server:', err);
          toast.error('Failed to update wishlist');
          // Revert on failure
          loadWishlistFromBackend();
        });
    },
    [user?.id, wishlist, loadWishlistFromBackend]
  );

  return {
    wishlist,
    wishlistProducts,
    isWishlistLoading,
    loadWishlistFromBackend,
    setWishlist,
    toggleWishlist,
  };
}
