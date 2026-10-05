'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';

export interface AvailabilityFilterProps {
  inStock: boolean;
  onSale: boolean;
  inStockCount?: number;
  onSaleCount?: number;
  onChange: (patch: { inStock?: boolean; onSale?: boolean }) => void;
}

export function AvailabilityFilter({
  inStock,
  onSale,
  inStockCount,
  onSaleCount,
  onChange,
}: AvailabilityFilterProps) {
  return (
    <fieldset className="border-b border-line py-5">
      <legend className="mb-3 text-sm font-medium text-ink">Availability</legend>
      <div className="space-y-2.5">
        <Checkbox
          checked={inStock}
          onChange={(v) => onChange({ inStock: v })}
          label={
            <span className="flex w-full justify-between gap-3 text-ink">
              <span>In stock only</span>
              {inStockCount !== undefined && (
                <span className="text-ink-muted tabular-nums">
                  {inStockCount}
                </span>
              )}
            </span>
          }
          className="w-full [&>span:last-child]:flex-1 cursor-pointer"
        />
        <Checkbox
          checked={onSale}
          onChange={(v) => onChange({ onSale: v })}
          label={
            <span className="flex w-full justify-between gap-3 text-ink">
              <span>On sale</span>
              {onSaleCount !== undefined && (
                <span className="text-ink-muted tabular-nums">
                  {onSaleCount}
                </span>
              )}
            </span>
          }
          className="w-full [&>span:last-child]:flex-1 cursor-pointer"
        />
      </div>
    </fieldset>
  );
}
