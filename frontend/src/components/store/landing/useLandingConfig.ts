'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_LANDING_CONFIG,
  LANDING_CHANGE_EVENT,
  LANDING_STORAGE_KEY,
  readLandingConfig,
  writeLandingConfig,
  type LandingConfig,
} from '@/lib/landing-config';

export function useLandingConfig() {
  const [config, setConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConfig(readLandingConfig());
    setReady(true);

    const sync = () => setConfig(readLandingConfig());
    const onStorage = (event: StorageEvent) => {
      if (event.key === LANDING_STORAGE_KEY) sync();
    };

    window.addEventListener(LANDING_CHANGE_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LANDING_CHANGE_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const save = useCallback((next: LandingConfig) => {
    writeLandingConfig(next);
    setConfig(readLandingConfig());
  }, []);

  return { config, ready, save };
}
