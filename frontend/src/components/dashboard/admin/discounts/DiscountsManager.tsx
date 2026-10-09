'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Percent,
  Tag,
  Loader2,
  TrendingUp,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { DiscountModal } from './DiscountModal';
import { DiscountRow } from './DiscountRow';
import { discountService } from '@/services/discount-service';
import type { DiscountResponseData, DiscountStatus } from '@/types/discount';
import { formatBDT } from '@/utils/format';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

export function DiscountsManager() {
  const [discountsList, setDiscountsList] = useState<DiscountResponseData[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountResponseData | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<DiscountResponseData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch discounts from backend
  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await discountService.getDiscounts({
        limit: 100,
      });

      if (res?.data && Array.isArray(res.data)) {
        setDiscountsList(res.data);
      }
    } catch (error) {
      console.error('Failed to load discounts:', error);
      toast.error('Failed to load discount campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied code "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDiscount(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (discount: DiscountResponseData) => {
    setEditingDiscount(discount);
    setModalOpen(true);
  };

  // Save Callback
  const handleDiscountSaved = (savedDiscount: DiscountResponseData, isNew: boolean) => {
    if (isNew) {
      setDiscountsList((prev) => [savedDiscount, ...prev.filter((d) => d.id !== savedDiscount.id)]);
    } else {
      setDiscountsList((prev) =>
        prev.map((d) => (d.id === savedDiscount.id ? savedDiscount : d))
      );
    }
    fetchDiscounts();
  };

  // Toggle Status (ACTIVE <-> DISABLED)
  const handleToggleStatus = async (discount: DiscountResponseData) => {
    const newStatus: DiscountStatus = discount.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      // Optimistic update
      setDiscountsList((prev) =>
        prev.map((d) => (d.id === discount.id ? { ...d, status: newStatus } : d))
      );

      await discountService.updateDiscount(discount.id, { status: newStatus });
      toast.success(
        `Discount "${discount.code}" is now ${newStatus === 'ACTIVE' ? 'Active' : 'Disabled'}`
      );
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update discount status');
      fetchDiscounts();
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingDiscount) return;
    const { id, code } = deletingDiscount;
    setIsDeleting(true);
    try {
      await discountService.deleteDiscount(id);
      setDiscountsList((prev) => prev.filter((d) => d.id !== id));
      setDeletingDiscount(null);
      toast.success(`Discount "${code}" deleted successfully`);
    } catch (error: any) {
      console.error('Failed to delete discount:', error);
      toast.error(error?.message || 'Failed to delete discount');
    } finally {
      setIsDeleting(false);
    }
  };

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: discountsList.length,
      active: discountsList.filter((d) => d.status === 'ACTIVE').length,
      scheduled: discountsList.filter((d) => d.status === 'SCHEDULED').length,
      expired: discountsList.filter((d) => d.status === 'EXPIRED').length,
      disabled: discountsList.filter((d) => d.status === 'DISABLED').length,
    };
  }, [discountsList]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const activeCount = discountsList.filter((d) => d.status === 'ACTIVE').length;
    const totalRedemptions = discountsList.reduce((acc, d) => acc + (d.usedCount || 0), 0);
    const scheduledCount = discountsList.filter((d) => d.status === 'SCHEDULED').length;

    // Approximate total savings granted based on redemptions
    const estimatedSavings = discountsList.reduce((acc, d) => {
      const redemptions = d.usedCount || 0;
      if (d.type === 'FIXED_AMOUNT') return acc + redemptions * d.value;
      if (d.type === 'PERCENTAGE') return acc + redemptions * (d.maxDiscountAmount || 250);
      return acc + redemptions * 120; // free delivery approx ৳120
    }, 0);

    return {
      activeCount,
      totalRedemptions,
      scheduledCount,
      estimatedSavings,
    };
  }, [discountsList]);

  // Filtered list
  const filteredDiscounts = useMemo(() => {
    let list = [...discountsList];

    // Filter by Tab
    if (activeTab !== 'all') {
      list = list.filter((d) => d.status === activeTab);
    }

    // Filter by Type
    if (selectedType !== 'all') {
      list = list.filter((d) => d.type === selectedType);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.code.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q)
      );
    }

    return list;
  }, [discountsList, activeTab, selectedType, searchQuery]);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Discounts & Promotions"
        description="Create promotional coupon codes, percentage sales, flat discounts, and manage customer redemptions."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span>Create discount</span>
            </Button>
          </div>
        }
      />

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Metric 1: Active Discounts */}
        <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              Active Promotions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {metrics.activeCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live on store
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {metrics.scheduledCount} upcoming scheduled campaign(s)
          </p>
        </div>

        {/* Metric 2: Total Redemptions */}
        <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              Total Used Count
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {metrics.totalRedemptions}
            </span>
            <span className="text-xs text-ink-muted">orders redeemed</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Tracked in realtime per user & order
          </p>
        </div>

        {/* Metric 3: Total Revenue / Savings */}
        <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              Customer Savings Impact
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay/10 text-clay">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {formatBDT(metrics.estimatedSavings)}
            </span>
            <span className="text-xs font-medium text-clay">৳ Saved</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Estimated promotional value delivered
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {[
            { key: 'all' as FilterTab, label: 'All', count: counts.all },
            { key: 'ACTIVE' as FilterTab, label: 'Active', count: counts.active },
            { key: 'SCHEDULED' as FilterTab, label: 'Scheduled', count: counts.scheduled },
            { key: 'EXPIRED' as FilterTab, label: 'Expired', count: counts.expired },
            { key: 'DISABLED' as FilterTab, label: 'Disabled', count: counts.disabled },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                activeTab === tab.key
                  ? 'bg-ink text-canvas shadow-xs'
                  : 'text-ink-muted hover:bg-subtle hover:text-ink'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search & Type Filter */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-full rounded-lg border border-line bg-canvas/60 pl-8.5 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
            />
          </div>

          {/* Type Dropdown */}
          <select
            aria-label="Filter by discount type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-8.5 rounded-lg border border-line bg-canvas/60 px-2.5 text-xs text-ink focus:border-clay focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED_AMOUNT">Fixed Amount (৳)</option>
            <option value="FREE_SHIPPING">Free Shipping</option>
          </select>
        </div>
      </div>

      {/* Content Table / Cards */}
      {loading && discountsList.length === 0 ? (
        <div className="flex h-64 w-full items-center justify-center rounded-xl border border-line bg-surface">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-clay" />
            <p className="text-xs text-ink-muted">Loading live promotions from database...</p>
          </div>
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8">
          <EmptyState
            icon={Percent}
            title={searchQuery ? 'No matching discounts' : 'No discounts in this view'}
            description={
              searchQuery
                ? `No promotions match "${searchQuery}". Try a different keyword or clear filters.`
                : 'Create your first coupon campaign to attract and reward shoppers!'
            }
            action={
              searchQuery ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="cursor-pointer"
                >
                  Clear search
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreate}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create discount</span>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-subtle/50 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Discount / Code
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Benefit / Value
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Usage Limit
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Schedule Dates
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredDiscounts.map((discount) => (
                  <DiscountRow
                    key={discount.id}
                    discount={discount}
                    isCopied={copiedCode === discount.code}
                    onCopyCode={handleCopyCode}
                    onToggleStatus={handleToggleStatus}
                    onEdit={handleOpenEdit}
                    onDelete={setDeletingDiscount}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <DiscountModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDiscount(null);
        }}
        discount={editingDiscount}
        onSaved={handleDiscountSaved}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingDiscount)}
        onClose={() => setDeletingDiscount(null)}
        size="sm"
        title="Delete discount campaign?"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDeletingDiscount(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={handleConfirmDelete}
              loading={isDeleting}
            >
              Delete discount
            </Button>
          </div>
        }
      >
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-ink">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p>
              Are you sure you want to delete coupon code{' '}
              <strong className="font-semibold text-ink font-mono">
                &ldquo;{deletingDiscount?.code}&rdquo;
              </strong>
              ? Customers will no longer be able to apply this discount at checkout.
            </p>
          </div>
          <p className="text-xs text-ink-muted">
            Past order redemption records will be preserved for financial auditing.
          </p>
        </div>
      </Modal>
    </div>
  );
}
