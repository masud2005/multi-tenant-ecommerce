'use client';

import { useEffect } from 'react';
import { themeService } from '@/services/theme-service';
import {
  applyEcommerceTheme,
  DEFAULT_LIGHT_THEME_ID,
  getEcommerceThemePreset,
} from '@/components/dashboard/theme/ecommerce-themes';
import { applyPublishedTheme, LIVE_THEME_CACHE_KEY, type LiveThemeRef } from '@/lib/live-theme';
import type { TenantTheme } from '@/types/theme';

function readCachedLive(): LiveThemeRef | null {
  try {
    const raw = localStorage.getItem(LIVE_THEME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveThemeRef;
    if (!parsed?.updatedAt || !parsed.primaryColor) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function StoreThemeInjector() {
  useEffect(() => {
    let cancelled = false;

    async function syncLiveTheme() {
      try {
        const res = await themeService.getLiveTheme();
        if (cancelled) return;
        if (res?.success && res.data?.primaryColor) {
          const cached = readCachedLive();
          if (!cached || cached.updatedAt !== res.data.updatedAt || cached.primaryColor !== res.data.primaryColor) {
            applyPublishedTheme(res.data);
          } else {
            applyPublishedTheme(cached);
          }
          return;
        }
      } catch {
        if (cancelled) return;
      }

      const cached = readCachedLive();
      if (cached) {
        applyPublishedTheme(cached);
        return;
      }
      applyEcommerceTheme(getEcommerceThemePreset(DEFAULT_LIGHT_THEME_ID), 'solid');
    }

    syncLiveTheme();

    const onPublished = (event: Event) => {
      const detail = (event as CustomEvent<TenantTheme>).detail;
      if (detail?.primaryColor) applyPublishedTheme(detail);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === LIVE_THEME_CACHE_KEY) syncLiveTheme();
    };

    window.addEventListener('tanti-theme-published', onPublished);
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener('tanti-theme-published', onPublished);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return null;
}

export const AppThemeInjector = StoreThemeInjector;
