'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, Smartphone, ExternalLink, RotateCw } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useStore } from '@/contexts/StoreContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import type { TenantTheme, ThemeSection } from '@/types/theme';
import {
  HeroBanner,
  CategorySection,
  Bestsellers,
  SummerLinenSpotlight,
  NewArrivals,
  TrustPoints,
  Testimonials,
  Recommended,
} from '@/components/store/home';
import { LandingHome } from '@/components/store/landing';
import { StoreFooter, StoreHeader } from '@/components/store/layout';

interface ThemePreviewCanvasProps {
  theme: TenantTheme;
  focus?: 'landing' | 'sections';
}

// Converts hex color to space-separated RGB channels for CSS variables
function hexToRgbChannels(hex?: string): string | null {
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

// Compute dynamic CSS variables reflecting the live theme tokens
function getThemeCssVars(t: TenantTheme): React.CSSProperties {
  const vars: Record<string, string> = {};

  const clayRgb = hexToRgbChannels(t.primaryColor);
  const canvasRgb = hexToRgbChannels(t.canvasColor);
  const surfaceRgb = hexToRgbChannels(t.surfaceColor);
  const inkRgb = hexToRgbChannels(t.inkColor);
  const accentRgb = hexToRgbChannels(t.accentColor);

  if (clayRgb) vars['--clay'] = clayRgb;
  if (canvasRgb) vars['--canvas'] = canvasRgb;
  if (surfaceRgb) vars['--surface'] = surfaceRgb;
  if (inkRgb) vars['--ink'] = inkRgb;
  if (accentRgb) vars['--accent-rgb'] = accentRgb;

  if (canvasRgb && t.canvasColor) {
    const clean = t.canvasColor.replace('#', '').trim();
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      const isDarkBg = (r * 0.299 + g * 0.587 + b * 0.114) < 140;

      if (isDarkBg) {
        vars['--subtle'] = `${Math.min(255, r + 18)} ${Math.min(255, g + 18)} ${Math.min(255, b + 26)}`;
        vars['--line'] = `${Math.min(255, r + 36)} ${Math.min(255, g + 36)} ${Math.min(255, b + 48)}`;
      } else {
        vars['--subtle'] = `${Math.max(0, Math.round(r * 0.96))} ${Math.max(0, Math.round(g * 0.96))} ${Math.max(0, Math.round(g * 0.96))}`;
        vars['--line'] = `${Math.max(0, Math.round(r * 0.91))} ${Math.max(0, Math.round(g * 0.91))} ${Math.max(0, Math.round(g * 0.91))}`;
      }
    }
  }

  if (inkRgb && t.inkColor) {
    const clean = t.inkColor.replace('#', '').trim();
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      const isLightText = (r * 0.299 + g * 0.587 + b * 0.114) > 140;

      if (isLightText) {
        vars['--ink-soft'] = `${Math.round(r * 0.85)} ${Math.round(g * 0.85)} ${Math.round(b * 0.85)}`;
        vars['--ink-muted'] = `${Math.round(r * 0.65)} ${Math.round(g * 0.65)} ${Math.round(b * 0.65)}`;
      } else {
        vars['--ink-soft'] = `${Math.round(r * 0.7 + 255 * 0.3)} ${Math.round(g * 0.7 + 255 * 0.3)} ${Math.round(b * 0.7 + 255 * 0.3)}`;
        vars['--ink-muted'] = `${Math.round(r * 0.45 + 255 * 0.55)} ${Math.round(g * 0.45 + 255 * 0.55)} ${Math.round(b * 0.45 + 255 * 0.55)}`;
      }
    }
  }

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
        vars['--clay-dark'] = `${dr} ${dg} ${db}`;
        const sr = Math.min(255, Math.round(r + (255 - r) * 0.85));
        const sg = Math.min(255, Math.round(g + (255 - g) * 0.85));
        const sb = Math.min(255, Math.round(b + (255 - b) * 0.85));
        vars['--clay-soft'] = `${sr} ${sg} ${sb}`;
      }
    }
  }

  if (t.borderRadius) {
    vars['--radius'] = t.borderRadius;
  }

  if (t.fontHeading) {
    vars['--font-display'] = `'${t.fontHeading}', 'Fraunces', Georgia, serif`;
  }
  if (t.fontBody) {
    vars['--font-sans'] = `'${t.fontBody}', 'Inter', system-ui, sans-serif`;
  }

  return {
    ...vars,
    backgroundColor: t.canvasColor || '#F7F4EF',
    color: t.inkColor || '#1C1A17',
    fontFamily: t.fontBody ? `'${t.fontBody}', 'Inter', sans-serif` : undefined,
  } as React.CSSProperties;
}

