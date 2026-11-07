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
  const model = useLandingModel(active);
  return <LandingSections config={active} model={model} />;
}

export function LandingHome() {
  const { config } = useLandingConfig();
  return <LandingRenderer config={config} />;
}
