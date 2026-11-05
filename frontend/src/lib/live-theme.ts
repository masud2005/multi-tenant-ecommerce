import {
  applyEcommerceTheme,
  findMatchingPresetId,
  getEcommerceThemePreset,
} from '@/components/dashboard/theme/ecommerce-themes';
import type { TenantTheme } from '@/types/theme';

export const LIVE_THEME_CACHE_KEY = 'tanti_live_theme';

export type LiveThemeRef = Pick<
  TenantTheme,
  | 'id'
  | 'updatedAt'
  | 'primaryColor'
  | 'canvasColor'
  | 'surfaceColor'
  | 'inkColor'
  | 'fontHeading'
  | 'fontBody'
  | 'borderRadius'
  | 'cardStyle'
>;

function hexToRgb(hex?: string) {
  if (!hex) return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return `${parseInt(clean[0] + clean[0], 16)} ${parseInt(clean[1] + clean[1], 16)} ${parseInt(clean[2] + clean[2], 16)}`;
  }
  if (clean.length === 6) {
    return `${parseInt(clean.slice(0, 2), 16)} ${parseInt(clean.slice(2, 4), 16)} ${parseInt(clean.slice(4, 6), 16)}`;
  }
  return null;
}

/** Apply saved tokens, including corner radius and color overrides, on top of the closest preset. */
export function applyPublishedTheme(theme: LiveThemeRef) {
  const preset = getEcommerceThemePreset(
    findMatchingPresetId(theme.primaryColor, theme.canvasColor)
  );
  applyEcommerceTheme(preset, preset.style);

  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme.borderRadius) root.style.setProperty('--radius', theme.borderRadius);
  if (theme.cardStyle) root.setAttribute('data-card-style', theme.cardStyle);
  if (theme.fontHeading) {
    root.style.setProperty('--font-display', `'${theme.fontHeading}', Georgia, serif`);
    root.style.setProperty('--font-heading', `'${theme.fontHeading}', Georgia, serif`);
  }
  if (theme.fontBody) {
    root.style.setProperty('--font-sans', `'${theme.fontBody}', Inter, system-ui, sans-serif`);
  }

  const clay = hexToRgb(theme.primaryColor);
  const canvas = hexToRgb(theme.canvasColor);
  const surface = hexToRgb(theme.surfaceColor);
  const ink = hexToRgb(theme.inkColor);
  if (clay) root.style.setProperty('--clay', clay);
  if (canvas) root.style.setProperty('--canvas', canvas);
  if (surface) root.style.setProperty('--surface', surface);
  if (ink) root.style.setProperty('--ink', ink);
  if (theme.primaryColor) root.style.setProperty('--primary', theme.primaryColor);
  if (theme.canvasColor) root.style.setProperty('--background', theme.canvasColor);

  try {
    localStorage.setItem(
      LIVE_THEME_CACHE_KEY,
      JSON.stringify({
        id: theme.id,
        updatedAt: theme.updatedAt,
        primaryColor: theme.primaryColor,
        canvasColor: theme.canvasColor,
        surfaceColor: theme.surfaceColor,
        inkColor: theme.inkColor,
        fontHeading: theme.fontHeading,
        fontBody: theme.fontBody,
        borderRadius: theme.borderRadius,
        cardStyle: theme.cardStyle,
      })
    );
  } catch {
    // cache is only for the next paint
  }
}
