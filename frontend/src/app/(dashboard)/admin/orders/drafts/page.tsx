'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Loader2,
  RefreshCw,
  Eye,
  UserPlus,
  Users,
  CheckCircle2,
  CreditCard,
  Building,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { orderService } from '@/services/order-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { variantPrice, available } from '@/utils/pricing';
import { formatBDT, formatDateTime } from '@/utils/format';
import { districts, areasByDistrict } from '@/data/shipping';
import type { Order, PaymentMethod } from '@/types/commerce';

interface DraftLine {
  productId: string;
  variantId: string;
  qty: number;
}

export default function DraftOrdersPage() {
  const { products, customers } = useStore();

  // Backend live drafts state
  const [liveDrafts, setLiveDrafts] = useState<Order[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State: Products & Lines
  const [q, setQ] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);

  // Form State: Customer Info
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLine1, setNewLine1] = useState('');
  const [newDistrict, setNewDistrict] = useState('Dhaka');
  const [newArea, setNewArea] = useState(areasByDistrict['Dhaka']?.[0] || 'Dhanmondi');

  const handleDistrictChange = (d: string) => {
    setNewDistrict(d);
    const thanas = areasByDistrict[d] || [];
    setNewArea(thanas[0] || '');
  };

  // Form State: Financials & Notes
  const [discount, setDiscount] = useState('');
  const [shipping, setShipping] = useState('70');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [wholesale, setWholesale] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [staffNote, setStaffNote] = useState('');

  // Fetch real draft orders from backend
  const fetchDrafts = useCallback(async () => {
    try {
      setIsLoadingDrafts(true);
      const res = await orderService.getDraftOrders();
      if (res?.data?.drafts) {
        setLiveDrafts(res.data.drafts);
      }
    } catch (err) {
      console.warn('Could not load draft orders from backend:', err);
    } finally {
      setIsLoadingDrafts(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  // Selected existing customer details
  const selectedCustomer = customers.find((c) => c.id === customerId) || customers[0];
  const isB2B = customerMode === 'existing' && selectedCustomer?.segment === 'Wholesale';

  // Search product matches
  const matches =
    q.trim().length > 0
      ? products
          .filter((p) => p.title.toLowerCase().includes(q.trim().toLowerCase()) || p.brand.toLowerCase().includes(q.trim().toLowerCase()))
          .slice(0, 6)
      : [];

  // Detailed lines calculation
  const detailed = lines
    .map((l) => {
      const p = products.find((x) => x.id === l.productId);
      if (!p) return null;
      const v = p.variants.find((x) => x.id === l.variantId) || p.variants[0];
      const base = variantPrice(v);
      const tier = isB2B && wholesale ? (l.qty >= 20 ? 0.7 : l.qty >= 10 ? 0.8 : 0.9) : 1;
      return {
        ...l,
        p,
        v,
        unit: Math.round(base * tier),
        tier,
      };
    })
    .filter(Boolean) as Array<{
    productId: string;
    variantId: string;
    qty: number;
    p: (typeof products)[0];
    v: (typeof products)[0]['variants'][0];
    unit: number;
    tier: number;
  }>;

  const subtotal = detailed.reduce((s, l) => s + l.unit * l.qty, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(shipping || 0));

  // Add product line
  const addLine = (pid: string) => {
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    const v = p.variants.find((x) => available(x) > 0) || p.variants[0];
    setLines((ls) => [...ls, { productId: pid, variantId: v?.id || '', qty: isB2B ? 5 : 1 }]);
    setQ('');
  };

  // Submit Draft Order
  const finalize = async () => {
    if (!lines.length) {
      toast.error('Please add at least one product to the draft');
      return;
    }

    // Resolve customer information
    let resolvedName = '';
    let resolvedPhone = '';
    let resolvedEmail = '';
    let resolvedAddress = {
      name: '',
      phone: '',
      line1: '',
      area: '',
      district: 'Dhaka',
    };

    if (customerMode === 'existing') {
      if (!selectedCustomer) {
        toast.error('Please select a customer');
        return;
      }
      resolvedName = selectedCustomer.name;
      resolvedPhone = selectedCustomer.phone;
      resolvedEmail = selectedCustomer.email || '';
      resolvedAddress = {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        line1: 'Standard delivery address',
        area: selectedCustomer.district || 'Dhaka',
        district: selectedCustomer.district || 'Dhaka',
      };
    } else {
      if (!newName.trim()) {
        toast.error('Customer name is required');
        return;
      }
      if (!newPhone.trim()) {
        toast.error('Customer mobile phone is required');
        return;
      }
      resolvedName = newName.trim();
      resolvedPhone = newPhone.trim();
      resolvedEmail = newEmail.trim() || '';
      resolvedAddress = {
        name: newName.trim(),
        phone: newPhone.trim(),
        line1: newLine1.trim() || 'Store pick up / Standard address',
        area: newArea.trim() || (areasByDistrict[newDistrict]?.[0] || 'Dhanmondi'),
        district: newDistrict || 'Dhaka',
      };
    }

    const payload = {
      customerId: customerMode === 'existing' ? selectedCustomer?.id : undefined,
      customerName: resolvedName,
      phone: resolvedPhone,
      email: resolvedEmail?.trim() ? resolvedEmail.trim() : undefined,
      shippingAddress: resolvedAddress,
      items: detailed.map((l) => ({
        productId: l.p.id,
        variantId: l.v.id,
        title: l.p.title,
        image: l.p.images[0] || '',
        color: l.v.color,
        size: l.v.size,
        sku: l.v.sku,
        price: l.unit,
        qty: l.qty,
      })),
      shippingFee: Number(shipping || 0),
      discount: Number(discount || 0),
      paymentMethod: 'COD' as const,
      mode: 'invoice' as const,
      customerNote: customerNote.trim() || undefined,
      staffNote: staffNote.trim() || `Manual draft order created by admin`,
    };

    try {
      setIsSubmitting(true);
      const res = await orderService.createDraftOrder(payload);

      if (res?.data) {
        toast.success(`Draft order #${res.data.number} created successfully!`);

        // Reset form
        setLines([]);
        setDiscount('');
        setCustomerNote('');
        setStaffNote('');
        if (customerMode === 'new') {
          setNewName('');
          setNewPhone('');
          setNewEmail('');
          setNewLine1('');
          setNewDistrict('Dhaka');
          setNewArea(areasByDistrict['Dhaka']?.[0] || 'Dhanmondi');
        }

        // Refresh live drafts
        fetchDrafts();
      } else {
        toast.error(res?.message || 'Could not create draft order');
      }
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        const errorMsg = fieldErrors.map((e: any) => `${e.field}: ${e.message}`).join(' | ');
        toast.error(errorMsg);
      } else {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to create draft order');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        back={{ href: '/admin/orders', label: 'Orders' }}
        title="Draft & Manual Orders"
        description="Create phone, Facebook, showroom or wholesale orders and send customer an invoice link."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDrafts}
            disabled={isLoadingDrafts}
            className="cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingDrafts ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Products & Items */}
        <div className="space-y-6">
          <Panel title="Add Products to Order" description="Search catalog and add items with custom sizes and quantities">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products by title or brand (e.g. Jamdani, Kurta, Saree)…"
                aria-label="Search products"
                className="h-10 w-full rounded-md border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
              />
              {matches.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-pop">
                  {matches.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => addLine(p.id)}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-canvas cursor-pointer transition-colors"
                      >
                        <img src={p.images[0]} alt="" className="h-10 w-8 rounded object-cover border border-line" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink truncate">{p.title}</p>
                          <p className="text-xs text-ink-muted">{p.brand} · {formatBDT(p.salePrice || p.price)}</p>
                        </div>
                        <Plus className="h-4 w-4 text-ink-muted hover:text-clay" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {detailed.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon={FileText}
                  title="No items in draft yet"
                  description="Type in the search box above to add Jamdani kurtas, sarees, panjabis or other products."
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {detailed.map((l, idx) => (
                  <li key={`${l.p.id}-${idx}`} className="flex flex-wrap items-center gap-3 py-3.5">
                    <img src={l.p.images[0]} alt="" className="h-14 w-11 rounded object-cover border border-line" />
                    <div className="min-w-[160px] flex-1 text-sm">
                      <p className="font-medium text-ink leading-snug">{l.p.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <select
                          aria-label="Variant"
                          value={l.variantId}
                          onChange={(e) =>
                            setLines((ls) => ls.map((x, i) => (i === idx ? { ...x, variantId: e.target.value } : x)))
                          }
                          className="h-7 rounded border border-line bg-surface px-2 text-xs text-ink focus:outline-none"
                        >
                          {l.p.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.color} / {v.size} ({available(v)} in stock)
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-ink-muted">SKU: {l.v.sku}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-ink-muted">Qty:</label>
                      <input
                        aria-label="Quantity"
                        type="number"
                        min={1}
                        value={l.qty}
                        onChange={(e) =>
                          setLines((ls) =>
                            ls.map((x, i) => (i === idx ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x))
                          )
                        }
                        className="h-8 w-16 rounded border border-line bg-surface px-2 text-center text-sm text-ink focus:outline-none"
                      />
                    </div>
                    <div className="w-24 text-right text-sm">
                      <p className="tabular-nums font-medium text-ink">{formatBDT(l.unit * l.qty)}</p>
                      <p className="text-[11px] text-ink-muted">{l.qty} × {formatBDT(l.unit)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}
                      className="rounded p-1.5 text-ink-muted hover:bg-subtle hover:text-danger cursor-pointer transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Recent Drafts List from Database */}
          <Panel
            title={`Recent Draft Orders (${liveDrafts.length})`}
            description="Previously created draft and manual orders"
            flush
          >
            {isLoadingDrafts ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-clay mb-2" />
                <p className="text-xs text-ink-muted">Loading draft orders…</p>
              </div>
            ) : liveDrafts.length === 0 ? (
              <div className="p-6 text-center text-sm text-ink-muted">
                No draft orders created yet. Use the form above to create your first manual order.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {liveDrafts.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm hover:bg-canvas/50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${d.id}`}
                          className="font-medium text-ink hover:text-clay hover:underline"
                        >
                          {d.number}
                        </Link>
                        <Badge tone={d.status === 'confirmed' ? 'success' : d.status === 'pending_payment' ? 'warning' : 'neutral'}>
                          {d.status === 'pending_payment' ? 'Open Draft' : d.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {d.customerName} · {d.items?.length || 0} items · {formatDateTime(d.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="tabular-nums font-semibold text-ink">{formatBDT(d.total)}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        href={`/admin/orders/${d.id}`}
                        className="cursor-pointer h-7 px-2.5 text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden /> View
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Right Column: Customer Info & Order Summary */}
        <div className="space-y-6">
          {/* Customer Panel */}
          <Panel title="Customer Details">
            <div className="flex gap-2 mb-4 p-1 rounded-md bg-canvas border border-line">
              <button
                type="button"
                onClick={() => setCustomerMode('existing')}
                className={`flex-1 py-1.5 text-xs font-medium rounded cursor-pointer transition-colors ${
                  customerMode === 'existing' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Registered Customer
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('new')}
                className={`flex-1 py-1.5 text-xs font-medium rounded cursor-pointer transition-colors ${
                  customerMode === 'new' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                + New / Phone Customer
              </button>
            </div>

            {customerMode === 'existing' ? (
              <div>
                <Select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` }))}
                  aria-label="Select Customer"
                />
                {selectedCustomer && (
                  <div className="mt-3 rounded-md bg-canvas p-3 text-xs space-y-1 text-ink-muted border border-line">
                    <p><strong className="text-ink">Email:</strong> {selectedCustomer.email || 'N/A'}</p>
                    <p><strong className="text-ink">Phone:</strong> {selectedCustomer.phone}</p>
                    <p><strong className="text-ink">District:</strong> {selectedCustomer.district || 'Dhaka'}</p>
                  </div>
                )}
                {isB2B && (
                  <div className="mt-3 rounded-md bg-info-soft p-3 text-xs text-info border border-info/20">
                    <p className="font-medium">Wholesale Business Account</p>
                    <label className="mt-2 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wholesale}
                        onChange={(e) => setWholesale(e.target.checked)}
                      />
                      Apply volume tiered discount (10% - 30%)
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Customer Full Name *"
                  placeholder="e.g. Sumona Yeasmin"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Input
                  label="Mobile Phone *"
                  placeholder="01712345678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <Input
                  label="Email Address (Optional)"
                  placeholder="customer@example.com"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Input
                  label="Delivery Street Address"
                  placeholder="House, Road, Flat details..."
                  value={newLine1}
                  onChange={(e) => setNewLine1(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1.5">District *</label>
                    <select
                      value={newDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="h-9 w-full rounded-md border border-line bg-surface px-2.5 text-xs text-ink focus:outline-none"
                    >
                      {districts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1.5">Area / Thana *</label>
                    <select
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      className="h-9 w-full rounded-md border border-line bg-surface px-2.5 text-xs text-ink focus:outline-none"
                    >
                      {(areasByDistrict[newDistrict] || []).map((thana) => (
                        <option key={thana} value={thana}>
                          {thana}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </Panel>

          {/* Payment & Summary Panel */}
          <Panel title="Order Summary & Payment">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">Payment Method</label>
                <div className="flex items-center gap-2.5 p-3 rounded-md border border-clay/60 bg-clay-soft/30 text-ink">
                  <PaymentMark method="cod" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-ink-muted">Payment collected at customer's doorstep</p>
                  </div>
                  <Badge tone="success">Default</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Input
                  label="Discount (৳)"
                  inputMode="numeric"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ''))}
                />
                <Input
                  label="Shipping (৳)"
                  inputMode="numeric"
                  placeholder="70"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="flex gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShipping('70')}
                  className="px-2 py-1 rounded bg-canvas border border-line text-ink-muted hover:text-ink cursor-pointer"
                >
                  Dhaka ৳70
                </button>
                <button
                  type="button"
                  onClick={() => setShipping('130')}
                  className="px-2 py-1 rounded bg-canvas border border-line text-ink-muted hover:text-ink cursor-pointer"
                >
                  Outside ৳130
                </button>
                <button
                  type="button"
                  onClick={() => setShipping('0')}
                  className="px-2 py-1 rounded bg-canvas border border-line text-ink-muted hover:text-ink cursor-pointer"
                >
                  Free ৳0
                </button>
              </div>

              <Input
                label="Staff Internal Note (Optional)"
                placeholder="e.g. Phone order / Special request"
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
              />
            </div>

            {/* Calculations */}
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-medium text-ink tabular-nums">{formatBDT(subtotal)}</dd>
              </div>
              {Number(discount) > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount</dt>
                  <dd className="font-medium tabular-nums">−{formatBDT(Number(discount))}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd className="font-medium text-ink tabular-nums">{formatBDT(Number(shipping || 0))}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
                <dt>Total Amount</dt>
                <dd className="tabular-nums text-clay">{formatBDT(total)}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <Button
                fullWidth
                disabled={isSubmitting || detailed.length === 0}
                onClick={finalize}
                className="cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create draft order
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
