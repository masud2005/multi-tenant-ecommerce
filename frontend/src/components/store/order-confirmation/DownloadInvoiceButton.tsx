'use client';

import React, { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';
import {
  downloadOrderInvoicePdf,
  resolveInvoiceStore,
} from '@/utils/order-invoice';
import type { Order } from '@/types/commerce';

interface DownloadInvoiceButtonProps {
  order: Order;
  variant?: 'primary' | 'secondary';
}

export function DownloadInvoiceButton({
  order,
  variant = 'secondary',
}: DownloadInvoiceButtonProps) {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadOrderInvoicePdf(order, resolveInvoiceStore(tenant));
    } catch (err) {
      console.error(err);
      toast.error('Could not generate PDF invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      className="cursor-pointer"
      loading={loading}
      onClick={handleDownload}
    >
      {!loading && <DownloadIcon className="h-4 w-4" aria-hidden />}
      Download invoice
    </Button>
  );
}
