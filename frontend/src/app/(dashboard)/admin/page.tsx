'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, ChevronRight, Package, RotateCcw, AlertTriangle, Star, CreditCard, RefreshCw } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useTenant } from '@/contexts/TenantContext';
import { Panel } from '@/components/dashboard/shared/Panel';
import { Badge } from '@/components/ui/Badge';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { orderStatusMeta } from '@/utils/status';
import { formatBDT, formatCompactBDT, formatNumber, timeAgo } from '@/utils/format';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth';
import { analyticsService, AnalyticsOverviewResponse } from '@/services/analytics-service';
import { reviewService } from '@/services/review-service';
import { orderService } from '@/services/order-service';
import { returnService } from '@/services/return-service';
import { inventoryService, type InventoryVariantItem } from '@/services/inventory-service';
import type { Order } from '@/types/commerce';

type Range = '7d' | '30d';

type TopProductRow = {
  key: string;
  title: string;
  image?: string;
  qty: number;
};

export default function AdminDashboardPage() {
  const { can } = useAdmin();
  const { tenant } = useTenant();
  const [userName, setUserName] = useState<string>('');
  const [range, setRange] = useState<Range>('30d');
  const [realOverview, setRealOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [pendingReplyCount, setPendingReplyCount] = useState(0);
  const [pendingReturnsCount, setPendingReturnsCount] = useState(0);
  const [ownerOrders, setOwnerOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<InventoryVariantItem[]>([]);
  const storeName = tenant?.name?.trim() || 'your store';
  const greetingName = userName || 'there';

  const fetchOverview = () => {
    setIsLoadingAnalytics(true);
    analyticsService
      .getAnalyticsOverview(range === '7d' ? '7 days' : '30 days')
      .then((res) => {
        if (res) setRealOverview(res);
      })
      .catch((err) => {
        console.warn('Could not load live analytics:', err);
      })
      .finally(() => {
        setIsLoadingAnalytics(false);
      });
  };

  useEffect(() => {
    fetchOverview();
  }, [range]);

  useEffect(() => {
    if (!can('reviews')) return;
    let cancelled = false;
    reviewService
      .getOwnerReviews({ page: 1, limit: 1 })
      .then((res) => {
        if (!cancelled) {
          setPendingReplyCount(res?.data?.stats?.pendingReplyCount || 0);
        }
      })
      .catch(() => {
        if (!cancelled) setPendingReplyCount(0);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!can('orders')) return;
    let cancelled = false;
    orderService
      .getOwnerOrders({ limit: 100 })
      .then((res) => {
        if (!cancelled) setOwnerOrders(res?.data?.orders || []);
      })
      .catch(() => {
        if (!cancelled) setOwnerOrders([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!can('returns')) return;
    let cancelled = false;
    returnService
      .getOwnerReturns({ tab: 'awaitingReview', limit: 1 })
      .then((res) => {
        if (!cancelled) {
          const counts = res?.data?.counts;
          setPendingReturnsCount(
            counts?.awaitingReview ?? counts?.open ?? res?.data?.returns?.length ?? 0,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setPendingReturnsCount(0);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!can('inventory')) return;
    let cancelled = false;
    inventoryService
      .getOverview({ stockStatus: 'low', limit: 5, sortBy: 'stock', sortOrder: 'asc' })
      .then((res) => {
        if (!cancelled) setLowStock(res?.data?.items || []);
      })
      .catch(() => {
        if (!cancelled) setLowStock([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute 100% Dynamic DB-driven Time Series
  const series = useMemo(() => {
    const days = range === '7d' ? 7 : 30;
    const now = new Date();
    const dateMap = new Map<string, { date: string; sales: number; prev: number; orders: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap.set(key, { date: key, sales: 0, prev: 0, orders: 0 });
    }

    if (realOverview?.salesSeries && realOverview.salesSeries.length > 0) {
      for (const item of realOverview.salesSeries) {
        if (dateMap.has(item.date)) {
          const entry = dateMap.get(item.date)!;
          entry.sales = item.sales;
          entry.prev = item.prev;
          entry.orders = item.orders;
        } else {
          dateMap.set(item.date, item);
        }
      }
    }

    return Array.from(dateMap.values());
  }, [range, realOverview]);

  const total = realOverview?.kpis ? realOverview.kpis.netSales : series.reduce((s, d) => s + d.sales, 0);
  const prev = series.reduce((s, d) => s + d.prev, 0);
  const change = prev > 0 ? ((total - prev) / prev) * 100 : total > 0 ? 100 : 0;

  const displayKpis = {
    orders: realOverview?.kpis ? realOverview.kpis.orders : 0,
    aov: realOverview?.kpis ? realOverview.kpis.aov : 0,
    conversionRate: realOverview?.kpis?.conversionRate ?? 0,
    returningRate: realOverview?.kpis?.returningRate ?? 0,
  };
  const showMoney = can('analytics');

  useEffect(() => {
    const user = authService.getStoredUser();
    if (user?.name) {
      setUserName(user.name.split(' ')[0]);
    } else if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }
  }, []);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const toFulfill = ownerOrders.filter((o) =>
    ['confirmed', 'processing'].includes(o.status),
  );
  const toShip = ownerOrders.filter((o) => o.status === 'packed');
  const unpaid = ownerOrders.filter(
    (o) => o.status === 'pending_payment' || o.paymentStatus === 'failed',
  );

  const topProducts = useMemo<TopProductRow[]>(() => {
    const map = new Map<string, TopProductRow>();
    for (const o of ownerOrders) {
      if (['cancelled', 'failed', 'refunded'].includes(o.status)) continue;
      for (const item of o.items || []) {
        const key = item.productId || item.sku || item.title;
        const existing = map.get(key);
        if (existing) {
          existing.qty += item.qty || 0;
        } else {
          map.set(key, {
            key,
            title: item.title,
            image: item.image,
            qty: item.qty || 0,
          });
        }
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [ownerOrders]);

  const todos = [
    { label: 'Orders to fulfill', count: toFulfill.length, to: '/admin/orders?tab=unfulfilled', icon: Package, show: can('orders') },
    { label: 'Packed, awaiting courier', count: toShip.length, to: '/admin/orders?tab=packed', icon: Package, show: can('orders') },
    { label: 'Returns to review', count: pendingReturnsCount, to: '/admin/returns', icon: RotateCcw, show: can('returns') },
    { label: 'Payments needing attention', count: unpaid.length, to: '/admin/orders?tab=unpaid', icon: CreditCard, show: can('orders') },
    { label: 'Reviews awaiting reply', count: pendingReplyCount, to: '/admin/reviews', icon: Star, show: can('reviews') },
  ].filter((t) => t.show);

  return (
    <div className="w-full space-y-6 min-w-0">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink truncate">
          Good morning, {greetingName}
        </h1>
        <p className="mt-1 text-sm text-ink-muted break-words">
          Here’s what’s happening at {storeName} today · {todayFormatted}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        {showMoney ? (
          <Panel className="lg:col-span-2 min-w-0" flush>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-ink-muted">Net sales</p>
                <p className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-ink tabular-nums truncate">
                  {formatBDT(total)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1 text-xs sm:text-sm">
                  <span className="inline-flex items-center font-medium text-success">
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    {change.toFixed(1)}%
                  </span>
                  <span className="text-ink-muted">vs previous period</span>
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={fetchOverview}
                  disabled={isLoadingAnalytics}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-ink-muted hover:text-ink cursor-pointer transition-colors shrink-0"
                  title="Refresh live analytics"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex rounded-md border border-line p-0.5 text-xs" role="group" aria-label="Date range">
                  {(['7d', '30d'] as Range[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      aria-pressed={range === r}
                      className={cn(
                        'whitespace-nowrap rounded px-2 sm:px-2.5 py-1 cursor-pointer transition-colors text-xs',
                        range === r ? 'bg-ink text-canvas font-medium' : 'text-ink-muted hover:text-ink'
                      )}
                    >
                      {r === '7d' ? 'Last 7 days' : 'Last 30 days'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-60 sm:h-64 px-1 sm:px-2 pb-2 pt-2 sm:pt-4 w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={series} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={16}
                    tick={{ fontSize: 11, fill: 'rgb(var(--ink-muted))' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'rgb(var(--ink-muted))' }}
                    tickFormatter={(v) => formatCompactBDT(v)}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatBDT(Number(Array.isArray(value) ? value[0] : value)),
                      String(name) === 'sales' ? 'This period' : 'Previous period',
                    ]}
                    contentStyle={{ borderRadius: 8, border: '1px solid rgb(var(--line))', fontSize: 12, backgroundColor: 'white' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="prev"
                    stroke="rgb(var(--line-strong))"
                    strokeDasharray="4 4"
                    fill="none"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="rgb(var(--clay))"
                    fill="rgb(var(--clay-soft))"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
              {[
                ['Orders', formatNumber(displayKpis.orders)],
                ['Avg. order value', formatBDT(displayKpis.aov)],
                ['Conversion', `${displayKpis.conversionRate}%`],
                ['Returning customers', `${displayKpis.returningRate}%`],
              ].map(([l, v], i) => (
                <div
                  key={l}
                  className={cn(
                    'px-3.5 py-3 sm:px-5 sm:py-3.5 min-w-0',
                    i >= 2 && 'border-t border-line sm:border-t-0',
                    i % 2 === 1 && 'border-l border-line',
                    i > 0 && 'sm:border-l sm:border-line'
                  )}
                >
                  <dt className="text-xs text-ink-muted truncate">{l}</dt>
                  <dd className="mt-0.5 text-sm sm:text-base font-semibold text-ink tabular-nums truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ) : (
          <Panel className="lg:col-span-2 min-w-0" title="Your queue" description="Sales figures are hidden for your role.">
            <p className="text-2xl sm:text-3xl font-semibold text-ink">{toFulfill.length + toShip.length} orders</p>
            <p className="mt-1 text-sm text-ink-muted">need picking, packing or handover today</p>
          </Panel>
        )}

        <Panel title="Needs your attention" flush className="min-w-0">
          <ul className="divide-y divide-line">
            {todos.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.label}>
                  <Link href={t.to} className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-canvas transition-colors">
                    <Icon className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
                    <span className="flex-1 min-w-0 text-sm text-ink truncate">{t.label}</span>
                    <span
                      className={cn(
                        'min-w-[28px] rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums shrink-0',
                        t.count ? 'bg-ink text-canvas' : 'bg-subtle text-ink-muted'
                      )}
                    >
                      {t.count}
                    </span>
                    <ChevronRight className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          className="lg:col-span-2 min-w-0"
          title="Recent orders"
          actions={
            <Link href="/admin/orders" className="text-sm font-medium text-ink hover:text-clay transition-colors">
              View all
            </Link>
          }
          flush
        >
          <ul className="divide-y divide-line">
            {ownerOrders.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-col gap-1.5 px-4 py-3 sm:px-5 sm:py-3.5 hover:bg-canvas transition-colors sm:grid sm:grid-cols-[110px_minmax(0,1fr)_auto_auto_90px] sm:items-center sm:gap-4"
                >
                  {/* Top row on mobile / Col 1 & 4 on desktop */}
                  <div className="flex items-center justify-between gap-2 sm:contents">
                    <span className="text-sm font-semibold sm:font-medium text-ink truncate sm:order-0">
                      {o.number}
                    </span>
                    <span className="sm:hidden">
                      <Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge>
                    </span>
                  </div>

                  {/* Bottom row on mobile / Col 2, 3, 4, 5 on desktop */}
                  <div className="flex items-center justify-between gap-2 min-w-0 sm:contents">
                    <span className="truncate min-w-0 text-xs sm:text-sm text-ink-soft sm:order-1 flex-1">
                      {o.customerName} <span className="text-ink-muted">· {timeAgo(o.createdAt)}</span>
                    </span>
                    <span className="hidden sm:order-2 sm:block shrink-0">
                      <PaymentMark method={o.paymentMethod} />
                    </span>
                    <span className="hidden sm:order-3 sm:block shrink-0">
                      <Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge>
                    </span>
                    <span className="text-right text-sm tabular-nums text-ink font-semibold sm:font-medium sm:order-4 shrink-0">
                      {formatBDT(o.total)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
            {ownerOrders.length === 0 && (
              <li className="px-5 py-8 text-sm text-ink-muted">No orders yet.</li>
            )}
          </ul>
        </Panel>

        <div className="space-y-6 min-w-0">
          {showMoney && (
            <Panel title="Top products · recent orders" flush className="min-w-0">
              <ol className="divide-y divide-line">
                {topProducts.map((p, i) => (
                  <li key={p.key} className="flex items-center gap-3 px-4 sm:px-5 py-2.5">
                    <span className="w-4 text-xs text-ink-muted tabular-nums shrink-0">{i + 1}</span>
                    {p.image ? (
                      <img src={p.image} alt="" className="h-9 w-7 rounded object-cover shrink-0" />
                    ) : (
                      <span className="h-9 w-7 rounded bg-subtle shrink-0" />
                    )}
                    <span className="flex-1 min-w-0 truncate text-sm text-ink">{p.title}</span>
                    <span className="text-xs text-ink-muted tabular-nums shrink-0">{p.qty} sold</span>
                  </li>
                ))}
                {topProducts.length === 0 && (
                  <li className="px-5 py-6 text-sm text-ink-muted">No product sales in loaded orders yet.</li>
                )}
              </ol>
            </Panel>
          )}
          {can('inventory') && (
            <Panel
              className="min-w-0"
              title={
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-warning" aria-hidden /> Low stock
                </span>
              }
              actions={
                <Link href="/admin/inventory" className="text-sm font-medium text-ink hover:text-clay transition-colors">
                  Inventory
                </Link>
              }
              flush
            >
              <ul className="divide-y divide-line">
                {lowStock.map((v) => {
                  const available = Math.max(0, (v.stock || 0) - (v.reserved || 0));
                  return (
                    <li key={v.id} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 text-sm">
                      <span className="flex-1 min-w-0 truncate text-ink">
                        {v.product?.title || 'Product'}{' '}
                        <span className="text-ink-muted">
                          · {[v.color, v.size].filter(Boolean).join(' / ') || v.sku}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'font-semibold tabular-nums shrink-0',
                          available === 0 ? 'text-danger' : 'text-warning'
                        )}
                      >
                        {available}
                      </span>
                    </li>
                  );
                })}
                {lowStock.length === 0 && (
                  <li className="px-5 py-6 text-sm text-ink-muted">No low-stock variants.</li>
                )}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
