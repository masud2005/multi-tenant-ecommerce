'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Download, RefreshCw } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { DataTable, type Column } from '@/components/dashboard/shared/DataTable';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { Badge } from '@/components/ui/Badge';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { paymentMethodLabel, paymentStatusMeta } from '@/utils/status';
import { formatBDT, formatDateTime } from '@/utils/format';
import type { PaymentMethod, PaymentStatus } from '@/types/commerce';

interface Txn {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: string;
  method: PaymentMethod;
  ref: string;
  amount: number;
  status: PaymentStatus;
  at: string;
}

export default function PaymentsPage() {
  const { orders } = useStore();
  const [method, setMethod] = useState<'all' | PaymentMethod>('all');

  const txns = useMemo<Txn[]>(() => {
    const list: Txn[] = [];
    orders.forEach((o) => {
      o.attempts.forEach((a) =>
        list.push({
          id: a.id,
          orderId: o.id,
          orderNumber: o.number,
          customer: o.customerName,
          method: a.method,
          ref: a.ref,
          amount: a.amount,
          status: a.status,
          at: a.at,
        })
      );
      if (o.paymentMethod === 'cod' && o.codCollected)
        list.push({
          id: `cod-${o.id}`,
          orderId: o.id,
          orderNumber: o.number,
          customer: o.customerName,
          method: 'cod',
          ref: `${o.courier ?? 'Courier'} remittance`,
          amount: o.total,
          status: 'paid',
          at: o.timeline[0]?.at || o.createdAt,
        });
      if (o.refunded > 0)
        list.push({
          id: `rf-${o.id}`,
          orderId: o.id,
          orderNumber: o.number,
          customer: o.customerName,
          method: o.paymentMethod,
          ref: `RFND-${o.number.slice(3)}`,
          amount: -o.refunded,
          status: 'refunded',
          at: o.timeline[0]?.at || o.createdAt,
        });
    });
    return list.sort((a, b) => b.at.localeCompare(a.at));
  }, [orders]);

  const rows = txns.filter((t) => method === 'all' || t.method === method);
  const gateways: PaymentMethod[] = ['bkash', 'nagad', 'sslcommerz', 'stripe', 'cod'];
  const summary = gateways.map((g) => {
    const t = txns.filter((x) => x.method === g);
    const paid = t.filter((x) => x.status === 'paid');
    const failed = t.filter((x) => x.status === 'failed').length;
    const hasOutcomes = paid.length + failed > 0;
    return {
      g,
      volume: paid.reduce((s, x) => s + x.amount, 0),
      count: paid.length,
      successRate: hasOutcomes ? Math.round((paid.length / (paid.length + failed)) * 100) : null,
      pending:
        g === 'cod'
          ? orders
              .filter((o) => o.paymentMethod === 'cod' && !o.codCollected && !['cancelled', 'failed'].includes(o.status))
              .reduce((s, o) => s + o.total, 0)
          : 0
    };
  });

  const columns: Column<Txn>[] = [
    { key: 'at', header: 'Date', render: (t) => <span className="text-ink-muted">{formatDateTime(t.at)}</span> },
    {
      key: 'order',
      header: 'Order',
      render: (t) => (
        <Link href={`/admin/orders/${t.orderId}`} className="font-medium text-ink hover:underline">
          {t.orderNumber}
        </Link>
      )
    },
    { key: 'cust', header: 'Customer', render: (t) => <span className="text-ink">{t.customer}</span>, hideOnMobile: true },
    {
      key: 'gw',
      header: 'Gateway',
      render: (t) => (
        <span className="flex items-center gap-2">
          <PaymentMark method={t.method} />
          <span className="text-ink">{paymentMethodLabel[t.method]}</span>
        </span>
      )
    },
    {
      key: 'ref',
      header: 'Transaction ID',
      render: (t) => <span className="font-mono text-xs text-ink-muted">{t.ref}</span>,
      hideOnMobile: true
    },
    {
      key: 'amt',
      header: 'Amount',
      align: 'right',
      render: (t) => (
        <span className={t.amount < 0 ? 'text-danger font-medium tabular-nums' : 'font-medium text-ink tabular-nums'}>
          {formatBDT(t.amount)}
        </span>
      )
    },
    { key: 'status', header: 'Status', render: (t) => <Badge tone={paymentStatusMeta[t.status].tone}>{t.status}</Badge> },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Payments & payouts"
        description="Transactions across all connected gateways. Automatic daily settlement via BEFTN / RTGS."
        actions={
          <>
            <GuardedButton
              module="payments"
              action="export"
              variant="secondary"
              size="sm"
              onClick={() => toast.message('Payment export is not available yet')}
            >
              <Download className="h-4 w-4" aria-hidden /> Export
            </GuardedButton>
            <GuardedButton
              module="payments"
              action="update"
              size="sm"
              onClick={() => toast.message('Gateway sync is not available yet')}
            >
              <RefreshCw className="h-4 w-4" aria-hidden /> Sync gateways
            </GuardedButton>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-5">
        {summary.map((s) => (
          <div key={s.g} className="rounded-lg border border-line bg-surface p-3.5">
            <div className="flex items-center justify-between">
              <PaymentMark method={s.g} />
              <span className="text-xs text-ink-muted">{s.count} txn</span>
            </div>
            <p className="mt-2 text-base font-semibold text-ink tabular-nums">{formatBDT(s.volume)}</p>
            <p className="text-xs text-ink-muted">
              {s.g === 'cod'
                ? `৳${(s.pending / 1000).toFixed(0)}k in courier hands`
                : s.successRate === null
                  ? '— success rate'
                  : `${s.successRate}% success rate`}
            </p>
          </div>
        ))}
      </div>

      <Panel flush>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex flex-wrap gap-1">
            {(['all', ...gateways] as (PaymentMethod | 'all')[]).map((g) => (
              <button
                key={g}
                onClick={() => setMethod(g)}
                className={`rounded-md px-2.5 py-1 text-xs cursor-pointer capitalize transition-colors ${
                  method === g ? 'bg-ink text-canvas font-medium' : 'text-ink-soft hover:bg-subtle'
                }`}
              >
                {g === 'all' ? 'All gateways' : paymentMethodLabel[g]}
              </button>
            ))}
          </div>
          <span className="text-xs text-ink-muted tabular-nums">{rows.length} records</span>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      </Panel>
    </div>
  );
}
