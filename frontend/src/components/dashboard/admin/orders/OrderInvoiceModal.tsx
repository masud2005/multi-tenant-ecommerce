'use client';

import React from 'react';
import { Printer, Download, X, Building, Phone, Mail, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { formatBDT, formatDateTime } from '@/utils/format';
import type { Order } from '@/types/commerce';
import type { Tenant } from '@/types/tenant';

interface OrderInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  order: Order;
  tenant?: Tenant | null;
}

export function OrderInvoiceModal({ open, onClose, order, tenant }: OrderInvoiceModalProps) {
  const storeName = tenant?.name || 'Tanti Fashion';
  const storeTagline = tenant?.tagline || 'Handloom & Contemporary Fashion';
  const storePhone = tenant?.contact?.phone || '09612-826842';
  const storeEmail = tenant?.contact?.email || 'care@tanti.com.bd';
  const storeAddress = tenant?.contact?.address || 'House 14, Road 27 (old), Dhanmondi, Dhaka 1209';

  const isPaid = order.paymentStatus === 'paid';
  const isCod = order.paymentMethod === 'cod';
  const isManualMfs = order.paymentMethod === 'bkash' || order.paymentMethod === 'nagad';
  const latestAttempt = order.attempts?.[0];
  const trxId = latestAttempt?.transactionId || latestAttempt?.ref;
  const senderNumber = latestAttempt?.senderPhone;

  // Print popup window with pure standalone CSS
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cash Memo / Invoice - ${order.number}</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #1f2937;
              background: #fff;
              padding: 24px;
              font-size: 13px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .brand-name {
              font-size: 24px;
              font-weight: 800;
              color: #111827;
              letter-spacing: -0.5px;
            }
            .brand-tagline {
              font-size: 12px;
              color: #6b7280;
              margin-top: 2px;
            }
            .store-meta {
              font-size: 11px;
              color: #4b5563;
              margin-top: 6px;
              line-height: 1.4;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-badge {
              display: inline-block;
              font-size: 16px;
              font-weight: 800;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .order-number {
              font-family: monospace;
              font-size: 14px;
              font-weight: 700;
              color: #2563eb;
              margin-top: 4px;
            }
            .order-date {
              font-size: 11px;
              color: #6b7280;
              margin-top: 2px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 24px;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 14px;
            }
            .info-block h4 {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: #4b5563;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .info-block p {
              font-size: 12px;
              color: #111827;
              margin-bottom: 2px;
            }
            .info-block .subtext {
              font-size: 11px;
              color: #6b7280;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px 12px;
              text-align: left;
            }
            th {
              background: #f3f4f6;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #374151;
            }
            td {
              font-size: 12px;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .item-title { font-weight: 600; color: #111827; }
            .item-sku { font-size: 10px; color: #6b7280; font-family: monospace; }
            .summary-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 10px;
              margin-bottom: 24px;
            }
            .payment-box {
              width: 48%;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 12px;
              background: #f9fafb;
            }
            .payment-title {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: #4b5563;
              margin-bottom: 6px;
            }
            .payment-status-tag {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 700;
              margin-top: 4px;
            }
            .paid-tag { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
            .cod-tag { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
            .financial-table {
              width: 46%;
              border: none;
              margin: 0;
            }
            .financial-table td {
              border: none;
              padding: 4px 0;
            }
            .total-row {
              border-top: 2px solid #111827 !important;
              font-size: 15px;
              font-weight: 800;
              color: #111827;
              padding-top: 8px !important;
            }
            .footer-note {
              border-top: 1px dashed #d1d5db;
              padding-top: 16px;
              margin-top: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 11px;
              color: #6b7280;
            }
            .signature-box {
              text-align: center;
              border-top: 1px solid #9ca3af;
              width: 160px;
              padding-top: 4px;
              font-size: 11px;
              color: #374151;
            }
            @media print {
              body { padding: 0; }
              @page { margin: 10mm; size: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand-name">${storeName}</div>
              <div class="brand-tagline">${storeTagline}</div>
              <div class="store-meta">
                ${storeAddress}<br />
                Hotline: ${storePhone} · Email: ${storeEmail}
              </div>
            </div>
            <div class="invoice-title">
              <div class="invoice-badge">CASH MEMO / চালান</div>
              <div class="order-number">ORDER #${order.number}</div>
              <div class="order-date">${formatDateTime(order.createdAt)}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <h4>DELIVERY DESTINATION / গ্রাহক তথ্য</h4>
              <p><strong>${order.shippingAddress.name || order.customerName || 'Customer'}</strong></p>
              <p>Phone: <strong>${order.shippingAddress.phone || order.phone || 'N/A'}</strong></p>
              <p>${order.shippingAddress.line1 || ''}</p>
              <p class="subtext">${order.shippingAddress.area ? order.shippingAddress.area + ', ' : ''}${order.shippingAddress.district || 'Dhaka'}</p>
            </div>
            <div class="info-block">
              <h4>DISPATCH & SHIPPING / ডেলিভারি</h4>
              <p>Shipping Zone: <strong>${(order.shippingAddress.district || '').toLowerCase() === 'dhaka' ? 'Inside Dhaka (ঢাকার মধ্যে)' : 'Outside Dhaka (ঢাকার বাইরে)'}</strong></p>
              <p>Courier Provider: <strong>${order.courier || 'Pathao / Steadfast'}</strong></p>
              <p>Tracking Number: <strong>${order.tracking || 'Pending Dispatch'}</strong></p>
              <p class="subtext">Fulfillment Status: ${order.fulfillmentStatus.toUpperCase()}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">#</th>
                <th>Product Description</th>
                <th class="text-center" style="width: 80px;">Qty</th>
                <th class="text-right" style="width: 110px;">Price</th>
                <th class="text-right" style="width: 120px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td>
                    <div class="item-title">${item.title}</div>
                    <div class="item-sku">
                      ${item.color ? 'Color: ' + item.color + ' · ' : ''}
                      ${item.size ? 'Size: ' + item.size + ' · ' : ''}
                      SKU: ${item.sku || 'N/A'}
                    </div>
                  </td>
                  <td class="text-center">${item.qty}</td>
                  <td class="text-right">${formatBDT(item.price)}</td>
                  <td class="text-right"><strong>${formatBDT(item.price * item.qty)}</strong></td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>

          <div class="summary-container">
            <div class="payment-box">
              <div class="payment-title">PAYMENT DETAILS / মূল্য পরিশোধ বিবরণ</div>
              <p>Method: <strong>${order.paymentMethod.toUpperCase()} (${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Direct Send Money'})</strong></p>
              ${
                isManualMfs
                  ? `
                <p style="font-size: 11px; margin-top: 4px;">Sender Mobile: <strong>${senderNumber || 'N/A'}</strong></p>
                <p style="font-size: 11px;">Transaction ID (TrxID): <strong style="font-family: monospace;">${trxId || 'N/A'}</strong></p>
              `
                  : ''
              }
              <div style="margin-top: 8px;">
                ${
                  isPaid
                    ? `<span class="payment-status-tag paid-tag">✓ PAID IN FULL / সম্পূর্ণ পরিশোধিত</span>`
                    : `<span class="payment-status-tag cod-tag">⚠️ COD DUE: COLLECT ${formatBDT(order.total)}</span>`
                }
              </div>
            </div>

            <table class="financial-table">
              <tr>
                <td>Subtotal</td>
                <td class="text-right">${formatBDT(order.subtotal)}</td>
              </tr>
              ${
                order.discount > 0
                  ? `
                <tr style="color: #15803d;">
                  <td>Discount ${order.couponCode ? '(' + order.couponCode + ')' : ''}</td>
                  <td class="text-right">−${formatBDT(order.discount)}</td>
                </tr>
              `
                  : ''
              }
              <tr>
                <td>Delivery Charge (${order.shippingAddress.district || 'Standard'})</td>
                <td class="text-right">${formatBDT(order.shipping)}</td>
              </tr>
              <tr class="total-row">
                <td>Total Payable (সর্বমোট)</td>
                <td class="text-right">${formatBDT(order.total)}</td>
              </tr>
            </table>
          </div>

          <div class="footer-note">
            <div>
              <p>Thank you for choosing ${storeName}! For queries, please contact our helpline: ${storePhone}.</p>
              <p style="margin-top: 2px;">This is a computer-generated memo and does not require an ink seal.</p>
            </div>
            <div class="signature-box">
              Authorized Signature / Courier Receiver
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Order Cash Memo / Invoice #${order.number}`}>
      <div className="space-y-6 py-2">
        {/* Actions Bar */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Badge tone={isPaid ? 'success' : 'warning'}>
              {isPaid ? 'PAID / পরিশোধিত' : 'COD / সংগ্রহযোগ্য'}
            </Badge>
            <span className="text-xs text-ink-muted">Standard Courier Packing Slip Format</span>
          </div>
          <Button size="sm" onClick={handlePrint} className="cursor-pointer bg-ink text-canvas hover:bg-ink/90">
            <Printer className="h-4 w-4 mr-1.5" /> Print Cash Memo / Invoice
          </Button>
        </div>

        {/* Invoice Preview Card */}
        <div className="rounded-lg border border-line bg-surface p-5 text-ink space-y-5 shadow-xs">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink">{storeName}</h2>
              <p className="text-xs text-ink-muted">{storeTagline}</p>
              <p className="text-xs text-ink-soft mt-1">
                {storeAddress} · Hotline: <b className="text-ink">{storePhone}</b>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded bg-subtle px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-ink">
                Cash Memo / চালান
              </span>
              <p className="font-mono text-sm font-bold text-clay mt-1">#{order.number}</p>
              <p className="text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>

          {/* Customer & Shipping Summary Grid */}
          <div className="grid gap-4 sm:grid-cols-2 rounded-md bg-canvas p-3.5 border border-line text-xs">
            <div>
              <p className="font-semibold text-ink uppercase tracking-wider text-[11px] mb-1">
                Customer / প্রাপকের বিবরণ
              </p>
              <p className="font-medium text-ink text-sm">
                {order.shippingAddress.name || order.customerName || 'Customer'}
              </p>
              <p className="text-ink-soft font-mono">
                Phone: <span className="font-semibold text-ink">{order.shippingAddress.phone || order.phone || 'N/A'}</span>
              </p>
              <p className="text-ink-muted mt-1">{order.shippingAddress.line1}</p>
              <p className="text-ink-muted">
                {order.shippingAddress.area ? order.shippingAddress.area + ', ' : ''}
                {order.shippingAddress.district || 'Dhaka'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-ink uppercase tracking-wider text-[11px] mb-1">
                Shipping & Delivery
              </p>
              <p className="text-ink-soft">
                Zone:{' '}
                <span className="font-medium text-ink">
                  {(order.shippingAddress.district || '').toLowerCase() === 'dhaka'
                    ? 'Inside Dhaka (ঢাকার মধ্যে)'
                    : 'Outside Dhaka (ঢাকার বাইরে)'}
                </span>
              </p>
              <p className="text-ink-soft">
                Courier:{' '}
                <span className="font-medium text-ink">{order.courier || 'Standard Courier'}</span>
              </p>
              <p className="text-ink-soft">
                Tracking:{' '}
                <span className="font-mono font-medium text-ink">{order.tracking || 'Pending'}</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-line">
              <thead className="bg-subtle text-ink font-semibold">
                <tr>
                  <th className="p-2.5 border-b border-line w-8 text-center">#</th>
                  <th className="p-2.5 border-b border-line">Product Item</th>
                  <th className="p-2.5 border-b border-line text-center w-16">Qty</th>
                  <th className="p-2.5 border-b border-line text-right w-24">Price</th>
                  <th className="p-2.5 border-b border-line text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 text-center text-ink-muted">{idx + 1}</td>
                    <td className="p-2.5">
                      <p className="font-medium text-ink">{item.title}</p>
                      <p className="text-[11px] text-ink-muted">
                        {item.color && `Color: ${item.color} · `}
                        {item.size && `Size: ${item.size} · `}
                        SKU: {item.sku || 'N/A'}
                      </p>
                    </td>
                    <td className="p-2.5 text-center font-medium">{item.qty}</td>
                    <td className="p-2.5 text-right tabular-nums">{formatBDT(item.price)}</td>
                    <td className="p-2.5 text-right tabular-nums font-semibold">{formatBDT(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financials & Status */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="w-full sm:w-1/2 rounded-md bg-canvas p-3 border border-line text-xs space-y-1.5">
              <p className="font-semibold text-ink uppercase tracking-wider text-[11px]">
                Payment Status / পরিশোধের তথ্য
              </p>
              <p className="text-ink-soft">
                Method: <b className="text-ink uppercase">{order.paymentMethod} ({order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Send Money'})</b>
              </p>
              {isManualMfs && (
                <>
                  <p className="text-ink-soft font-mono">
                    Sender: <span className="font-medium text-ink">{senderNumber || 'N/A'}</span>
                  </p>
                  <p className="text-ink-soft font-mono">
                    TrxID: <span className="font-semibold text-ink">{trxId || 'N/A'}</span>
                  </p>
                </>
              )}
              <div className="pt-1">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 text-emerald-700 px-2 py-1 font-semibold text-xs border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" /> PAID IN FULL (পরিশোধিত)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded bg-amber-50 text-amber-800 px-2.5 py-1 font-bold text-xs border border-amber-200">
                    <Clock className="h-3.5 w-3.5" /> COD DUE: COLLECT {formatBDT(order.total)}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full sm:w-1/3 text-xs space-y-1.5">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal:</span>
                <span className="tabular-nums font-medium text-ink">{formatBDT(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="tabular-nums">−{formatBDT(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-muted">
                <span>Delivery Charge:</span>
                <span className="tabular-nums font-medium text-ink">{formatBDT(order.shipping)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-ink pt-1.5 text-sm font-bold text-ink">
                <span>Total Payable:</span>
                <span className="tabular-nums text-base">{formatBDT(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="ml-2 bg-ink text-canvas hover:bg-ink/90">
            <Printer className="h-4 w-4 mr-1.5" /> Print Now
          </Button>
        </div>
      </div>
    </Modal>
  );
}
