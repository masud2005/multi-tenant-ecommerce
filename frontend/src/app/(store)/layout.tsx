import React from 'react';
import { StoreProvider } from '@/contexts/StoreContext';
import { StoreShell } from '@/components/store/layout';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <StoreShell>{children}</StoreShell>
    </StoreProvider>
  );
}

