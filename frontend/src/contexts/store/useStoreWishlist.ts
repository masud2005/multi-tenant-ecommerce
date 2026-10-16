'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { wishlistService } from '@/services';
import { getAuthToken } from '@/services/auth/auth.storage';
import type { User } from './types';
import { loadWishlist } from './utils';

export function useStoreWishlist(user: User | null) {
  // Initialize immediately from localStorage so wishlist never flashes empty on page refresh
  const [wishlist, setWishlist] = useState<string[]>(() => loadWishlist());
  const syncedUserIdRef = useRef<string | null>(null);

  // Keep localStorage continuously in sync with current wishlist state
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tanti.wishlist', JSON.stringify(wishlist));
      }
    } catch {}
  }, [wishlist]);

  // Sync wishlist from backend database whenever authenticated customer changes or refreshes
  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();

    if (user?.id && token) {
      if (syncedUserIdRef.current === user.id) return;
      syncedUserIdRef.current = user.id;

      // Load authenticated customer's own wishlist from database
      wishlistService
        .getWishlist()
        .then((res) => {
          if (!isMounted) return;
          if (res?.data && Array.isArray(res.data)) {
            const dbWishlistIds = res.data
              .map((item) => item.product?.id)
              .filter(Boolean) as string[];
            setWishlist(dbWishlistIds);
          }
        })
        .catch((err) => {
          console.warn('Failed to load wishlist from server on load:', err);
          // Preserve cached wishlist on transient network errors
        });
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

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

      // 1. Optimistic UI update (immediately updates state & localStorage)
      setWishlist((prev) =>
        prev.includes(productId)
          ? prev.filter((x) => x !== productId)
          : [...prev, productId]
      );

      // 2. Persist to backend database for this user
      wishlistService.toggleWishlist(productId).catch((err) => {
        console.error('Failed to sync wishlist with server:', err);
        toast.error('Failed to update wishlist');
        // Rollback on failure
        setWishlist((prev) =>
          prev.includes(productId)
            ? prev.filter((x) => x !== productId)
            : [...prev, productId]
        );
      });
    },
    [user?.id]
  );

  return {
    wishlist,
    setWishlist,
    toggleWishlist,
  };
}
