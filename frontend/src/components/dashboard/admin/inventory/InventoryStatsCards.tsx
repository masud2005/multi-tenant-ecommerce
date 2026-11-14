'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { formatBDT } from '@/utils/format';
import type { InventoryStats } from '@/services/inventory-service';

interface InventoryStatsCardsProps {
  stats: InventoryStats | null;
  loading: boolean;
}

export function InventoryStatsCards({ stats, loading }: InventoryStatsCardsProps) {
  const cards: [string, string, string][] = [
    [
      'Stock value (at cost)',
      formatBDT(stats?.totalStockValue ?? 0),
      '',
    ],
    [
      'Low stock variants',
      String(stats?.lowStockCount ?? 0),
      'text-amber-600 dark:text-amber-400',
    ],
    [
      'Out of stock',
      String(stats?.outOfStockCount ?? 0),
      'text-red-600 dark:text-red-400',
    ],
    [
      'Total variants',
      String(stats?.totalVariants ?? 0),
      '',
    ],
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {cards.map(([label, value, colorClass]) => (
        <div
          key={label}
          className="rounded-lg border border-line bg-surface p-3 sm:px-4 sm:py-3 shadow-xs min-w-0"
        >
          <p className="text-xs text-ink-muted truncate" title={label}>{label}</p>
          <p className={cn('mt-1 text-base sm:text-lg font-semibold tabular-nums truncate', colorClass)}>
            {loading && !stats ? '...' : value}
          </p>
        </div>
      ))}
    </div>
  );
}
