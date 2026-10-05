'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface ColorFilterProps {
  colors: { name: string; hex: string }[];
  selected: string[];
  onToggle: (colorName: string) => void;
}

export function ColorFilter({ colors, selected, onToggle }: ColorFilterProps) {
  if (colors.length === 0) return null;

  return (
    <fieldset className="border-b border-line py-5">
      <legend className="mb-3 text-sm font-medium text-ink">Colour</legend>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c.name}
            type="button"
            title={c.name}
            aria-label={c.name}
            aria-pressed={selected.includes(c.name)}
            onClick={() => onToggle(c.name)}
            className={cn(
              'h-7 w-7 rounded-full border-2 p-0.5 cursor-pointer transition-colors',
              selected.includes(c.name)
                ? 'border-ink'
                : 'border-transparent hover:border-line-strong'
            )}
          >
            <span
              className="block h-full w-full rounded-full border border-ink/10"
              style={{ backgroundColor: c.hex }}
            />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
