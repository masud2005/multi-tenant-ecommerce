'use client';

import { useState, useCallback } from 'react';

export function useStoreUI() {
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  const toggleCompare = useCallback((id: string) => {
    setCompare((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id]
    );
  }, []);

  const trackView = useCallback((id: string) => {
    setRecentlyViewed((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8));
  }, []);

  return {
    miniCartOpen,
    setMiniCartOpen,
    quickViewId,
    setQuickViewId,
    compareOpen,
    setCompareOpen,
    searchOpen,
    setSearchOpen,
    compare,
    setCompare,
    toggleCompare,
    recentlyViewed,
    setRecentlyViewed,
    trackView,
  };
}
