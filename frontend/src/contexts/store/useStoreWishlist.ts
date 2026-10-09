'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { wishlistService } from '@/services';
import { getAuthToken } from '@/services/auth/auth.storage';
import type { User } from './types';

export function useStoreWishlist(user: User | null) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const syncedUserIdRef = useRef<string | null>(null);

  // Sync wishlist from backend database whenever logged-in user changes
  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();

    if (user?.id && token) {
      if (syncedUserIdRef.current === user.id) return;
      syncedUserIdRef.current = user.id;

      // Always load the specific authenticated customer's own wishlist from database
      wishlistService
        .getWishlist()
        .then((res) => {
          if (!isMounted) return;
          if (res?.data && Array.isArray(res.data)) {
            const dbWishlistIds = res.data
              .map((item) => item.product?.id)
              .filter(Boolean) as string[];
            setWishlist(dbWishlistIds);
          } else {
            setWishlist([]);
          }
        })
        .catch((err) => {
          console.warn('Failed to load wishlist from server:', err);
          if (isMounted) setWishlist([]);
        });
    } else {
      syncedUserIdRef.current = null;
      setWishlist([]);
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tanti.wishlist');
        }
      } catch {}
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      if (!productId) return;

      // 1. Optimistic UI update
      setWishlist((prev) =>
        prev.includes(productId)
          ? prev.filter((x) => x !== productId)
          : [...prev, productId]
      );

      // 2. If authenticated, persist to backend database for this user
      if (user?.id) {
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
      }
    },
    [user?.id]
  );

  return {
    wishlist,
    setWishlist,
    toggleWishlist,
  };
}

