import { formatBDT, formatDateTime } from '@/utils/format';
import type { Order } from '@/types/commerce';
import type { Tenant } from '@/types/tenant';

function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type InvoiceStoreInfo = {
  name: string;
  logoUrl?: string | null;
  tagline?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
};

/** Only live admin/store values — never invent mock defaults. */
export function resolveInvoiceStore(tenant?: Tenant | null): InvoiceStoreInfo {
  return {
    name: (tenant?.name || '').trim(),
    logoUrl: (tenant?.logoUrl || '').trim() || null,
    tagline: (tenant?.tagline || '').trim() || null,
    phone: (tenant?.contact?.phone || '').trim() || null,
    whatsapp: (tenant?.contact?.whatsapp || '').trim() || null,
    email: (tenant?.contact?.email || '').trim() || null,
    address: (tenant?.contact?.address || '').trim() || null,
  };
}

function brandBlockHtml(store: InvoiceStoreInfo) {
  const logo = store.logoUrl;
  const name = store.name;
  if (logo) {
    return `<img src="${esc(logo)}" alt="${esc(name)}" class="brand-logo" />`;
  }
  if (name) {
    return `<div class="brand-name">${esc(name)}</div>`;
  }
  return '';
}

function contactMetaHtml(store: InvoiceStoreInfo) {
  const lines: string[] = [];
  if (store.address) lines.push(esc(store.address));
  const channels = [
    store.phone ? `Hotline: ${esc(store.phone)}` : '',
    store.whatsapp ? `WhatsApp: ${esc(store.whatsapp)}` : '',
    store.email ? `Email: ${esc(store.email)}` : '',
  ].filter(Boolean);
  if (channels.length) lines.push(channels.join(' · '));
  if (!lines.length) return '';
  return `<div class="store-meta">${lines.join('<br />')}</div>`;
}

