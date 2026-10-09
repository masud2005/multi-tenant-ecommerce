'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  Copy,
  Check,
  Calendar,
  Percent,
  DollarSign,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { DiscountResponseData } from '@/types/discount';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

interface DiscountRowProps {
  discount: DiscountResponseData;
  isCopied: boolean;
  onCopyCode: (code: string) => void;
  onToggleStatus: (discount: DiscountResponseData) => void;
  onEdit: (discount: DiscountResponseData) => void;
  onDelete: (discount: DiscountResponseData) => void;
}

export function DiscountRow({
  discount,
  isCopied,
  onCopyCode,
  onToggleStatus,
  onEdit,
  onDelete,
}: DiscountRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const isPercentage = discount.type === 'PERCENTAGE';
  const isFixed = discount.type === 'FIXED_AMOUNT';
  const isFreeShip = discount.type === 'FREE_SHIPPING';
  const isActive = discount.status === 'ACTIVE';

  return (
    <tr className="group transition-colors hover:bg-subtle/40">
      {/* Code & Title */}
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold',
              isPercentage
                ? 'bg-purple-500/10 text-purple-600'
                : isFixed
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-blue-500/10 text-blue-600'
            )}
          >
            {isPercentage ? (
              <Percent className="h-4 w-4" />
            ) : isFixed ? (
              <DollarSign className="h-4 w-4" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                {discount.code}
              </span>
              <button
                type="button"
                onClick={() => onCopyCode(discount.code)}
                title="Copy code"
                className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">{discount.title}</p>
          </div>
        </div>
      </td>

      {/* Benefit / Value */}
      <td className="px-4 py-4">
        <div className="space-y-0.5">
          <span className="font-semibold text-ink">
            {isPercentage && `${discount.value}% Off`}
            {isFixed && `৳${discount.value} Flat Off`}
            {isFreeShip && 'Free Shipping'}
          </span>
          {discount.maxDiscountAmount && (
            <p className="text-[11px] text-ink-muted">
              Max Cap: ৳{discount.maxDiscountAmount}
            </p>
          )}
          {discount.minSubtotal && (
            <p className="text-[11px] text-ink-muted">
              Min Order: ৳{discount.minSubtotal}
            </p>
          )}
        </div>
      </td>

      {/* Usage */}
      <td className="px-4 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-ink">
            <span className="font-semibold">{discount.usedCount || 0}</span>
            <span className="text-ink-muted">
              / {discount.usageLimit ? discount.usageLimit : '∞'} uses
            </span>
          </div>
          <p className="text-[11px] text-ink-muted">
            {discount.usageLimitPerUser}x per customer
          </p>
        </div>
      </td>

      {/* Schedule */}
      <td className="px-4 py-4 text-ink-muted">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-ink-muted shrink-0" />
          <span>
            {formatDate(discount.startsAt)}
            {discount.endsAt ? ` – ${formatDate(discount.endsAt)}` : ' (Ongoing)'}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4 text-center">
        <Badge
          tone={
            discount.status === 'ACTIVE'
              ? 'success'
              : discount.status === 'SCHEDULED'
              ? 'info'
              : discount.status === 'DISABLED'
              ? 'warning'
              : 'neutral'
          }
          dot
        >
          {discount.status}
        </Badge>
      </td>

      {/* 3-Dot Actions Menu */}
      <td className="px-5 py-4 text-right">
        <div className="relative inline-block text-left" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={`Actions for discount ${discount.code}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-ink-muted transition-all duration-150 hover:border-line hover:bg-subtle hover:text-ink hover:shadow-xs focus:outline-none cursor-pointer"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-40 w-44 rounded-xl border border-line bg-surface p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 text-left">
              {/* 1. Toggle Status (Activate / Deactivate) */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onToggleStatus(discount);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'text-amber-700 hover:bg-amber-500/10'
                    : 'text-emerald-700 hover:bg-emerald-500/10'
                )}
              >
                <Power className="h-3.5 w-3.5 shrink-0" />
                <span>{isActive ? 'Disable Discount' : 'Activate Discount'}</span>
              </button>

              {/* 2. Edit */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(discount);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-subtle cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                <span>Edit Discount</span>
              </button>

              <div className="my-1 h-px bg-line" />

              {/* 3. Delete */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(discount);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger/10 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-danger shrink-0" />
                <span>Delete Discount</span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
