'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { paymentMethodLabel } from '@/utils/status';
import { formatBDT } from '@/utils/format';
import type { Order } from '@/types/commerce';

interface CancelOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
  busy?: boolean;
}

export function CancelOrderModal({
  isOpen,
  order,
  onClose,
  onConfirm,
  busy = false,
}: CancelOrderModalProps) {
  if (!order) return null;

  const methodLabel = paymentMethodLabel[order.paymentMethod] || order.paymentMethod;
  const description =
    order.paymentStatus === 'paid'
      ? `Your order will be cancelled. Because you already paid ${formatBDT(order.total)} via ${methodLabel}, the store will refund you manually (usually within a few days). This app does not run an automatic payment gateway.`
      : order.paymentMethod === 'cod'
        ? 'Your order will be cancelled. Nothing will be collected on delivery.'
        : 'Your order will be cancelled. If a payment was still pending verification, no further action is needed.';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Cancel this order?"
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Keep order
          </Button>
          <Button
            variant="danger"
            loading={busy}
            disabled={busy}
            onClick={() => onConfirm(order.id)}
          >
            Cancel order
          </Button>
        </>
      }
    />
  );
}
