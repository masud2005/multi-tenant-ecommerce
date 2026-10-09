'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface SizeFacet {
  size: string;
  count: number;
}

export interface SizeFilterProps {
  sizes: (string | SizeFacet)[];
  selected: string[];
  onToggle: (size: string) => void;
}

export function SizeFilter({ sizes, selected, onToggle }: SizeFilterProps) {
  if (!sizes || sizes.length === 0) return null;

  const normalizedSizes: SizeFacet[] = sizes.map((item) =>
    typeof item === 'string' ? { size: item, count: 0 } : item
  );

  return (
    <fieldset className="border-b border-line py-5">
      <div className="flex items-center justify-between mb-3">
        <legend className="text-sm font-medium text-ink">Size</legend>
        {selected.length > 0 && (
          <span className="text-[11px] font-medium text-clay tabular-nums">
            {selected.length} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {normalizedSizes.map(({ size, count }) => {
          const isSelected = selected.includes(size);
          const isDisabled = count === 0 && !isSelected;

          return (
            <button
              key={size}
              type="button"
              disabled={isDisabled}
              aria-pressed={isSelected}
              onClick={() => onToggle(size)}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border py-2 px-1 text-xs transition-all duration-150 cursor-pointer shadow-2xs select-none',
                isSelected
                  ? 'border-ink bg-ink text-canvas font-semibold shadow-xs ring-1 ring-ink'
                  : isDisabled
                  ? 'border-line/50 bg-subtle/30 text-ink-muted/40 cursor-not-allowed opacity-50'
                  : 'border-line-strong bg-surface hover:border-ink hover:bg-canvas/50 text-ink hover:shadow-xs'
              )}
            >
              <span className="font-semibold text-xs leading-tight truncate max-w-full">
                {size}
              </span>
              <span
                className={cn(
                  'text-[10px] tabular-nums mt-0.5 font-normal',
                  isSelected
                    ? 'text-canvas/80'
                    : isDisabled
                    ? 'text-ink-muted/40'
                    : 'text-ink-muted'
                )}
              >
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

