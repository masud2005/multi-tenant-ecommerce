import React from 'react';
import { Truck, Store, Clock } from 'lucide-react';
import { formatBDT } from '@/utils/format';
import { type ShippingMethod } from '@/data/shipping';
import { cn } from '@/utils/cn';
import { Section } from './Section';

interface DeliveryMethodSectionProps {
  methods: ShippingMethod[];
  selectedMethodId: string;
  onSelectMethod: (id: string) => void;
  district: string;
  subtotal: number;
  isFreeShipping?: boolean;
}

export function DeliveryMethodSection({
  methods,
  selectedMethodId,
  onSelectMethod,
  district,
  subtotal,
  isFreeShipping,
}: DeliveryMethodSectionProps) {
  const isDhaka = district?.trim()?.toLowerCase() === 'dhaka';

  return (
    <Section step={2} title="Delivery method">
      <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
        {methods.map((m) => {
          const isSelected = selectedMethodId === m.id;
          const isPickup = m.id === 'pickup';
          const price = isFreeShipping ? 0 : m.price(district, subtotal);

          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectMethod(m.id)}
              className={cn(
                'relative w-full rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer',
                'flex items-start gap-4',
                isSelected
                  ? 'border-ink bg-surface shadow-xs ring-1 ring-ink/10'
                  : 'border-line-strong/80 bg-surface/50 hover:border-ink/40 hover:bg-surface'
              )}
            >
              {/* Radio Selection Dot */}
              <div className="pt-1">
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                    isSelected ? 'border-ink' : 'border-line-strong'
                  )}
                >
                  {isSelected && <span className="h-2 w-2 rounded-full bg-ink" />}
                </span>
              </div>

              {/* Icon Badge */}
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors',
                  isSelected
                    ? 'border-ink/20 bg-ink/5 text-ink'
                    : 'border-line bg-surface-muted/60 text-ink-muted'
                )}
              >
                {isPickup ? (
                  <Store className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Truck className="h-5 w-5" aria-hidden="true" />
                )}
              </div>

              {/* Content Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink leading-tight">
                    {isPickup ? 'Store pickup' : 'Home delivery'}
                  </p>
                  {isSelected && (
                    <span className="rounded bg-clay/10 px-2 py-0.5 text-[11px] font-medium text-clay">
                      Selected
                    </span>
                  )}
                </div>

                {!isPickup ? (
                  <div className="mt-2 space-y-1">
                    {/* Line 1: Outside Dhaka */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          'font-medium',
                          !isDhaka ? 'text-ink font-semibold' : 'text-ink-muted'
                        )}
                      >
                        • Outside Dhaka:
                      </span>
                      <span
                        className={cn(
                          'tabular-nums font-medium',
                          !isDhaka ? 'text-ink' : 'text-ink-muted'
                        )}
                      >
                        ৳150
                      </span>
                      <span className="text-ink-muted">(3–5 days)</span>
                      {!isDhaka && district && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Applied for {district}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Inside Dhaka */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          'font-medium',
                          isDhaka ? 'text-ink font-semibold' : 'text-ink-muted'
                        )}
                      >
                        • Inside Dhaka:
                      </span>
                      <span
                        className={cn(
                          'tabular-nums font-medium',
                          isDhaka ? 'text-ink' : 'text-ink-muted'
                        )}
                      >
                        ৳70
                      </span>
                      <span className="text-ink-muted">(1–2 days)</span>
                      {isDhaka && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Applied for Dhaka
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-ink-muted">
                      Collect directly from our store / showroom
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <Clock className="h-3 w-3" />
                        Ready today · Free pickup
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Column */}
              <div className="text-right shrink-0 pt-0.5">
                {price === 0 ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                    FREE
                  </span>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-base font-semibold text-ink tabular-nums leading-tight">
                      {formatBDT(price)}
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      {isDhaka ? 'Inside Dhaka' : 'Outside Dhaka'}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Section>
  );
}
