'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * Legacy simulated gateway page — removed.
 * Manual bKash/Nagad payments are verified by the store owner from the submitted TrxID.
 */
export default function PayOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const router = useRouter();

  React.useEffect(() => {
    router.replace(`/order-confirmation/${encodeURIComponent(orderId)}`);
  }, [orderId, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
      <p className="text-lg font-medium text-ink">Online payment page removed</p>
      <p className="text-sm text-ink-muted">
        This store only accepts Cash on delivery and manual bKash / Nagad. There
        is no payment gateway checkout.
      </p>
      <Button href={`/order-confirmation/${encodeURIComponent(orderId)}`}>
        Back to order confirmation
      </Button>
      <div>
        <Link href="/shop" className="text-sm text-clay underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
