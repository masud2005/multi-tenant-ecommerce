'use client';

import React from 'react';
import { XIcon } from 'lucide-react';

export interface ActiveChip {
  label: string;
  clear: () => void;
}

export interface ShopActiveChipsProps {
  chips: ActiveChip[];
  onClearAll: () => void;
}

export function ShopActiveChips({ chips, onClearAll }: ShopActiveChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-4">
      {chips.map((c) => (
        <button
          key={c.label}
          onClick={c.clear}
          className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-xs hover:bg-line text-ink cursor-pointer transition-colors"
        >
          {c.label} <XIcon className="h-3 w-3" aria-hidden />
          <span className="sr-only">Remove filter {c.label}</span>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-ink-muted underline hover:text-ink cursor-pointer transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
