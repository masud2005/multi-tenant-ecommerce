'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';

export type StockFilterType = 'all' | 'low' | 'out';

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  stockFilter: StockFilterType;
  onStockFilterChange: (val: StockFilterType) => void;
}

export function InventoryFilters({
  searchQuery,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
}: InventoryFiltersProps) {
  const filterButtons: { key: StockFilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'low', label: 'Low Stock' },
    { key: 'out', label: 'Out of Stock' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-line px-4 py-3">
      <div className="relative min-w-[200px] flex-1">
        <Search
          className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search product title, SKU, color or size…"
          aria-label="Search inventory"
          className="h-9 w-full rounded-md border border-line-strong bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
        />
      </div>
      <div
        className="flex rounded-md border border-line p-0.5 text-xs"
        role="group"
        aria-label="Stock filter"
      >
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onStockFilterChange(key)}
            aria-pressed={stockFilter === key}
            className={cn(
              'rounded px-2.5 py-1 cursor-pointer transition-colors',
              stockFilter === key
                ? 'bg-ink text-canvas font-medium shadow-xs'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
