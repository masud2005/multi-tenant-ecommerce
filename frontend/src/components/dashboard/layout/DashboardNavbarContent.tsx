'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Palette, Sun, Moon } from 'lucide-react';
import { DashboardMobileSidebar } from './DashboardMobileSidebar';
import { NotificationBell } from './NotificationBell';
import { UserDropdown } from './UserDropdown';
import { CommandPalette } from '@/components/dashboard/shared/CommandPalette';
import { EcommerceThemeModal } from '@/components/dashboard/theme/EcommerceThemeModal';
import { useTheme } from '@/contexts/ThemeContext';
import type { NavItem } from '@/config/menu-items';
import type { UserInfo } from '@/types/user';

interface DashboardNavbarContentProps {
  user?: UserInfo;
  navItems: NavItem[];
}

export function DashboardNavbarContent({
  user,
  navItems,
}: DashboardNavbarContentProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const { colorMode, toggleColorMode } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4">
        {/* Left: Mobile Sidebar Trigger + Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          {/* Mobile menu drawer trigger */}
          <DashboardMobileSidebar navItems={navItems} user={user} />

          {/* Global Search Bar button matching exact e-commerce styling */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="relative flex h-9 w-full items-center gap-2 rounded-md border border-line bg-canvas px-3 text-sm text-ink-muted hover:border-line-strong transition-colors cursor-pointer text-left"
          >
            <Search className="h-4 w-4 text-ink-muted shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">Search orders, products, customers…</span>
            <kbd className="hidden rounded border border-line bg-surface px-1.5 py-0.5 text-xs font-medium text-ink-muted sm:inline select-none">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Plan badge, Theme Studio button, Mode Toggle, Notifications, and User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Subscription Plan Badge */}
          <Link
            href="/admin/billing"
            className="hidden whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-ink hover:text-ink transition-colors sm:inline-block"
          >
            Growth plan
          </Link>

          {/* Theme & Ambience Studio Button */}
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted hover:bg-subtle hover:text-ink transition-colors cursor-pointer"
            aria-label="Customize store theme atmosphere"
            title="Theme & Ambience Studio"
          >
            <Palette className="h-4 w-4" />
          </button>

          {/* Daylight / Midnight Mode Quick Toggle */}
          <button
            type="button"
            onClick={toggleColorMode}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted hover:bg-subtle hover:text-ink transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
            title={colorMode === 'dark' ? 'Switch to Daylight' : 'Switch to Midnight'}
          >
            {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications Popover */}
          <NotificationBell user={user} />

          {/* User Account / Profile Dropdown */}
          <UserDropdown user={user} />
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Global Theme Studio Modal */}
      <EcommerceThemeModal open={themeModalOpen} onOpenChange={setThemeModalOpen} />
    </>
  );
}
