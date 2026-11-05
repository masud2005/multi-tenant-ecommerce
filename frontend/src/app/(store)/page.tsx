'use client';

import React from 'react';
import { useStore } from '@/contexts/StoreContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LandingHome } from '@/components/store/landing';

export default function HomePage() {
  const { isStoreLoading } = useStore();

  if (isStoreLoading) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center py-24">
        <LoadingSpinner size="lg" label="Loading store experience..." />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <LandingHome />
    </div>
  );
}
