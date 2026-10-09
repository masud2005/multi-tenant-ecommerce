'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Printer,
  Copy,
  Truck,
  Banknote,
  RotateCcw,
  XCircle,
  Mail,
  Phone,
  Lock,
  Eye,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Tag,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useAdmin } from '@/contexts/AdminContext';
import { orderService } from '@/services/order-service';
import { couriers } from '@/data/shipping';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { OrderProgress } from '@/components/dashboard/shared/OrderProgress';
import {
  fulfillmentMeta,
  nextFulfillmentStatus,
  orderStatusMeta,
  paymentMethodLabel,
  paymentStatusMeta,
} from '@/utils/status';
import { formatBDT, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types/commerce';

const actionLabel: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Confirm order',
  processing: 'Start processing',
  packed: 'Mark as packed',
  shipped: 'Create shipment',
  out_for_delivery: 'Mark out for delivery',
  delivered: 'Mark as delivered',
};

const eventLabel: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Order confirmed by staff',
  processing: 'Picking & processing started',
  packed: 'Packed and ready for pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered to customer',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { orders: storeOrders, customers, setOrderStatus, refundOrder, markCodCollected, cancelOrder, returns } = useStore();
  const { actor, can } = useAdmin();

  // Local state for backend order
  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [note, setNote] = useState('');
  const [internal, setInternal] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const [shipOpen, setShipOpen] = useState(false);
  const [ship, setShip] = useState({ courier: 'Pathao', tracking: '', notify: true });
  const [refundOpen, setRefundOpen] = useState(false);
  const [refund, setRefund] = useState({ amount: '', reason: 'Customer request', restock: true });
  const [refundError, setRefundError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reauth, setReauth] = useState('');

  // Fetch live order from backend
  const fetchOrderDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await orderService.getOwnerOrderDetail(id);
      if (res?.data) {
        setLiveOrder(res.data);
      } else {
        const fallback = storeOrders.find((o) => o.id === id || o.number === id);
        setLiveOrder(fallback || null);
      }
    } catch (err) {
      console.warn('Backend order fetch failed, using client store:', err);
      const fallback = storeOrders.find((o) => o.id === id || o.number === id);
      setLiveOrder(fallback || null);
    } finally {
      setIsLoading(false);
    }
  }, [id, storeOrders]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const order = liveOrder || storeOrders.find((o) => o.id === id || o.number === id);

  if (isLoading && !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-clay mb-3" />
        <p className="text-sm text-ink-muted">Loading order details from store backend...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full py-16 text-center">
        <p className="text-base font-medium text-ink">Order not found</p>
        <p className="text-xs text-ink-muted mt-1">Could not find order with identifier "{id}"</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-sm font-medium text-clay hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === order.customerId);
  const next = order.status === 'pending_payment' ? 'confirmed' : nextFulfillmentStatus(order.status);
  const canUpdate = can('orders', 'update');
  const refundable = order.total - order.refunded;
  const isPaid = ['paid', 'partially_refunded', 'partially_paid'].includes(order.paymentStatus);
  const relatedReturn = returns.find((r) => r.orderNumber === order.number);
  const codPending = order.paymentMethod === 'cod' && !order.codCollected && ['out_for_delivery', 'delivered'].includes(order.status);

  // Mark payment as paid and confirm order
  const handleMarkPaid = async () => {
    try {
      setIsUpdating(true);
      const res = await orderService.updateOwnerOrderStatus(order.id, {
        status: (order.status === 'pending_payment' ? 'CONFIRMED' : order.status).toUpperCase() as any,
        paymentStatus: 'PAID',
        note: 'Payment marked as received by admin',
      });

      if (res?.data) {
        setLiveOrder(res.data);
      } else {
        setOrderStatus(order.id, 'confirmed', {
          label: 'Payment marked as received by admin',
          by: actor,
        });
      }
      toast.success('Payment marked as paid & order confirmed');
      fetchOrderDetail();
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        toast.error(fieldErrors.map((e: any) => `${e.field}: ${e.message}`).join(' | '));
      } else {
        toast.error(err?.response?.data?.message || err.message || 'Failed to update payment status');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Advance fulfillment/order status
  const advance = async () => {
    if (!next) return;
    if (next === 'shipped') {
      setShip({
        courier: order.courier || 'Pathao',
        tracking: order.tracking || `${(order.courier || 'PA').slice(0, 2).toUpperCase()}${order.number.slice(3)}${Math.floor(Math.random() * 900 + 100)}`,
        notify: true,
      });
      setShipOpen(true);
      return;
    }

    try {
      setIsUpdating(true);
      const label = eventLabel[next] ?? `Order status updated to ${next}`;
      const res = await orderService.updateOwnerOrderStatus(order.id, {
        status: next.toUpperCase() as any,
        note: label,
      });

      if (res?.data) {
        setLiveOrder(res.data);
      } else {
        setOrderStatus(order.id, next, { label, by: actor });
      }

      toast.success(`${order.number}: Marked as ${orderStatusMeta[next]?.label || next}`);
      fetchOrderDetail();
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        toast.error(fieldErrors.map((e: any) => `${e.field}: ${e.message}`).join(' | '));
      } else {
        toast.error(err?.response?.data?.message || err.message || 'Failed to update order status');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Submit courier shipment modal
  const handleConfirmShipment = async () => {
    try {
      setIsUpdating(true);
      const res = await orderService.updateOwnerOrderStatus(order.id, {
        status: 'SHIPPED',
        courier: ship.courier,
        trackingNumber: ship.tracking,
        note: `Dispatched via ${ship.courier} (Tracking: ${ship.tracking})`,
      });

      if (res?.data) {
        setLiveOrder(res.data);
      } else {
        setOrderStatus(order.id, 'shipped', {
          label: `Shipped via ${ship.courier} (${ship.tracking})`,
          by: actor,
          courier: ship.courier,
          tracking: ship.tracking,
        });
      }

      setShipOpen(false);
      toast.success('Shipment created and order status updated to Shipped');
      fetchOrderDetail();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shipment');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add staff note
  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      setIsAddingNote(true);
      await orderService.addOwnerOrderNote(order.id, {
        text: note.trim(),
        internal,
      });

      setNote('');
      toast.success('Order note added successfully');
      fetchOrderDetail();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Mark COD collected
  const handleMarkCodCollected = async () => {
    try {
      setIsUpdating(true);
      const res = await orderService.updateOwnerOrderStatus(order.id, {
        status: order.status,
        paymentStatus: 'PAID',
        note: 'Cash on delivery collected from customer',
      });

      if (res?.data) {
        setLiveOrder(res.data);
      } else {
        markCodCollected(order.id, actor);
      }
      toast.success('Cash on delivery marked as collected');
      fetchOrderDetail();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment status');
    } finally {
      setIsUpdating(false);
    }
  };

  const doRefund = () => {
    const amt = Number(refund.amount);
    if (!amt || amt <= 0) return setRefundError('Enter an amount');
    if (amt > refundable) return setRefundError(`Maximum refundable is ${formatBDT(refundable)}`);
    if (reauth.length < 4) return setRefundError('Confirm your password to issue a refund');
    refundOrder(order.id, amt, actor, refund.reason);
    setRefundOpen(false);
    setReauth('');
    toast.success(`Refund of ${formatBDT(amt)} sent to ${paymentMethodLabel[order.paymentMethod]}`);
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        back={{ href: '/admin/orders', label: 'Orders' }}
        title={order.number}
        meta={
          <div className="flex items-center gap-2">
            <Badge tone={orderStatusMeta[order.status]?.tone || 'neutral'} dot>
              {orderStatusMeta[order.status]?.label || order.status}
            </Badge>
            <Badge tone={paymentStatusMeta[order.paymentStatus]?.tone || 'neutral'}>
              {paymentStatusMeta[order.paymentStatus]?.label || order.paymentStatus}
            </Badge>
            <Badge tone={fulfillmentMeta[order.fulfillmentStatus]?.tone || 'neutral'}>
              {fulfillmentMeta[order.fulfillmentStatus]?.label || order.fulfillmentStatus}
            </Badge>
          </div>
        }
        description={`${formatDateTime(order.createdAt)} · ${order.channel === 'manual' ? 'Created by staff' : 'Online store'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchOrderDetail} disabled={isLoading} className="cursor-pointer">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden /> Refresh
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()} className="cursor-pointer">
              <Printer className="h-4 w-4" aria-hidden /> Print slip
            </Button>
            {isPaid && can('payments', 'refund') && refundable > 0 && (
              <GuardedButton
                module="payments"
                action="refund"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRefund({ amount: String(refundable), reason: 'Customer request', restock: true });
                  setRefundOpen(true);
                }}
              >
                Refund
              </GuardedButton>
            )}
            {codPending && canUpdate && (
              <Button size="sm" onClick={handleMarkCodCollected} disabled={isUpdating} className="cursor-pointer">
                <Banknote className="h-4 w-4" aria-hidden /> Mark COD collected
              </Button>
            )}
            {order.paymentStatus === 'pending' && canUpdate && (
              <Button size="sm" variant="secondary" onClick={handleMarkPaid} disabled={isUpdating} className="cursor-pointer">
                <Banknote className="h-4 w-4" aria-hidden /> Mark as Paid
              </Button>
            )}
            {next && canUpdate && (
              <Button size="sm" onClick={advance} disabled={isUpdating} className="cursor-pointer">
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {actionLabel[next]}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Order Progress Steps */}
          <Panel title="Order progress">
            <OrderProgress order={order} />
          </Panel>

          {/* Items Table */}
          <Panel title={`Items (${order.items.reduce((s, i) => s + i.qty, 0)})`}>
            <div className="divide-y divide-line">
              {order.items.map((i, idx) => (
                <div key={i.variantId || idx} className="flex items-center gap-4 py-3">
                  {i.image ? (
                    <img src={i.image} alt={i.title} className="h-14 w-11 rounded object-cover border border-line" />
                  ) : (
                    <div className="h-14 w-11 rounded bg-canvas border border-line flex items-center justify-center text-xs text-ink-muted">
                      No img
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{i.title}</p>
                    <p className="text-xs text-ink-muted">
                      {(i.color || i.size) ? `${i.color || ''} ${i.size ? `/ ${i.size}` : ''} · ` : ''}SKU: {i.sku || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink tabular-nums">{formatBDT(i.price * i.qty)}</p>
                    <p className="text-xs text-ink-muted tabular-nums">
                      {i.qty} × {formatBDT(i.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial summary */}
            <div className="mt-4 border-t border-line pt-4 text-sm space-y-1.5">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-ink">{formatBDT(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span className="tabular-nums">−{formatBDT(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <span>Shipping ({order.shippingMethod})</span>
                <span className="tabular-nums font-medium text-ink">{formatBDT(order.shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold text-ink">
                <span>Total</span>
                <span className="tabular-nums">{formatBDT(order.total)}</span>
              </div>
              {order.refunded > 0 && (
                <div className="flex justify-between text-xs text-danger pt-1">
                  <span>Refunded</span>
                  <span className="tabular-nums">−{formatBDT(order.refunded)}</span>
                </div>
              )}
            </div>
          </Panel>

          {/* Payment & Attempts */}
          <Panel
            title="Payment"
            description={`${paymentMethodLabel[order.paymentMethod] || order.paymentMethod} · ${paymentStatusMeta[order.paymentStatus]?.label || order.paymentStatus}`}
          >
            {order.attempts && order.attempts.length > 0 ? (
              <ul className="divide-y divide-line text-xs">
                {order.attempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <span className="font-mono text-ink-muted">{a.ref || 'Direct / COD'}</span>
                    <Badge tone={paymentStatusMeta[a.status]?.tone || 'neutral'}>{a.status}</Badge>
                    <span className="font-medium text-ink tabular-nums">{formatBDT(a.amount)}</span>
                    <span className="text-ink-muted">{formatDateTime(a.at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-muted py-1">
                Payment method: <span className="font-medium text-ink uppercase">{order.paymentMethod}</span> ({order.paymentStatus})
              </p>
            )}
            {order.paymentStatus === 'pending' && canUpdate && (
              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                <span className="text-xs text-ink-muted">Awaiting customer payment confirmation.</span>
                <Button size="sm" variant="secondary" onClick={handleMarkPaid} disabled={isUpdating} className="cursor-pointer">
                  <Banknote className="h-3.5 w-3.5" aria-hidden /> Mark as Paid
                </Button>
              </div>
            )}
          </Panel>

          {/* Timeline & Notes */}
          <Panel title="Timeline & notes">
            <div className="mb-4 flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a staff note…"
                className="h-9 flex-1 rounded-md border border-line bg-canvas px-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={isAddingNote || !note.trim()}
                className="cursor-pointer"
              >
                {isAddingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Add note
              </Button>
            </div>

            {/* Notes list */}
            {order.notes && order.notes.length > 0 && (
              <div className="mb-6 space-y-2">
                <p className="text-xs font-semibold text-ink uppercase tracking-wider">Staff Notes</p>
                <div className="space-y-2">
                  {order.notes.map((n, idx) => (
                    <div key={idx} className="rounded-md border border-line bg-canvas p-3 text-xs">
                      <p className="text-ink">{n.text}</p>
                      <p className="mt-1 text-[11px] text-ink-muted">
                        {n.by || 'Admin'} · {formatDateTime(n.at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline history */}
            <ol className="relative border-l border-line pl-4 space-y-4 text-xs">
              {order.timeline && order.timeline.map((e, idx) => (
                <li key={idx} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-ink" />
                  <p className="font-medium text-ink">{e.label}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDateTime(e.at)} {e.by && `· by ${e.by}`}
                  </p>
                  {e.note && <p className="mt-1 rounded bg-canvas p-2 text-ink-soft italic">“{e.note}”</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        {/* Right Sidebar: Customer & Shipping Details */}
        <div className="space-y-6">
          <Panel title="Customer">
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-ink">{order.customerName}</p>
                {order.email && <p className="text-xs text-ink-muted">{order.email}</p>}
                {order.phone && <p className="text-xs text-ink-muted">{order.phone}</p>}
              </div>

              <div className="border-t border-line pt-3">
                <p className="text-xs font-medium text-ink-muted mb-1">Shipping address</p>
                <p className="text-ink font-medium">{order.shippingAddress?.name || order.customerName}</p>
                <p className="text-ink-muted">{order.shippingAddress?.line1}</p>
                <p className="text-ink-muted">
                  {order.shippingAddress?.area ? `${order.shippingAddress.area}, ` : ''}{order.shippingAddress?.district}
                </p>
                {order.shippingAddress?.phone && (
                  <p className="text-xs text-ink-muted mt-1">{order.shippingAddress.phone}</p>
                )}
              </div>

              {order.courier && (
                <div className="border-t border-line pt-3">
                  <p className="text-xs font-medium text-ink-muted mb-1">Courier & Tracking</p>
                  <p className="font-medium text-ink">{order.courier}</p>
                  {order.tracking && <p className="font-mono text-xs text-ink-muted">{order.tracking}</p>}
                </div>
              )}

              {order.customerNote && (
                <div className="border-t border-line pt-3">
                  <p className="text-xs font-medium text-ink-muted mb-1">Customer Note</p>
                  <p className="text-xs text-ink bg-canvas p-2 rounded italic">"{order.customerNote}"</p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Shipment Modal */}
      <Modal open={shipOpen} onClose={() => setShipOpen(false)} title="Create courier shipment">
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-ink">Courier</label>
            <select
              value={ship.courier}
              onChange={(e) => setShip({ ...ship, courier: e.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none"
            >
              {couriers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink">Tracking Number</label>
            <input
              value={ship.tracking}
              onChange={(e) => setShip({ ...ship, tracking: e.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-line bg-surface px-3 text-sm font-mono text-ink focus:outline-none"
              placeholder="e.g. CID-98234190"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShipOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmShipment} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm shipment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Refund Modal */}
      <Modal open={refundOpen} onClose={() => setRefundOpen(false)} title="Issue refund">
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-ink">Refund Amount (max: {formatBDT(refundable)})</label>
            <input
              type="number"
              value={refund.amount}
              onChange={(e) => setRefund({ ...refund, amount: e.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink">Reason</label>
            <input
              value={refund.reason}
              onChange={(e) => setRefund({ ...refund, reason: e.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink">Re-enter staff password to authorize</label>
            <input
              type="password"
              placeholder="••••••••"
              value={reauth}
              onChange={(e) => setReauth(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none"
            />
          </div>
          {refundError && <p className="text-xs text-danger">{refundError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doRefund}>
              Confirm refund
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

