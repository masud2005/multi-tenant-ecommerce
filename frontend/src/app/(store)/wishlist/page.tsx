'use client';

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { HeartIcon, TrendingDownIcon, BellIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { productPrice, productStock, available } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';

export default function WishlistPage() {
  const {
    user,
    wishlist,
    products,
    toggleWishlist,
    addToCart,
    setMiniCartOpen,
    setQuickViewId,
  } = useStore();
  const items = wishlist
    .map((id) => products.find((p) => p.id === id)!)
    .filter(Boolean);

  const moveToBag = (id: string) => {
    if (!user) {
      toast.error('Please log in to add items to your cart.');
      if (typeof window !== 'undefined') {
        window.location.href = '/login?next=/wishlist';
      }
      return;
    }
    const p = products.find((x) => x.id === id)!;
    if (p.sizes.length > 1) {
      setQuickViewId(p.id);
      return;
    }
    const v = p.variants.find((x) => available(x) > 0);
    if (!v) return;
    addToCart(p.id, v.id);
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
      <h1 className="font-display text-4xl">Wishlist</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {items.length} saved {items.length === 1 ? 'piece' : 'pieces'} · we’ll alert you
        about price drops and restocks
      </p>
      {items.length === 0 ? (
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
            return (
              <li key={p.id} className="flex flex-col">
                <Link
                  href={`/products/${p.slug}`}
                  className="relative block overflow-hidden rounded-md bg-subtle"
                >
                  <img
                    src={p.images[0]}
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
