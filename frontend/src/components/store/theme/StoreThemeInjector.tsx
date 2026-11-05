'use client';

import { useEffect } from 'react';
import { themeService } from '@/services/theme-service';
import {
  getEcommerceThemePreset,
  applyEcommerceTheme,
  DEFAULT_LIGHT_THEME_ID,
  findMatchingPresetId,
} from '@/components/dashboard/theme/ecommerce-themes';
import { THEME_STORAGE_KEY, type ThemeSettingsState } from '@/contexts/ThemeContext';
import type { TenantTheme } from '@/types/theme';

function applyStoredTheme(): boolean {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<ThemeSettingsState>;
    if (!parsed?.themePresetId) return false;
    const preset = getEcommerceThemePreset(parsed.themePresetId);
    const style = parsed.themeStyle === 'gradient' ? 'gradient' : parsed.themeStyle === 'solid' ? 'solid' : preset.style;
    applyEcommerceTheme(preset, style);
    return true;
  } catch {
    return false;
  }
}

export function StoreThemeInjector() {
  useEffect(() => {
    let cancelled = false;

    async function fetchAndApply() {
      if (applyStoredTheme()) return;

      try {
        const res = await themeService.getLiveTheme();
        if (cancelled || applyStoredTheme()) return;
        if (res && res.success && res.data) {
          const matchedId = findMatchingPresetId(res.data.primaryColor, res.data.canvasColor);
          const preset = getEcommerceThemePreset(matchedId);
          applyEcommerceTheme(preset, 'solid');
          return;
        }
      } catch {
        if (cancelled || applyStoredTheme()) return;
        applyEcommerceTheme(getEcommerceThemePreset(DEFAULT_LIGHT_THEME_ID), 'solid');
      }
    }

    fetchAndApply();

    const onLocalChange = () => {
      applyStoredTheme();
    };

    const onPublished = (event: Event) => {
      if (applyStoredTheme()) return;
      const detail = (event as CustomEvent<TenantTheme>).detail;
      if (!detail) return;
      const matchedId = findMatchingPresetId(detail.primaryColor, detail.canvasColor);
      applyEcommerceTheme(getEcommerceThemePreset(matchedId), 'solid');
    };

    window.addEventListener('tanti-theme-changed', onLocalChange);
    window.addEventListener('storage', onLocalChange);
    window.addEventListener('tanti-theme-published', onPublished);

    return () => {
      cancelled = true;
      window.removeEventListener('tanti-theme-changed', onLocalChange);
      window.removeEventListener('storage', onLocalChange);
      window.removeEventListener('tanti-theme-published', onPublished);
    };
  }, []);

  return null;
}

export const AppThemeInjector = StoreThemeInjector;
