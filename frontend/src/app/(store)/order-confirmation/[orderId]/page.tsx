'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { PackageIcon, Loader2Icon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { orderService, mapBackendOrderToFrontend } from '@/services/order-service';
import {
  OrderSuccessBanner,
  OrderPaymentRetry,
  OrderConfirmationSummary,
  DownloadInvoiceButton,
} from '@/components/store/order-confirmation';
import type { Order } from '@/types/commerce';

interface OrderConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { orderId } = use(params);
  const { orders, user } = useStore();

  const matchedOrder = orders.find((o) => o.id === orderId || o.number === orderId);
  const [dbOrder, setDbOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(!matchedOrder);

  useEffect(() => {
    if (!matchedOrder && orderId) {
      setIsLoading(true);
      orderService
        .getOrderDetail(orderId)
        .then((res) => {
          if (res?.data) {
            setDbOrder(mapBackendOrderToFrontend(res.data));
          }
        })
        .catch((err) => {
          console.warn('Could not fetch order from backend:', err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [matchedOrder, orderId]);

  const order = matchedOrder || dbOrder;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Loader2Icon className="mx-auto h-8 w-8 animate-spin text-clay" />
        <p className="mt-3 text-sm text-ink-muted">Loading order confirmation...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-medium text-ink">Order not found</p>
        <Link href="/" className="mt-4 inline-block text-sm text-clay underline">
          Return to home
        </Link>
      </div>
    );
  }

  const awaitingManualPayment =
    order.paymentMethod === 'bkash' || order.paymentMethod === 'nagad'
      ? order.paymentStatus === 'pending' ||
        order.status === 'pending_payment' ||
        order.paymentStatus === 'failed'
      : false;

  const failed =
    awaitingManualPayment &&
    (order.paymentStatus === 'failed' || order.status === 'failed');

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {awaitingManualPayment ? (
        <OrderPaymentRetry order={order} failed={failed} />
      ) : (
        <OrderSuccessBanner order={order} />
      )}

      <OrderConfirmationSummary order={order} />

      {!awaitingManualPayment && (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Button href={`/account/orders/${order.number}`}>
              <PackageIcon className="h-4 w-4" aria-hidden /> Track this order
            </Button>
          ) : (
            <Button href="/register">Create an account to track orders</Button>
          )}
          <DownloadInvoiceButton order={order} />
          <Button variant="secondary" href="/shop">
            Continue shopping
          </Button>
        </div>
      )}

      {awaitingManualPayment && !failed && (
        <div className="mt-6 flex justify-center">
          <DownloadInvoiceButton order={order} />
        </div>
      )}
    </div>
  );
}
