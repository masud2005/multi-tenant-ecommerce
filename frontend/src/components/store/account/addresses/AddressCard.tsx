'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Address } from '@/types/commerce';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (id: string) => void;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  return (
    <li className="flex flex-col rounded-lg border border-line bg-surface p-5">
      {/* Address Header with Label and Status Badges */}
      <div className="flex items-center gap-2">
        <p className="font-medium text-ink">{address.label}</p>
        {address.isDefaultShipping && <Badge tone="clay">Default shipping</Badge>}
        {address.isDefaultBilling && <Badge>Billing</Badge>}
      </div>

      {/* Recipient Details */}
      <p className="mt-2 text-sm text-ink">
        {address.name} · {address.phone}
      </p>
      <p className="text-sm text-ink-muted">
        {address.line1}, {address.area}, {address.district}
      </p>

      {/* Action Buttons */}
      <div className="mt-auto flex items-center gap-4 pt-4 text-sm">
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="font-medium text-ink underline-offset-2 hover:underline cursor-pointer"
        >
          Edit
        </button>

        {!address.isDefaultShipping && (
          <button
            type="button"
            onClick={() => onSetDefault(address.id)}
            className="text-ink-soft hover:text-ink cursor-pointer"
          >
            Set as default
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(address)}
          className="ml-auto text-ink-muted hover:text-danger cursor-pointer"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
