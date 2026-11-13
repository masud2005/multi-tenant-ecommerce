'use client';


import { asApiError } from '@/lib/api-error';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileBarChart, Search, SearchX, Download, Loader2 } from 'lucide-react';
import { orderService } from '@/services/order-service';
import { customerService } from '@/services/customer-service';
import { inventoryService } from '@/services/inventory-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/utils/format';
import type { Order, Customer } from '@/types/commerce';
import type { InventoryVariantItem } from '@/services/inventory-service';

type ReportId = 'orders' | 'inventory' | 'customers';

type ReportDef = {
  id: ReportId;
  name: string;
  description: string;
};

/** Only reports that export accurate rows from live owner APIs. */
const LIVE_REPORTS: ReportDef[] = [
  {
    id: 'orders',
    name: 'Orders export',
    description:
      'Every store order from the database: number, customer, status, payment, totals, courier and tracking.',
  },
  {
    id: 'inventory',
    name: 'Inventory export',
    description:
      'Variant-level stock from the database: product, SKU, color/size, on-hand and reserved units.',
  },
  {
    id: 'customers',
    name: 'Customers export',
    description:
      'Customer profiles from the database: contact, district, order count, total spent and status.',
  },
];

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function fetchAllOrders(): Promise<Order[]> {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const all: Order[] = [];

  while (page <= totalPages) {
    const res = await orderService.getOwnerOrders({
      page,
      limit: pageSize,
    });
    const batch = res?.data?.orders;
    if (!Array.isArray(batch)) {
      throw new Error(res?.message || 'Could not load orders from database');
    }
    all.push(...batch);
    totalPages = Math.max(1, Number(res?.data?.pagination?.totalPages) || 1);
    if (batch.length === 0) break;
    page += 1;
    if (page > 200) break;
  }

  return all;
}

async function fetchAllInventoryVariants(): Promise<InventoryVariantItem[]> {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const all: InventoryVariantItem[] = [];

  while (page <= totalPages) {
    const res = await inventoryService.getOverview({
      page,
      limit: pageSize,
      stockStatus: 'all',
    });
    const batch = res?.data?.items;
    if (!Array.isArray(batch)) {
      throw new Error(res?.message || 'Could not load inventory from database');
    }
    all.push(...batch);
    totalPages = Math.max(1, Number(res?.data?.pagination?.totalPages) || 1);
    if (batch.length === 0) break;
    page += 1;
    if (page > 200) break;
  }

  return all;
}

