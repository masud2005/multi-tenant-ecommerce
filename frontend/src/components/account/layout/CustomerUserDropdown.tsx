'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Package, LifeBuoy, Shield, LogOut } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

interface CustomerUserDropdownProps {
  onLogoutClick?: () => void;
}

export function CustomerUserDropdown({ onLogoutClick }: CustomerUserDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useStore();

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
        className="flex items-center gap-2 pl-1 rounded-md p-1 hover:bg-subtle cursor-pointer transition-colors"
        aria-label="User profile menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-line text-xs font-semibold text-ink shrink-0">
          {initials}
        </span>
        <div className="hidden leading-tight md:block text-left">
          <p className="whitespace-nowrap text-sm font-medium text-ink">{customerName}</p>
          <p className="whitespace-nowrap text-xs text-ink-muted">Customer Account</p>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-line bg-surface shadow-pop py-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {/* User Header */}
          <div className="px-3 py-2 border-b border-line">
            <p className="text-xs font-semibold text-ink">{customerName}</p>
            <p className="text-xs text-ink-muted truncate">{customerEmail}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-ink hover:bg-subtle transition-colors cursor-pointer"
            >
              <User className="h-4 w-4 text-ink-muted" />
              <span>Profile Settings</span>
            </Link>

            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-ink hover:bg-subtle transition-colors cursor-pointer"
            >
              <Package className="h-4 w-4 text-ink-muted" />
              <span>My Orders</span>
            </Link>

            <Link
              href="/account/support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-ink hover:bg-subtle transition-colors cursor-pointer"
            >
              <LifeBuoy className="h-4 w-4 text-ink-muted" />
              <span>Live Support & Chat</span>
            </Link>

            <Link
              href="/account/security"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-ink hover:bg-subtle transition-colors cursor-pointer"
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
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs text-danger hover:bg-subtle cursor-pointer transition-colors"
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
