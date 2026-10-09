'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  RotateCcw,
  Image as ImageIcon,
  Search,
  RefreshCw,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  Eye,
  X,
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { returnService } from '@/services/return-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { DataTable, type Column } from '@/components/dashboard/shared/DataTable';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { returnStatusMeta } from '@/utils/status';
import { formatBDT, formatDate, formatDateTime } from '@/utils/format';
import type { ReturnRequest, ReturnStatus } from '@/types/commerce';

type Tab = 'all' | 'open' | 'requested' | 'in_progress' | 'closed';

type ReturnWithExtras = ReturnRequest & {
  photoUrls?: string[];
  order?: any;
};

function ReturnsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) ?? 'open';

  const { actor } = useAdmin();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Live backend data state
  const [liveReturns, setLiveReturns] = useState<ReturnWithExtras[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [counts, setCounts] = useState({
    all: 0,
    open: 0,
    awaitingReview: 0,
    inProgress: 0,
    closed: 0,
  });

  // Fetch real returns from backend API
  const fetchReturns = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await returnService.getOwnerReturns({
        tab: tab !== 'all' ? tab : undefined,
        search: q.trim() || undefined,
        limit: 100,
      });

      if (res?.data?.returns) {
        setLiveReturns(res.data.returns);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      } else {
        setLiveReturns([]);
      }
    } catch (err) {
      console.warn('Could not fetch owner returns from backend:', err);
      toast.error('Could not load returns from server');
    } finally {
      setIsLoading(false);
    }
  }, [tab, q]);

  // Initial & reactive fetch with debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReturns();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchReturns]);

  // Active selected return for Drawer
  const active = useMemo(() => {
    return liveReturns.find((r) => r.id === activeId) || null;
  }, [liveReturns, activeId]);

  // Sync inspection note when active item changes
  useEffect(() => {
    if (active) {
      setNote(active.inspectionNote || '');
    }
  }, [active?.id]);

  // Status transition action handler
  const handleUpdateStatus = async (
    targetStatus: ReturnStatus,
    successMessage: string,
    actionNote?: string,
  ) => {
    if (!active) return;
    setIsActionLoading(true);
    try {
      const res = await returnService.updateOwnerReturnStatus(active.id, {
        status: targetStatus,
        inspectionNote: note.trim() || undefined,
        note: actionNote || (note.trim() ? note.trim() : undefined),
      });

      if (res?.data) {
        toast.success(successMessage);
        setLiveReturns((prev) =>
          prev.map((r) => (r.id === active.id ? { ...r, ...res.data } : r)),
        );
        fetchReturns();
      } else {
        throw new Error(res?.message || 'Failed to update return status');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update return status on server');
    } finally {
      setIsActionLoading(false);
    }
  };

  const columns: Column<ReturnWithExtras>[] = [
    {
      key: 'id',
      header: 'Return / Exchange',
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-ink">
          {r.id.length > 12 ? `${r.id.slice(0, 8)}...` : r.id}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (r) => (
        <span className="font-medium text-ink flex items-center gap-1">
          {r.orderNumber}
        </span>
      ),
    },
    {
      key: 'cust',
      header: 'Customer',
      render: (r) => <span className="text-ink font-medium">{r.customerName}</span>,
    },
    {
      key: 'item',
      header: 'Items',
      render: (r) => {
        const firstItem = r.items[0];
        return (
          <span className="flex items-center gap-2">
            {firstItem?.image ? (
              <img
                src={firstItem.image}
                alt=""
                className="h-9 w-7 rounded object-cover border border-line"
              />
            ) : (
              <div className="h-9 w-7 rounded bg-canvas border border-line flex items-center justify-center text-[10px] text-ink-muted">
                No img
              </div>
            )}
            <span className="text-ink font-medium line-clamp-1 max-w-[160px]">
              {firstItem?.title || 'Return Item'}
            </span>
            {r.items.length > 1 && (
              <span className="text-xs text-ink-muted shrink-0">+{r.items.length - 1}</span>
            )}
          </span>
        );
      },
      hideOnMobile: true,
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (r) => (
        <span className="text-ink-muted line-clamp-1 max-w-[180px]">{r.reason}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'res',
      header: 'Type',
      render: (r) => (
        <span className="capitalize text-xs font-medium text-ink bg-canvas px-2 py-0.5 rounded border border-line">
          Exchange
        </span>
      ),
    },
    {
      key: 'amt',
      header: 'Item Value',
      align: 'right',
      render: (r) => (
        <span className="tabular-nums font-semibold text-ink">{formatBDT(r.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const meta = returnStatusMeta[r.status] || { label: r.status, tone: 'neutral' };
        return (
          <Badge tone={meta.tone} dot>
            {r.status === 'refunded' || r.status === 'exchanged' ? 'Exchanged' : meta.label}
          </Badge>
        );
      },
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setActiveId(r.id);
          }}
          className="cursor-pointer h-7 px-2.5 text-xs inline-flex items-center gap-1 hover:border-clay hover:text-clay"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          <span>Review</span>
        </Button>
      ),
    },
  ];

  const stats: [string, number | string][] = [
    ['Awaiting review', counts.awaitingReview],
    ['In progress / inspect', counts.inProgress],
    ['Exchanged / Closed', counts.closed],
    ['Total store returns', counts.all],
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Returns & Exchanges"
        description="Review customer exchange requests, schedule courier pickups, inspect items and dispatch replacements."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchReturns}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-line bg-surface px-4 py-3 shadow-xs"
          >
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="mt-1 text-xl font-bold text-ink tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="rounded-lg border border-line bg-surface overflow-hidden shadow-xs">
        <div className="px-4 pt-2">
          <Tabs
            value={tab}
            onChange={(t) => {
              const newTab = t as Tab;
              setTab(newTab);
              const url =
                newTab === 'open' ? '/admin/returns' : `/admin/returns?tab=${newTab}`;
              router.push(url);
            }}
            tabs={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'open', label: 'Open', count: counts.open },
              {
                value: 'requested',
                label: 'Awaiting review',
                count: counts.awaitingReview,
              },
              {
                value: 'in_progress',
                label: 'In progress',
                count: counts.inProgress,
              },
              { value: 'closed', label: 'Closed', count: counts.closed },
            ]}
          />
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by order #, customer name, return ID or reason…"
              aria-label="Search returns"
              className="h-9 w-full rounded-md border border-line bg-canvas pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
            />
          </div>
        </div>

        {/* Content Table or Loader */}
        {isLoading && liveReturns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-clay mb-2" />
            <p className="text-sm text-ink-muted">Loading returns & exchanges...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={liveReturns}
            rowKey={(r) => r.id}
            onRowClick={(r) => setActiveId(r.id)}
            empty={
              <EmptyState
                icon={RotateCcw}
                title="No return or exchange requests found"
                description="New customer requests will appear here."
              />
            }
          />
        )}
      </div>

      {/* Detail and Action Drawer */}
      <Drawer
        open={!!active}
        onClose={() => setActiveId(null)}
        width="max-w-lg"
        title={
          active
            ? `Exchange #${active.id.slice(0, 8)} · ${active.orderNumber}`
            : ''
        }
        subtitle={
          active &&
          `Requested by ${active.customerName} on ${formatDate(active.createdAt)}`
        }
      >
        {active && (
          <div className="space-y-5 p-5 text-sm">
            {/* Status & Resolution Banner */}
            <div className="rounded-lg border border-line bg-canvas/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Current Status
                </span>
                <Badge
                  tone={
                    returnStatusMeta[active.status]?.tone || 'neutral'
                  }
                  dot
                >
                  {active.status === 'exchanged' || active.status === 'refunded'
                    ? 'Exchanged'
                    : returnStatusMeta[active.status]?.label || active.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-muted">Resolution Type</p>
                <p className="mt-0.5 text-base font-bold capitalize text-ink flex items-center justify-between">
                  <span>Doorstep Size & Product Exchange</span>
                  <span className="text-clay tabular-nums">{formatBDT(active.amount)}</span>
                </p>
              </div>
              <div className="pt-2 border-t border-line">
                <p className="text-xs text-ink-muted">
                  Reason:{' '}
                  <b className="text-ink font-semibold">{active.reason}</b>
                </p>
                {active.details && (
                  <p className="mt-1 text-xs italic text-ink-soft bg-surface p-2 rounded border border-line">
                    “{active.details}”
                  </p>
                )}
              </div>
              {active.order && (
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Original Order:</span>
                  <Link
                    href={`/admin/orders/${active.order.id || active.orderNumber}`}
                    className="font-medium text-clay hover:underline inline-flex items-center gap-1"
                  >
                    View {active.orderNumber} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Returned Items */}
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Return Items ({active.items.length})
              </p>
              <div className="space-y-2">
                {active.items.map((i, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border border-line p-2.5 bg-surface"
                  >
                    {i.image ? (
                      <img
                        src={i.image}
                        alt=""
                        className="h-12 w-10 rounded object-cover border border-line"
                      />
                    ) : (
                      <div className="h-12 w-10 rounded bg-canvas border border-line flex items-center justify-center text-[10px] text-ink-muted">
                        No img
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">{i.title}</p>
                      <p className="text-xs text-ink-muted">
                        {[i.color, i.size].filter(Boolean).join(' / ') || 'Standard'} · Qty{' '}
                        {i.qty}
                      </p>
                    </div>
                    <span className="tabular-nums font-semibold text-ink">
                      {formatBDT(i.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Uploaded Photos */}
            {active.photoUrls && active.photoUrls.length > 0 && (
              <div className="border-t border-line pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  <ImageIcon className="h-4 w-4 text-clay" /> Customer Photos (
                  {active.photoUrls.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {active.photoUrls.map((photo, i) => (
                    <div
                      key={i}
                      onClick={() => setPreviewPhoto(photo)}
                      className="group relative h-20 overflow-hidden rounded-md border border-line bg-canvas cursor-pointer hover:border-clay"
                    >
                      <img
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                        View
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Section */}
            <div className="border-t border-line pt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Admin Actions
              </p>

              {/* 1. When status is REQUESTED (Awaiting Review) */}
              {active.status === 'requested' && (
                <div className="space-y-3">
                  <Textarea
                    label="Review Remarks / Pickup Instructions"
                    rows={2}
                    placeholder="E.g. Approved for courier exchange pickup..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <GuardedButton
                      module="returns"
                      action="update"
                      fullWidth
                      disabled={isActionLoading}
                      onClick={() =>
                        handleUpdateStatus(
                          'approved',
                          'Exchange request approved & scheduled for courier pickup',
                          'Exchange request approved by staff',
                        )
                      }
                      className="bg-clay text-white hover:bg-clay-dark"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Approve & Schedule Pickup
                    </GuardedButton>
                    <GuardedButton
                      module="returns"
                      action="update"
                      fullWidth
                      variant="danger"
                      disabled={isActionLoading}
                      onClick={() =>
                        handleUpdateStatus(
                          'rejected',
                          'Exchange request rejected',
                          'Exchange request rejected by staff',
                        )
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reject
                    </GuardedButton>
                  </div>
                </div>
              )}

              {/* 2. When status is APPROVED */}
              {active.status === 'approved' && (
                <div className="space-y-3">
                  <Textarea
                    label="Courier Tracking Note"
                    rows={2}
                    placeholder="Courier name and tracking number..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <GuardedButton
                    module="returns"
                    action="update"
                    fullWidth
                    disabled={isActionLoading}
                    onClick={() =>
                      handleUpdateStatus(
                        'in_transit',
                        'Parcel marked as in transit',
                        'Return parcel dispatched with courier',
                      )
                    }
                  >
                    <Truck className="h-4 w-4 mr-1.5" />
                    Mark In Transit (Courier Picked Up)
                  </GuardedButton>
                </div>
              )}

              {/* 3. When status is IN_TRANSIT */}
              {active.status === 'in_transit' && (
                <div className="space-y-3">
                  <Textarea
                    label="Warehouse Receiving Note"
                    rows={2}
                    placeholder="Package condition upon arrival..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <GuardedButton
                    module="returns"
                    action="update"
                    fullWidth
                    disabled={isActionLoading}
                    onClick={() =>
                      handleUpdateStatus(
                        'received',
                        'Marked as received at warehouse — ready for inspection',
                        'Returned parcel received at warehouse',
                      )
                    }
                  >
                    <PackageCheck className="h-4 w-4 mr-1.5" />
                    Mark Received at Warehouse
                  </GuardedButton>
                </div>
              )}

              {/* 4. When status is RECEIVED */}
              {active.status === 'received' && (
                <div className="space-y-3">
                  <Textarea
                    label="Inspection Findings & Quality Check Notes"
                    rows={2}
                    placeholder="Tag intact, product condition verified, replacement ready…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />

                  <div className="space-y-2 pt-2">
                    <GuardedButton
                      module="returns"
                      action="update"
                      fullWidth
                      disabled={isActionLoading}
                      onClick={() =>
                        handleUpdateStatus(
                          'exchanged',
                          'Exchange approved & replacement dispatched to customer',
                          'Replacement parcel prepared and dispatched to customer',
                        )
                      }
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <PackageCheck className="h-4 w-4 mr-1.5" />
                      Approve Exchange & Dispatch Replacement
                    </GuardedButton>

                    <Button
                      variant="danger"
                      fullWidth
                      disabled={isActionLoading}
                      onClick={() =>
                        handleUpdateStatus(
                          'rejected',
                          'Item failed quality inspection — exchange rejected',
                          'Item failed quality inspection. Exchange rejected.',
                        )
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Fail Quality Inspection & Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* 5. When return is closed */}
              {['refunded', 'exchanged', 'rejected'].includes(active.status) && (
                <div className="rounded-lg border border-line bg-canvas p-3 text-xs space-y-1">
                  <p className="font-semibold text-ink flex items-center gap-1.5">
                    {active.status === 'rejected' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    This exchange request is completed ({active.status === 'rejected' ? 'REJECTED' : 'EXCHANGED'})
                  </p>
                  {active.inspectionNote && (
                    <p className="text-ink-muted">
                      Inspection note: <span className="text-ink">{active.inspectionNote}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Timeline Audit Trail */}
            <div className="border-t border-line pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Audit Timeline
              </p>
              <ol className="relative border-l border-line pl-4 space-y-3.5 text-xs">
                {active.timeline.map((e, idx) => (
                  <li key={idx} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-clay" />
                    <p className="font-semibold text-ink">{e.label}</p>
                    <p className="text-xs text-ink-muted">
                      {formatDateTime(e.at)} {e.by && `· by ${e.by}`}
                    </p>
                    {e.note && (
                      <p className="mt-1 text-ink-soft italic bg-canvas p-2 rounded border border-line">
                        “{e.note}”
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Drawer>

      {/* Full Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-lg bg-surface p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-ink/70 p-1.5 text-white hover:bg-ink"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={previewPhoto}
              alt="Return Photo Preview"
              className="max-h-[75vh] w-auto rounded object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReturnsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-ink-muted">Loading returns dashboard...</div>
      }
    >
      <ReturnsContent />
    </Suspense>
  );
}
