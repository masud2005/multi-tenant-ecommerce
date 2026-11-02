'use client';

import { useEffect, useRef } from 'react';
import { themeService } from '@/services/theme-service';
import {
  getEcommerceThemePreset,
  applyEcommerceTheme,
  DEFAULT_LIGHT_THEME_ID,
  findMatchingPresetId,
} from '@/components/dashboard/theme/ecommerce-themes';
import type { TenantTheme } from '@/types/theme';

export function StoreThemeInjector() {
  const lastThemeIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAndApply() {
      // 1. First check if user has local customized theme settings
      try {
        const raw = localStorage.getItem('tanti_theme_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.themePresetId) {
            const p = getEcommerceThemePreset(parsed.themePresetId);
            applyEcommerceTheme(p, parsed.themeStyle);
            return;
          }
        }
      } catch {
        // ignore
      }

      // 2. Otherwise fetch live theme from backend
      try {
        const res = await themeService.getLiveTheme();
        if (!isMounted) return;
        if (res && res.success && res.data) {
          const matchedId = findMatchingPresetId(res.data.primaryColor, res.data.canvasColor);
          const p = getEcommerceThemePreset(matchedId);
          applyEcommerceTheme(p, 'solid');
          lastThemeIdRef.current = res.data.id;
        }
      } catch {
        // Fallback gracefully to default preset
        const defaultPreset = getEcommerceThemePreset(DEFAULT_LIGHT_THEME_ID);
        applyEcommerceTheme(defaultPreset, 'solid');
      }
    }

    fetchAndApply();

    const handleThemePublished = (e: Event) => {
      const customEvent = e as CustomEvent<TenantTheme>;
      if (customEvent.detail) {
        const matchedId = findMatchingPresetId(
          customEvent.detail.primaryColor,
          customEvent.detail.canvasColor
        );
        const p = getEcommerceThemePreset(matchedId);
        applyEcommerceTheme(p, 'solid');
      } else {
        fetchAndApply();
      }
    };

    window.addEventListener('tanti-theme-published', handleThemePublished);

    return () => {
      isMounted = false;
      window.removeEventListener('tanti-theme-published', handleThemePublished);
    };
  }, []);

  return null;
}

export const AppThemeInjector = StoreThemeInjector;
