'use client';

import React, { useState, useMemo } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Layout,
  Type,
} from 'lucide-react';
import { Panel } from '@/components/dashboard/shared/Panel';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import {
  ECOMMERCE_THEMES,
  type EcommerceThemePreset,
  type ThemeStyle,
  getEcommerceThemePreset,
  findMatchingPresetId,
  presetToTenantTokens,
  applyEcommerceTheme,
} from './ecommerce-themes';
import { EcommerceThemeModal } from './EcommerceThemeModal';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';
import type { TenantTheme } from '@/types/theme';

const FONT_HEADING_OPTIONS = [
  { label: 'Fraunces (Artisanal Serif)', value: 'Fraunces' },
  { label: 'Playfair Display (Luxury Serif)', value: 'Playfair Display' },
  { label: 'Plus Jakarta Sans (Modern Editorial)', value: 'Plus Jakarta Sans' },
  { label: 'Inter (Neutral Sans)', value: 'Inter' },
];

const FONT_BODY_OPTIONS = [
  { label: 'Inter (High Readability)', value: 'Inter' },
  { label: 'Plus Jakarta Sans (Clean Modern)', value: 'Plus Jakarta Sans' },
  { label: 'Geist (Technical Sans)', value: 'Geist' },
];

const CARD_STYLE_OPTIONS = [
  { label: 'Portrait 3:4, hover second image', value: 'portrait-hover' },
  { label: 'Square 1:1, minimal grid', value: 'square-minimal' },
  { label: 'Portrait with quick-add drawer', value: 'portrait-quickadd' },
];

const RADIUS_OPTIONS = [
  { label: '0px (Sharp & Editorial)', value: '0px' },
  { label: '4px (Subtle Curves)', value: '0.25rem' },
  { label: '8px (Modern Rounded)', value: '0.5rem' },
  { label: '12px (Soft Smooth)', value: '0.75rem' },
  { label: '24px (Pill Shaped)', value: '1.5rem' },
];

interface BrandAmbienceStudioProps {
  theme: TenantTheme;
  onChange: (fields: Partial<TenantTheme>) => void;
}

