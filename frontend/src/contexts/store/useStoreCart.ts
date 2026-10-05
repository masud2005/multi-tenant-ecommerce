'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CartItem } from '@/types/commerce';
import { cartService } from '@/services';
import { loadCart } from './utils';

export function useStoreCart() {
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());

  // Sync cart changes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('tanti.cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const addToCart = useCallback((productId: string, variantId: string, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variantId && !i.savedForLater);
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { key: `${variantId}-${Date.now()}`, productId, variantId, qty }];
    });

    // Persist in backend database Cart and CartItem table
    cartService
      .addToCart({ productId, variantId, qty })
      .catch((err: any) => {
        console.error('Failed to persist cart in backend:', err);
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Could not add item to bag. Please check stock.';
        toast.error(errorMsg);

        // Re-sync cart from database to revert optimistic addition if failed
        cartService
          .getCart()
          .then((res) => {
            if (res?.data?.items) {
              setCart(
                res.data.items.map((item) => ({
                  key: `${item.variantId}-${item.id}`,
                  productId: item.productId,
                  variantId: item.variantId,
                  qty: item.qty,
                  savedForLater: item.savedForLater,
                }))
              );
            }
          })
          .catch(() => {});
      });
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    const validQty = Math.max(1, qty);
    let targetVariantId: string | undefined;

    setCart((prev) => {
      const item = prev.find((i) => i.key === key);
      if (item) {
        targetVariantId = item.variantId;
      }
      return prev.map((i) => (i.key === key ? { ...i, qty: validQty } : i));
    });

    if (targetVariantId) {
      cartService
        .updateQuantity(targetVariantId, validQty)
        .catch((err: any) => {
          console.error('Failed to sync updated quantity to backend:', err);
          const errorMsg =
            err?.response?.data?.message ||
            err?.message ||
            'Requested quantity exceeds available stock.';
          toast.error(errorMsg);

          // Revert to database state if out of stock
          cartService
            .getCart()
            .then((res) => {
              if (res?.data?.items) {
                setCart(
                  res.data.items.map((item) => ({
                    key: `${item.variantId}-${item.id}`,
                    productId: item.productId,
                    variantId: item.variantId,
                    qty: item.qty,
                    savedForLater: item.savedForLater,
                  }))
                );
              }
            })
            .catch(() => {});
        });
    }
  }, []);

  const changeVariant = useCallback((key: string, variantId: string) => {
    setCart((prev) => prev.map((i) => (i.key === key ? { ...i, variantId } : i)));
  }, []);

  const removeFromCart = useCallback((key: string) => {
    let targetVariantId: string | undefined;

    setCart((prev) => {
      const item = prev.find((i) => i.key === key);
      if (item) {
        targetVariantId = item.variantId;
      }
      return prev.filter((i) => i.key !== key);
    });

    if (targetVariantId) {
      cartService
        .removeItem(targetVariantId)
        .catch((err) => console.error('Failed to sync item removal to backend:', err));
    }
  }, []);

  const toggleSaveForLater = useCallback((key: string) => {
    let targetVariantId: string | undefined;
    let nextSavedState = false;

    setCart((prev) => {
      const item = prev.find((i) => i.key === key);
      if (item) {
        targetVariantId = item.variantId;
        nextSavedState = !item.savedForLater;
      }
      return prev.map((i) =>
        i.key === key ? { ...i, savedForLater: !i.savedForLater } : i
      );
    });

    if (targetVariantId) {
      cartService
        .updateQuantity(targetVariantId, undefined, nextSavedState)
        .catch((err) => console.error('Failed to sync savedForLater to backend:', err));
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart((prev) => prev.filter((i) => i.savedForLater));
  }, []);

  return {
    cart,
    setCart,
    addToCart,
    updateQty,
    changeVariant,
    removeFromCart,
    toggleSaveForLater,
    clearCart,
  };
}
