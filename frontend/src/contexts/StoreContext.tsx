'use client';

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import type { CartItem } from '@/types/commerce';
import {
  type User,
  type PlaceOrderInput,
  type StoreContextValue,
  useStoreAuth,
  useStoreCart,
  useStoreWishlist,
  useStoreCatalog,
  useStoreOrders,
  useStoreUI,
} from './store';

// Export types for backward compatibility across the codebase
export type { User, PlaceOrderInput, StoreContextValue };

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // 1. Authentication & Customer Profile State
  const auth = useStoreAuth();

  // 2. Shopping Cart & Inventory State
  const cartState = useStoreCart();

  // 3. Wishlist State & Server Persistence
  const wishlistState = useStoreWishlist(auth.user);

  // 4. Initial Database Cart Hydration Callback
  const handleCartInitialized = useCallback((dbItems: any[]) => {
    const formatted: CartItem[] = dbItems.map((item) => ({
      key: `${item.variantId}-${item.id}`,
      productId: item.productId,
      variantId: item.variantId,
      qty: item.qty,
      savedForLater: item.savedForLater,
    }));
    cartState.setCart(formatted);
  }, [cartState]);

  // 5. Product Catalog & Categories State
  const catalog = useStoreCatalog(handleCartInitialized);

  // 6. Orders, Returns & Reviews State
  const ordersState = useStoreOrders(
    auth.user,
    catalog.products,
    cartState.cart,
    catalog.adjustStock,
    cartState.setCart
  );

  // 7. Modals, Drawers & UI Navigation State
  const ui = useStoreUI();

  // 8. Unified Context Value Composition
  const value = useMemo<StoreContextValue>(
    () => ({
      // Catalog
      isStoreLoading: catalog.isStoreLoading,
      products: catalog.products,
      categories: catalog.categories,
      collections: catalog.collections,
      saveProduct: catalog.saveProduct,
      adjustStock: catalog.adjustStock,
      addCategory: catalog.addCategory,
      saveCategory: catalog.saveCategory,
      deleteCategory: catalog.deleteCategory,
      addSubcategory: catalog.addSubcategory,
      removeSubcategory: catalog.removeSubcategory,
      renameSubcategory: catalog.renameSubcategory,

      // Cart
      cart: cartState.cart,
      addToCart: cartState.addToCart,
      updateQty: cartState.updateQty,
      changeVariant: cartState.changeVariant,
      removeFromCart: cartState.removeFromCart,
      toggleSaveForLater: cartState.toggleSaveForLater,
      clearCart: cartState.clearCart,

      // Wishlist
      wishlist: wishlistState.wishlist,
      toggleWishlist: wishlistState.toggleWishlist,

      // Auth & Customer
      user: auth.user,
      addresses: auth.addresses,
      storeCredit: auth.storeCredit,
      customers: auth.customers,
      login: auth.login,
      register: auth.register,
      logout: auth.logout,
      saveAddress: auth.saveAddress,
      deleteAddress: auth.deleteAddress,
      setDefaultAddress: auth.setDefaultAddress,
      toggleCustomerStatus: auth.toggleCustomerStatus,

      // Orders, Returns & Reviews
      orders: ordersState.orders,
      returns: ordersState.returns,
      reviews: ordersState.reviews,
      placeOrder: ordersState.placeOrder,
      completePayment: ordersState.completePayment,
      retryPayment: ordersState.retryPayment,
      setOrderStatus: ordersState.setOrderStatus,
      addOrderNote: ordersState.addOrderNote,
      refundOrder: ordersState.refundOrder,
      markCodCollected: ordersState.markCodCollected,
      cancelOrder: ordersState.cancelOrder,
      createReturn: ordersState.createReturn,
      updateReturn: ordersState.updateReturn,
      updateReview: ordersState.updateReview,
      addReview: ordersState.addReview,

      // UI & Modals
      miniCartOpen: ui.miniCartOpen,
      setMiniCartOpen: ui.setMiniCartOpen,
      quickViewId: ui.quickViewId,
      setQuickViewId: ui.setQuickViewId,
      compareOpen: ui.compareOpen,
      setCompareOpen: ui.setCompareOpen,
      searchOpen: ui.searchOpen,
      setSearchOpen: ui.setSearchOpen,
      compare: ui.compare,
      toggleCompare: ui.toggleCompare,
      recentlyViewed: ui.recentlyViewed,
      trackView: ui.trackView,
    }),
    [catalog, cartState, wishlistState, auth, ordersState, ui]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
}
