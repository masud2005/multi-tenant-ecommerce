'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, Smartphone, ExternalLink, RotateCw, Lock, Sparkles } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useStore } from '@/contexts/StoreContext';
import { products as seedProducts } from '@/data/products';
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

interface ThemePreviewCanvasProps {
  theme: TenantTheme;
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

export function ThemePreviewCanvas({ theme }: ThemePreviewCanvasProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { tenant } = useTenant();
  const { categories, products, recentlyViewed } = useStore();

  const storeName = tenant?.name || 'Store';

  // Ensure products are published so Bestsellers & NewArrivals sections render in preview
  const displayProducts = useMemo(() => {
    const base = products && products.length > 0 ? products : seedProducts;
    return base.map((p) => ({
      ...p,
      status: 'published' as const,
      isNew: p.isNew ?? true,
    }));
  }, [products]);

  // Ensure recentlyViewed has at least one item for the Recommended section to preview
  const displayRecentlyViewed = useMemo(() => {
    if (recentlyViewed && recentlyViewed.length > 0) return recentlyViewed;
    return displayProducts.length > 0 ? [displayProducts[0].id] : ['seed-1'];
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
      className="min-h-screen pb-16 transition-colors duration-200"
    >
      {/* Storefront Mini Header */}
      <header
        className="sticky top-0 z-30 border-b border-line px-4 py-3 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: theme.surfaceColor || '#ffffff',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span
              className="text-xl font-bold tracking-tight text-ink"
              style={{
                fontFamily: theme.fontHeading
                  ? `'${theme.fontHeading}', Georgia, serif`
                  : undefined,
              }}
            >
              {storeName}
            </span>
            {device === 'desktop' && (
              <nav className="flex items-center gap-4 text-xs font-medium text-ink-muted">
                {(categories && categories.length > 0
                  ? categories.slice(0, 5).map((c) => c.name)
                  : ['Women', 'Men', 'Heritage', 'Occasion', 'Sale']
                ).map((catName) => (
                  <span
                    key={catName}
                    className="cursor-default hover:text-ink transition-colors"
                  >
                    {catName}
                  </span>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="rounded px-2.5 py-1 text-xs font-medium text-white shadow-xs"
              style={{
                backgroundColor: theme.primaryColor,
                borderRadius: theme.borderRadius,
              }}
            >
              Shop Collection
            </span>
          </div>
        </div>
      </header>

      {/* Landing page sections rendered in order */}
      <main className="transition-opacity duration-300">
        {activeSections.length > 0 ? (
          activeSections.map((s) => renderSection(s.sectionType, s.id, s.label))
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <p className="text-base font-semibold text-ink">No active sections</p>
            <p className="mt-1 text-sm text-ink-muted">
              Toggle on section visibility in the Sections tab to preview them here.
            </p>
          </div>
        )}
      </main>

      {/* Mini Footer */}
      <footer
        className="mt-20 border-t border-line py-8 text-center text-xs text-ink-muted"
        style={{ backgroundColor: theme.surfaceColor || '#ffffff' }}
      >
        <p>© {new Date().getFullYear()} {storeName}. Powered by Tanti Platform.</p>
      </footer>
    </div>
  );

  return (
    <div className="rounded-lg border border-line bg-subtle p-4">
      {/* Top Preview Control Bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-ink">Live Storefront Preview</p>
          <span className="flex items-center gap-1 rounded bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Live Sync
          </span>
        </div>

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
        {/* Device Top Bar (Desktop Browser Bar or Mobile Notch) */}
        {device === 'desktop' ? (
          <div className="flex items-center justify-between border-b border-line bg-subtle px-3 py-2 text-xs text-ink-muted">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
            </div>
            <div className="flex items-center gap-1.5 rounded bg-surface px-3 py-0.5 text-[11px] font-mono text-ink-soft border border-line/60">
              <Lock className="h-2.5 w-2.5 text-success" />
              <span>https://store.orvio.test</span>
            </div>
            <div className="text-[10px] text-ink-muted font-mono">100% responsive</div>
          </div>
        ) : (
          <div className="flex items-center justify-center bg-ink/80 py-1.5">
            <div className="h-3.5 w-24 rounded-full bg-ink-muted/40 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-black/60 mr-2" />
              <span className="h-1 w-6 rounded-full bg-black/40" />
            </div>
          </div>
        )}

        {/* Viewport Frame with Iframe Portal */}
        <div className="relative h-[720px] w-full bg-canvas overflow-hidden">
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
