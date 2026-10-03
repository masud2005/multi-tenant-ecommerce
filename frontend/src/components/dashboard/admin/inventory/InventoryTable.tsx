'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { LOW_STOCK_THRESHOLD } from '@/utils/pricing';
import type { InventoryVariantItem } from '@/services/inventory-service';

interface InventoryTableProps {
  items: InventoryVariantItem[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  stockFilter: string;
  onAdjustClick: (item: InventoryVariantItem) => void;
}

export function InventoryTable({
  items,
  loading,
  totalCount,
  currentPage,
  totalPages,
  searchQuery,
  stockFilter,
  onAdjustClick,
}: InventoryTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-4 py-2.5 font-medium">Variant</th>
              <th className="px-3 py-2.5 font-medium">SKU</th>
              <th className="px-3 py-2.5 text-right font-medium">On hand</th>
              <th className="px-3 py-2.5 text-right font-medium">Reserved</th>
              <th className="px-3 py-2.5 text-right font-medium">Available</th>
              <th className="px-4 py-2.5 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-ink-muted">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-ink-muted" />
                  <p className="mt-2 text-xs">Loading live inventory data...</p>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-ink-muted">
                  <p className="text-sm font-medium">No inventory items found</p>
                  <p className="mt-1 text-xs">
                    {searchQuery || stockFilter !== 'all'
                      ? 'Try adjusting your search query or filter'
                      : 'Products created in your store will appear here with live stock levels.'}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const onHand = item.stock ?? 0;
                const reserved = item.reserved ?? 0;
                const availableQty = Math.max(0, onHand - reserved);
                const coverImg =
                  item.product.images?.[0]?.url ||
                  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&auto=format&fit=crop&q=60';

                return (
                  <tr key={item.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-3">
                        <img
                          src={coverImg}
                          alt={item.product.title}
                          className="h-10 w-8 rounded object-cover border border-line"
                        />
                        <span>
                          <span className="block font-medium text-ink">
                            {item.product.title}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {[item.color, item.size].filter(Boolean).join(' / ') || 'Standard'}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-ink">
                      {item.sku}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-ink">
                      {onHand}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">
                      {reserved}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={cn(
                          'font-semibold tabular-nums',
                          availableQty === 0
                            ? 'text-red-600 dark:text-red-400'
                            : availableQty <= (item.lowStockThreshold ?? LOW_STOCK_THRESHOLD)
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {availableQty}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <GuardedButton
                        module="inventory"
                        action="update"
                        size="sm"
                        variant="ghost"
                        onClick={() => onAdjustClick(item)}
                      >
                        Adjust
                      </GuardedButton>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-ink-muted">
        <p>
          Showing {items.length} of {totalCount} variants
        </p>
        {totalPages > 1 && (
          <p>
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>
    </>
  );
}
