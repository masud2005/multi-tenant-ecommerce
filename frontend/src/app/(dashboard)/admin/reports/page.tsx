'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileBarChart, Search, SearchX, Download, Loader2 } from 'lucide-react';
import { reportCatalog } from '@/data/admin';
import { useStore } from '@/contexts/StoreContext';
import { orderService } from '@/services/order-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/utils/format';

export default function AdminReportsPage() {
  const { products, customers } = useStore();
  const [q, setQ] = useState('');
  const [exportingReport, setExportingReport] = useState<string | null>(null);

  const groups = reportCatalog
    .map((g) => ({
      ...g,
      items: g.items.filter((i) =>
        `${i.name} ${i.description}`.toLowerCase().includes(q.toLowerCase())
      ),
    }))
    .filter((g) => g.items.length > 0);

  // Helper to trigger file download in browser
  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate real dynamic CSV reports
  const handleExport = async (reportName: string, groupName: string) => {
    try {
      setExportingReport(reportName);
      const dateStr = new Date().toISOString().slice(0, 10);

      // 1. Sales & Revenue Reports
      if (groupName === 'Sales' || groupName === 'Operations') {
        const res = await orderService.getOwnerOrders({ limit: 500 });
        const orders = res?.data?.orders || [];

        if (orders.length === 0) {
          toast.error('No orders available in database to generate report');
          return;
        }

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
          const row = [
            `"${o.number}"`,
            `"${formatDateTime(o.createdAt)}"`,
            `"${(o.customerName || '').replace(/"/g, '""')}"`,
            `"${(o.phone || '').replace(/"/g, '""')}"`,
            `"${(o.shippingAddress?.district || '').replace(/"/g, '""')}"`,
            `"${(o.status || '').toUpperCase()}"`,
            `"${(o.paymentMethod || '').toUpperCase()}"`,
            `"${(o.paymentStatus || '').toUpperCase()}"`,
            `"${o.subtotal}"`,
            `"${o.shipping}"`,
            `"${o.discount}"`,
            `"${o.total}"`,
            `"${(o.courier || '').replace(/"/g, '""')}"`,
            `"${(o.tracking || '').replace(/"/g, '""')}"`,
          ];
          rows.push(row.join(','));
        }

        const fileName = `${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dateStr}.csv`;
        downloadCsv(fileName, rows.join('\n'));
        toast.success(`Generated and downloaded ${fileName}`);
        return;
      }

      // 2. Catalog & Inventory Reports
      if (groupName === 'Catalog') {
        if (!products || products.length === 0) {
          toast.error('No catalog products found in store');
          return;
        }

        const headers = [
          'Product ID',
          'Title',
          'Category',
          'Price',
          'Compare At Price',
          'Available Stock',
          'SKU',
          'Status',
          'Created At',
        ];

        const rows = [headers.join(',')];

        for (const p of products) {
          const stock = p.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
          const sku = p.variants?.[0]?.sku || 'N/A';
          const row = [
            `"${p.id}"`,
            `"${(p.title || '').replace(/"/g, '""')}"`,
            `"${(p.category || '').replace(/"/g, '""')}"`,
            `"${p.price}"`,
            `"${p.salePrice || ''}"`,
            `"${stock}"`,
            `"${sku.replace(/"/g, '""')}"`,
            `"${(p.status || 'PUBLISHED').toUpperCase()}"`,
            `"${p.createdAt ? formatDateTime(p.createdAt) : ''}"`,
          ];
          rows.push(row.join(','));
        }

        const fileName = `${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dateStr}.csv`;
        downloadCsv(fileName, rows.join('\n'));
        toast.success(`Generated and downloaded ${fileName}`);
        return;
      }

      // 3. Customers Reports
      if (groupName === 'Customers') {
        if (!customers || customers.length === 0) {
          toast.error('No customers found in database');
          return;
        }

        const headers = [
          'Customer ID',
          'Name',
          'Email',
          'Phone',
          'District',
          'Total Orders',
          'Total Spent (BDT)',
          'Segment',
          'Joined At',
        ];

        const rows = [headers.join(',')];

        for (const c of customers) {
          const row = [
            `"${c.id}"`,
            `"${(c.name || '').replace(/"/g, '""')}"`,
            `"${(c.email || '').replace(/"/g, '""')}"`,
            `"${(c.phone || '').replace(/"/g, '""')}"`,
            `"${(c.district || '').replace(/"/g, '""')}"`,
            `"${c.orders || 0}"`,
            `"${c.spent || 0}"`,
            `"${(c.segment || 'Normal').replace(/"/g, '""')}"`,
            `"${c.joined ? formatDateTime(c.joined) : ''}"`,
          ];
          rows.push(row.join(','));
        }

        const fileName = `${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dateStr}.csv`;
        downloadCsv(fileName, rows.join('\n'));
        toast.success(`Generated and downloaded ${fileName}`);
        return;
      }

      // Default fallback
      toast.info(`Preparing report for ${reportName}...`);
      const fallbackContent = `Report Name,${reportName}\nGenerated Date,${new Date().toISOString()}\nStatus,Active`;
      downloadCsv(`${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dateStr}.csv`, fallbackContent);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate report');
    } finally {
      setExportingReport(null);
    }
  };

  return (
    <ModuleGate module="reports">
      <div className="w-full space-y-6">
        <PageHeader
          title="Reports & Analytics Export"
          description="Generate and download live operational reports for sales, inventory, revenue, taxes, and customer metrics in CSV format."
        />
        <div className="relative mb-6 max-w-sm">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search report by name or topic…"
            aria-label="Find a report"
            className="h-9 w-full rounded-md border border-line bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
          />
        </div>
        {groups.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No reports match"
            description="Try a different search term."
          />
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.group}>
                <h2 className="mb-2 text-sm font-semibold text-ink">{g.group} Reports</h2>
                <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                  {g.items.map((i) => {
                    const isExportingThis = exportingReport === i.name;
                    return (
                      <li
                        key={i.name}
                        className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-subtle/30 transition-colors"
                      >
                        <FileBarChart
                          className="h-4 w-4 text-ink-muted shrink-0"
                          aria-hidden
                        />
                        <div className="min-w-[200px] flex-1">
                          <p className="text-sm font-medium text-ink">{i.name}</p>
                          <p className="text-xs text-ink-muted">{i.description}</p>
                        </div>
                        <GuardedButton
                          module="reports"
                          action="export"
                          size="sm"
                          variant="secondary"
                          disabled={isExportingThis}
                          onClick={() => handleExport(i.name, g.group)}
                          className="cursor-pointer"
                        >
                          {isExportingThis ? (
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
              </section>
            ))}
          </div>
        )}
      </div>
    </ModuleGate>
  );
}
