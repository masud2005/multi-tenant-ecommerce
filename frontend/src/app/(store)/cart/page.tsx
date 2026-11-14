'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangleIcon,
  BookmarkIcon,
  ShoppingBagIcon,
  MinusIcon,
  PlusIcon,
  InfoIcon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useCartLines } from '@/hooks/useCartLines';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductCard } from '@/components/store/product';
import { SectionHeading } from '@/components/store/shared';
import { formatBDT } from '@/utils/format';

function CartSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading bag">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-2 h-4 w-24" />
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6 border-y border-line py-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-5">
              <Skeleton className="h-36 w-28 shrink-0 rounded" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-64 max-w-full" />
                <Skeleton className="h-4 w-32 max-w-full" />
                <Skeleton className="mt-8 h-9 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const {
    updateQty,
    removeFromCart,
    toggleSaveForLater,
    changeVariant,
    user,
    products,
    cart,
    isCartLoading,
    isProductsLoading,
  } = useStore();
  const { active, saved, subtotal, hasIssues, count } = useCartLines();

  const isBootstrapping =
    !!isCartLoading ||
    !!isProductsLoading ||
    (cart.length > 0 && active.length === 0 && saved.length === 0);

  const inCartIds = active.map((l) => l.product.id);
  const recommendations = products
    .filter(
      (p) =>
        p.status === 'published' &&
        !inCartIds.includes(p.id) &&
        p.category === 'accessories'
    )
    .slice(0, 4);
  const blocked = active.some((l) => l.issue === 'out_of_stock');

  if (isBootstrapping) {
    return <CartSkeleton />;
  }

  if (active.length === 0 && saved.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={ShoppingBagIcon}
          title="Your bag is empty"
          description="Explore our latest collection and start adding items to your bag."
          action={<Button href="/shop">Browse Catalog</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl">Your bag</h1>
      <p className="mt-1 text-sm text-ink">
        {count} {count === 1 ? 'item' : 'items'}
      </p>

      {!user && (
        <div className="mt-6 flex items-center gap-3 rounded-md bg-info-soft px-4 py-3 text-sm text-info">
          <InfoIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <Link href="/login?next=/cart" className="font-medium underline">
              Sign in
            </Link>{' '}
            to save your bag across devices — items here will be merged with your account.
          </span>
        </div>
      )}

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          {hasIssues && (
            <div
              className="mb-4 flex gap-3 rounded-md border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
              role="alert"
            >
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Some items changed since you added them. Review the highlighted items before checking
              out.
            </div>
          )}
          <ul className="divide-y divide-line border-y border-line">
            {active.map(({ item, product, variant, unitPrice, maxQty, issue }) => (
                <li key={item.key} className="flex gap-3 sm:gap-5 py-5 sm:py-6">
                  <Link href={`/products/${product.slug}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images[0]}
                      alt=""
                      className="h-28 w-20 sm:h-36 sm:w-28 rounded object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-medium hover:underline"
                        >
                          {product.title}
                        </Link>
                        <p className="mt-0.5 text-sm text-ink/80">{variant.color}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium tabular-nums">
                          {formatBDT(unitPrice * item.qty)}
                        </p>
                        {item.qty > 1 && (
                          <p className="text-xs tabular-nums text-ink/80">
                            {formatBDT(unitPrice)} each
                          </p>
                        )}
                      </div>
                    </div>
                    {issue && (
                      <p className="mt-2 text-sm font-medium text-danger">
                        {issue === 'out_of_stock'
                          ? 'This size just sold out. Choose another size or save it for later.'
                          : `Only ${maxQty} left — quantity will be reduced at checkout.`}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                      {product.sizes.length > 1 && (
                        <select
                          aria-label="Size"
                          value={variant.id}
                          onChange={(e) => changeVariant(item.key, e.target.value)}
                          className="h-9 cursor-pointer rounded-md border border-line-strong bg-surface px-2 text-sm"
                        >
                          {product.variants
                            .filter((v) => v.color === variant.color)
                            .map((v) => (
                              <option
                                key={v.id}
                                value={v.id}
                                disabled={!product.preorder && v.stock - v.reserved <= 0}
                              >
                                {v.size}
                                {!product.preorder && v.stock - v.reserved <= 0 ? ' — sold out' : ''}
                              </option>
                            ))}
                        </select>
                      )}
                      <div className="inline-flex h-9 items-center rounded-md border border-line-strong">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={item.qty <= 1}
                          onClick={() => updateQty(item.key, item.qty - 1)}
                          className="flex h-full w-9 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={item.qty >= maxQty}
                          onClick={() => updateQty(item.key, item.qty + 1)}
                          className="flex h-full w-9 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSaveForLater(item.key)}
                        className="cursor-pointer text-sm text-ink/80 underline-offset-2 hover:text-ink hover:underline"
                      >
                        Save for later
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        className="cursor-pointer text-sm text-ink/80 underline-offset-2 hover:text-ink hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
            ))}
              </ul>

          {
                saved.length > 0 && (
                  <section className="mt-12" aria-labelledby="saved-h">
                    <h2 id="saved-h" className="flex items-center gap-2 text-sm font-medium">
                      <BookmarkIcon className="h-4 w-4" aria-hidden /> Saved for later ({saved.length})
                    </h2>
                    <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                      {saved.map(({ item, product, variant, unitPrice }) => (
                        <li
                          key={item.key}
                          className="flex gap-4 rounded-md border border-line bg-surface p-3"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.images[0]}
                            alt=""
                            className="h-20 w-16 rounded object-cover"
                          />
                          <div className="flex flex-1 flex-col">
                            <p className="text-sm font-medium">{product.title}</p>
                            <p className="text-xs text-ink/80">
                              {variant.color} · {variant.size} · {formatBDT(unitPrice)}
                            </p>
                            <div className="mt-auto flex gap-3 text-sm">
                              <button
                                type="button"
                                onClick={() => toggleSaveForLater(item.key)}
                                className="cursor-pointer font-medium underline-offset-2 hover:underline"
                              >
                                Move to bag
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.key)}
                                className="cursor-pointer text-ink/80 hover:text-ink"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              }
        </div>

        <aside aria-label="Order summary" className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-lg border border-line bg-surface p-6">
            <h2 className="text-base font-semibold text-ink">Order summary</h2>
            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/80">Subtotal</dt>
                <dd className="tabular-nums text-ink">{formatBDT(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/80">Delivery</dt>
                <dd className="text-ink/80">At checkout</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/80">Discount</dt>
                <dd className="text-ink/80">At checkout</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/80">VAT</dt>
                <dd className="text-ink">Included</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
                <dt>Estimated total</dt>
                <dd className="tabular-nums">{formatBDT(subtotal)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-ink/80">
              Delivery, discounts and payment are confirmed on the checkout page.
            </p>
            <Button
              size="lg"
              fullWidth
              className="mt-6"
              href={blocked ? undefined : user ? '/checkout' : '/login?next=/checkout'}
              disabled={blocked || active.length === 0}
            >
              {blocked ? 'Remove sold-out items to continue' : 'Checkout'}
            </Button>
          </div>
        </aside>
      </div>

      {recommendations.length > 0 && (
        <section className="mt-20" aria-labelledby="rec-h">
          <SectionHeading
            id="rec-h"
            title="Finish the look"
            subtitle="Accessories that pair well with your bag"
          />
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
