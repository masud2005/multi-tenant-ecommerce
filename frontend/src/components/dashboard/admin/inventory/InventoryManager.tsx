'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Download, ClipboardCheck, RefreshCw } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { stockMovements, type StockMovementItem } from '@/data/admin';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import {
  inventoryService,
  type InventoryOverviewData,
  type InventoryVariantItem,
} from '@/services/inventory-service';
import { InventoryStatsCards } from './InventoryStatsCards';
import { InventoryFilters, type StockFilterType } from './InventoryFilters';
import { InventoryTable } from './InventoryTable';
import { InventoryLedgerTable } from './InventoryLedgerTable';
import { AdjustStockModal, type AdjustModalTarget } from './AdjustStockModal';

type Tab = 'stock' | 'ledger';

const REASON_MAP: Record<string, string> = {
  'Received': 'RECEIVED',
  'Correction': 'CORRECTION',
  'Damaged': 'DAMAGED',
  'Lost / stolen': 'LOST_STOLEN',
  'Physical count': 'PHYSICAL_COUNT',
  'Returned to stock': 'RETURN',
};

export function InventoryManager() {
  const { actor } = useAdmin();
  const [tab, setTab] = useState<Tab>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilterType>('all');

  // Backend Live State
  const [inventoryData, setInventoryData] = useState<InventoryOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Adjustment Modal State
  const [adjustTarget, setAdjustTarget] = useState<AdjustModalTarget | null>(null);
  const [ledger, setLedger] = useState<StockMovementItem[]>(stockMovements);

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch live inventory overview from backend
  const fetchInventory = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await inventoryService.getOverview({
        search: debouncedQuery.trim() || undefined,
        stockStatus: stockFilter,
      });

      if (res && res.data) {
        setInventoryData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      toast.error(err?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedQuery, stockFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchInventory(true);
    toast.success('Inventory refreshed');
  };

  const handleOpenAdjust = (item: InventoryVariantItem) => {
    const variantLabel =
      [item.color, item.size].filter(Boolean).join(' / ') || item.sku;
    setAdjustTarget({
      pid: item.product.id,
      vid: item.id,
      label: `${item.product.title} · ${variantLabel}`,
      current: item.stock,
    });
  };

  const handleSaveAdjust = async ({
    target,
    delta,
    reason,
    reference,
    note,
  }: {
    target: AdjustModalTarget;
    delta: number;
    reason: string;
    reference: string;
    note: string;
  }) => {
    const reasonEnum = REASON_MAP[reason] || 'CORRECTION';
    const type: 'ADD' | 'SUBTRACT' | 'SET' = delta >= 0 ? 'ADD' : 'SUBTRACT';
    const quantity = Math.abs(delta);

    try {
      const res = await inventoryService.adjustStock({
        variantId: target.vid,
        type,
        quantity,
        reason: reasonEnum,
        ref: reference || undefined,
        note: note || undefined,
      });

      // Update local item stock immediately from response
      const updatedStock = res?.data?.variant?.stock ?? (target.current + delta);
      if (inventoryData) {
        const updatedItems = inventoryData.items.map((item) =>
          item.id === target.vid ? { ...item, stock: updatedStock } : item
        );
        setInventoryData({
          ...inventoryData,
          items: updatedItems,
        });
      }

      // Record movement in audit ledger
      setLedger((prev) => [
        {
          id: res?.data?.movement?.id || `sm${Date.now()}`,
          at: res?.data?.movement?.createdAt || new Date().toISOString(),
          sku: target.vid,
          product: target.label,
          change: delta,
          stockAfter: updatedStock,
          reason,
          by: actor || 'Store Owner',
          ref: reference || undefined,
          note: note || undefined,
        },
        ...prev,
      ]);

      toast.success(
        res?.message || `Stock ${delta > 0 ? '+' : ''}${delta} (${reason}) saved to database!`
      );
      setAdjustTarget(null);

      // Silently refresh stats in the background
      fetchInventory(true);
    } catch (err: any) {
      console.error('Failed to adjust stock:', err);
      toast.error(err?.message || 'Failed to adjust stock in database');
    }
  };

  const items = inventoryData?.items ?? [];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Inventory"
        description="Available = on hand − reserved in unpaid/unfulfilled orders. Overselling is blocked at checkout."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Refresh
            </Button>
            <GuardedButton
              module="inventory"
              action="update"
              variant="secondary"
              size="sm"
              onClick={() => toast.success('Physical count started')}
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden /> Start count
            </GuardedButton>
            <GuardedButton
              module="inventory"
              action="export"
              variant="secondary"
              size="sm"
              onClick={() => toast.success('Inventory exported')}
            >
              <Download className="h-4 w-4" aria-hidden /> Export
            </GuardedButton>
          </>
        }
      />

      {/* KPI Stats Cards */}
      <InventoryStatsCards stats={inventoryData?.stats ?? null} loading={loading} />

      {/* Main Content Area: Stock Table or Movement Ledger */}
      <div className="rounded-lg border border-line bg-surface shadow-xs">
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-2">
          <Tabs
            value={tab}
            onChange={(val) => setTab(val as Tab)}
            tabs={[
              { value: 'stock', label: 'Stock levels' },
              { value: 'ledger', label: 'Movement ledger' },
            ]}
          />
        </div>

        {tab === 'stock' && (
          <>
            <InventoryFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              stockFilter={stockFilter}
              onStockFilterChange={setStockFilter}
            />

            <InventoryTable
              items={items}
              loading={loading}
              totalCount={inventoryData?.pagination.total ?? items.length}
              currentPage={inventoryData?.pagination.page ?? 1}
              totalPages={inventoryData?.pagination.totalPages ?? 1}
              searchQuery={searchQuery}
              stockFilter={stockFilter}
              onAdjustClick={handleOpenAdjust}
            />
          </>
        )}

        {tab === 'ledger' && <InventoryLedgerTable movements={ledger} />}
      </div>

      {/* Stock Adjustment Modal */}
      <AdjustStockModal
        target={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onSave={handleSaveAdjust}
      />
    </div>
  );
}
