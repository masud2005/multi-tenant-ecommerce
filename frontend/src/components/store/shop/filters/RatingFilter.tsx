'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface RatingFilterProps {
  rating: number;
  onChange: (rating: number) => void;
}

const RATING_OPTIONS = [0, 4, 4.5] as const;

export function RatingFilter({ rating, onChange }: RatingFilterProps) {
  return (
    <fieldset className="border-b border-line py-5">
      <legend className="mb-3 text-sm font-medium text-ink">Rating</legend>
      <div className="flex gap-1.5">
        {RATING_OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs cursor-pointer transition-colors font-medium',
              rating === r
                ? 'border-ink bg-ink text-canvas'
                : 'border-line-strong hover:border-ink text-ink'
            )}
          >
            {r === 0 ? 'Any' : `${r}★ & up`}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
