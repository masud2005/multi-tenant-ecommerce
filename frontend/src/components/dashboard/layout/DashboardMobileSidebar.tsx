'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { DashboardSidebarContent } from './DashboardSidebarContent';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config/menu-items';
import type { UserInfo } from '@/types/user';

interface DashboardMobileSidebarProps {
  navItems: NavItem[];
  user?: UserInfo;
}

export function DashboardMobileSidebar({
  navItems,
  user,
}: DashboardMobileSidebarProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden rounded-md p-1.5 text-ink hover:bg-subtle cursor-pointer transition-colors"
        aria-label="Open dashboard menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Drawer Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 transition-visibility duration-200',
          open ? 'visible' : 'invisible pointer-events-none'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Drawer"
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-ink/40 transition-opacity duration-200 ease-out',
            open ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />

        {/* Sliding Drawer Content */}
        <aside
          className={cn(
            'absolute top-0 left-0 flex h-full w-64 max-w-[260px] flex-col bg-canvas border-r border-line shadow-pop transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex justify-end p-2 border-b border-line bg-canvas">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink cursor-pointer transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <DashboardSidebarContent
              navItems={navItems}
              user={user}
              onItemClick={() => setOpen(false)}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