/** Shared invoice HTML used for PDF download (exact layout for email too). */
export function buildOrderInvoiceHtml(order: Order, store: InvoiceStoreInfo): string {
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

  const paymentMethodLabel =
    order.paymentMethod === 'cod'
      ? 'Cash on Delivery'
      : order.paymentMethod === 'bkash'
        ? 'bKash'
        : order.paymentMethod === 'nagad'
          ? 'Nagad'
          : order.paymentMethod
            ? String(order.paymentMethod).toUpperCase()
            : '';

  const shipName = order.shippingAddress?.name || order.customerName || '';
  const shipPhone = order.shippingAddress?.phone || order.phone || '';

  const itemRows = order.items
    .map((item, idx) => {
      const meta = [
        item.color ? `Color: ${item.color}` : '',
        item.size ? `Size: ${item.size}` : '',
        item.sku ? `SKU: ${item.sku}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      return `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>
          <div class="item-title">${esc(item.title)}</div>
          ${meta ? `<div class="item-sku">${esc(meta)}</div>` : ''}
        </td>
        <td class="text-center">${item.qty}</td>
        <td class="text-right">${formatBDT(item.price)}</td>
        <td class="text-right"><strong>${formatBDT(item.price * item.qty)}</strong></td>
      </tr>`;
    })
    .join('');

  const deliveryRows = [
    zone ? `<p>Zone: <strong>${esc(zone)}</strong></p>` : '',
    order.shippingMethod
      ? `<p>Method: <strong>${esc(order.shippingMethod)}</strong></p>`
      : '',
    order.courier ? `<p>Courier: <strong>${esc(order.courier)}</strong></p>` : '',
    order.tracking
      ? `<p class="subtext">Tracking: ${esc(order.tracking)}</p>`
      : '',
    order.fulfillmentStatus
      ? `<p class="subtext">Fulfillment: ${esc(String(order.fulfillmentStatus).toUpperCase())}</p>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <title>Invoice${order.number ? ` - ${esc(order.number)}` : ''}</title>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Georgia, "Times New Roman", serif;
        color: #1a1814;
        background: #fff;
        padding: 28px;
        font-size: 13px;
        line-height: 1.5;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #1a1814;
        padding-bottom: 16px;
        margin-bottom: 20px;
        gap: 16px;
      }
      .brand-logo {
        display: block;
        max-height: 56px;
        max-width: 220px;
        object-fit: contain;
      }
      .brand-name {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.4px;
      }
      .brand-tagline { font-size: 12px; color: #6b6560; margin-top: 4px; font-family: Arial, sans-serif; }
      .store-meta { font-size: 11px; color: #4b5563; margin-top: 8px; line-height: 1.45; font-family: Arial, sans-serif; }
      .invoice-title { text-align: right; font-family: Arial, sans-serif; flex-shrink: 0; }
      .invoice-badge {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.4px;
        text-transform: uppercase;
        color: #6b6560;
      }
      .order-number {
        font-family: ui-monospace, monospace;
        font-size: 16px;
        font-weight: 700;
        margin-top: 6px;
      }
      .order-date { font-size: 11px; color: #6b6560; margin-top: 2px; }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 24px;
        background: #f7f4ee;
        border: 1px solid #e8e4dc;
        border-radius: 4px;
        padding: 14px;
        font-family: Arial, sans-serif;
      }
      .info-block h4 {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #6b6560;
        margin-bottom: 6px;
      }
      .info-block p { font-size: 12px; margin-bottom: 2px; }
      .info-block .subtext { font-size: 11px; color: #6b6560; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: Arial, sans-serif; }
      th, td { border: 1px solid #e8e4dc; padding: 10px 12px; text-align: left; }
      th {
        background: #f7f4ee;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #4b5563;
      }
      td { font-size: 12px; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .item-title { font-weight: 600; }
      .item-sku { font-size: 10px; color: #6b6560; font-family: ui-monospace, monospace; margin-top: 2px; }
      .summary-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
        font-family: Arial, sans-serif;
      }
      .payment-box {
        width: 48%;
        border: 1px solid #e8e4dc;
        border-radius: 4px;
        padding: 12px;
        background: #f7f4ee;
      }
      .payment-title {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #6b6560;
        margin-bottom: 6px;
      }
      .payment-status-tag {
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 8px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 700;
        margin-top: 8px;
        text-align: center;
      }
      .paid-tag { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
      .cod-tag { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
      .financial-table { width: 46%; border: none; margin: 0; }
      .financial-table td { border: none; padding: 4px 0; }
      .total-row {
        border-top: 2px solid #1a1814 !important;
        font-size: 15px;
        font-weight: 800;
        padding-top: 8px !important;
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
        ${brandBlockHtml(store)}
        ${store.tagline ? `<div class="brand-tagline">${esc(store.tagline)}</div>` : ''}
        ${contactMetaHtml(store)}
      </div>
      <div class="invoice-title">
        <div class="invoice-badge">INVOICE</div>
        ${order.number ? `<div class="order-number">ORDER #${esc(order.number)}</div>` : ''}
        ${order.createdAt ? `<div class="order-date">${esc(formatDateTime(order.createdAt))}</div>` : ''}
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h4>Bill / Ship to</h4>
        ${shipName ? `<p><strong>${esc(shipName)}</strong></p>` : ''}
        ${shipPhone ? `<p>Phone: <strong>${esc(shipPhone)}</strong></p>` : ''}
        ${order.shippingAddress?.line1 ? `<p>${esc(order.shippingAddress.line1)}</p>` : ''}
        ${
          order.shippingAddress?.area || order.shippingAddress?.district
            ? `<p class="subtext">${esc(
                [order.shippingAddress?.area, order.shippingAddress?.district]
                  .filter(Boolean)
                  .join(', ')
              )}</p>`
            : ''
        }
        ${order.email ? `<p class="subtext">Email: ${esc(order.email)}</p>` : ''}
      </div>
      <div class="info-block">
        <h4>Delivery</h4>
        ${deliveryRows || '<p class="subtext">—</p>'}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px;" class="text-center">#</th>
          <th>Product</th>
          <th class="text-center" style="width:80px;">Qty</th>
          <th class="text-right" style="width:110px;">Price</th>
          <th class="text-right" style="width:120px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="summary-container">
      <div class="payment-box">
        <div class="payment-title">Payment</div>
        ${paymentMethodLabel ? `<p>Method: <strong>${esc(paymentMethodLabel)}</strong></p>` : ''}
        ${
          isManualMfs
            ? `${senderNumber ? `<p style="font-size:11px;margin-top:4px;">Sender: <strong>${esc(senderNumber)}</strong></p>` : ''}
               ${trxId ? `<p style="font-size:11px;">TrxID: <strong style="font-family:monospace;">${esc(trxId)}</strong></p>` : ''}`
            : ''
        }
        <div>
          ${
            isPaid
              ? `<span class="payment-status-tag paid-tag">✓ PAID IN FULL</span>`
              : isCod
                ? `<span class="payment-status-tag cod-tag">COD DUE: ${formatBDT(order.total)}</span>`
                : order.paymentStatus
                  ? `<span class="payment-status-tag cod-tag">${esc(String(order.paymentStatus).toUpperCase())}</span>`
                  : ''
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
            ? `<tr>
                <td style="color:#15803d;">Discount</td>
                <td class="text-right" style="color:#15803d;">−${formatBDT(order.discount)}</td>
              </tr>`
            : ''
        }
        <tr>
          <td>Delivery</td>
          <td class="text-right">${order.shipping === 0 ? 'Free' : formatBDT(order.shipping)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td class="text-right">${formatBDT(order.total)}</td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
}

/** Generate and download a real PDF invoice (no print dialog). */
export async function downloadOrderInvoicePdf(
  order: Order,
  store: InvoiceStoreInfo
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const html = buildOrderInvoiceHtml(order, store);
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '794px';
  host.style.background = '#ffffff';
  host.style.zIndex = '-1';
  host.style.padding = '28px';
  host.style.color = '#1a1814';
  host.style.fontFamily = 'Georgia, "Times New Roman", serif';
  host.style.fontSize = '13px';
  host.style.lineHeight = '1.5';

  if (styleMatch?.[1]) {
    const styleEl = document.createElement('style');
    styleEl.textContent = styleMatch[1];
    host.appendChild(styleEl);
  }
  const content = document.createElement('div');
  content.innerHTML = bodyMatch?.[1] || html;
  host.appendChild(content);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    const fileName = order.number
      ? `invoice-${order.number}.pdf`
      : `invoice-${Date.now()}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(host);
  }
}
