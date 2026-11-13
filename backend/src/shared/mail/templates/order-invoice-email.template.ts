export type OrderInvoiceEmailItem = {
  title: string;
  color?: string | null;
  size?: string | null;
  sku?: string | null;
  qty: number;
  price: number;
};

export type OrderInvoiceEmailPayload = {
  storeName?: string | null;
  storeLogoUrl?: string | null;
  storeTagline?: string | null;
  storePhone?: string | null;
  storeWhatsapp?: string | null;
  storeEmail?: string | null;
  storeAddress?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  orderNumber: string;
  orderDate?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  shippingMethod?: string | null;
  courier?: string | null;
  tracking?: string | null;
  fulfillmentStatus?: string | null;
  shippingAddress: {
    name?: string | null;
    phone?: string | null;
    line1?: string | null;
    area?: string | null;
    district?: string | null;
  };
  items: OrderInvoiceEmailItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
};

function money(amount: number) {
  const n = Math.round(Number(amount) || 0);
  return `৳${Math.abs(n).toLocaleString('en-IN')}`;
}

function esc(value: unknown) {
  const text =
    typeof value === 'string'
      ? value
      : typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paymentLabel(method?: string | null) {
  const m = (method || '').toUpperCase();
  if (!m) return '';
  if (m === 'COD') return 'Cash on Delivery';
  if (m === 'BKASH') return 'bKash';
  if (m === 'NAGAD') return 'Nagad';
  return method || '';
}

/**
 * Customer invoice email — same layout as storefront PDF invoice.
 * No mock/fallback branding: missing admin values stay blank.
 */
export function buildOrderInvoiceEmailHtml(
  payload: OrderInvoiceEmailPayload,
): string {
  const {
    storeName,
    storeLogoUrl,
    storeTagline,
    storePhone,
    storeWhatsapp,
    storeEmail,
    storeAddress,
    customerName,
    customerEmail,
    orderNumber,
    orderDate,
    paymentMethod,
    paymentStatus,
    shippingMethod,
    courier,
    tracking,
    fulfillmentStatus,
    shippingAddress,
    items,
    subtotal,
    discount,
    shipping,
    total,
  } = payload;

  const brandHtml = storeLogoUrl
    ? `<img src="${esc(storeLogoUrl)}" alt="${esc(storeName || '')}" style="display:block;max-height:56px;max-width:220px;object-fit:contain;" />`
    : storeName
      ? `<div style="font-size:22px;font-weight:700;letter-spacing:-0.3px;">${esc(storeName)}</div>`
      : '';

  const channelLine = [
    storePhone ? `Hotline: ${esc(storePhone)}` : '',
    storeWhatsapp ? `WhatsApp: ${esc(storeWhatsapp)}` : '',
    storeEmail ? `Email: ${esc(storeEmail)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const metaHtml = [storeAddress ? esc(storeAddress) : '', channelLine]
    .filter(Boolean)
    .join('<br/>');

  const itemRows = items
    .map((item, idx) => {
      const meta = [
        item.color ? `Color: ${item.color}` : '',
        item.size ? `Size: ${item.size}` : '',
        item.sku ? `SKU: ${item.sku}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      const lineTotal = Number(item.price) * Number(item.qty);
      return `
        <tr>
          <td style="padding:10px 8px;border:1px solid #e8e4dc;text-align:center;font-size:12px;">${idx + 1}</td>
          <td style="padding:10px 8px;border:1px solid #e8e4dc;">
            <div style="font-weight:600;color:#1a1814;font-size:13px;">${esc(item.title)}</div>
            ${meta ? `<div style="font-size:10px;color:#6b6560;margin-top:2px;font-family:ui-monospace,monospace;">${esc(meta)}</div>` : ''}
          </td>
          <td style="padding:10px 8px;border:1px solid #e8e4dc;text-align:center;font-size:12px;">${Number(item.qty)}</td>
          <td style="padding:10px 8px;border:1px solid #e8e4dc;text-align:right;font-size:12px;">${money(item.price)}</td>
          <td style="padding:10px 8px;border:1px solid #e8e4dc;text-align:right;font-size:12px;font-weight:600;">${money(lineTotal)}</td>
        </tr>`;
    })
    .join('');

  const shipName = shippingAddress.name || customerName || '';
  const shipPhone = shippingAddress.phone || '';
  const district = (shippingAddress.district || '').trim();
  const zone = district
    ? district.toLowerCase() === 'dhaka'
      ? 'Inside Dhaka (ঢাকার মধ্যে)'
      : 'Outside Dhaka (ঢাকার বাইরে)'
    : '';

  const paid = String(paymentStatus || '').toUpperCase() === 'PAID';
  const isCod = String(paymentMethod || '').toUpperCase() === 'COD';
  const methodText = paymentLabel(paymentMethod);

  const deliveryBits = [
    zone ? `<div>Zone: <strong>${esc(zone)}</strong></div>` : '',
    shippingMethod
      ? `<div>Method: <strong>${esc(shippingMethod)}</strong></div>`
      : '',
    courier ? `<div>Courier: <strong>${esc(courier)}</strong></div>` : '',
    tracking
      ? `<div style="font-size:11px;color:#6b6560;">Tracking: ${esc(tracking)}</div>`
      : '',
    fulfillmentStatus
      ? `<div style="font-size:11px;color:#6b6560;">Fulfillment: ${esc(String(fulfillmentStatus).toUpperCase())}</div>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${esc(orderNumber)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Georgia,'Times New Roman',serif;color:#1a1814;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;">
          <tr>
            <td style="padding:8px 8px 16px;border-bottom:2px solid #1a1814;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:top;">
                    ${brandHtml}
                    ${storeTagline ? `<div style="font-size:12px;color:#6b6560;margin-top:4px;font-family:Arial,sans-serif;">${esc(storeTagline)}</div>` : ''}
                    ${metaHtml ? `<div style="font-size:11px;color:#4b5563;margin-top:10px;line-height:1.5;font-family:Arial,sans-serif;">${metaHtml}</div>` : ''}
                  </td>
                  <td style="vertical-align:top;text-align:right;font-family:Arial,sans-serif;">
                    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#6b6560;">INVOICE</div>
                    ${orderNumber ? `<div style="font-size:16px;font-weight:700;margin-top:6px;font-family:ui-monospace,monospace;">ORDER #${esc(orderNumber)}</div>` : ''}
                    ${orderDate ? `<div style="font-size:11px;color:#6b6560;margin-top:2px;">${esc(orderDate)}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 8px;font-family:Arial,sans-serif;">
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;background:#f7f4ee;border:1px solid #e8e4dc;border-radius:4px;">
                <tr>
                  <td width="50%" style="vertical-align:top;padding:14px;">
                    <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#6b6560;margin-bottom:8px;">Bill / Ship to</div>
                    ${shipName ? `<div style="font-size:13px;font-weight:600;">${esc(shipName)}</div>` : ''}
                    ${shipPhone ? `<div style="font-size:12px;">Phone: <strong>${esc(shipPhone)}</strong></div>` : ''}
                    ${shippingAddress.line1 ? `<div style="font-size:12px;">${esc(shippingAddress.line1)}</div>` : ''}
                    ${
                      shippingAddress.area || shippingAddress.district
                        ? `<div style="font-size:11px;color:#6b6560;">${esc(
                            [shippingAddress.area, shippingAddress.district]
                              .filter(Boolean)
                              .join(', '),
                          )}</div>`
                        : ''
                    }
                    ${customerEmail ? `<div style="font-size:11px;color:#6b6560;">Email: ${esc(customerEmail)}</div>` : ''}
                  </td>
                  <td width="50%" style="vertical-align:top;padding:14px;">
                    <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#6b6560;margin-bottom:8px;">Delivery</div>
                    <div style="font-size:13px;line-height:1.6;">${deliveryBits || '—'}</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-family:Arial,sans-serif;">
                <thead>
                  <tr style="background:#f7f4ee;">
                    <th align="center" style="padding:10px 8px;font-size:10px;letter-spacing:0.8px;text-transform:uppercase;color:#6b6560;border:1px solid #e8e4dc;">#</th>
                    <th align="left" style="padding:10px 8px;font-size:10px;letter-spacing:0.8px;text-transform:uppercase;color:#6b6560;border:1px solid #e8e4dc;">Product</th>
                    <th align="center" style="padding:10px 8px;font-size:10px;letter-spacing:0.8px;text-transform:uppercase;color:#6b6560;border:1px solid #e8e4dc;">Qty</th>
                    <th align="right" style="padding:10px 8px;font-size:10px;letter-spacing:0.8px;text-transform:uppercase;color:#6b6560;border:1px solid #e8e4dc;">Price</th>
                    <th align="right" style="padding:10px 8px;font-size:10px;letter-spacing:0.8px;text-transform:uppercase;color:#6b6560;border:1px solid #e8e4dc;">Total</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
              </table>

              <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;font-family:Arial,sans-serif;">
                <tr>
                  <td width="52%" style="vertical-align:top;padding-right:12px;">
                    <div style="border:1px solid #e8e4dc;border-radius:4px;padding:12px;background:#f7f4ee;">
                      <div style="font-size:10px;letter-spacing:0.8px;text-transform:uppercase;color:#6b6560;margin-bottom:6px;">Payment</div>
                      ${methodText ? `<div style="font-size:13px;">Method: <strong>${esc(methodText)}</strong></div>` : ''}
                      <div style="margin-top:8px;">
                        ${
                          paid
                            ? `<span style="display:block;width:100%;box-sizing:border-box;padding:8px 10px;border-radius:4px;font-size:12px;font-weight:700;text-align:center;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;">✓ PAID IN FULL</span>`
                            : isCod
                              ? `<span style="display:block;width:100%;box-sizing:border-box;padding:8px 10px;border-radius:4px;font-size:12px;font-weight:700;text-align:center;background:#fef3c7;color:#b45309;border:1px solid #fde68a;">COD DUE: ${money(total)}</span>`
                              : paymentStatus
                                ? `<span style="display:block;width:100%;box-sizing:border-box;padding:8px 10px;border-radius:4px;font-size:12px;font-weight:700;text-align:center;background:#fef3c7;color:#b45309;border:1px solid #fde68a;">${esc(String(paymentStatus).toUpperCase())}</span>`
                                : ''
                        }
                      </div>
                    </div>
                  </td>
                  <td width="48%" style="vertical-align:top;font-size:13px;color:#3d3a35;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:4px 0;">Subtotal</td>
                        <td align="right" style="padding:4px 0;">${money(subtotal)}</td>
                      </tr>
                      ${
                        discount > 0
                          ? `<tr>
                              <td style="padding:4px 0;color:#15803d;">Discount</td>
                              <td align="right" style="padding:4px 0;color:#15803d;">−${money(discount)}</td>
                            </tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding:4px 0;">Delivery</td>
                        <td align="right" style="padding:4px 0;">${shipping === 0 ? 'Free' : money(shipping)}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 0;border-top:2px solid #1a1814;font-size:15px;font-weight:700;color:#1a1814;">Total</td>
                        <td align="right" style="padding:10px 0 0;border-top:2px solid #1a1814;font-size:15px;font-weight:700;color:#1a1814;">${money(total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
