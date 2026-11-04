'use client';

import React from 'react';

export interface PriceFilterProps {
  minPrice: string;
  maxPrice: string;
  onChange: (min: string, max: string) => void;
}

export function PriceFilter({
  minPrice,
  maxPrice,
  onChange,
}: PriceFilterProps) {
  return (
    <fieldset className="border-b border-line py-5">
      <legend className="mb-3 text-sm font-medium text-ink">Price (৳)</legend>
      <div className="flex items-center gap-2">
        <input
          aria-label="Minimum price"
          inputMode="numeric"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''), maxPrice)}
          className="h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-clay focus:outline-none"
        />
        <span className="text-ink-muted">–</span>
        <input
          aria-label="Maximum price"
          inputMode="numeric"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => onChange(minPrice, e.target.value.replace(/\D/g, ''))}
          className="h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-clay focus:outline-none"
        />
      </div>
    </fieldset>
  );
}
