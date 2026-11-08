'use client';

import React from 'react';
import { Download, FileSpreadsheet, UploadCloud } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';

const TEMPLATE_CSV =
  'handle,title,option1_name,option1_value,option2_name,option2_value,sku,barcode,price,sale_price,cost,stock,weight_grams,status,tags\n';

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'product-import-template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminProductImportPage() {
  return (
    <ModuleGate module="products" action="create">
      <div className="w-full space-y-6">
        <PageHeader
          back={{ href: '/admin/products', label: 'Products' }}
          title="Import & export products"
          description="Bulk-create or update products, variants, prices and stock using CSV."
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Panel>
            <EmptyState
              icon={UploadCloud}
              title="CSV import is not available yet"
              description="Bulk product import will land here soon. You can still download a column template to prepare your file, or add products one at a time."
              action={
                <Button href="/admin/products/new" variant="secondary" size="sm">
                  Add a product
                </Button>
              }
            />
          </Panel>

          <div className="space-y-6">
            <Panel title="Template">
              <p className="text-sm text-ink-muted">
                Download a blank CSV with the supported column headers. Importing a filled file is not available yet.
              </p>
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4" aria-hidden /> Download template
                </Button>
              </div>
            </Panel>
            <Panel title="Export">
              <p className="text-sm text-ink-muted">
                Bulk product export is not available yet.
              </p>
              <div className="mt-3">
                <Button variant="secondary" size="sm" disabled>
                  <FileSpreadsheet className="h-4 w-4" aria-hidden /> Export CSV
                </Button>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </ModuleGate>
  );
}
