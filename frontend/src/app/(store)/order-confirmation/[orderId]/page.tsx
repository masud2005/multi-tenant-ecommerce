'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PackageIcon, Loader2Icon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { orderService, mapBackendOrderToFrontend } from '@/services/order-service';
import {
  OrderSuccessBanner,
  OrderPaymentRetry,
  OrderConfirmationSummary,
} from '@/components/store/order-confirmation';
import type { PaymentMethod, Order } from '@/types/commerce';

interface OrderConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { orderId } = use(params);
  const router = useRouter();
  const { orders, retryPayment, user } = useStore();

  const matchedOrder = orders.find((o) => o.id === orderId || o.number === orderId);
  const [dbOrder, setDbOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(!matchedOrder);

  // Fetch order from backend if not found in local store state
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
  const [method, setMethod] = useState<PaymentMethod | null>(null);

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

  const awaitingPayment = order.status === 'pending_payment';
  const failed =
    awaitingPayment &&
    (order.paymentStatus === 'failed' ||
      order.attempts.some((a) => a.status === 'cancelled' || a.status === 'failed'));
  const chosen = method ?? order.paymentMethod;

  // Retry or switch payment method
  const retry = () => {
    retryPayment(order.id, chosen);
    if (chosen === 'cod') return;
    router.push(`/pay/${order.number || order.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Top Banner: Either Payment Retry Alert or Order Success Checkmark */}
      {awaitingPayment ? (
        <OrderPaymentRetry
          order={order}
          failed={failed}
          chosenMethod={chosen}
          onSelectMethod={setMethod}
          onRetry={retry}
        />
      ) : (
        <OrderSuccessBanner order={order} />
      )}

      {/* Structured Order Summary */}
      <OrderConfirmationSummary order={order} />

      {/* Footer Navigation Buttons */}
      {!awaitingPayment && (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Button href={`/account/orders/${order.number}`}>
              <PackageIcon className="h-4 w-4" aria-hidden /> Track this order
            </Button>
          ) : (
            <Button href="/register">Create an account to track orders</Button>
          )}
          <Button variant="secondary" href="/shop">
            Continue shopping
          </Button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink-muted">
        Need help?{' '}
        <Link href="/contact" className="underline">
          Contact Tanti Care
        </Link>{' '}
        · 09612-826842
      </p>
    </div>
  );
}
