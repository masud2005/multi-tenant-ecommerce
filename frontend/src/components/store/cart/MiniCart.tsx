'use client';

import React from 'react';
import Link from 'next/link';
import { MinusIcon, PlusIcon, ShoppingBagIcon, TruckIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useCartLines } from '@/hooks/useCartLines';
import { FREE_SHIPPING_THRESHOLD } from '@/data/shipping';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatBDT } from '@/utils/format';

export function MiniCart() {
  const { miniCartOpen, setMiniCartOpen, updateQty, removeFromCart } = useStore();
  const { active, subtotal, count, hasIssues } = useCartLines();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const close = () => setMiniCartOpen(false);

  return (
    <Drawer
      open={miniCartOpen}
      onClose={close}
      title={`Your bag (${count})`}
      footer={
        active.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-semibold tabular-nums text-ink">
                {formatBDT(subtotal)}
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              Delivery and discounts calculated at checkout.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" href="/cart" onClick={close}>
                View bag
              </Button>
              <Button href={hasIssues ? '/cart' : '/checkout'} onClick={close}>
                Checkout
              </Button>
            </div>
          </div>
        )
      }
    >
      {active.length === 0 ? (
        <EmptyState
          icon={ShoppingBagIcon}
          title="Your bag is empty"
          description="Pieces you add will appear here."
          action={
            <Button href="/shop" onClick={close}>
              Start shopping
            </Button>
          }
        />
      ) : (
        <>
          <div className="border-b border-line bg-canvas px-5 py-3">
            <p className="flex items-center gap-2 text-sm">
              <TruckIcon className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
              {remaining > 0 ? (
                <span>
                  Add <b className="tabular-nums font-semibold">{formatBDT(remaining)}</b> for free delivery in Dhaka
                </span>
              ) : (
                <span className="text-success font-medium">
                  You’ve unlocked free delivery in Dhaka
                </span>
              )}
            </p>
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-ink transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <ul className="divide-y divide-line">
            {active.map(({ item, product, variant, unitPrice, maxQty, issue }) => (
              <li key={item.key} className="flex gap-4 px-5 py-4">
                <Link
                  href={`/products/${product.slug}`}
                  onClick={close}
                  className="shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-24 w-[72px] rounded object-cover border border-line bg-subtle"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={close}
                      className="text-sm font-medium leading-snug hover:underline text-ink line-clamp-1"
                    >
                      {product.title}
                    </Link>
                    <span className="text-sm font-medium tabular-nums text-ink">
                      {formatBDT(unitPrice * item.qty)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {variant.color} · {variant.size}
                  </p>
                  {issue === 'out_of_stock' && (
                    <p className="mt-1 text-xs font-medium text-danger">
                      Sold out — remove to continue
                    </p>
                  )}
                  {issue === 'limited' && (
                    <p className="mt-1 text-xs font-medium text-warning">
                      Only {maxQty} left
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-md border border-line-strong">
                      <button
                        className="p-1.5 disabled:opacity-40 cursor-pointer"
                        disabled={item.qty <= 1}
                        onClick={() => updateQty(item.key, item.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className="w-7 text-center text-sm tabular-nums"
                        aria-live="polite"
                      >
                        {item.qty}
                      </span>
                      <button
                        className="p-1.5 disabled:opacity-40 cursor-pointer"
                        disabled={item.qty >= maxQty}
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
