'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';
import {
  CancelOrderModal,
  OrderDetailHeader,
  OrderStatusSection,
  OrderItemsSection,
  OrderCostBreakdown,
  OrderDeliveryCard,
  OrderPaymentCard,
  OrderActivityCard,
} from '@/components/store/account/orders';

interface OrderDetailPageProps {
  params: Promise<{ number: string }>;
}

export default function AccountOrderDetailPage({ params }: OrderDetailPageProps) {
  const { number } = use(params);
  const { orders, cancelOrder, returns } = useStore();
  const order = orders.find((o) => o.number === number || o.id === number);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!order) {
    return (
      <p className="text-sm text-ink-muted">
        Order not found.{' '}
        <Link href="/account/orders" className="underline">
          Back to orders
        </Link>
      </p>
    );
  }

  const canCancel = ['pending_payment', 'confirmed', 'processing'].includes(order.status);
  const canReturn = order.status === 'delivered';
  const existingReturn = returns.find((r) => r.orderNumber === order.number);

  return (
    <div>
      {/* Top Header & Quick Actions */}
      <OrderDetailHeader
        order={order}
        canReturn={canReturn}
        canCancel={canCancel}
        hasExistingReturn={Boolean(existingReturn)}
        onDownloadInvoice={() => toast.success(`Invoice ${order.number}.pdf downloaded`)}
        onRequestCancel={() => setConfirmCancel(true)}
      />

      {/* Progress & Live Tracking Status */}
      <OrderStatusSection
        order={order}
        existingReturn={existingReturn}
      />

      {/* Two-Column Layout: Left = Items & Cost; Right = Delivery, Payment & Activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Items and Cost Breakdown */}
        <section className="rounded-lg border border-line bg-surface">
          <OrderItemsSection
            items={order.items}
            orderStatus={order.status}
          />
          <OrderCostBreakdown order={order} />
        </section>

        {/* Right Column: Delivery, Payment, and Activity Timeline */}
        <div className="space-y-6">
          <OrderDeliveryCard
            shippingAddress={order.shippingAddress}
            shippingMethod={order.shippingMethod}
          />
          <OrderPaymentCard
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
          />
          <OrderActivityCard
            timeline={order.timeline}
            notes={order.notes}
          />
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        isOpen={confirmCancel}
        order={order}
        onClose={() => setConfirmCancel(false)}
        onConfirm={(orderId) => {
          cancelOrder(orderId, 'Customer');
          toast.success('Order cancelled');
        }}
      />
    </div>
  );
}