export function ThemePreviewCanvas({ theme, focus = 'landing' }: ThemePreviewCanvasProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { tenant } = useTenant();
  const { categories, products, recentlyViewed } = useStore();

  const storeName = tenant?.name || 'Store';

  // Use real store products only — empty catalog means empty product sections in preview
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.map((p) => ({
      ...p,
      status: 'published' as const,
      isNew: p.isNew ?? true,
    }));
  }, [products]);

  const displayRecentlyViewed = useMemo(() => {
    if (recentlyViewed && recentlyViewed.length > 0) return recentlyViewed;
    return displayProducts.length > 0 ? [displayProducts[0].id] : [];
  }, [recentlyViewed, displayProducts]);

  // Active theme sections sorted by orderIndex
  const activeSections = useMemo(() => {
    if (!theme?.sections || theme.sections.length === 0) return [];
    return [...theme.sections]
      .filter((s) => s.isVisible)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [theme?.sections]);

  // Setup iframe document and sync styles
  const setupIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Base HTML template if empty
      if (!doc.getElementById('preview-root')) {
        doc.open();
        doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      html, body {
        margin: 0;
        padding: 0;
        min-height: 100%;
        overflow-x: hidden;
      }
      /* Custom override for square product card preview */
      [data-card-style="square-minimal"] article img.aspect-\\[3\\/4\\] {
        aspect-ratio: 1 / 1 !important;
      }
    </style>
  </head>
  <body>
    <div id="preview-root"></div>
  </body>
</html>`);
        doc.close();
      }

      // Clone stylesheets & fonts from main window into iframe
      const existingInjected = doc.head.querySelectorAll('[data-preview-injected="true"]');
      existingInjected.forEach((node) => node.remove());

      document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute('data-preview-injected', 'true');
        doc.head.appendChild(clone);
      });

      // Google Fonts for Fraunces, Inter, Playfair Display, Plus Jakarta Sans
      const fontLink = doc.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.setAttribute('data-preview-injected', 'true');
      fontLink.href =
        'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
      doc.head.appendChild(fontLink);

      const root = doc.getElementById('preview-root') || doc.body;
      setMountNode(root);
      setIsInitializing(false);
    } catch (err) {
      console.error('Failed to setup preview iframe:', err);
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    setupIframe();
  }, [setupIframe]);

  // Sync dark class on the iframe html document based on background brightness
  useEffect(() => {
    if (iframeRef.current?.contentDocument && theme.canvasColor) {
      const clean = theme.canvasColor.replace('#', '').trim();
      if (clean.length === 6) {
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        const isDark = (r * 0.299 + g * 0.587 + b * 0.114) < 140;
        iframeRef.current.contentDocument.documentElement.classList.toggle('dark', isDark);
      }
    }
  }, [theme.canvasColor]);

  // Capture navigation clicks inside the preview so the admin doesn't navigate away
  const handlePreventNavigation = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('a, button');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Component registry mapping section types to actual store landing page components
  const renderSection = (type: string, key: string, label?: string) => {
    switch (type) {
      case 'HERO_BANNER':
        return <HeroBanner key={key} />;
      case 'CATEGORY_GRID':
        return <CategorySection key={key} title={label || 'Shop by category'} />;
      case 'BESTSELLERS':
        return <Bestsellers key={key} products={displayProducts} />;
      case 'SUMMER_SPOTLIGHT':
        return <SummerLinenSpotlight key={key} />;
      case 'NEW_ARRIVALS':
        return <NewArrivals key={key} products={displayProducts} />;
      case 'TRUST_POINTS':
        return <TrustPoints key={key} />;
      case 'TESTIMONIALS':
        return <Testimonials key={key} />;
      case 'RECOMMENDED':
        return (
          <Recommended
            key={key}
            products={displayProducts}
            recentlyViewed={displayRecentlyViewed}
          />
        );
      default:
        return (
          <div
            key={key}
            className="mx-auto my-6 max-w-7xl rounded-md border border-line bg-surface p-6 text-center text-sm text-ink-muted"
          >
            {label || type} Section
          </div>
        );
    }
  };

  const themeStyles = useMemo(() => getThemeCssVars(theme), [theme]);

  // Content rendered inside the iframe portal
  const previewContent = (
    <div
      style={themeStyles}
      data-card-style={theme.cardStyle || 'portrait-hover'}
      onClickCapture={handlePreventNavigation}
      className="relative min-h-full bg-canvas text-ink"
    >
      <Suspense fallback={null}>
        <StoreHeader />
      </Suspense>
      <main>
        <LandingHome />
      </main>
      <StoreFooter />
    </div>
  );

  return (
    <div className="rounded-lg border border-line bg-subtle p-4">
      {/* Top Preview Control Bar */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">Live Storefront Preview</p>

        <div className="flex items-center gap-2">
          {/* Device Toggle */}
          <div
            className="flex rounded-md border border-line bg-surface p-0.5"
            role="group"
            aria-label="Preview device"
          >
            {(
              [
                ['desktop', Monitor, 'Desktop View'],
                ['mobile', Smartphone, 'Mobile View'],
              ] as const
            ).map(([d, Icon, title]) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                aria-pressed={device === d}
                aria-label={title}
                title={title}
                className={cn(
                  'rounded px-2.5 py-1 text-xs cursor-pointer transition-colors flex items-center gap-1.5',
                  device === d
                    ? 'bg-ink text-canvas font-medium shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="capitalize">{d}</span>
              </button>
            ))}
          </div>

          {/* Reload Preview Iframe */}
          <button
            type="button"
            onClick={setupIframe}
            title="Refresh preview canvas"
            aria-label="Refresh preview canvas"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          {/* Open Actual Live Storefront in New Tab */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open live storefront in new tab"
            className="flex items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-subtle transition-colors cursor-pointer"
          >
            <span>Live store</span>
            <ExternalLink className="h-3 w-3 text-ink-muted" />
          </a>
        </div>
      </div>

      {/* Device Viewport Wrapper */}
      <div
        className={cn(
          'mx-auto overflow-hidden transition-all duration-300 ease-out',
          device === 'mobile'
            ? 'w-[375px] max-w-full rounded-[32px] border-[8px] border-ink/80 shadow-2xl bg-canvas'
            : 'w-full rounded-md border border-line bg-surface shadow-xs'
        )}
      >
        <div className="relative h-[calc(100dvh-11rem)] min-h-[560px] w-full overflow-hidden bg-canvas">
          <iframe
            ref={iframeRef}
            title="Theme Live Storefront Preview"
            className="h-full w-full border-0 bg-canvas"
          />

          {/* Portal rendered directly inside the iframe */}
          {mountNode && createPortal(previewContent, mountNode)}

          {/* Initial loading state */}
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas/80 backdrop-blur-xs">
              <LoadingSpinner size="md" label="Rendering live landing page..." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
