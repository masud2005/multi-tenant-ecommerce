'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/button';
import { areasFor, districts } from '@/data/shipping';
import type { Address } from '@/types/commerce';

interface AddressModalProps {
  isOpen: boolean;
  address: Address | null;
  onClose: () => void;
  onSave: (address: Address) => void;
}

const defaultAddress: Address = {
  id: '',
  label: 'Home',
  name: '',
  phone: '',
  line1: '',
  area: 'Dhanmondi',
  district: 'Dhaka',
  isDefaultShipping: false,
};

export function AddressModal({
  isOpen,
  address,
  onClose,
  onSave,
}: AddressModalProps) {
  const [draft, setDraft] = useState<Address>(defaultAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync draft state with address prop on open
  useEffect(() => {
    if (isOpen) {
      setDraft(address ? { ...address } : { ...defaultAddress, id: `a${Date.now()}` });
      setErrors({});
    }
  }, [isOpen, address]);

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    if (!draft.name.trim()) {
      nextErrors.name = 'Required';
    }
    const cleanPhone = draft.phone.replace(/\s/g, '');
    if (!/^01[3-9]\d{2}-?\d{6}$|^01[3-9]\d{8}$/.test(cleanPhone)) {
      nextErrors.phone = 'Enter an 11-digit mobile number';
    }
    if (draft.line1.trim().length < 5) {
      nextErrors.line1 = 'Enter house, road and area';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave(draft);
  };

  const isEditing = Boolean(address?.id);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit address' : 'Add address'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save address</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Label"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          options={['Home', 'Office', "Parents' home", 'Other']}
          className="sm:col-span-2"
        />

        <Input
          label="Recipient name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          error={errors.name}
        />

        <Input
          label="Phone"
          value={draft.phone}
          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          error={errors.phone}
          placeholder="01XXX-XXXXXX"
        />

        <Input
          label="House, road, area"
          value={draft.line1}
          onChange={(e) => setDraft({ ...draft, line1: e.target.value })}
          error={errors.line1}
          className="sm:col-span-2"
        />

        <Select
          label="District"
          value={draft.district}
          onChange={(e) => {
            const nextDistrict = e.target.value;
            const districtAreas = areasFor(nextDistrict);
            setDraft({
              ...draft,
              district: nextDistrict,
              area: districtAreas[0] || '',
            });
          }}
          options={districts}
        />

        <Select
          label="Thana / area"
          value={draft.area}
          onChange={(e) => setDraft({ ...draft, area: e.target.value })}
          options={areasFor(draft.district)}
        />

        <Checkbox
          className="sm:col-span-2"
          checked={!!draft.isDefaultShipping}
          onChange={(checked) => setDraft({ ...draft, isDefaultShipping: checked })}
          label="Use as default delivery address"
        />
      </div>
    </Modal>
  );
}
