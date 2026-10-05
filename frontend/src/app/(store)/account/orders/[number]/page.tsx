'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronLeftIcon,
  DownloadIcon,
  ExternalLinkIcon,
  RotateCcwIcon,
  XCircleIcon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { OrderProgress } from '@/components/store/shared';
import {
  orderStatusMeta,
  paymentMethodLabel,
  paymentStatusMeta,
} from '@/utils/status';
import { formatBDT, formatDate, formatDateTime } from '@/utils/format';

interface OrderDetailPageProps {
  params: Promise<{ number: string }>;
}

export default function AccountOrderDetailPage({ params }: OrderDetailPageProps) {
  const { number } = use(params);
  const { orders, cancelOrder, returns } = useStore();
  const order = orders.find((o) => o.number === number);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!order) {
    return (
      <p className="text-sm text-ink-muted">
        Order not found.{' '}
        <Link href="/account/orders" className="underline">
          Back to orders
        </Link>
      </p>
    );
  }

  const canCancel = ['pending_payment', 'confirmed', 'processing'].includes(order.status);
  const canReturn = order.status === 'delivered';
  const existingReturn = returns.find((r) => r.orderNumber === order.number);
  const visibleNotes = order.notes.filter((n) => !n.internal);

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden /> All orders
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Order {order.number}</h1>
          <p className="mt-1 text-sm text-ink-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.success(`Invoice ${order.number}.pdf downloaded`)}
          >
            <DownloadIcon className="h-4 w-4" aria-hidden /> Invoice
          </Button>
          {canReturn && !existingReturn && (
            <Button size="sm" href={`/account/orders/${order.number}/return`}>
              <RotateCcwIcon className="h-4 w-4" aria-hidden /> Return or exchange
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmCancel(true)}
            >
              <XCircleIcon className="h-4 w-4" aria-hidden /> Cancel order
            </Button>
          )}
        </div>
      </div>

      <section className="mt-8 rounded-lg border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge tone={orderStatusMeta[order.status].tone} dot>
            {orderStatusMeta[order.status].label}
          </Badge>
          {order.tracking && (
            <p className="flex items-center gap-2 text-sm">
              {order.courier}: <span className="font-mono">{order.tracking}</span>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-1 font-medium underline"
              >
                Track <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden />
              </a>
            </p>
          )}
        </div>
        <div className="mt-6">
          <OrderProgress order={order} />
        </div>
        {existingReturn && (
          <p className="mt-6 rounded-md bg-subtle px-4 py-3 text-sm">
            Return {existingReturn.id} is in progress.{' '}
            <Link href="/account/returns" className="font-medium underline">
              View status
            </Link>
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-line bg-surface">
          <h2 className="border-b border-line px-6 py-4 text-sm font-semibold">Items</h2>
          <ul className="divide-y divide-line px-6">
            {order.items.map((i) => (
              <li key={i.variantId} className="flex items-center gap-4 py-4">
                <img
                  src={i.image}
                  alt=""
                  className="h-20 rounded object-cover"
                  style={{ width: 60 }}
                />
                <div className="flex-1 text-sm">
                  <p className="font-medium">{i.title}</p>
                  <p className="text-xs text-ink-muted">
                    {i.color} · {i.size} · Qty {i.qty}
                  </p>
                  {order.status === 'delivered' && (
                    <Link
                      href={`/products/${i.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}#reviews`}
                      className="mt-1 inline-block text-xs underline"
                    >
                      Write a review
                    </Link>
                  )}
                </div>
                <span className="text-sm tabular-nums">{formatBDT(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-line px-6 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd>{formatBDT(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
                <dd>−{formatBDT(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-muted">Delivery & fees</dt>
              <dd>{order.shipping ? formatBDT(order.shipping) : 'Free'}</dd>
            </div>
            <div className="flex justify-between pt-1 font-semibold">
              <dt>Total</dt>
              <dd>{formatBDT(order.total)}</dd>
            </div>
            {order.refunded > 0 && (
              <div className="flex justify-between text-ink-muted">
                <dt>Refunded</dt>
                <dd>−{formatBDT(order.refunded)}</dd>
              </div>
            )}
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-line bg-surface p-5 text-sm">
            <h2 className="font-semibold">Delivery</h2>
            <p className="mt-2">
              {order.shippingAddress.name} · {order.shippingAddress.phone}
            </p>
            <p className="text-ink-muted">
              {order.shippingAddress.line1}, {order.shippingAddress.area},{' '}
              {order.shippingAddress.district}
            </p>
            <p className="mt-2 text-ink-muted">{order.shippingMethod}</p>
          </section>
          <section className="rounded-lg border border-line bg-surface p-5 text-sm">
            <h2 className="font-semibold">Payment</h2>
            <p className="mt-2 flex items-center gap-2">
              <PaymentMark method={order.paymentMethod} />{' '}
              {paymentMethodLabel[order.paymentMethod]}
            </p>
            <div className="mt-2">
              <Badge tone={paymentStatusMeta[order.paymentStatus].tone}>
                {paymentStatusMeta[order.paymentStatus].label}
              </Badge>
            </div>
          </section>
          <section className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">Activity</h2>
            <ol className="mt-3 space-y-3 border-l border-line pl-4">
              {order.timeline.map((t, i) => (
                <li key={i} className="relative text-sm">
                  <span
                    className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${
                      i === 0 ? 'bg-ink' : 'bg-line-strong'
                    }`}
                    aria-hidden
                  />
                  <p>{t.label}</p>
                  <p className="text-xs text-ink-muted">{formatDate(t.at)}</p>
                </li>
              ))}
            </ol>
            {visibleNotes.map((n, i) => (
              <p key={i} className="mt-3 rounded bg-subtle p-2 text-xs">
                {n.text}
              </p>
            ))}
          </section>
        </div>
      </div>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this order?"
        description={
          order.paymentStatus === 'paid'
            ? `We’ll refund ${formatBDT(order.total)} to your ${
                paymentMethodLabel[order.paymentMethod]
              } account within 3–7 days.`
            : 'Your order will be cancelled and nothing will be charged.'
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
              Keep order
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                cancelOrder(order.id, 'Customer');
                setConfirmCancel(false);
                toast.success('Order cancelled');
              }}
            >
              Cancel order
            </Button>
          </>
        }
      />
    </div>
  );
}