async function fetchAllCustomers(): Promise<Customer[]> {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const all: Customer[] = [];

  while (page <= totalPages) {
    const res = await customerService.getOwnerCustomers({
      page,
      limit: pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    const batch = res?.data?.customers;
    if (!Array.isArray(batch)) {
      throw new Error(res?.message || 'Could not load customers from database');
    }
    all.push(...batch);
    totalPages = Math.max(1, Number(res?.data?.meta?.totalPages) || 1);
    if (batch.length === 0) break;
    page += 1;
    if (page > 200) break;
  }

  return all;
}

function buildOrdersCsv(orders: Order[]) {
  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Phone',
    'District',
    'Status',
    'Payment Method',
    'Payment Status',
    'Subtotal',
    'Shipping Fee',
    'Discount',
    'Total Amount (BDT)',
    'Courier',
    'Tracking Number',
  ];
  const rows = [headers.join(',')];
  for (const o of orders) {
    rows.push(
      [
        csvEscape(o.number),
        csvEscape(formatDateTime(o.createdAt)),
        csvEscape(o.customerName || ''),
        csvEscape(o.phone || ''),
        csvEscape(o.shippingAddress?.district || ''),
        csvEscape((o.status || '').toUpperCase()),
        csvEscape((o.paymentMethod || '').toUpperCase()),
        csvEscape((o.paymentStatus || '').toUpperCase()),
        csvEscape(o.subtotal),
        csvEscape(o.shipping),
        csvEscape(o.discount),
        csvEscape(o.total),
        csvEscape(o.courier || ''),
        csvEscape(o.tracking || ''),
      ].join(','),
    );
  }
  return rows.join('\n');
}

function buildInventoryCsv(items: InventoryVariantItem[]) {
  const headers = [
    'Variant ID',
    'Product Title',
    'SKU',
    'Color',
    'Size',
    'On Hand',
    'Reserved',
    'Available',
    'Low Stock Threshold',
    'Category',
    'Brand',
    'Updated At',
  ];
  const rows = [headers.join(',')];
  for (const v of items) {
    const onHand = Number(v.stock) || 0;
    const reserved = Number(v.reserved) || 0;
    rows.push(
      [
        csvEscape(v.id),
        csvEscape(v.product?.title || ''),
        csvEscape(v.sku || ''),
        csvEscape(v.color || ''),
        csvEscape(v.size || ''),
        csvEscape(onHand),
        csvEscape(reserved),
        csvEscape(onHand - reserved),
        csvEscape(v.lowStockThreshold ?? ''),
        csvEscape(v.product?.category?.name || ''),
        csvEscape(v.product?.brand?.name || ''),
        csvEscape(v.updatedAt ? formatDateTime(v.updatedAt) : ''),
      ].join(','),
    );
  }
  return rows.join('\n');
}

function buildCustomersCsv(customers: Customer[]) {
  const headers = [
    'Customer ID',
    'Name',
    'Email',
    'Phone',
    'District',
    'Total Orders',
    'Total Spent (BDT)',
    'Segment',
    'Status',
    'Joined At',
  ];
  const rows = [headers.join(',')];
  for (const c of customers) {
    rows.push(
      [
        csvEscape(c.id),
        csvEscape(c.name || ''),
        csvEscape(c.email || ''),
        csvEscape(c.phone || ''),
        csvEscape(c.district || ''),
        csvEscape(c.orders || 0),
        csvEscape(c.spent || 0),
        csvEscape(c.segment || ''),
        csvEscape(c.status || ''),
        csvEscape(c.joined ? formatDateTime(c.joined) : ''),
      ].join(','),
    );
  }
  return rows.join('\n');
}

export default function AdminReportsPage() {
  const [q, setQ] = useState('');
  const [exportingId, setExportingId] = useState<ReportId | null>(null);

  const reports = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return LIVE_REPORTS;
    return LIVE_REPORTS.filter((r) =>
      `${r.name} ${r.description}`.toLowerCase().includes(needle),
    );
  }, [q]);

  const handleExport = async (report: ReportDef) => {
    try {
      setExportingId(report.id);
      const dateStr = new Date().toISOString().slice(0, 10);

      if (report.id === 'orders') {
        const orders = await fetchAllOrders();
        if (orders.length === 0) {
          toast.error('No orders found in the database');
          return;
        }
        downloadCsv(`orders_export_${dateStr}.csv`, buildOrdersCsv(orders));
        toast.success(`Downloaded ${orders.length} orders`);
        return;
      }

      if (report.id === 'inventory') {
        const items = await fetchAllInventoryVariants();
        if (items.length === 0) {
          toast.error('No inventory variants found in the database');
          return;
        }
        downloadCsv(
          `inventory_export_${dateStr}.csv`,
          buildInventoryCsv(items),
        );
        toast.success(`Downloaded ${items.length} inventory variants`);
        return;
      }

      if (report.id === 'customers') {
        const customers = await fetchAllCustomers();
        if (customers.length === 0) {
          toast.error('No customers found in the database');
          return;
        }
        downloadCsv(
          `customers_export_${dateStr}.csv`,
          buildCustomersCsv(customers),
        );
        toast.success(`Downloaded ${customers.length} customers`);
        return;
      }
    } catch (err: unknown) {
      toast.error(asApiError(err).message || 'Failed to generate report from database');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <ModuleGate module="reports">
      <div className="w-full space-y-6">
        <PageHeader
          title="Reports"
          description="Download live CSV exports from your database. Only reports with accurate, complete data are listed."
        />

        <div className="relative mb-6 max-w-sm">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports…"
            aria-label="Find a report"
            className="h-9 w-full rounded-md border border-line bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
          />
        </div>

        {reports.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No reports match"
            description="Try a different search term."
          />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {reports.map((report) => {
              const isExporting = exportingId === report.id;
              return (
                <li
                  key={report.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-subtle/30 transition-colors"
                >
                  <FileBarChart
                    className="h-4 w-4 text-ink-muted shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-[200px] flex-1">
                    <p className="text-sm font-medium text-ink">{report.name}</p>
                    <p className="text-xs text-ink-muted">{report.description}</p>
                  </div>
                  <GuardedButton
                    module="reports"
                    action="export"
                    size="sm"
                    variant="secondary"
                    disabled={isExporting || exportingId !== null}
                    onClick={() => handleExport(report)}
                    className="cursor-pointer"
                  >
                    {isExporting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1" />
                    )}
                    Download CSV
                  </GuardedButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ModuleGate>
  );
}
