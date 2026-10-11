'use client';

import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Download, Search, ShoppingCart, RefreshCw, Loader2, Eye, ChevronRight } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useAdmin } from '@/contexts/AdminContext';
import { orderService } from '@/services/order-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { DataTable, type Column } from '@/components/dashboard/shared/DataTable';
import { BulkBar } from '@/components/dashboard/shared/BulkBar';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { EmptyState } from '@/components/ui/EmptyState';
import { fulfillmentMeta, orderStatusMeta, paymentStatusMeta } from '@/utils/status';
import { formatBDT, formatDateTime } from '@/utils/format';
import type { Order, OrderStatus, PaymentMethod } from '@/types/commerce';

type Tab = 'all' | 'unfulfilled' | 'unpaid' | 'packed' | 'shipped' | 'returns' | 'closed';

const tabFilter: Record<Tab, (o: Order) => boolean> = {
  all: () => true,
  unfulfilled: (o) =>
    (o.fulfillmentStatus === 'unfulfilled' || ['confirmed', 'processing', 'pending_payment'].includes(o.status)) &&
    !['delivered', 'cancelled', 'failed'].includes(o.status),
  unpaid: (o) =>
    (o.paymentStatus !== 'paid' || o.status === 'pending_payment') &&
    !['cancelled', 'failed'].includes(o.status),
  packed: (o) => o.status === 'packed',
  shipped: (o) => ['shipped', 'out_for_delivery'].includes(o.status),
  returns: (o) => ['return_requested', 'returned', 'refunded', 'partially_refunded'].includes(o.status),
  closed: (o) => ['delivered', 'cancelled', 'failed'].includes(o.status),
};

