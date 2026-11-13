'use client';

import React from 'react';
import { useTenant } from '@/contexts/TenantContext';

export function TrustPoints() {
  const { tenant } = useTenant();
  const trustPoints = tenant.settings?.trustPoints ?? [];

  if (trustPoints.length === 0) return null;

  return (
    <section
      className="mt-24 border-y border-line bg-surface"
      aria-label="Store Promises"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {trustPoints.map((t) => (
          <div key={t.title}>
            <p className="font-display text-lg text-ink font-medium">{t.title}</p>
            <p className="mt-1.5 text-sm text-ink-muted">{t.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Alias for backward-compatibility
export const TrustPointsSection = TrustPoints;
