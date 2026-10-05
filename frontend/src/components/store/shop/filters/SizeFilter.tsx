'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface SizeFilterProps {
  sizes: string[];
  selected: string[];
  onToggle: (size: string) => void;
}

export function SizeFilter({ sizes, selected, onToggle }: SizeFilterProps) {
  if (sizes.length === 0) return null;

  return (
    <fieldset className="border-b border-line py-5">
      <legend className="mb-3 text-sm font-medium text-ink">Size</legend>
      <div className="grid grid-cols-4 gap-1.5">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={selected.includes(s)}
            onClick={() => onToggle(s)}
            className={cn(
              'h-8 rounded border text-xs cursor-pointer transition-colors font-medium',
              selected.includes(s)
                ? 'border-ink bg-ink text-canvas'
                : 'border-line-strong bg-surface hover:border-ink text-ink'
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
