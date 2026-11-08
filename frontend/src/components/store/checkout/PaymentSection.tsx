'use client';

import React from 'react';
import { CheckCircle2, PhoneIcon, HashIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Section } from './Section';
import { PaymentBrandIcon } from '@/components/ui/PaymentBrandIcon';
import type { PaymentMethod } from '@/types/commerce';

interface PaymentSectionProps {
  payment: PaymentMethod;
  onSelectPayment: (method: PaymentMethod) => void;
  senderPhone: string;
  onSenderPhoneChange: (val: string) => void;
  transactionId: string;
  onTransactionIdChange: (val: string) => void;
  errors?: {
    senderPhone?: string;
    transactionId?: string;
    payment?: string;
  };
  totalAmount?: number;
  storePaymentConfig?: {
    bkashNumber?: string;
    bkashType?: string;
    nagadNumber?: string;
    nagadType?: string;
    bkashEnabled?: boolean;
    nagadEnabled?: boolean;
    codEnabled?: boolean;
  };
}

function PaymentOption({
  selected,
  onSelect,
  title,
  description,
  badge,
  icon,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        selected
          ? 'border-ink bg-surface shadow-xs ring-1 ring-ink/10'
          : 'border-line bg-surface hover:border-ink/40'
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="flex w-full cursor-pointer items-start justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 shrink-0 items-center justify-center">{icon}</div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">{title}</p>
              {badge && (
                <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink">
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-ink">{description}</p>
          </div>
        </div>
        {selected && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />}
      </button>
      {children}
    </div>
  );
}

export function PaymentSection({
  payment,
  onSelectPayment,
  senderPhone,
  onSenderPhoneChange,
  transactionId,
  onTransactionIdChange,
  errors,
  totalAmount = 0,
  storePaymentConfig,
}: PaymentSectionProps) {
  const codEnabled = storePaymentConfig?.codEnabled !== false;
  const bkashEnabled = storePaymentConfig?.bkashEnabled === true;
  const nagadEnabled = storePaymentConfig?.nagadEnabled === true;

  const bkashNumber = storePaymentConfig?.bkashNumber || '';
  const bkashType = storePaymentConfig?.bkashType || '';
  const nagadNumber = storePaymentConfig?.nagadNumber || '';
  const nagadType = storePaymentConfig?.nagadType || '';

  const noneAvailable = !codEnabled && !bkashEnabled && !nagadEnabled;

  return (
    <Section step={3} title="Payment Method">
      <div className="space-y-4" role="radiogroup" aria-label="Payment method">
        {noneAvailable && (
          <p className="rounded-lg border border-line bg-subtle px-4 py-3 text-sm text-ink">
            No payment methods are configured for this store yet.
          </p>
        )}

        {errors?.payment && (
          <p className="flex items-center gap-1 text-xs text-danger">
            <AlertCircle className="h-3 w-3" /> {errors.payment}
          </p>
        )}

        {codEnabled && (
          <PaymentOption
            selected={payment === 'cod'}
            onSelect={() => onSelectPayment('cod')}
            title="Cash on Delivery"
            description="Pay the delivery person when your order arrives."
            icon={<PaymentBrandIcon method="cod" />}
          />
        )}

        {bkashEnabled && (
          <PaymentOption
            selected={payment === 'bkash'}
            onSelect={() => onSelectPayment('bkash')}
            title="bKash"
            description="Send money, then enter your number and Transaction ID."
            badge="Manual verification"
            icon={<PaymentBrandIcon method="bkash" />}
          >
            {payment === 'bkash' && (
              <div className="space-y-3 border-t border-line px-4 pb-4 pt-4">
                <div className="rounded-md bg-subtle p-3 text-xs text-ink">
                  {bkashNumber ? (
                    <>
                      <p className="font-semibold text-ink">
                        bKash number:{' '}
                        <span className="font-mono text-sm underline select-all">{bkashNumber}</span>
                        {bkashType ? ` (${bkashType})` : ''}
                      </p>
                      <p className="mt-1 text-ink">
                        Send <b>৳{totalAmount}</b>, then confirm with your bKash number and TrxID
                        below.
                      </p>
                    </>
                  ) : (
                    <p className="text-ink">
                      bKash is enabled but the store number is not configured yet. Please contact
                      the store.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink">
                      Sender bKash number <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/70" />
                      <input
                        type="text"
                        value={senderPhone}
                        onChange={(e) => onSenderPhoneChange(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        maxLength={14}
                        className="h-9 w-full rounded-md border border-line-strong bg-canvas pl-8 pr-3 text-sm text-ink placeholder:text-ink/50 focus:border-ink focus:outline-none"
                      />
                    </div>
                    {errors?.senderPhone && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                        <AlertCircle className="h-3 w-3" /> {errors.senderPhone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink">
                      Transaction ID <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <HashIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/70" />
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => onTransactionIdChange(e.target.value.toUpperCase())}
                        placeholder="e.g. CK8A2B3C4D5"
                        className="h-9 w-full rounded-md border border-line-strong bg-canvas pl-8 pr-3 font-mono text-sm uppercase text-ink placeholder:text-ink/50 focus:border-ink focus:outline-none"
                      />
                    </div>
                    {errors?.transactionId && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                        <AlertCircle className="h-3 w-3" /> {errors.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </PaymentOption>
        )}

        {nagadEnabled && (
          <PaymentOption
            selected={payment === 'nagad'}
            onSelect={() => onSelectPayment('nagad')}
            title="Nagad"
            description="Send money, then enter your number and Transaction ID."
            badge="Manual verification"
            icon={<PaymentBrandIcon method="nagad" />}
          >
            {payment === 'nagad' && (
              <div className="space-y-3 border-t border-line px-4 pb-4 pt-4">
                <div className="rounded-md bg-subtle p-3 text-xs text-ink">
                  {nagadNumber ? (
                    <>
                      <p className="font-semibold text-ink">
                        Nagad number:{' '}
                        <span className="font-mono text-sm underline select-all">{nagadNumber}</span>
                        {nagadType ? ` (${nagadType})` : ''}
                      </p>
                      <p className="mt-1 text-ink">
                        Send <b>৳{totalAmount}</b>, then confirm with your Nagad number and TrxID
                        below.
                      </p>
                    </>
                  ) : (
                    <p className="text-ink">
                      Nagad is enabled but the store number is not configured yet. Please contact
                      the store.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink">
                      Sender Nagad number <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/70" />
                      <input
                        type="text"
                        value={senderPhone}
                        onChange={(e) => onSenderPhoneChange(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        maxLength={14}
                        className="h-9 w-full rounded-md border border-line-strong bg-canvas pl-8 pr-3 text-sm text-ink placeholder:text-ink/50 focus:border-ink focus:outline-none"
                      />
                    </div>
                    {errors?.senderPhone && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                        <AlertCircle className="h-3 w-3" /> {errors.senderPhone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink">
                      Transaction ID <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <HashIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/70" />
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => onTransactionIdChange(e.target.value.toUpperCase())}
                        placeholder="e.g. CK8A2B3C4D5"
                        className="h-9 w-full rounded-md border border-line-strong bg-canvas pl-8 pr-3 font-mono text-sm uppercase text-ink placeholder:text-ink/50 focus:border-ink focus:outline-none"
                      />
                    </div>
                    {errors?.transactionId && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                        <AlertCircle className="h-3 w-3" /> {errors.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </PaymentOption>
        )}
      </div>
    </Section>
  );
}
