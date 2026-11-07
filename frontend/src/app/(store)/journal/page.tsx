'use client';

import React from 'react';
import Link from 'next/link';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';

export default function JournalPage() {
  const { tenant } = useTenant();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl">Journal</h1>
      <p className="mt-2 text-ink-muted">
        Stories, styling guides, and announcements from {tenant.name}.
      </p>

      <div className="mt-12 rounded-xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
        <h2 className="text-base font-semibold text-ink">No articles published yet</h2>
        <p className="mt-1 text-sm text-ink-muted max-w-md mx-auto">
          We haven’t published any stories or journal posts yet. Check back soon for new articles and updates!
        </p>
        <div className="mt-6">
          <Button href="/shop">Explore Shop</Button>
        </div>
      </div>
    </div>
  );
}
