'use client';

import { useEffect, useRef } from 'react';
import { themeService } from '@/services/theme-service';
import type { TenantTheme } from '@/types/theme';

// Converts hex color to space-separated RGB channels for CSS variables
export function hexToRgbChannels(hex?: string): string | null {
  if (!hex) return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r} ${g} ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  return null;
}

// Dynamically loads Google Fonts for custom typography
function ensureGoogleFontLoaded(fontName?: string) {
  if (!fontName || typeof document === 'undefined') return;
  const clean = fontName.trim();
  const builtIn = ['Inter', 'Fraunces', 'system-ui', 'sans-serif', 'serif', 'monospace', 'Geist'];
  if (builtIn.includes(clean)) return;

  const id = `gfont-${clean.toLowerCase().replace(/\s+/g, '-')}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(clean)}:ital,wght@0,400..700;1,400..700&display=swap`;
    document.head.appendChild(link);
  }
}

// Applies theme tokens as CSS variables on document root
export function applyThemeToRoot(t: TenantTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const clayRgb = hexToRgbChannels(t.primaryColor);
  const canvasRgb = hexToRgbChannels(t.canvasColor);
  const surfaceRgb = hexToRgbChannels(t.surfaceColor);
  const inkRgb = hexToRgbChannels(t.inkColor);
  const accentRgb = hexToRgbChannels(t.accentColor);

  // Core brand colors
  if (clayRgb) {
    root.style.setProperty('--clay', clayRgb);
    root.style.setProperty('--primary', clayRgb);
    root.style.setProperty('--ring', clayRgb);
  }
  if (canvasRgb) {
    root.style.setProperty('--canvas', canvasRgb);
  }
  if (surfaceRgb) {
    root.style.setProperty('--surface', surfaceRgb);
    root.style.setProperty('--card', surfaceRgb);
    root.style.setProperty('--popover', surfaceRgb);
  }
  if (inkRgb) {
    root.style.setProperty('--ink', inkRgb);
  }

  // Derive clay variants for hover and soft backgrounds
  if (t.primaryColor) {
    const clean = t.primaryColor.replace('#', '').trim();
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const dr = Math.max(0, Math.round(r * 0.8));
        const dg = Math.max(0, Math.round(g * 0.8));
        const db = Math.max(0, Math.round(b * 0.8));
        root.style.setProperty('--clay-dark', `${dr} ${dg} ${db}`);

        const sr = Math.min(255, Math.round(r + (255 - r) * 0.85));
        const sg = Math.min(255, Math.round(g + (255 - g) * 0.85));
        const sb = Math.min(255, Math.round(b + (255 - b) * 0.85));
        root.style.setProperty('--clay-soft', `${sr} ${sg} ${sb}`);
      }
    }
  }

  // Derive subtle and line shades from canvas color
  if (t.canvasColor) {
    const clean = t.canvasColor.replace('#', '').trim();
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const subR = Math.max(0, Math.round(r * 0.96));
        const subG = Math.max(0, Math.round(g * 0.96));
        const subB = Math.max(0, Math.round(b * 0.96));
        root.style.setProperty('--subtle', `${subR} ${subG} ${subB}`);

        const lineR = Math.max(0, Math.round(r * 0.91));
        const lineG = Math.max(0, Math.round(g * 0.91));
        const lineB = Math.max(0, Math.round(b * 0.91));
        root.style.setProperty('--line', `${lineR} ${lineG} ${lineB}`);
      }
    }
  }

  // Derive soft and muted text colors from ink color
  if (t.inkColor) {
    const clean = t.inkColor.replace('#', '').trim();
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const softR = Math.round(r * 0.7 + 255 * 0.3);
        const softG = Math.round(g * 0.7 + 255 * 0.3);
        const softB = Math.round(b * 0.7 + 255 * 0.3);
        root.style.setProperty('--ink-soft', `${softR} ${softG} ${softB}`);

        const mutedR = Math.round(r * 0.45 + 255 * 0.55);
        const mutedG = Math.round(g * 0.45 + 255 * 0.55);
        const mutedB = Math.round(b * 0.45 + 255 * 0.55);
        root.style.setProperty('--ink-muted', `${mutedR} ${mutedG} ${mutedB}`);
      }
    }
  }

  if (accentRgb) root.style.setProperty('--accent-rgb', accentRgb);

  // Typography
  if (t.fontHeading) {
    ensureGoogleFontLoaded(t.fontHeading);
    root.style.setProperty(
      '--font-display',
      `'${t.fontHeading}', 'Fraunces', Georgia, serif`
    );
    root.style.setProperty(
      '--font-heading',
      `'${t.fontHeading}', 'Fraunces', Georgia, serif`
    );
  }
  if (t.fontBody) {
    ensureGoogleFontLoaded(t.fontBody);
    root.style.setProperty(
      '--font-sans',
      `'${t.fontBody}', 'Inter', system-ui, sans-serif`
    );
  }

  if (t.borderRadius) {
    root.style.setProperty('--radius', t.borderRadius);
  }

  // Card style attribute for global product card ratio
  if (t.cardStyle) {
    root.setAttribute('data-card-style', t.cardStyle);
  }

  // Inject tenant custom CSS if provided
  const existingCustom = document.getElementById('tanti-custom-css');
  if (t.customCss) {
    if (existingCustom) {
      existingCustom.textContent = t.customCss;
    } else {
      const style = document.createElement('style');
      style.id = 'tanti-custom-css';
      style.textContent = t.customCss;
      document.head.appendChild(style);
    }
  } else if (existingCustom) {
    existingCustom.remove();
  }
}

// Injects live tenant theme CSS variables globally at root
export function StoreThemeInjector() {
  const lastThemeIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAndApply() {
      try {
        const res = await themeService.getLiveTheme();
        if (!isMounted) return;
        if (res.success && res.data) {
          applyThemeToRoot(res.data);
          lastThemeIdRef.current = res.data.id;
        }
      } catch {
        // Fallback gracefully to default CSS
      }
    }

    fetchAndApply();

    // Listen for instant publish updates
    const handleThemePublished = (e: Event) => {
      const customEvent = e as CustomEvent<TenantTheme>;
      if (customEvent.detail) {
        applyThemeToRoot(customEvent.detail);
      } else {
        fetchAndApply();
      }
    };

    window.addEventListener('tanti-theme-published', handleThemePublished);

    // Poll every 15s for cross-tab sync
    const interval = setInterval(fetchAndApply, 15_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('tanti-theme-published', handleThemePublished);
    };
  }, []);

  return null;
}

export const AppThemeInjector = StoreThemeInjector;
