'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { wishlistService } from '@/services';
import { getAuthToken } from '@/services/auth/auth.storage';
import { loadWishlist } from './utils';
import type { User } from './types';

export function useStoreWishlist(user: User | null) {
  const [wishlist, setWishlist] = useState<string[]>(() => loadWishlist());
  const syncedUserIdRef = useRef<string | null>(null);

  // Sync wishlist to local storage (for guest users or offline cache)
  useEffect(() => {
    try {
      localStorage.setItem('tanti.wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // Handle guest-to-user wishlist sync & server hydration on login
  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();

    if (user?.id && token) {
      // Prevent redundant sync calls for the same login session
      if (syncedUserIdRef.current === user.id) return;
      syncedUserIdRef.current = user.id;

      // 1. Check if there are items saved in localStorage during guest browsing
      const localGuestItems = loadWishlist();

      if (localGuestItems.length > 0) {
        // Sync & merge guest wishlist with database
        wishlistService
          .syncWishlist(localGuestItems)
          .then((res) => {
            if (!isMounted) return;
            if (res?.data && Array.isArray(res.data)) {
              const mergedIds = res.data
                .map((item) => item.product?.id)
                .filter(Boolean) as string[];
              setWishlist(mergedIds);
            }
          })
          .catch((err) => {
            console.error('Failed to sync guest wishlist with server:', err);
          });
      } else {
        // No guest items, simply load the customer's server wishlist
        wishlistService
          .getWishlist()
          .then((res) => {
            if (!isMounted) return;
            if (res?.data && Array.isArray(res.data)) {
              const dbWishlistIds = res.data
                .map((item) => item.product?.id)
                .filter(Boolean) as string[];
              if (dbWishlistIds.length > 0) {
                setWishlist(dbWishlistIds);
              }
            }
          })
          .catch((err) => {
            console.error('Failed to load wishlist from server:', err);
          });
      }
    } else {
      syncedUserIdRef.current = null;
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      // 1. Optimistic UI update
      setWishlist((prev) =>
        prev.includes(productId)
          ? prev.filter((x) => x !== productId)
          : [...prev, productId]
      );

      // 2. If authenticated, persist to backend database
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
