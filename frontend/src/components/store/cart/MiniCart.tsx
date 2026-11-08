'use client';

import React from 'react';
import Link from 'next/link';
import { MinusIcon, PlusIcon, ShoppingBagIcon, TruckIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useTenant } from '@/contexts/TenantContext';
import { useCartLines } from '@/hooks/useCartLines';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatBDT } from '@/utils/format';

export function MiniCart() {
  const { user, miniCartOpen, setMiniCartOpen, updateQty, removeFromCart } = useStore();
  const { shipping, isLoading: shippingLoading } = useTenant();
  const { active, subtotal, count, hasIssues } = useCartLines();

  const threshold = shipping.freeDeliveryThreshold;
  const freeShippingEnabled = threshold > 0;
  const remaining = freeShippingEnabled ? Math.max(0, threshold - subtotal) : 0;
  const progress = freeShippingEnabled
    ? Math.min(100, (subtotal / threshold) * 100)
    : 0;
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
              <Button
                variant="secondary"
                href="/cart"
                onClick={() => setMiniCartOpen(false)}
              >
                View bag
              </Button>
              <Button
                href={hasIssues ? '/cart' : user ? '/checkout' : '/login?next=/checkout'}
                onClick={() => setMiniCartOpen(false)}
              >
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
          {freeShippingEnabled && !shippingLoading && (
            <div className="border-b border-line bg-canvas px-5 py-3">
              <p className="flex items-center gap-2 text-sm">
                <TruckIcon className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                {remaining > 0 ? (
                  <span>
                    Add <b className="tabular-nums font-semibold">{formatBDT(remaining)}</b> for
                    free delivery in Dhaka
                  </span>
                ) : (
                  <span className="font-medium text-success">
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
          )}
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
                    className="h-24 w-[72px] rounded border border-line bg-subtle object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={close}
                      className="line-clamp-1 text-sm font-medium leading-snug text-ink hover:underline"
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
                    <p className="mt-1 text-xs font-medium text-warning">Only {maxQty} left</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-md border border-line-strong">
                      <button
                        className="cursor-pointer p-1.5 disabled:opacity-40"
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
                        className="cursor-pointer p-1.5 disabled:opacity-40"
                        disabled={item.qty >= maxQty}
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="cursor-pointer text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
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
