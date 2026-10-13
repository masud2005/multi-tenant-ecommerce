'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { CustomerSidebarContent } from './CustomerSidebarContent';
import { cn } from '@/utils/cn';

interface CustomerMobileSidebarProps {
  open: boolean;
  onClose: () => void;
  onLogoutClick?: () => void;
}

export function CustomerMobileSidebar({
  open,
  onClose,
  onLogoutClick,
}: CustomerMobileSidebarProps) {
  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-visibility duration-200 lg:hidden',
        open ? 'visible' : 'invisible pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Customer Mobile Navigation Drawer"
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-ink/50 backdrop-blur-xs transition-opacity duration-200 ease-out',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Drawer */}
      <aside
        className={cn(
          'absolute top-0 left-0 flex h-full w-72 max-w-[280px] flex-col bg-canvas border-r border-line shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex justify-end p-2 border-b border-line bg-canvas">
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink cursor-pointer transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <CustomerSidebarContent
            onItemClick={onClose}
            onLogoutClick={onLogoutClick}
          />
        </div>
      </aside>
    </div>
  );
}
