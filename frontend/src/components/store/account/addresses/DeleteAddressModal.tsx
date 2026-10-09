'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import type { Address } from '@/types/commerce';

interface DeleteAddressModalProps {
  isOpen: boolean;
  address: Address | null;
  onClose: () => void;
  onConfirm: (addressId: string) => void;
}

export function DeleteAddressModal({
  isOpen,
  address,
  onClose,
  onConfirm,
}: DeleteAddressModalProps) {
  if (!address) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Delete this address?"
      description={`${address.label} — ${address.line1}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm(address.id);
              onClose();
            }}
          >
            Delete
          </Button>
        </>
      }
    />
  );
}
