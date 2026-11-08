'use client';

import React from 'react';
import { Truck, Store, Clock } from 'lucide-react';
import { formatBDT } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Section } from './Section';

export interface CheckoutDeliveryMethod {
  id: string;
  name: string;
  description: string;
  eta: string;
  price: number;
}

interface DeliveryMethodSectionProps {
  methods: CheckoutDeliveryMethod[];
  selectedMethodId: string;
  onSelectMethod: (id: string) => void;
  isDhaka: boolean;
  district: string;
  rates: {
    insideDhaka: number;
    outsideDhaka: number;
    insideEst: string;
    outsideEst: string;
  };
  isFreeShipping?: boolean;
}

export function DeliveryMethodSection({
  methods,
  selectedMethodId,
  onSelectMethod,
  isDhaka,
  district,
  rates,
  isFreeShipping,
}: DeliveryMethodSectionProps) {
  return (
    <Section step={2} title="Delivery method">
      <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
        {methods.map((m) => {
          const isSelected = selectedMethodId === m.id;
          const isPickup = m.id === 'pickup';
          const price = isFreeShipping && !isPickup ? 0 : m.price;

          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectMethod(m.id)}
              className={cn(
                'relative flex w-full cursor-pointer items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200',
                isSelected
                  ? 'border-ink bg-surface shadow-xs ring-1 ring-ink/10'
                  : 'border-line-strong/80 bg-surface/50 hover:border-ink/40 hover:bg-surface'
              )}
            >
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

              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors',
                  isSelected
                    ? 'border-ink/20 bg-ink/5 text-ink'
                    : 'border-line bg-subtle text-ink/80'
                )}
              >
                {isPickup ? (
                  <Store className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Truck className="h-5 w-5" aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold leading-tight text-ink">{m.name}</p>
                  {isSelected && (
                    <span className="rounded bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink">
                      Selected
                    </span>
                  )}
                </div>

                {!isPickup ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          'font-medium',
                          !isDhaka ? 'font-semibold text-ink' : 'text-ink/75'
                        )}
                      >
                        • Outside Dhaka:
                      </span>
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          !isDhaka ? 'text-ink' : 'text-ink/75'
                        )}
                      >
                        {formatBDT(rates.outsideDhaka)}
                      </span>
                      <span className="text-ink/75">({rates.outsideEst})</span>
                      {!isDhaka && district && (
                        <span className="rounded bg-subtle px-1.5 py-0.5 text-xs font-semibold text-ink">
                          Applied for {district}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          'font-medium',
                          isDhaka ? 'font-semibold text-ink' : 'text-ink/75'
                        )}
                      >
                        • Inside Dhaka:
                      </span>
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          isDhaka ? 'text-ink' : 'text-ink/75'
                        )}
                      >
                        {formatBDT(rates.insideDhaka)}
                      </span>
                      <span className="text-ink/75">({rates.insideEst})</span>
                      {isDhaka && (
                        <span className="rounded bg-subtle px-1.5 py-0.5 text-xs font-semibold text-ink">
                          Applied for Dhaka
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-ink/80">{m.description}</p>
                    <span className="inline-flex items-center gap-1 rounded-md bg-subtle px-2 py-0.5 text-xs font-medium text-ink">
                      <Clock className="h-3 w-3" />
                      {m.eta} · Free pickup
                    </span>
                  </div>
                )}
              </div>

              <div className="shrink-0 pt-0.5 text-right">
                {price === 0 && (isFreeShipping || isPickup) ? (
                  <span className="inline-flex items-center rounded-full border border-line bg-subtle px-2.5 py-0.5 text-xs font-semibold text-ink">
                    FREE
                  </span>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-base font-semibold tabular-nums leading-tight text-ink">
                      {formatBDT(price)}
                    </span>
                    <span className="text-xs text-ink/80">
                      {isPickup ? 'Pickup' : isDhaka ? 'Inside Dhaka' : 'Outside Dhaka'}
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
