'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { formatBDT, formatDateTime } from '@/utils/format';
import {
  downloadOrderInvoicePdf,
  resolveInvoiceStore,
} from '@/utils/order-invoice';
import type { Order } from '@/types/commerce';
import type { Tenant } from '@/types/tenant';

interface OrderInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  order: Order;
  tenant?: Tenant | null;
}

export function OrderInvoiceModal({ open, onClose, order, tenant }: OrderInvoiceModalProps) {
  const store = resolveInvoiceStore(tenant);
  const [loading, setLoading] = useState(false);

  const isPaid = order.paymentStatus === 'paid';
  const isCod = order.paymentMethod === 'cod';
  const isManualMfs = order.paymentMethod === 'bkash' || order.paymentMethod === 'nagad';
  const latestAttempt = order.attempts?.[0];
  const trxId = latestAttempt?.transactionId || latestAttempt?.ref;
  const senderNumber = latestAttempt?.senderPhone;
  const district = (order.shippingAddress?.district || '').trim();
  const zone = district
    ? district.toLowerCase() === 'dhaka'
      ? 'Inside Dhaka (ঢাকার মধ্যে)'
      : 'Outside Dhaka (ঢাকার বাইরে)'
    : '';

  const handleDownloadPdf = async () => {
    try {
      setLoading(true);
      await downloadOrderInvoicePdf(order, store);
    } catch (err) {
      console.error(err);
      toast.error('Could not generate PDF invoice');
    } finally {
      setLoading(false);
    }
  };

  const channelLine = [
    store.phone ? `Hotline: ${store.phone}` : '',
    store.whatsapp ? `WhatsApp: ${store.whatsapp}` : '',
    store.email ? `Email: ${store.email}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Modal open={open} onClose={onClose} title={`Invoice #${order.number}`}>
      <div className="space-y-6 py-2">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <Badge tone={isPaid ? 'success' : 'warning'}>
            {isPaid ? 'PAID' : isCod ? 'COD' : String(order.paymentStatus || '').toUpperCase()}
          </Badge>
          <Button
            size="sm"
            loading={loading}
            disabled={loading}
            onClick={handleDownloadPdf}
            className="cursor-pointer bg-ink text-canvas hover:bg-ink/90"
          >
            <Download className="h-4 w-4 mr-1.5" /> Download PDF invoice
          </Button>
        </div>

        <div className="rounded-lg border border-line bg-surface p-5 text-ink space-y-5 shadow-xs">
          <div className="flex items-start justify-between border-b border-line pb-4 gap-4">
            <div>
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt={store.name || 'Store logo'}
                  className="mb-2 max-h-14 max-w-[220px] object-contain"
                />
              ) : store.name ? (
                <h2 className="text-xl font-bold tracking-tight text-ink">{store.name}</h2>
              ) : null}
              {store.tagline ? (
                <p className="text-xs text-ink-muted">{store.tagline}</p>
              ) : null}
              {store.address ? (
                <p className="text-xs text-ink-soft mt-1">{store.address}</p>
              ) : null}
              {channelLine ? (
                <p className="text-xs text-ink-soft mt-0.5">{channelLine}</p>
              ) : null}
            </div>
            <div className="text-right">
              <span className="inline-block rounded bg-subtle px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-ink">
                Tax Invoice / চালান
              </span>
              {order.number ? (
                <p className="font-mono text-sm font-bold text-clay mt-1">#{order.number}</p>
              ) : null}
              {order.createdAt ? (
                <p className="text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 rounded-md bg-canvas p-3.5 border border-line text-xs">
            <div>
              <p className="font-semibold text-ink uppercase tracking-wider text-[11px] mb-1">
                Bill / Ship to
              </p>
              {(order.shippingAddress?.name || order.customerName) && (
                <p className="font-medium text-ink text-sm">
                  {order.shippingAddress?.name || order.customerName}
                </p>
              )}
              {(order.shippingAddress?.phone || order.phone) && (
                <p className="text-ink-soft font-mono">
                  Phone:{' '}
                  <span className="font-semibold text-ink">
                    {order.shippingAddress?.phone || order.phone}
                  </span>
                </p>
              )}
              {order.shippingAddress?.line1 ? (
                <p className="text-ink-muted mt-1">{order.shippingAddress.line1}</p>
              ) : null}
              {(order.shippingAddress?.area || order.shippingAddress?.district) && (
                <p className="text-ink-muted">
                  {[order.shippingAddress?.area, order.shippingAddress?.district]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
            <div>
              <p className="font-semibold text-ink uppercase tracking-wider text-[11px] mb-1">
                Delivery
              </p>
              {zone ? (
                <p className="text-ink-soft">
                  Zone: <span className="font-medium text-ink">{zone}</span>
                </p>
              ) : null}
              {order.shippingMethod ? (
                <p className="text-ink-soft">
                  Method: <span className="font-medium text-ink">{order.shippingMethod}</span>
                </p>
              ) : null}
              {order.courier ? (
                <p className="text-ink-soft">
                  Courier: <span className="font-medium text-ink">{order.courier}</span>
                </p>
              ) : null}
              {order.tracking ? (
                <p className="text-ink-soft">
                  Tracking:{' '}
                  <span className="font-mono font-medium text-ink">{order.tracking}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-line">
              <thead className="bg-subtle text-ink font-semibold">
                <tr>
                  <th className="p-2 border-b border-line w-8 text-center">#</th>
                  <th className="p-2 border-b border-line">Product</th>
                  <th className="p-2 border-b border-line text-center w-16">Qty</th>
                  <th className="p-2 border-b border-line text-right w-24">Price</th>
                  <th className="p-2 border-b border-line text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={`${item.variantId || item.productId}-${idx}`} className="border-b border-line">
                    <td className="p-2 text-center text-ink-muted">{idx + 1}</td>
                    <td className="p-2">
                      <p className="font-medium text-ink">{item.title}</p>
                      <p className="text-[10px] text-ink-muted font-mono">
                        {[
                          item.color ? `Color: ${item.color}` : '',
                          item.size ? `Size: ${item.size}` : '',
                          item.sku ? `SKU: ${item.sku}` : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </td>
                    <td className="p-2 text-center">{item.qty}</td>
                    <td className="p-2 text-right tabular-nums">{formatBDT(item.price)}</td>
                    <td className="p-2 text-right font-medium tabular-nums">
                      {formatBDT(item.price * item.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="rounded-md border border-line bg-canvas p-3 text-xs sm:w-[48%]">
              <p className="font-semibold uppercase tracking-wider text-[11px] text-ink-muted mb-1">
                Payment
              </p>
              <p className="text-ink">
                Method:{' '}
                <strong>
                  {order.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : order.paymentMethod === 'bkash'
                      ? 'bKash'
                      : order.paymentMethod === 'nagad'
                        ? 'Nagad'
                        : String(order.paymentMethod || '').toUpperCase()}
                </strong>
              </p>
              {isManualMfs && senderNumber ? (
                <p className="text-ink-soft mt-1">Sender: <strong>{senderNumber}</strong></p>
              ) : null}
              {isManualMfs && trxId ? (
                <p className="text-ink-soft">
                  TrxID: <strong className="font-mono">{trxId}</strong>
                </p>
              ) : null}
              <div className="mt-2">
                {isPaid ? (
                  <Badge tone="success">PAID IN FULL</Badge>
                ) : isCod ? (
                  <Badge tone="warning">COD DUE: {formatBDT(order.total)}</Badge>
                ) : order.paymentStatus ? (
                  <Badge tone="warning">{String(order.paymentStatus).toUpperCase()}</Badge>
                ) : null}
              </div>
            </div>

            <dl className="space-y-1 text-sm sm:w-[46%]">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd>{formatBDT(order.subtotal)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-success">
                  <dt>Discount</dt>
                  <dd>−{formatBDT(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery</dt>
                <dd>{order.shipping === 0 ? 'Free' : formatBDT(order.shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatBDT(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Modal>
  );
}
