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
}

export function CancelOrderModal({
  isOpen,
  order,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  if (!order) return null;

  const description =
    order.paymentStatus === 'paid'
      ? `We’ll refund ${formatBDT(order.total)} to your ${
          paymentMethodLabel[order.paymentMethod]
        } account within 3–7 days.`
      : 'Your order will be cancelled and nothing will be charged.';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Cancel this order?"
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep order
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm(order.id);
              onClose();
            }}
          >
            Cancel order
          </Button>
        </>
      }
    />
  );
}
