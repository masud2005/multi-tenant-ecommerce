'use client';

import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { LandingConfig } from '@/lib/landing-config';
import { LandingSections } from './LandingSections';
import { useLandingConfig } from './useLandingConfig';
import { useLandingModel } from './useLandingModel';

export function LandingRenderer({ config }: { config?: LandingConfig }) {
  const stored = useLandingConfig();
  const active = config || stored.config;
  const model = useLandingModel();
  return <LandingSections config={active} model={model} />;
}

export function LandingHome() {
  const { config, ready } = useLandingConfig();
  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="md" label="Loading homepage..." />
      </div>
    );
  }
  return <LandingRenderer config={config} />;
}
