'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { HeartIcon, TrendingDownIcon, BellIcon, Loader2Icon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { productPrice, productStock, available } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';
import type { Product } from '@/types/commerce';

export default function WishlistPage() {
  const {
    user,
    wishlist,
    wishlistProducts,
    isWishlistLoading,
    refreshWishlist,
    products,
    toggleWishlist,
    addToCart,
    setMiniCartOpen,
    setQuickViewId,
  } = useStore();

  // Always trigger a fresh fetch from the backend database when entering the wishlist page
  useEffect(() => {
    if (refreshWishlist && user?.id) {
      refreshWishlist();
    }
  }, [refreshWishlist, user?.id]);

  // Resolve items by matching catalog products first, then falling back to direct backend wishlist products
  const items: Product[] = wishlist
    .map((id) => {
      const fromCatalog = products.find((p) => p.id === id);
      if (fromCatalog) return fromCatalog;
      const fromWishlistDb = wishlistProducts?.find((p) => p.id === id);
      return fromWishlistDb || null;
    })
    .filter(Boolean) as Product[];

  const moveToBag = (id: string) => {
    if (!user) {
      toast.error('Please log in to add items to your cart.');
      if (typeof window !== 'undefined') {
        window.location.href = '/login?next=/wishlist';
      }
      return;
    }
    const p = items.find((x) => x.id === id) || products.find((x) => x.id === id);
    if (!p) return;

    if (p.sizes && p.sizes.length > 1) {
      setQuickViewId(p.id);
      return;
    }
    const v = p.variants?.find((x) => available(x) > 0) || p.variants?.[0];
    const variantId = v?.id || `${p.id}-default`;
    addToCart(p.id, variantId);
    toggleWishlist(p.id);
    toast.success('Moved to bag');
    setMiniCartOpen(true);
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <EmptyState
          icon={HeartIcon}
          title="Sign in to view your Wishlist"
          description="Save and manage pieces you love across all your devices."
          action={<Button href="/login?next=/wishlist">Sign in to your account</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl">Wishlist</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {items.length} saved {items.length === 1 ? 'piece' : 'pieces'} · we’ll alert you
            about price drops and restocks
          </p>
        </div>
        {isWishlistLoading && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Loader2Icon className="h-4 w-4 animate-spin text-clay" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {isWishlistLoading && items.length === 0 ? (
        <div className="py-24 text-center">
          <Loader2Icon className="mx-auto h-8 w-8 animate-spin text-clay" />
          <p className="mt-3 text-sm text-ink-muted">Loading your saved pieces...</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="Nothing saved yet"
          description="Tap the heart on any piece to save it here."
          action={<Button href="/shop">Discover pieces</Button>}
        />
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => {
            const stock = productStock(p);
            const imageSrc = p.images?.[0] || (p as any).coverImage || '/placeholder.png';
            return (
              <li key={p.id} className="flex flex-col">
                <Link
                  href={`/products/${p.slug}`}
                  className="relative block overflow-hidden rounded-md bg-subtle"
                >
                  <img
                    src={imageSrc}
                    alt={p.title}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {p.salePrice && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded bg-clay px-2 py-0.5 text-xs font-semibold text-white">
                      <TrendingDownIcon className="h-3 w-3" aria-hidden /> Price dropped
                    </span>
                  )}
                </Link>
                <p className="mt-3 text-sm font-medium">{p.title}</p>
                <p className="mt-0.5 flex items-baseline gap-2 text-sm">
                  <span className="font-semibold">{formatBDT(productPrice(p))}</span>
                  {p.salePrice && (
                    <span className="text-xs text-ink-muted line-through">
                      {formatBDT(p.price)}
                    </span>
                  )}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    stock === 0 && !p.preorder
                      ? 'text-danger'
                      : stock <= 5
                      ? 'text-warning'
                      : 'text-success'
                  }`}
                >
                  {p.preorder
                    ? 'Available for pre-order'
                    : stock === 0
                    ? 'Sold out'
                    : stock <= 5
                    ? `Low stock — ${stock} left`
                    : 'In stock'}
                </p>
                <div className="mt-auto flex gap-2 pt-3">
                  {stock === 0 && !p.preorder ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => toast.success('We’ll notify you when it’s back')}
                    >
                      <BellIcon className="h-3.5 w-3.5" aria-hidden /> Notify me
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1" onClick={() => moveToBag(p.id)}>
                      Move to bag
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleWishlist(p.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
