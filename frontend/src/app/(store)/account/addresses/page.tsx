'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { MapPinIcon, PlusIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  AddressCard,
  AddressModal,
  DeleteAddressModal,
} from '@/components/store/account/addresses';
import type { Address } from '@/types/commerce';

export default function AccountAddressesPage() {
  const { addresses, saveAddress, deleteAddress, setDefaultAddress } = useStore();
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteAddress, setConfirmDeleteAddress] = useState<Address | null>(null);

  // Open modal for creating a new address
  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing address
  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  // Save new or updated address to store
  const handleSave = async (saved: Address) => {
    await saveAddress(saved);
    setIsModalOpen(false);
    toast.success('Address saved');
  };

  // Delete confirmed address
  const handleDelete = (addrId: string) => {
    deleteAddress(addrId);
    toast.success('Address deleted');
  };

  return (
    <div>
      <AccountHeader
        title="Addresses"
        description="Saved addresses make checkout faster."
        action={
          <Button size="sm" onClick={handleOpenAdd}>
            <PlusIcon className="h-4 w-4" aria-hidden /> Add address
          </Button>
        }
      />

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPinIcon}
          title="No saved addresses"
          action={<Button onClick={handleOpenAdd}>Add your first address</Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEdit}
              onDelete={setConfirmDeleteAddress}
              onSetDefault={setDefaultAddress}
            />
          ))}
        </ul>
      )}

      {/* Add / Edit Address Modal */}
      <AddressModal
        isOpen={isModalOpen}
        address={editingAddress}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      <DeleteAddressModal
        isOpen={Boolean(confirmDeleteAddress)}
        address={confirmDeleteAddress}
        onClose={() => setConfirmDeleteAddress(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
