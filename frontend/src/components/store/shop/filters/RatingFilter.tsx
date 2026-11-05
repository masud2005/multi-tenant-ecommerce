'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface RatingFilterProps {
  rating: number;
  onChange: (rating: number) => void;
}

const RATING_TIERS = [
  { value: 5, label: '5 Stars' },
  { value: 4, label: '4 Stars & up' },
  { value: 3, label: '3 Stars & up' },
  { value: 2, label: '2 Stars & up' },
  { value: 1, label: '1 Star & up' },
] as const;

export function RatingFilter({ rating, onChange }: RatingFilterProps) {
  return (
    <fieldset className="border-b border-line py-5">
      <div className="flex items-center justify-between mb-3">
        <legend className="text-sm font-medium text-ink">Rating</legend>
        {rating > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-xs text-ink-muted hover:text-ink transition-colors cursor-pointer underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1">
        {RATING_TIERS.map(({ value, label }) => {
          const isSelected = rating === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(isSelected ? 0 : value)}
              aria-label={label}
              className={cn(
                'group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer',
                isSelected
                  ? 'bg-subtle font-medium text-ink ring-1 ring-line-strong/60'
                  : 'hover:bg-subtle/70 text-ink-muted hover:text-ink'
              )}
            >
              <div className="flex items-center gap-2">
                {/* 5-Star Visual Meter */}
                <div className="flex items-center gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((starIndex) => (
                    <Star
                      key={starIndex}
                      className={cn(
                        'h-3.5 w-3.5 transition-colors',
                        starIndex <= value
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-line-strong'
                      )}
                    />
                  ))}
                </div>

                {/* Rating Label */}
                <span className="text-xs text-ink">
                  {label}
                </span>
              </div>

              {isSelected && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