export function BrandAmbienceStudio({ theme, onChange }: BrandAmbienceStudioProps) {
  const { setThemePreset, setThemeStyle, themeStyle: globalStyle } = useTheme();
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeStyle, setActiveStyle] = useState<ThemeStyle>(globalStyle || 'solid');

  // Find current active preset based on current theme colors
  const activePresetId = useMemo(() => {
    return findMatchingPresetId(theme.primaryColor, theme.canvasColor);
  }, [theme.primaryColor, theme.canvasColor]);

  const activePreset = getEcommerceThemePreset(activePresetId);

  // 1-Click quick select from in-page palette cards
  const handleSelectPreset = (preset: EcommerceThemePreset) => {
    const tokens = presetToTenantTokens(preset, preset.style);
    setActiveStyle(preset.style);
    applyEcommerceTheme(preset, preset.style);
    setThemePreset(preset.id);
    onChange(tokens);
  };

  // When saved from the modal
  const handleModalSaved = (preset: EcommerceThemePreset, style: ThemeStyle) => {
    const tokens = presetToTenantTokens(preset, style);
    setActiveStyle(style);
    applyEcommerceTheme(preset, style);
    setThemePreset(preset.id);
    setThemeStyle(style);
    onChange(tokens);
  };

  // Previewing in real-time from modal
  const handleModalPreview = (preset: EcommerceThemePreset, style: ThemeStyle) => {
    const tokens = presetToTenantTokens(preset, style);
    setActiveStyle(style);
    applyEcommerceTheme(preset, style);
    onChange(tokens);
  };

  return (
    <div className="space-y-4">
      {/* ================= ACTIVE ATMOSPHERE BANNER ================= */}
      <div
        className="rounded-xl border p-4 transition-all relative overflow-hidden shadow-xs"
        style={{
          background:
            activeStyle === 'gradient'
              ? activePreset.previewGradient
              : activePreset.colors.card,
          borderColor: activePreset.colors.border,
        }}
      >
        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-3.5 w-3.5 rounded-full shadow-xs ring-2 ring-black/20 shrink-0"
                style={{ backgroundColor: activePreset.accentDot }}
              />
              <h4
                className="font-bold text-sm tracking-tight truncate"
                style={{ color: activePreset.colors.foreground }}
              >
                {activePreset.name}
              </h4>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="inline-flex items-center text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border shadow-xs"
                style={{
                  borderColor: activePreset.colors.border,
                  color: activePreset.colors.foreground,
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                }}
              >
                {activePreset.mode === 'dark' ? 'Midnight' : 'Daylight'}
              </span>
              <span
                className="inline-flex items-center text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border shadow-xs"
                style={{
                  borderColor: activePreset.colors.border,
                  color: activePreset.colors.foreground,
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                }}
              >
                {activeStyle === 'gradient' ? 'Gradient' : 'Solid'}
              </span>
            </div>
          </div>

          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: activePreset.colors.mutedForeground }}
          >
            {activePreset.concept}
          </p>

          {/* Active colors swatch strip & Open Studio Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md border text-[10px]"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderColor: activePreset.colors.border,
                  color: activePreset.colors.foreground,
                }}
                title="Primary Brand Accent"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activePreset.colors.accent }}
                />
                <span className="font-mono">Primary</span>
              </div>

              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md border text-[10px]"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderColor: activePreset.colors.border,
                  color: activePreset.colors.foreground,
                }}
                title="Canvas Background"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activePreset.colors.background }}
                />
                <span className="font-mono">Canvas</span>
              </div>

              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md border text-[10px]"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderColor: activePreset.colors.border,
                  color: activePreset.colors.foreground,
                }}
                title="Surface Cards"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activePreset.colors.card }}
                />
                <span className="font-mono">Surface</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs bg-clay text-white hover:opacity-90 transition-all cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Open Theme Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= CURATED CONCEPTS QUICK SELECTOR ================= */}
      <Panel
        title="Curated Concepts"
        description="One-click retail palettes designed for your store's personality"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-medium">
              Atmospheres ({activePreset.mode === 'dark' ? 'Midnight / Dark' : 'Daylight / Light'})
            </span>
            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="text-clay hover:underline font-semibold cursor-pointer"
            >
              Browse all 16
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {ECOMMERCE_THEMES.filter((p) => p.mode === activePreset.mode).map((preset) => {
              const isSelected = activePreset.id === preset.id;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={cn(
                    'flex flex-col gap-1.5 p-2 rounded-xl border text-left transition-all relative group cursor-pointer',
                    isSelected
                      ? 'border-clay bg-clay/15 ring-2 ring-clay/40 shadow-xs font-semibold'
                      : 'border-line bg-surface hover:bg-subtle/50'
                  )}
                >
                  <div
                    className="w-full h-7 rounded-lg relative overflow-hidden flex items-center justify-between px-2 shadow-inner"
                    style={{ background: preset.previewGradient }}
                  >
                    {isSelected ? (
                      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-clay text-white shadow-xs">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div />
                    )}
                    <span
                      className="h-2.5 w-2.5 rounded-full shadow-xs ring-1 ring-black/20 shrink-0"
                      style={{ backgroundColor: preset.accentDot }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-ink">
                      {preset.name}
                    </div>
                    <div className="truncate text-[10px] text-ink-muted">
                      {preset.concept}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* ================= FINE-TUNE & ADVANCED OVERRIDES ================= */}
      <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-ink cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-ink-muted" />
            <span>Fine-Tune Brand Typography & Layout</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 text-ink-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-ink-muted" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 pt-3 border-t border-line">
            {/* Typography */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
                <Type className="h-3.5 w-3.5" />
                <span>Typography</span>
              </div>
              <Select
                label="Heading font"
                value={theme.fontHeading || 'Fraunces'}
                onChange={(e) => onChange({ fontHeading: e.target.value })}
                options={FONT_HEADING_OPTIONS}
              />
              <Select
                label="Body font"
                value={theme.fontBody || 'Inter'}
                onChange={(e) => onChange({ fontBody: e.target.value })}
                options={FONT_BODY_OPTIONS}
              />
            </div>

            {/* Layout & Corner Style */}
            <div className="space-y-3 pt-3 border-t border-line">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
                <Layout className="h-3.5 w-3.5" />
                <span>Product Cards & Corners</span>
              </div>
              <Select
                label="Card layout ratio"
                value={theme.cardStyle || 'portrait-hover'}
                onChange={(e) => onChange({ cardStyle: e.target.value })}
                options={CARD_STYLE_OPTIONS}
              />
              <Select
                label="Corner curvature"
                value={theme.borderRadius || '0.5rem'}
                onChange={(e) => onChange({ borderRadius: e.target.value })}
                options={RADIUS_OPTIONS}
              />
            </div>

            {/* Fine-Tuning Colors */}
            <div className="space-y-3 pt-3 border-t border-line">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Color Overrides
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-ink">Primary brand color</p>
                  <p className="text-[10px] text-ink-muted">Buttons, badges & active states</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => onChange({ primaryColor: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded-full border border-line p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => onChange({ primaryColor: e.target.value })}
                    className="w-18 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-mono uppercase text-ink text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-ink">Canvas background</p>
                  <p className="text-[10px] text-ink-muted">Storefront canvas backdrop</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={theme.canvasColor}
                    onChange={(e) => onChange({ canvasColor: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded-full border border-line p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={theme.canvasColor}
                    onChange={(e) => onChange({ canvasColor: e.target.value })}
                    className="w-18 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-mono uppercase text-ink text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= THEME STUDIO MODAL ================= */}
      <EcommerceThemeModal
        open={themeModalOpen}
        onOpenChange={setThemeModalOpen}
        currentPresetId={activePreset.id}
        currentStyle={activeStyle}
        onPreviewPreset={handleModalPreview}
        onSaved={handleModalSaved}
      />
    </div>
  );
}
