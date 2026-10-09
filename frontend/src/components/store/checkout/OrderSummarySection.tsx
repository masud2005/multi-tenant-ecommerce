import React from 'react';
import Link from 'next/link';
import { AlertTriangleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/Checkbox';
import { formatBDT } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { CartLine } from '@/hooks/useCartLines';
import type { PaymentMethod } from '@/types/commerce';
import type { Coupon } from '@/data/shipping';

export interface CheckoutTotals {
  discount: number;
  shipping: number;
  codFee: number;
  credit: number;
  total: number;
}

interface OrderSummarySectionProps {
  items: CartLine[];
  code: string;
  onCodeChange: (code: string) => void;
  onApplyCode: () => void;
  codeError?: string;
  appliedCoupon?: Coupon;
  isLoggedIn: boolean;
  storeCredit: number;
  useCredit: boolean;
  onToggleCredit: (use: boolean) => void;
  subtotal: number;
  totals: CheckoutTotals;
  shippingMethodName: string;
  paymentMethod: PaymentMethod;
  hasIssues: boolean;
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
  isLoggedIn,
  storeCredit,
  useCredit,
  onToggleCredit,
  subtotal,
  totals,
  shippingMethodName,
  paymentMethod,
  hasIssues,
  consent,
  onConsentChange,
  consentError,
  isPlacing,
}: OrderSummarySectionProps) {
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Order summary">
      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="text-base font-semibold text-ink">Order summary</h2>

        {/* Cart items list */}
        <ul className="mt-4 max-h-64 space-y-4 overflow-y-auto pr-1">
          {items.map(({ item, product, variant, unitPrice, issue }) => (
            <li key={item.key} className="flex gap-3">
              <div className="relative shrink-0">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-16 w-12 rounded object-cover"
                />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1 text-xs text-canvas">
                  {item.qty}
                </span>
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium leading-snug text-ink">{product.title}</p>
                <p className="text-xs text-ink-muted">
                  {variant.color} · {variant.size}
                </p>
                {issue && <p className="text-xs text-danger font-medium">Stock changed</p>}
              </div>
              <span className="text-sm tabular-nums text-ink font-medium">
                {formatBDT(unitPrice * item.qty)}
              </span>
            </li>
          ))}
        </ul>

        {/* Coupon input */}
        <div className="mt-5 flex gap-2 border-t border-line pt-5">
          <input
            aria-label="Discount code"
            value={code}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            placeholder="Discount code"
            className="h-10 flex-1 rounded-md border border-line-strong px-3 text-sm uppercase text-ink focus:border-clay focus:outline-none"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={onApplyCode}
            disabled={!code}
          >
            Apply
          </Button>
        </div>

        {codeError && <p className="mt-1.5 text-xs text-danger">{codeError}</p>}
        {appliedCoupon && !codeError && (
          <p className="mt-1.5 text-xs text-success font-medium">
            {appliedCoupon.code} applied
          </p>
        )}

        {/* Store credit */}
        {isLoggedIn && storeCredit > 0 && (
          <div className="mt-4">
            <Checkbox
              checked={useCredit}
              onChange={onToggleCredit}
              label={`Use store credit (${formatBDT(storeCredit)} available)`}
            />
          </div>
        )}

        {/* Price totals breakdown */}
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
            label={`Delivery · ${shippingMethodName.split(' ')[0]}`}
            value={totals.shipping === 0 ? 'Free' : formatBDT(totals.shipping)}
          />
          {totals.codFee > 0 && (
            <SummaryRow label="COD fee" value={formatBDT(totals.codFee)} />
          )}
          {totals.credit > 0 && (
            <SummaryRow
              label="Store credit"
              value={`−${formatBDT(totals.credit)}`}
              tone="success"
            />
          )}
          <SummaryRow label="VAT" value="Included" />
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatBDT(totals.total)}</dd>
          </div>
        </dl>

        {/* Stock issues warning */}
        {hasIssues && (
          <p
            className="mt-4 flex gap-2 rounded-md bg-warning-soft p-3 text-xs text-warning"
            role="alert"
          >
            <AlertTriangleIcon className="h-4 w-4 shrink-0" aria-hidden /> Stock
            changed for an item in your bag. Review before paying.
          </p>
        )}

        {/* Terms and consent */}
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
            <p
              className="mt-1 text-xs text-danger"
              aria-invalid="true"
              tabIndex={-1}
            >
              {consentError}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          size="lg"
          fullWidth
          className="mt-5"
          loading={isPlacing}
        >
          {isPlacing
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
    <div
      className={cn('flex justify-between', tone === 'success' ? 'text-success font-medium' : '')}
    >
      <dt className={tone ? '' : 'text-ink-muted'}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
