'use client';


import { asApiError } from '@/lib/api-error';
import React, { use, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';
import { useTenant } from '@/contexts/TenantContext';
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
import { orderService } from '@/services/order-service';
import {
  downloadOrderInvoicePdf,
  resolveInvoiceStore,
} from '@/utils/order-invoice';

interface OrderDetailPageProps {
  params: Promise<{ number: string }>;
}

export default function AccountOrderDetailPage({ params }: OrderDetailPageProps) {
  const { number } = use(params);
  const { orders, returns, refreshOrders } = useStore();
  const { tenant } = useTenant();
  const order = orders.find((o) => o.number === number || o.id === number);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

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

  const handleDownloadInvoice = async () => {
    try {
      setInvoiceLoading(true);
      await downloadOrderInvoicePdf(order, resolveInvoiceStore(tenant));
    } catch (err) {
      console.error(err);
      toast.error('Could not generate PDF invoice. Please try again.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      setCancelling(true);
      await orderService.cancelCustomerOrder(order.number || orderId);
      await refreshOrders?.();
      setConfirmCancel(false);
      toast.success(
        order.paymentStatus === 'paid'
          ? 'Order cancelled. If you already paid via bKash/Nagad, the store will refund you manually.'
          : 'Order cancelled',
      );
    } catch (err: unknown) {
      toast.error(
        asApiError(err).response?.data?.message || asApiError(err).message || 'Could not cancel this order',
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      {/* Top Header & Quick Actions */}
      <OrderDetailHeader
        order={order}
        canReturn={canReturn}
        canCancel={canCancel}
        hasExistingReturn={Boolean(existingReturn)}
        onDownloadInvoice={handleDownloadInvoice}
        onRequestCancel={() => setConfirmCancel(true)}
        invoiceLoading={invoiceLoading}
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
            order={order}
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
        busy={cancelling}
        onClose={() => !cancelling && setConfirmCancel(false)}
        onConfirm={handleCancel}
      />
    </div>
  );
}
