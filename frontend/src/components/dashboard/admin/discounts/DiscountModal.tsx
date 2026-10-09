'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Sparkles, Calendar, Tag, Percent, DollarSign, Truck, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { discountService } from '@/services/discount-service';
import type {
  DiscountResponseData,
  CreateDiscountPayload,
  UpdateDiscountPayload,
  DiscountType,
  DiscountMethod,
  DiscountStatus,
} from '@/types/discount';

interface DiscountModalProps {
  open: boolean;
  onClose: () => void;
  discount?: DiscountResponseData | null;
  onSaved: (discount: DiscountResponseData, isNew: boolean) => void;
}

export function DiscountModal({
  open,
  onClose,
  discount,
  onSaved,
}: DiscountModalProps) {
  const isEditing = Boolean(discount);

  // Form states
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DiscountType>('PERCENTAGE');
  const [method, setMethod] = useState<DiscountMethod>('CODE');
  const [status, setStatus] = useState<DiscountStatus>('ACTIVE');
  const [value, setValue] = useState<number | string>(10);
  const [minSubtotal, setMinSubtotal] = useState<string>('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<string>('1');
  const [startsAt, setStartsAt] = useState<string>('');
  const [endsAt, setEndsAt] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or populate form when modal opens / discount changes
  useEffect(() => {
    if (discount) {
      setCode(discount.code);
      setTitle(discount.title);
      setType(discount.type);
      setMethod(discount.method || 'CODE');
      setStatus(discount.status || 'ACTIVE');
      setValue(discount.value);
      setMinSubtotal(discount.minSubtotal ? String(discount.minSubtotal) : '');
      setMaxDiscountAmount(discount.maxDiscountAmount ? String(discount.maxDiscountAmount) : '');
      setUsageLimit(discount.usageLimit ? String(discount.usageLimit) : '');
      setUsageLimitPerUser(String(discount.usageLimitPerUser ?? 1));
      setStartsAt(
        discount.startsAt ? new Date(discount.startsAt).toISOString().split('T')[0] : ''
      );
      setEndsAt(
        discount.endsAt ? new Date(discount.endsAt).toISOString().split('T')[0] : ''
      );
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      setCode('');
      setTitle('');
      setType('PERCENTAGE');
      setMethod('CODE');
      setStatus('ACTIVE');
      setValue(10);
      setMinSubtotal('');
      setMaxDiscountAmount('');
      setUsageLimit('');
      setUsageLimitPerUser('1');
      setStartsAt(today);
      setEndsAt(nextMonth);
    }
    setErrors({});
  }, [discount, open]);

  // Generate a random high-converting code
  const handleGenerateCode = () => {
    const prefixes = ['SAVE', 'FESTIVE', 'SPECIAL', 'DEAL', 'VIP', 'FLASH'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    const newCode = `${randomPrefix}${randomNum}`;
    setCode(newCode);
    if (!title) {
      setTitle(`${newCode} Special Promotion`);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (code.trim().length < 3) {
      newErrors.code = 'Code must be at least 3 characters';
    }

    if (!title.trim()) {
      newErrors.title = 'Title or campaign name is required';
    }

    const numVal = Number(value);
    if (type !== 'FREE_SHIPPING') {
      if (isNaN(numVal) || numVal <= 0) {
        newErrors.value = 'Value must be greater than 0';
      } else if (type === 'PERCENTAGE' && numVal > 100) {
        newErrors.value = 'Percentage discount cannot exceed 100%';
      }
    }

    if (!startsAt) {
      newErrors.startsAt = 'Start date is required';
    }

    if (startsAt && endsAt) {
      if (new Date(endsAt) <= new Date(startsAt)) {
        newErrors.endsAt = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const parsedStartsAt = new Date(`${startsAt}T00:00:00.000Z`).toISOString();
      const parsedEndsAt = endsAt ? new Date(`${endsAt}T23:59:59.000Z`).toISOString() : undefined;

      if (isEditing && discount) {
        const payload: UpdateDiscountPayload = {
          code: code.trim().toUpperCase(),
          title: title.trim(),
          type,
          method,
          status,
          value: type === 'FREE_SHIPPING' ? 0 : Number(value),
          minSubtotal: minSubtotal ? Number(minSubtotal) : undefined,
          maxDiscountAmount:
            type === 'PERCENTAGE' && maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : 1,
          startsAt: parsedStartsAt,
          endsAt: parsedEndsAt,
        };

        const res = await discountService.updateDiscount(discount.id, payload);
        if (res.data) {
          toast.success(`Discount "${res.data.code}" updated successfully!`);
          onSaved(res.data, false);
          onClose();
        }
      } else {
        const payload: CreateDiscountPayload = {
          code: code.trim().toUpperCase(),
          title: title.trim(),
          type,
          method,
          status,
          value: type === 'FREE_SHIPPING' ? 0 : Number(value),
          minSubtotal: minSubtotal ? Number(minSubtotal) : undefined,
          maxDiscountAmount:
            type === 'PERCENTAGE' && maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : 1,
          startsAt: parsedStartsAt,
          endsAt: parsedEndsAt,
        };

        const res = await discountService.createDiscount(payload);
        if (res.data) {
          toast.success(`Discount "${res.data.code}" created successfully!`);
          onSaved(res.data, true);
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Failed to save discount:', error);
      toast.error(error?.message || 'Failed to save discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEditing ? `Edit Discount (${discount?.code})` : 'Create New Discount'}
      description="Configure coupon codes, percentage or flat discounts, usage limits, and campaign dates."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="discount-form" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Discount'}
          </Button>
        </div>
      }
    >
      <form id="discount-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Discount Type Selector Cards */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Discount Type
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              {
                typeKey: 'PERCENTAGE' as DiscountType,
                title: 'Percentage Off',
                desc: 'e.g. 15% discount on cart',
                icon: Percent,
              },
              {
                typeKey: 'FIXED_AMOUNT' as DiscountType,
                title: 'Fixed Amount',
                desc: 'e.g. ৳500 flat deduction',
                icon: DollarSign,
              },
              {
                typeKey: 'FREE_SHIPPING' as DiscountType,
                title: 'Free Shipping',
                desc: 'Waives courier delivery fee',
                icon: Truck,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = type === item.typeKey;
              return (
                <button
                  key={item.typeKey}
                  type="button"
                  onClick={() => {
                    setType(item.typeKey);
                    if (item.typeKey === 'FREE_SHIPPING') setValue(0);
                    else if (value === 0) setValue(item.typeKey === 'PERCENTAGE' ? 10 : 100);
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-clay bg-clay/5 ring-2 ring-clay/20 shadow-xs'
                      : 'border-line bg-surface hover:border-line-strong hover:bg-subtle/50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-clay text-canvas' : 'bg-subtle text-ink-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-clay ring-2 ring-clay/30" />
                    )}
                  </div>
                  <span className="mt-1 text-sm font-semibold text-ink">{item.title}</span>
                  <span className="text-[11px] text-ink-muted leading-tight">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code & Title */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-ink">Coupon Code</label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="inline-flex items-center gap-1 text-xs font-medium text-clay hover:underline cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Generate Code</span>
                </button>
              )}
            </div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EID500, SAVE20"
              error={errors.code}
              className="uppercase tracking-wider font-semibold font-mono"
            />
          </div>

          <Input
            label="Campaign / Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Eid Mega Offer ৳500 Flat Off"
            error={errors.title}
          />
        </div>

        {/* Discount Value & Max Cap */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {type !== 'FREE_SHIPPING' ? (
            <Input
              label={type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (৳)'}
              prefix={type === 'PERCENTAGE' ? '%' : '৳'}
              type="number"
              min="1"
              max={type === 'PERCENTAGE' ? '100' : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={errors.value}
              hint={type === 'PERCENTAGE' ? 'Enter rate between 1% to 100%' : 'Flat deduction in BDT'}
            />
          ) : (
            <div className="flex flex-col justify-center rounded-lg border border-line bg-subtle/50 p-3">
              <span className="text-xs font-medium text-ink">Free Shipping Active</span>
              <span className="text-[11px] text-ink-muted">
                100% standard delivery fee will be waived automatically at checkout.
              </span>
            </div>
          )}

          {type === 'PERCENTAGE' && (
            <Input
              label="Maximum Discount Cap (৳) (Optional)"
              prefix="৳"
              type="number"
              min="0"
              value={maxDiscountAmount}
              onChange={(e) => setMaxDiscountAmount(e.target.value)}
              placeholder="e.g. 500 (No maximum limit if blank)"
              hint="Prevents excessively high discounts on bulk orders"
            />
          )}

          {type !== 'PERCENTAGE' && (
            <Input
              label="Minimum Order Subtotal (৳)"
              prefix="৳"
              type="number"
              min="0"
              value={minSubtotal}
              onChange={(e) => setMinSubtotal(e.target.value)}
              placeholder="e.g. 2000 (Optional)"
              hint="Customer cart must reach this amount"
            />
          )}
        </div>

        {/* Minimum Subtotal for Percentage & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {type === 'PERCENTAGE' && (
            <Input
              label="Minimum Order Subtotal (৳)"
              prefix="৳"
              type="number"
              min="0"
              value={minSubtotal}
              onChange={(e) => setMinSubtotal(e.target.value)}
              placeholder="e.g. 1500 (Optional)"
              hint="Cart must reach this subtotal to apply code"
            />
          )}

          <Select
            label="Campaign Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as DiscountStatus)}
            options={[
              { value: 'ACTIVE', label: 'Active (Live for customers)' },
              { value: 'SCHEDULED', label: 'Scheduled (Activates on start date)' },
              { value: 'DISABLED', label: 'Disabled (Deactivated / Hidden)' },
            ]}
          />
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Total Global Usage Limit"
            type="number"
            min="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="Unlimited if left empty"
            hint="Maximum redemptions across all store customers"
          />

          <Input
            label="Per-Customer Usage Limit"
            type="number"
            min="1"
            value={usageLimitPerUser}
            onChange={(e) => setUsageLimitPerUser(e.target.value)}
            placeholder="1"
            hint="Times a single customer/email can use this code"
          />
        </div>

        {/* Date Schedule */}
        <div className="rounded-xl border border-line bg-subtle/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
            <Calendar className="h-4 w-4 text-clay" />
            <span>Active Campaign Dates</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              error={errors.startsAt}
            />

            <Input
              label="End Date (Optional)"
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              error={errors.endsAt}
              hint="Leave blank for ongoing promotional codes"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
