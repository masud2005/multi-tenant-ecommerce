'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { orderService } from '@/services/order-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { DataTable, type Column } from '@/components/dashboard/shared/DataTable';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { EmptyState } from '@/components/ui/EmptyState';
import { paymentMethodLabel, paymentStatusMeta } from '@/utils/status';
import { formatBDT, formatDateTime } from '@/utils/format';
import type { Order, PaymentMethod, PaymentStatus } from '@/types/commerce';

const MANUAL_METHODS: PaymentMethod[] = ['bkash', 'nagad', 'cod'];

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

function attemptRef(order: Order): string {
  const attempt = order.attempts?.[0];
  if (!attempt) return '—';
  if (attempt.transactionId) return attempt.transactionId;
  if (attempt.senderPhone) return attempt.senderPhone;
  return attempt.ref || '—';
}

function buildTxns(orders: Order[]): Txn[] {
  const list: Txn[] = [];
  for (const o of orders) {
    if (o.paymentMethod === 'bkash' || o.paymentMethod === 'nagad') {
      const attempt = o.attempts?.[0];
      list.push({
        id: attempt?.id || `mfs-${o.id}`,
        orderId: o.id,
        orderNumber: o.number,
        customer: o.customerName || o.email || '—',
        method: o.paymentMethod,
        ref: attemptRef(o),
        amount: attempt?.amount ?? o.total,
        status: (attempt?.status || o.paymentStatus) as PaymentStatus,
        at: attempt?.at || o.createdAt,
      });
    } else if (o.paymentMethod === 'cod') {
      list.push({
        id: `cod-${o.id}`,
        orderId: o.id,
        orderNumber: o.number,
        customer: o.customerName || o.email || '—',
        method: 'cod',
        ref: o.codCollected
          ? `${o.courier || 'Courier'} remittance`
          : 'Awaiting collection',
        amount: o.total,
        status: o.codCollected || o.paymentStatus === 'paid' ? 'paid' : 'pending',
        at: o.createdAt,
      });
    }

    if (o.refunded > 0) {
      list.push({
        id: `rf-${o.id}`,
        orderId: o.id,
        orderNumber: o.number,
        customer: o.customerName || o.email || '—',
        method: o.paymentMethod,
        ref: `Refund · ${o.number}`,
        amount: -o.refunded,
        status: 'refunded',
        at: o.updatedAt || o.createdAt,
      });
    }
  }
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

function buildPaymentsCsv(txns: Txn[]) {
  const headers = [
    'Date',
    'Order',
    'Customer',
    'Method',
    'Reference',
    'Amount',
    'Status',
  ];
  const rows = [headers.join(',')];
  for (const t of txns) {
    rows.push(
      [
        `"${formatDateTime(t.at)}"`,
        `"${t.orderNumber}"`,
        `"${t.customer.replace(/"/g, '""')}"`,
        `"${paymentMethodLabel[t.method] || t.method}"`,
        `"${String(t.ref).replace(/"/g, '""')}"`,
        `"${t.amount}"`,
        `"${t.status}"`,
      ].join(','),
    );
  }
  return rows.join('\n');
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<'all' | PaymentMethod>('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const pageSize = 100;
      let page = 1;
      let totalPages = 1;
      const all: Order[] = [];
      while (page <= totalPages) {
        const res = await orderService.getOwnerOrders({ page, limit: pageSize });
        const batch = res?.data?.orders;
        if (!Array.isArray(batch)) {
          throw new Error(res?.message || 'Could not load payments');
        }
        all.push(...batch);
        totalPages = Math.max(1, Number(res?.data?.pagination?.totalPages) || 1);
        if (batch.length === 0) break;
        page += 1;
        if (page > 50) break;
      }
      setOrders(all);
    } catch (err: any) {
      setOrders([]);
      toast.error(err?.message || 'Could not load payment records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const txns = useMemo(() => buildTxns(orders), [orders]);
  const rows = txns.filter((t) => method === 'all' || t.method === method);

  const summary = MANUAL_METHODS.map((g) => {
    const t = txns.filter((x) => x.method === g);
    const paid = t.filter((x) => x.status === 'paid');
    const pending = t.filter((x) => x.status === 'pending' || x.status === 'failed');
    return {
      g,
      volume: paid.reduce((s, x) => s + Math.max(0, x.amount), 0),
      count: paid.length,
      pendingCount: pending.length,
      pendingCod:
        g === 'cod'
          ? orders
              .filter(
                (o) =>
                  o.paymentMethod === 'cod' &&
                  !o.codCollected &&
                  !['cancelled', 'failed'].includes(o.status),
              )
              .reduce((s, o) => s + o.total, 0)
          : 0,
    };
  });

  const columns: Column<Txn>[] = [
    {
      key: 'at',
      header: 'Date',
      render: (t) => (
        <span className="text-ink-muted">{formatDateTime(t.at)}</span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (t) => (
        <Link
          href={`/admin/orders/${t.orderId}`}
          className="font-medium text-ink hover:underline"
        >
          {t.orderNumber}
        </Link>
      ),
    },
    {
      key: 'cust',
      header: 'Customer',
      render: (t) => <span className="text-ink">{t.customer}</span>,
      hideOnMobile: true,
    },
    {
      key: 'method',
      header: 'Method',
      render: (t) => (
        <span className="flex items-center gap-2">
          <PaymentMark method={t.method} />
          <span className="text-ink">{paymentMethodLabel[t.method]}</span>
        </span>
      ),
    },
    {
      key: 'ref',
      header: 'Reference / TrxID',
      render: (t) => (
        <span className="font-mono text-xs text-ink-muted">{t.ref}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'amt',
      header: 'Amount',
      align: 'right',
      render: (t) => (
        <span
          className={
            t.amount < 0
              ? 'text-danger font-medium tabular-nums'
              : 'font-medium text-ink tabular-nums'
          }
        >
          {formatBDT(t.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <Badge tone={paymentStatusMeta[t.status]?.tone || 'neutral'}>
          {paymentStatusMeta[t.status]?.label || t.status}
        </Badge>
      ),
    },
  ];

  const handleExport = () => {
    if (rows.length === 0) {
      toast.error('No payment records to export');
      return;
    }
    const csv = buildPaymentsCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${rows.length} payment records`);
  };

  return (
    <ModuleGate module="payments">
      <div className="w-full space-y-6">
        <PageHeader
          title="Payments"
          description="COD collections and manual bKash / Nagad payments from your store orders. No payment gateway."
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchOrders}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  aria-hidden
                />
                Refresh
              </Button>
              <GuardedButton
                module="payments"
                action="export"
                variant="secondary"
                size="sm"
                onClick={handleExport}
                disabled={loading || rows.length === 0}
              >
                <Download className="h-4 w-4" aria-hidden /> Export CSV
              </GuardedButton>
            </>
          }
        />

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {summary.map((s) => (
            <div
              key={s.g}
              className="rounded-lg border border-line bg-surface p-3.5"
            >
              <div className="flex items-center justify-between">
                <PaymentMark method={s.g} />
                <span className="text-xs text-ink-muted">{s.count} paid</span>
              </div>
              <p className="mt-2 text-base font-semibold text-ink tabular-nums">
                {formatBDT(s.volume)}
              </p>
              <p className="text-xs text-ink-muted">
                {s.g === 'cod'
                  ? `${formatBDT(s.pendingCod)} still with courier / pending`
                  : `${s.pendingCount} awaiting review`}
              </p>
            </div>
          ))}
        </div>

        <Panel flush>
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <div className="flex flex-wrap gap-1">
              {(['all', ...MANUAL_METHODS] as ('all' | PaymentMethod)[]).map(
                (g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setMethod(g)}
                    className={`rounded-md px-2.5 py-1 text-xs cursor-pointer capitalize transition-colors ${
                      method === g
                        ? 'bg-ink text-canvas font-medium'
                        : 'text-ink-soft hover:bg-subtle'
                    }`}
                  >
                    {g === 'all' ? 'All methods' : paymentMethodLabel[g]}
                  </button>
                ),
              )}
            </div>
            <span className="text-xs text-ink-muted tabular-nums">
              {loading ? 'Loading…' : `${rows.length} records`}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-ink-muted">
              <Loader2 className="h-5 w-5 animate-spin text-clay" />
              <span className="text-xs">Loading payments from database…</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="No payment records"
                description="COD and manual bKash/Nagad transactions from orders will appear here."
              />
            </div>
          ) : (
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
          )}
        </Panel>
      </div>
    </ModuleGate>
  );
}
