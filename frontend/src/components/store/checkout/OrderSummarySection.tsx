'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/Checkbox';
import { formatBDT } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { CartLine } from '@/hooks/useCartLines';
import type { PaymentMethod } from '@/types/commerce';

export interface CheckoutAppliedCoupon {
  code: string;
  label: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;
}

export interface CheckoutTotals {
  discount: number;
  shipping: number;
  codFee: number;
  total: number;
}

interface OrderSummarySectionProps {
  items: CartLine[];
  code: string;
  onCodeChange: (code: string) => void;
  onApplyCode: () => void;
  codeError?: string;
  appliedCoupon?: CheckoutAppliedCoupon;
  isApplyingCode?: boolean;
  subtotal: number;
  totals: CheckoutTotals;
  shippingMethodName: string;
  shippingIsFree?: boolean;
  paymentMethod: PaymentMethod;
  hasIssues: boolean;
  canPlaceOrder?: boolean;
  consent: boolean;
  onConsentChange: (consent: boolean) => void;
  consentError?: string;
  isPlacing: boolean;
}

export function OrderSummarySection({
  items,
  code,
  onCodeChange,
  onApplyCode,
  codeError,
  appliedCoupon,
  isApplyingCode,
  subtotal,
  totals,
  shippingMethodName,
  shippingIsFree,
  paymentMethod,
  hasIssues,
  canPlaceOrder = true,
  consent,
  onConsentChange,
  consentError,
  isPlacing,
}: OrderSummarySectionProps) {
  const deliveryLabel = shippingMethodName.toLowerCase().includes('pickup')
    ? 'Pickup'
    : shippingMethodName.includes('Inside')
      ? 'Inside Dhaka'
      : shippingMethodName.includes('Outside')
        ? 'Outside Dhaka'
        : 'Delivery';

  return (
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Order summary">
        <div className="rounded-lg border border-line bg-surface p-6">
          <h2 className="text-base font-semibold text-ink">Order summary</h2>

          <ul className="scrollbar-none mt-4 max-h-64 space-y-4 overflow-y-auto overflow-x-visible pt-1.5 pr-1">
            {items.map(({ item, product, variant, unitPrice, issue }) => (
              <li key={item.key} className="flex gap-3">
                <div className="relative z-10 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="h-16 w-12 rounded object-cover"
                  />
                  <span className="absolute -right-2 -top-2 z-20 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold leading-none text-canvas shadow-sm ring-2 ring-surface">
                    {item.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium leading-snug text-ink">{product.title}</p>
                  <p className="text-xs text-ink/80">
                    {variant.color} · {variant.size}
                  </p>
                  {issue && <p className="text-xs font-medium text-danger">Stock changed</p>}
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums text-ink">
                  {formatBDT(unitPrice * item.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex gap-2 border-t border-line pt-5">
            <input
              aria-label="Discount code"
              value={code}
              onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
              placeholder="e.g. EID500"
              className="h-10 flex-1 rounded-md border border-line-strong bg-canvas px-3 text-sm uppercase text-ink focus:border-ink focus:outline-none"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={onApplyCode}
              disabled={!code || isApplyingCode}
              loading={isApplyingCode}
            >
              Apply
            </Button>
          </div>

          {codeError && <p className="mt-1.5 text-xs text-danger">{codeError}</p>}
          {appliedCoupon && !codeError && (
            <p className="mt-1.5 text-xs font-medium text-success">{appliedCoupon.code} applied</p>
          )}

          <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
            <SummaryRow label="Subtotal" value={formatBDT(subtotal)} />
            {totals.discount > 0 && (
              <SummaryRow
                label={`Discount (${appliedCoupon?.code})`}
                value={`−${formatBDT(totals.discount)}`}
                tone="success"
              />
            )}
            <SummaryRow
              label={`Delivery · ${deliveryLabel}`}
              value={
                totals.shipping === 0 && shippingIsFree
                  ? 'Free'
                  : formatBDT(totals.shipping)
              }
            />
            {totals.codFee > 0 && (
              <SummaryRow label="COD fee" value={formatBDT(totals.codFee)} />
            )}
            <SummaryRow label="VAT" value="Included" />
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatBDT(totals.total)}</dd>
            </div>
          </dl>

          {hasIssues && (
            <p
              className="mt-4 flex gap-2 rounded-md bg-warning-soft p-3 text-xs text-warning"
              role="alert"
            >
              <AlertTriangleIcon className="h-4 w-4 shrink-0" aria-hidden /> Stock changed for an
              item in your bag. Review before paying.
            </p>
          )}

          <div className="mt-5">
            <Checkbox
              checked={consent}
              onChange={onConsentChange}
              label={
                <>
                  I agree to the{' '}
                  <Link href="/policies/terms" className="underline" target="_blank">
                    Terms
                  </Link>
                  ,{' '}
                  <Link href="/policies/returns" className="underline" target="_blank">
                    Return policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/policies/privacy" className="underline" target="_blank">
                    Privacy policy
                  </Link>
                </>
              }
            />
            {consentError && (
              <p className="mt-1 text-xs text-danger" aria-invalid="true" tabIndex={-1}>
                {consentError}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            className="mt-5"
            loading={isPlacing}
            disabled={!canPlaceOrder || items.length === 0 || !consent}
          >
            {items.length === 0
              ? 'Your bag is empty'
              : isPlacing
                ? 'Confirming stock & price…'
                : paymentMethod === 'cod'
                  ? `Place order · ${formatBDT(totals.total)}`
                  : `Pay ${formatBDT(totals.total)}`}
          </Button>
        </div>
      </aside>
      );
}

      function SummaryRow({
        label,
        value,
        tone,
}: {
        label: string;
      value: string;
      tone?: 'success';
}) {
  return (
      <div className={cn('flex justify-between', tone === 'success' ? 'font-medium text-success' : '')}>
        <dt className={tone ? '' : 'text-ink/80'}>{label}</dt>
        <dd className="tabular-nums">{value}</dd>
      </div>
      );
}
