'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
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
import { districts, shippingMethods } from '@/data/shipping';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/store/product';
import { SectionHeading } from '@/components/store/shared';
import { findCoupon, couponDiscount } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';

export default function CartPage() {
  const {
    updateQty,
    removeFromCart,
    toggleSaveForLater,
    changeVariant,
    user,
    products,
  } = useStore();
  const { active, saved, subtotal, hasIssues, count } = useCartLines();
  const [district, setDistrict] = useState('Dhaka');
  const [code, setCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('tanti.coupon') ?? '';
    }
    return '';
  });
  const [applied, setApplied] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('tanti.coupon') ?? '';
    }
    return '';
  });
  const [codeError, setCodeError] = useState('');

  const coupon = applied ? findCoupon(applied) : undefined;
  const discount = couponDiscount(coupon, subtotal);
  const shipping =
    coupon?.type === 'free_shipping' ? 0 : shippingMethods[0].price(district, subtotal);
  const total = subtotal - discount + shipping;
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

  const applyCode = () => {
    const c = findCoupon(code);
    if (!c) {
      return setCodeError('This code isn’t valid. Check the spelling and try again.');
    }
    if (c.minSubtotal && subtotal < c.minSubtotal) {
      return setCodeError(`Add ${formatBDT(c.minSubtotal - subtotal)} more to use ${c.code}.`);
    }
    setCodeError('');
    setApplied(c.code);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tanti.coupon', c.code);
    }
    toast.success(`${c.code} applied — ${c.label}`);
  };

  if (active.length === 0 && saved.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={ShoppingBagIcon}
          title="Your bag is empty"
          description="Browse our new Eid collection or pick up where you left off."
          action={<Button href="/collections/eid-2026">Shop Eid 2026</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl">Your bag</h1>
      <p className="mt-1 text-sm text-ink-muted">
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
              Some items changed since you added them. Review the highlighted items before checking out.
            </div>
          )}
          <ul className="divide-y divide-line border-y border-line">
            {active.map(({ item, product, variant, unitPrice, maxQty, issue }) => (
              <li key={item.key} className="flex gap-5 py-6">
                <Link href={`/products/${product.slug}`} className="shrink-0">
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-36 w-28 rounded object-cover"
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
                      <p className="mt-0.5 text-sm text-ink-muted">{variant.color}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">
                        {formatBDT(unitPrice * item.qty)}
                      </p>
                      {item.qty > 1 && (
                        <p className="text-xs text-ink-muted tabular-nums">
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
                        className="h-9 rounded-md border border-line-strong bg-surface px-2 text-sm"
                      >
                        {product.variants
                          .filter((v) => v.color === variant.color)
                          .map((v) => (
                            <option
                              key={v.id}
                              value={v.id}
                              disabled={!product.preorder && v.stock - v.reserved <= 0}
                            >
                              Size {v.size}
                              {!product.preorder && v.stock - v.reserved <= 0
                                ? ' — sold out'
                                : ''}
                            </option>
                          ))}
                      </select>
                    )}
                    <div className="flex h-9 items-center rounded-md border border-line-strong bg-surface">
                      <button
                        className="px-2.5 disabled:opacity-40"
                        disabled={item.qty <= 1}
                        onClick={() => updateQty(item.key, item.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        className="px-2.5 disabled:opacity-40"
                        disabled={item.qty >= maxQty}
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="ml-auto flex gap-4 text-sm">
                      <button
                        onClick={() => toggleSaveForLater(item.key)}
                        className="text-ink-soft underline-offset-2 hover:text-ink hover:underline cursor-pointer"
                      >
                        Save for later
                      </button>
                      <button
                        onClick={() => removeFromCart(item.key)}
                        className="text-ink-soft underline-offset-2 hover:text-ink hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {saved.length > 0 && (
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
                    <img
                      src={product.images[0]}
                      alt=""
                      className="h-20 w-16 rounded object-cover"
                    />
                    <div className="flex flex-1 flex-col">
                      <p className="text-sm font-medium">{product.title}</p>
                      <p className="text-xs text-ink-muted">
                        {variant.color} · {variant.size} · {formatBDT(unitPrice)}
                      </p>
                      <div className="mt-auto flex gap-3 text-sm">
                        <button
                          onClick={() => toggleSaveForLater(item.key)}
                          className="font-medium underline-offset-2 hover:underline cursor-pointer"
                        >
                          Move to bag
                        </button>
                        <button
                          onClick={() => removeFromCart(item.key)}
                          className="text-ink-muted hover:text-ink cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside aria-label="Order summary" className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-lg border border-line bg-surface p-6">
            <h2 className="text-base font-semibold">Order summary</h2>
            <div className="mt-5">
              <label htmlFor="coupon" className="text-sm font-medium">
                Discount code
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="coupon"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EID500"
                  aria-invalid={!!codeError}
                  className="h-10 flex-1 rounded-md border border-line-strong px-3 text-sm uppercase focus:border-clay focus:outline-none"
                />
                <Button variant="secondary" onClick={applyCode} disabled={!code}>
                  Apply
                </Button>
              </div>
              {codeError && <p className="mt-1.5 text-xs text-danger">{codeError}</p>}
              {coupon && !codeError && (
                <p className="mt-1.5 flex items-center justify-between text-xs text-success">
                  {coupon.code} · {coupon.label}
                  <button
                    onClick={() => {
                      setApplied('');
                      setCode('');
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('tanti.coupon');
                      }
                    }}
                    className="text-ink-muted underline cursor-pointer"
                  >
                    Remove
                  </button>
                </p>
              )}
            </div>
            <dl className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatBDT(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{formatBDT(discount)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1 text-ink-muted">
                  Delivery to
                  <select
                    aria-label="Estimate delivery for district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="bg-transparent font-medium text-ink underline underline-offset-2 focus:outline-none cursor-pointer"
                  >
                    {districts.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </dt>
                <dd className="tabular-nums">
                  {shipping === 0 ? 'Free' : formatBDT(shipping)}
                </dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>VAT</dt>
                <dd>Included</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>Estimated total</dt>
                <dd className="tabular-nums">{formatBDT(total)}</dd>
              </div>
            </dl>
            <Button
              size="lg"
              fullWidth
              className="mt-6"
              href={blocked ? undefined : user ? '/checkout' : '/login?next=/checkout'}
              disabled={blocked || active.length === 0}
            >
              {blocked ? 'Remove sold-out items to continue' : 'Checkout'}
            </Button>
            <p className="mt-3 text-center text-xs text-ink-muted">
              Cash on delivery available nationwide
            </p>
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
