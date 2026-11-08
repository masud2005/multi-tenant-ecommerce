import React from 'react';
import { CheckIcon } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import { districts, areasFor } from '@/data/shipping';
import { cn } from '@/utils/cn';
import type { Address } from '@/types/commerce';
import { Section } from './Section';
import { RadioCard } from './RadioCard';

export interface NewAddressFormData {
  name: string;
  phone: string;
  line1: string;
  district: string;
  area: string;
  label: string;
}

interface AddressSectionProps {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddressId: (id: string) => void;
  newAddress: NewAddressFormData;
  onNewAddressChange: (data: NewAddressFormData) => void;
  isLoggedIn: boolean;
  errors: Partial<Record<string, string>>;
  onClearError: (field: string) => void;
  onSaveAddress: () => void | Promise<void>;
  isSavingAddress: boolean;
}

export function AddressSection({
  addresses,
  selectedAddressId,
  onSelectAddressId,
  newAddress,
  onNewAddressChange,
  isLoggedIn,
  errors,
  onClearError,
  onSaveAddress,
  isSavingAddress,
}: AddressSectionProps) {
  return (
    <Section step={1} title="Delivery address">
      {addresses.length > 0 && (
        <div
          className="grid gap-3 sm:grid-cols-2"
          role="radiogroup"
          aria-label="Delivery addresses"
        >
          {addresses.map((a) => {
            const isSelected = selectedAddressId === a.id;
            return (
              <RadioCard
                key={a.id}
                checked={isSelected}
                onSelect={() => onSelectAddressId(a.id)}
                className="pr-10"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{a.label || 'Saved address'}</p>
                  {a.isDefaultShipping ? (
                    <span className="rounded bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink">
                      Default
                    </span>
                  ) : (
                    <span className="rounded bg-subtle px-2 py-0.5 text-xs text-ink/80">
                      Saved
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-ink">
                  {a.name} · {a.phone}
                </p>
                <p className="text-sm text-ink/80">
                  {a.line1}, {a.area}, {a.district}
                </p>
              </RadioCard>
            );
          })}
          <RadioCard
            checked={selectedAddressId === 'new'}
            onSelect={() => onSelectAddressId('new')}
          >
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
              + Use a new address
            </p>
            <p className="mt-1 text-xs text-ink/80">
              Enter a different recipient or delivery location
            </p>
          </RadioCard>
        </div>
      )}

      {selectedAddressId === 'new' && (
        <div
          className={cn(
            'grid gap-4 sm:grid-cols-2',
            addresses.length > 0 && 'mt-5 p-4 rounded-xl border border-line bg-surface/40'
          )}
        >
          {addresses.length > 0 && (
            <div className="sm:col-span-2 flex items-center justify-between border-b border-line pb-2 mb-1">
              <p className="text-sm font-medium text-ink">Enter New Delivery Address</p>
              <button
                type="button"
                onClick={() => {
                  const def = addresses.find((a) => a.isDefaultShipping) ?? addresses[0];
                  if (def) onSelectAddressId(def.id);
                }}
                className="cursor-pointer text-xs font-medium text-ink hover:underline"
              >
                ← Back to saved address
              </button>
            </div>
          )}

          {isLoggedIn && (
            <Select
              label="Address type"
              value={newAddress.label}
              placeholder="(e.g. Home)"
              onChange={(e) =>
                onNewAddressChange({ ...newAddress, label: e.target.value })
              }
              options={['Home', 'Office', 'Other']}
              className="sm:col-span-2"
            />
          )}

          <Input
            label="Full name"
            value={newAddress.name}
            onChange={(e) => {
              onNewAddressChange({ ...newAddress, name: e.target.value });
              if (errors.recipientName) onClearError('recipientName');
            }}
            error={errors.recipientName}
            placeholder="e.g. Rahim Ahmed"
          />

          <Input
            label="Phone number"
            type="tel"
            value={newAddress.phone}
            onChange={(e) => {
              onNewAddressChange({ ...newAddress, phone: e.target.value });
              if (errors.recipientPhone) onClearError('recipientPhone');
            }}
            error={errors.recipientPhone}
            placeholder="01XXXXXXXXX"
          />

          <Input
            label="delivery address"
            value={newAddress.line1}
            onChange={(e) => {
              onNewAddressChange({ ...newAddress, line1: e.target.value });
              if (errors.line1) onClearError('line1');
            }}
            error={errors.line1}
            placeholder="House no, road no, flat, area details..."
            className="sm:col-span-2"
            autoComplete="street-address"
          />

          <Select
            label="District"
            value={newAddress.district}
            placeholder="Select district"
            error={errors.district}
            onChange={(e) => {
              const selectedDistrict = e.target.value;
              const defaultArea = areasFor(selectedDistrict)[0] || '';
              onNewAddressChange({
                ...newAddress,
                district: selectedDistrict,
                area: defaultArea,
              });
              if (errors.district) onClearError('district');
            }}
            options={districts}
          />

          <Select
            label="Thana / area"
            value={newAddress.area}
            placeholder="Select thana"
            error={errors.area}
            onChange={(e) => {
              onNewAddressChange({ ...newAddress, area: e.target.value });
              if (errors.area) onClearError('area');
            }}
            options={newAddress.district ? areasFor(newAddress.district) : []}
          />

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60 mt-1">
            <Button
              type="button"
              size="sm"
              loading={isSavingAddress}
              onClick={onSaveAddress}
              className="inline-flex items-center gap-1.5"
            >
              <CheckIcon className="h-4 w-4" /> Save address
            </Button>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const def = addresses.find((a) => a.isDefaultShipping) ?? addresses[0];
                  if (def) onSelectAddressId(def.id);
                }}
                className="cursor-pointer text-xs font-medium text-ink/80 hover:text-ink"
              >
                Cancel & use saved address
              </button>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
