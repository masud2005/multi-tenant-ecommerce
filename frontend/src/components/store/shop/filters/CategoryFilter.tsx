'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';

export interface CategoryFilterProps {
  categories: { key: string; label: string; count: number }[];
  selected: string[];
  onToggle: (key: string) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onToggle,
}: CategoryFilterProps) {
  return (
    <fieldset className="border-b border-line py-5 first:pt-0">
      <legend className="mb-3 text-sm font-medium text-ink">Category</legend>
      <div className="space-y-2.5">
        {categories.map((c) => (
          <Checkbox
            key={c.key}
            checked={selected.includes(c.key)}
            onChange={() => onToggle(c.key)}
            label={
              <span className="flex w-full justify-between gap-3 text-ink">
                {c.label}
                <span className="text-ink-muted tabular-nums">{c.count}</span>
              </span>
            }
            className="w-full [&>span:last-child]:flex-1 cursor-pointer"
          />
        ))}
      </div>
    </fieldset>
  );
}
