'use client';

import React from 'react';
import { CustomerSidebarContent } from './CustomerSidebarContent';

interface CustomerSidebarProps {
  onLogoutClick?: () => void;
}

export function CustomerSidebar({ onLogoutClick }: CustomerSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-40 border-r border-line bg-canvas">
      <CustomerSidebarContent onLogoutClick={onLogoutClick} />
    </aside>
  );
}
