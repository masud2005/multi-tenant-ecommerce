'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';

export interface BrandFilterProps {
  brands: { key: string; count: number }[];
  selected: string[];
  onToggle: (brandKey: string) => void;
}

export function BrandFilter({ brands, selected, onToggle }: BrandFilterProps) {
  if (brands.length === 0) return null;

  return (
    <fieldset className="border-b border-line py-5">
      <legend className="mb-3 text-sm font-medium text-ink">Brand</legend>
      <div className="space-y-2.5">
        {brands.map((b) => (
          <Checkbox
            key={b.key}
            checked={selected.includes(b.key)}
            onChange={() => onToggle(b.key)}
            label={
              <span className="flex w-full justify-between gap-3 text-ink">
                <span>{b.key}</span>
                <span className="text-ink-muted tabular-nums">{b.count}</span>
              </span>
            }
            className="w-full [&>span:last-child]:flex-1 cursor-pointer"
          />
        ))}
      </div>
    </fieldset>
  );
}
