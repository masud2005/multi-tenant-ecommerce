'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Package, LifeBuoy, Shield, LogOut, ChevronDown, Wallet } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { formatBDT } from '@/utils/format';

interface CustomerUserDropdownProps {
  onLogoutClick?: () => void;
}

export function CustomerUserDropdown({ onLogoutClick }: CustomerUserDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, storeCredit } = useStore();

  const customerName = user?.name || user?.email?.split('@')[0] || 'Customer';
  const customerEmail = user?.email || '';
  const initials = customerName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CU';

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg p-1 hover:bg-subtle cursor-pointer transition-colors"
        aria-label="Customer profile menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-clay/15 text-xs font-bold text-clay shrink-0 ring-1 ring-clay/20">
          {initials}
        </span>
        <div className="hidden leading-tight md:block text-left max-w-[120px]">
          <p className="truncate text-xs font-semibold text-ink">{customerName}</p>
          <p className="truncate text-[10px] text-ink-muted">VIP Member</p>
        </div>
        <ChevronDown className="hidden md:block h-3.5 w-3.5 text-ink-muted" />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-line bg-surface shadow-xl py-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {/* User Header */}
          <div className="px-3.5 py-2.5 border-b border-line">
            <p className="text-xs font-bold text-ink">{customerName}</p>
            <p className="text-[11px] text-ink-muted truncate">{customerEmail}</p>
            <div className="mt-2 flex items-center justify-between rounded-md bg-subtle px-2 py-1 text-[11px]">
              <span className="flex items-center gap-1 text-ink-muted">
                <Wallet className="h-3 w-3 text-clay" /> Credit
              </span>
              <span className="font-semibold text-ink">
                {formatBDT(storeCredit || 500)}
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-ink hover:bg-subtle transition-colors cursor-pointer"
            >
              <User className="h-4 w-4 text-ink-muted" />
              <span>Profile Settings</span>
            </Link>

            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-ink hover:bg-subtle transition-colors cursor-pointer"
            >
              <Package className="h-4 w-4 text-ink-muted" />
              <span>My Orders</span>
            </Link>

            <Link
              href="/account/support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-ink hover:bg-subtle transition-colors cursor-pointer"
            >
              <LifeBuoy className="h-4 w-4 text-ink-muted" />
              <span>Live Support & Chat</span>
            </Link>

            <Link
              href="/account/security"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-ink hover:bg-subtle transition-colors cursor-pointer"
            >
              <Shield className="h-4 w-4 text-ink-muted" />
              <span>Password & Security</span>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-line pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                if (onLogoutClick) onLogoutClick();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
