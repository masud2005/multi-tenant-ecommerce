'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  side?: 'right' | 'left';
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-md',
  side = 'right'
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className={cn(
          'relative z-10 flex h-full w-full flex-col bg-surface shadow-pop border-line animate-in duration-200 ease-out',
          width,
          side === 'right'
            ? 'ml-auto border-l slide-in-from-right'
            : 'mr-auto border-r slide-in-from-left'
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-ink truncate">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-ink-muted break-words">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 rounded-md p-1.5 text-ink-muted hover:bg-subtle hover:text-ink transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && <footer className="border-t border-line px-5 py-4 shrink-0 bg-canvas/40">{footer}</footer>}
      </aside>
    </div>
  );
}
