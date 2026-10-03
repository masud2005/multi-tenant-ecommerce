'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, ChevronRight, Package, RotateCcw, AlertTriangle, Star, CreditCard } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useAdmin } from '@/contexts/AdminContext';
import { roleMeta } from '@/data/admin';
import { kpis, salesSeries } from '@/data/analytics';
import { Panel } from '@/components/dashboard/shared/Panel';
import { Badge } from '@/components/ui/Badge';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { orderStatusMeta } from '@/utils/status';
import { formatBDT, formatCompactBDT, formatNumber, timeAgo } from '@/utils/format';
import { available } from '@/utils/pricing';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth';

type Range = '7d' | '30d';

export default function AdminDashboardPage() {
  const { orders, returns, reviews, products } = useStore();
  const { role, can } = useAdmin();
  const [userName, setUserName] = useState<string>('');
  const [range, setRange] = useState<Range>('30d');
  const series = range === '7d' ? salesSeries.slice(-4) : salesSeries;
  const total = series.reduce((s, d) => s + d.sales, 0);
  const prev = series.reduce((s, d) => s + d.prev, 0);
  const change = ((total - prev) / prev) * 100;
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

  const toFulfill = orders.filter((o) => ['confirmed', 'processing'].includes(o.status));
  const toShip = orders.filter((o) => o.status === 'packed');
  const pendingReturns = returns.filter((r) => r.status === 'requested' || r.status === 'received');
  const pendingReviews = reviews.filter((r) => r.status === 'pending');
  const unpaid = orders.filter((o) => o.status === 'pending_payment' || o.paymentStatus === 'failed');
  const lowStock = products
    .flatMap((p) => p.variants.filter((v) => !p.preorder && available(v) <= 3).map((v) => ({ p, v })))
    .sort((a, b) => available(a.v) - available(b.v))
    .slice(0, 5);
  const top = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);

  const me = roleMeta[role] ?? roleMeta.owner;

  const todos = [
    { label: 'Orders to fulfill', count: toFulfill.length, to: '/admin/orders?tab=unfulfilled', icon: Package, show: can('orders') },
    { label: 'Packed, awaiting courier', count: toShip.length, to: '/admin/orders?tab=packed', icon: Package, show: can('orders') },
    { label: 'Returns to review', count: pendingReturns.length, to: '/admin/returns', icon: RotateCcw, show: can('returns') },
    { label: 'Payments needing attention', count: unpaid.length, to: '/admin/orders?tab=unpaid', icon: CreditCard, show: can('orders') },
    { label: 'Reviews to moderate', count: pendingReviews.length, to: '/admin/reviews', icon: Star, show: can('reviews') },
  ].filter((t) => t.show);

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Good morning, {userName || me.person.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Here’s what’s happening at Tanti today · {todayFormatted}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {showMoney ? (
          <Panel className="lg:col-span-2" flush>
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
              <div>
                <p className="text-sm text-ink-muted">Net sales</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-ink tabular-nums">{formatBDT(total)}</p>
                <p className="mt-1 flex items-center gap-1 text-sm">
                  <span className="inline-flex items-center font-medium text-success">
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    {change.toFixed(1)}%
                  </span>
                  <span className="text-ink-muted">vs previous period</span>
                </p>
              </div>
              <div className="flex rounded-md border border-line p-0.5 text-xs" role="group" aria-label="Date range">
                {(['7d', '30d'] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    className={cn(
                      'whitespace-nowrap rounded px-2.5 py-1 cursor-pointer transition-colors',
                      range === r ? 'bg-ink text-canvas font-medium' : 'text-ink-muted hover:text-ink'
                    )}
                  >
                    {r === '7d' ? 'Last 7 days' : 'Last 30 days'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 px-2 pb-2 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'rgb(var(--ink-muted))' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'rgb(var(--ink-muted))' }}
                    tickFormatter={(v) => formatCompactBDT(v)}
                    width={56}
                  />
                  <Tooltip
                    formatter={(v: any, n: any) => [formatBDT(Number(v)), n === 'sales' ? 'This period' : 'Previous period']}
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
                ['Orders', formatNumber(kpis.orders)],
                ['Avg. order value', formatBDT(kpis.aov)],
                ['Conversion', `${kpis.conversionRate}%`],
                ['Returning customers', `${kpis.returningRate}%`],
              ].map(([l, v], i) => (
                <div
                  key={l}
                  className={cn(
                    'px-5 py-3.5',
                    i > 0 && 'sm:border-l sm:border-line',
                    i % 2 === 1 && 'border-l border-line'
                  )}
                >
                  <dt className="text-xs text-ink-muted">{l}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ) : (
          <Panel className="lg:col-span-2" title="Your queue" description="Sales figures are hidden for your role.">
            <p className="text-3xl font-semibold text-ink">{toFulfill.length + toShip.length} orders</p>
            <p className="mt-1 text-sm text-ink-muted">need picking, packing or handover today</p>
          </Panel>
        )}

        <Panel title="Needs your attention" flush>
          <ul className="divide-y divide-line">
            {todos.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.label}>
                  <Link href={t.to} className="flex items-center gap-3 px-5 py-3.5 hover:bg-canvas transition-colors">
                    <Icon className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
                    <span className="flex-1 text-sm text-ink">{t.label}</span>
                    <span
                      className={cn(
                        'min-w-[28px] rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums',
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
          className="lg:col-span-2"
          title="Recent orders"
          actions={
            <Link href="/admin/orders" className="text-sm font-medium text-ink hover:text-clay transition-colors">
              View all
            </Link>
          }
          flush
        >
          <ul className="divide-y divide-line">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-canvas transition-colors sm:grid-cols-[110px_1fr_auto_auto_90px]"
                >
                  <span className="text-sm font-medium text-ink">{o.number}</span>
                  <span className="text-right text-sm tabular-nums text-ink font-medium sm:order-4">
                    {formatBDT(o.total)}
                  </span>
                  <span className="truncate text-sm text-ink-soft sm:order-1">
                    {o.customerName} <span className="text-ink-muted">· {timeAgo(o.createdAt)}</span>
                  </span>
                  <span className="hidden sm:order-2 sm:block">
                    <PaymentMark method={o.paymentMethod} />
                  </span>
                  <span className="sm:order-3">
                    <Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          {showMoney && (
            <Panel title="Top products · 30 days" flush>
              <ol className="divide-y divide-line">
                {top.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="w-4 text-xs text-ink-muted tabular-nums">{i + 1}</span>
                    <img src={p.images[0]} alt="" className="h-9 w-7 rounded object-cover" />
                    <span className="flex-1 truncate text-sm text-ink">{p.title}</span>
                    <span className="text-xs text-ink-muted tabular-nums">{p.sold} sold</span>
                  </li>
                ))}
              </ol>
            </Panel>
          )}
          {can('inventory') && (
            <Panel
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
                {lowStock.map(({ p, v }) => (
                  <li key={v.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                    <span className="flex-1 truncate text-ink">
                      {p.title} <span className="text-ink-muted">· {v.color} / {v.size}</span>
                    </span>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        available(v) === 0 ? 'text-danger' : 'text-warning'
                      )}
                    >
                      {available(v)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
