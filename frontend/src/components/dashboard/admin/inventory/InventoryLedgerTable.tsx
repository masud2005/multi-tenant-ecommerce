'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import type { StockMovementItem } from '@/data/admin';

interface InventoryLedgerTableProps {
  movements: StockMovementItem[];
}

export function InventoryLedgerTable({ movements }: InventoryLedgerTableProps) {
  return (
    <div className="overflow-x-auto border-t border-line">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-muted">
            <th className="px-4 py-2.5 font-medium">Time</th>
            <th className="px-3 py-2.5 font-medium">Product / SKU</th>
            <th className="px-3 py-2.5 text-right font-medium">Change</th>
            <th className="px-3 py-2.5 text-right font-medium">New on hand</th>
            <th className="px-3 py-2.5 font-medium">Reason & Details</th>
            <th className="px-4 py-2.5 font-medium">By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {movements.map((m) => (
            <tr key={m.id} className="hover:bg-subtle/40 transition-colors">
              <td className="px-4 py-2.5 text-ink-muted">
                {formatDateTime(m.at)}
              </td>
              <td className="px-3 py-2.5">
                <span className="font-medium text-ink">{m.product}</span>
                <span className="block font-mono text-xs text-ink-muted">
                  {m.sku}
                </span>
              </td>
              <td
                className={cn(
                  'px-3 py-2.5 text-right font-semibold tabular-nums',
                  m.change > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {m.change > 0 ? `+${m.change}` : m.change}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-ink font-medium">
                {m.stockAfter !== undefined ? m.stockAfter : '—'}
              </td>
              <td className="px-3 py-2.5 text-ink">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium">{m.reason}</span>
                  {m.ref && (
                    <span className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                      {m.ref}
                    </span>
                  )}
                </div>
                {m.note && (
                  <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">
                    {m.note}
                  </p>
                )}
              </td>
              <td className="px-4 py-2.5 text-ink-muted">{m.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