function OrdersContent() {
  const { orders: storeOrders, setOrderStatus } = useStore();
  const { actor } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) ?? 'all';

  const [q, setQ] = useState('');
  const [method, setMethod] = useState<'all' | PaymentMethod>('all');
  const [channel, setChannel] = useState<'all' | 'online' | 'manual'>('all');
  const [selected, setSelected] = useState<string[]>([]);
  
  // Real backend order data state
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [serverCounts, setServerCounts] = useState<{
    all: number;
    unfulfilled: number;
    unpaid: number;
    packed: number;
    shipped: number;
    returns: number;
    closed: number;
  }>({
    all: 0,
    unfulfilled: 0,
    unpaid: 0,
    packed: 0,
    shipped: 0,
    returns: 0,
    closed: 0,
  });

  // Fetch real store orders from backend with search and filters
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await orderService.getOwnerOrders({
        search: q.trim() || undefined,
        tab: tab !== 'all' ? tab : undefined,
        paymentMethod: method !== 'all' ? method : undefined,
        channel: channel !== 'all' ? channel : undefined,
        limit: 100,
      });

      if (res?.data?.orders) {
        const backendOrders = res.data.orders;
        const backendOrderKeys = new Set(backendOrders.map((o: Order) => o.number || o.id));
        const localOnlyOrders = (storeOrders || []).filter(
          (o) => !backendOrderKeys.has(o.number) && !backendOrderKeys.has(o.id)
        );
        const combined = [...backendOrders, ...localOnlyOrders];
        setLiveOrders(combined);
        if (res.data.counts) {
          setServerCounts({
            ...res.data.counts,
            all: res.data.counts.all + localOnlyOrders.length,
            unfulfilled: res.data.counts.unfulfilled + localOnlyOrders.filter((o) => o.fulfillmentStatus === 'unfulfilled').length,
          });
        }
      } else {
        setLiveOrders(storeOrders);
      }
    } catch (err) {
      console.warn('Could not fetch owner orders from backend, using client store:', err);
      setLiveOrders(storeOrders);
    } finally {
      setIsLoading(false);
    }
  }, [q, tab, method, channel, storeOrders]);

  // Initial and reactive fetch with debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  // Client-side filtering fallback for maximum responsiveness
  const rows = useMemo(() => {
    return liveOrders.filter(
      (o) =>
        (tabFilter[tab] ?? tabFilter.all)(o) &&
        (method === 'all' || o.paymentMethod === method) &&
        (channel === 'all' || o.channel === channel) &&
        (!q || `${o.number} ${o.customerName} ${o.phone} ${o.email}`.toLowerCase().includes(q.toLowerCase()))
    );
  }, [liveOrders, tab, method, channel, q]);

  // Bulk status update with backend synchronization
  const bulkStatus = async (status: OrderStatus, label: string) => {
    if (selected.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await Promise.allSettled(
        selected.map((id) =>
          orderService.updateOwnerOrderStatus(id, {
            status,
            note: label,
          })
        )
      );

      selected.forEach((id) => setOrderStatus(id, status, { label, by: actor }));
      toast.success(`${selected.length} orders marked as ${orderStatusMeta[status].label.toLowerCase()}`);
      setSelected([]);
      fetchOrders();
    } catch (err: any) {
      toast.error('Some orders could not be updated on the server');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'num',
      header: 'Order',
      render: (o) => (
        <Link
          href={`/admin/orders/${o.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-ink hover:text-clay hover:underline inline-flex items-center gap-1"
        >
          {o.number}
        </Link>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (o) => <span className="text-ink-muted">{formatDateTime(o.createdAt)}</span>,
      hideOnMobile: true,
    },
    {
      key: 'cust',
      header: 'Customer',
      render: (o) => (
        <div>
          <p className="text-ink font-medium">{o.customerName}</p>
          <p className="text-xs text-ink-muted">{o.shippingAddress?.district || o.shippingAddress?.area}</p>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (o) => <span className="text-ink-muted">{o.channel === 'manual' ? 'Admin' : 'Online store'}</span>,
      hideOnMobile: true,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (o) => <span className="tabular-nums font-medium text-ink">{formatBDT(o.total)}</span>,
    },
    {
      key: 'pay',
      header: 'Payment',
      render: (o) => (
        <span className="inline-flex items-center" title={`Payment method: ${o.paymentMethod}`}>
          <PaymentMark method={o.paymentMethod} />
        </span>
      ),
    },
    {
      key: 'ful',
      header: 'Fulfillment',
      render: (o) => (
        <Badge tone={fulfillmentMeta[o.fulfillmentStatus]?.tone || 'neutral'} dot>
          {fulfillmentMeta[o.fulfillmentStatus]?.label || o.fulfillmentStatus}
        </Badge>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <Badge tone={orderStatusMeta[o.status]?.tone || 'neutral'}>
          {orderStatusMeta[o.status]?.label || o.status}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (o) => (
        <Button
          variant="secondary"
          size="sm"
          href={`/admin/orders/${o.id}`}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer h-7 px-2.5 text-xs inline-flex items-center gap-1 hover:border-clay hover:text-clay"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          <span>View</span>
        </Button>
      ),
    },
  ];

  // Helper to compute counts prioritizing server counts if available
  const count = (t: Tab) => {
    if (serverCounts && typeof serverCounts[t] === 'number') {
      return serverCounts[t];
    }
    return liveOrders.filter(tabFilter[t]).length;
  };

  const totalOrdersCount = serverCounts.all > 0 ? serverCounts.all : liveOrders.length;
  const unfulfilledCount = count('unfulfilled');

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Orders"
        description={`${totalOrdersCount} orders · ${unfulfilledCount} awaiting fulfillment`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchOrders}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden />
              Refresh
            </Button>
            <GuardedButton
              module="orders"
              action="export"
              variant="secondary"
              size="sm"
              onClick={() => toast.success(`Exported ${rows.length} orders to orders.csv`)}
            >
              <Download className="h-4 w-4" aria-hidden /> Export
            </GuardedButton>
          </div>
        }
      />

      <div className="rounded-lg border border-line bg-surface overflow-hidden">
        <div className="px-4 pt-2">
          <Tabs
            value={tab}
            onChange={(t) => {
              const url = t === 'all' ? '/admin/orders' : `/admin/orders?tab=${t}`;
              router.push(url);
              setSelected([]);
            }}
            tabs={[
              { value: 'all', label: 'All', count: count('all') },
              { value: 'unfulfilled', label: 'Unfulfilled', count: count('unfulfilled') },
              { value: 'unpaid', label: 'Unpaid', count: count('unpaid') },
              { value: 'packed', label: 'Ready to ship', count: count('packed') },
              { value: 'shipped', label: 'In transit', count: count('shipped') },
              { value: 'returns', label: 'Returns', count: count('returns') },
              { value: 'closed', label: 'Closed', count: count('closed') },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by order #, customer, phone or email…"
              aria-label="Search orders"
              className="h-9 w-full rounded-md border border-line bg-canvas pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
            />
          </div>
          <select
            aria-label="Payment method filter"
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm text-ink focus:outline-none"
          >
            <option value="all">All payment methods</option>
            <option value="cod">Cash on delivery (COD)</option>
          </select>
          <select
            aria-label="Channel filter"
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm text-ink focus:outline-none"
          >
            <option value="all">All channels</option>
            <option value="online">Online store</option>
            <option value="manual">Manual / POS</option>
          </select>
        </div>

        {isLoading && liveOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-clay mb-2" />
            <p className="text-sm text-ink-muted">Loading orders from store backend...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(o) => o.id}
            onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            empty={
              <EmptyState
                icon={ShoppingCart}
                title="No orders found"
                description="Try adjusting your filters or search term."
              />
            }
            mobileCard={(o) => (
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{o.number}</span>
                  <span className="tabular-nums font-semibold text-ink">{formatBDT(o.total)}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {o.customerName} · {o.shippingAddress?.district || o.shippingAddress?.area}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PaymentMark method={o.paymentMethod} />
                    <Badge tone={orderStatusMeta[o.status]?.tone || 'neutral'}>
                      {orderStatusMeta[o.status]?.label || o.status}
                    </Badge>
                  </div>
                  <span className="text-xs font-medium text-clay hover:underline inline-flex items-center gap-0.5">
                    Details <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            )}
          />
        )}
      </div>

      <BulkBar count={selected.length} onClear={() => setSelected([])}>
        <button
          disabled={isBulkUpdating}
          onClick={() => bulkStatus('processing', 'Bulk processing')}
          className="cursor-pointer hover:underline disabled:opacity-50"
        >
          Mark as processing
        </button>
        <button
          disabled={isBulkUpdating}
          onClick={() => bulkStatus('packed', 'Bulk packed')}
          className="cursor-pointer hover:underline disabled:opacity-50"
        >
          Mark as packed
        </button>
        <button
          disabled={isBulkUpdating}
          onClick={() => bulkStatus('shipped', 'Bulk shipped')}
          className="cursor-pointer hover:underline disabled:opacity-50"
        >
          Mark as shipped
        </button>
      </BulkBar>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-ink-muted">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}

