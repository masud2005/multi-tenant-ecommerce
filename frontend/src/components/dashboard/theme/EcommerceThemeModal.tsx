'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  Moon,
  Sparkles,
  Square,
  Sun,
  X,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ECOMMERCE_THEMES,
  type EcommerceThemePreset,
  type ThemeMode,
  type ThemeStyle,
  getEcommerceThemePreset,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME_ID,
  applyEcommerceTheme,
} from './ecommerce-themes';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

export interface EcommerceThemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPresetId?: string;
  currentStyle?: ThemeStyle;
  onPreviewPreset?: (preset: EcommerceThemePreset, style: ThemeStyle) => void;
  onSaved?: (preset: EcommerceThemePreset, style: ThemeStyle) => void;
}

export function EcommerceThemeModal({
  open,
  onOpenChange,
  currentPresetId: propPresetId,
  currentStyle: propStyle,
  onPreviewPreset,
  onSaved,
}: EcommerceThemeModalProps) {
  const {
    themePresetId: contextPresetId,
    colorMode: contextMode,
    themeStyle: contextStyle,
    setThemePreset,
    setColorMode,
    setThemeStyle,
  } = useTheme();

  // Active baseline (either passed in props or from global context)
  const effectivePresetId = propPresetId ?? contextPresetId;
  const effectiveStyle = propStyle ?? contextStyle;
  const baselinePreset = getEcommerceThemePreset(effectivePresetId);

  // Local draft state for live previewing before saving
  const [selectedId, setSelectedId] = useState<string>(effectivePresetId);
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(baselinePreset.mode);
  const [selectedStyle, setSelectedStyle] = useState<ThemeStyle>(effectiveStyle);

  // Sync state whenever modal opens
  useEffect(() => {
    if (open) {
      const p = getEcommerceThemePreset(effectivePresetId);
      setSelectedId(effectivePresetId);
      setSelectedMode(p.mode);
      setSelectedStyle(effectiveStyle || p.style);
    }
  }, [open, effectivePresetId, effectiveStyle]);

  const activePreset = getEcommerceThemePreset(selectedId);

  // Handle switching light / dark tab
  const handleModeChange = (mode: ThemeMode) => {
    setSelectedMode(mode);
    if (activePreset.mode !== mode) {
      const nextId = mode === 'dark' ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID;
      setSelectedId(nextId);
      const nextPreset = getEcommerceThemePreset(nextId);
      applyEcommerceTheme(nextPreset, selectedStyle);
      if (onPreviewPreset) onPreviewPreset(nextPreset, selectedStyle);
    }
  };

  // Handle clicking a preset card (Instant live preview)
  const handleSelectPreset = (preset: EcommerceThemePreset) => {
    setSelectedId(preset.id);
    setSelectedMode(preset.mode);
    setSelectedStyle(preset.style);
    applyEcommerceTheme(preset, preset.style);
    if (onPreviewPreset) onPreviewPreset(preset, preset.style);
  };

  // Handle style switch (gradient vs solid)
  const handleStyleChange = (style: ThemeStyle) => {
    setSelectedStyle(style);
    applyEcommerceTheme(activePreset, style);
    if (onPreviewPreset) onPreviewPreset(activePreset, style);
  };

  // Reset to default
  const handleResetToStandard = () => {
    const defaultPreset = getEcommerceThemePreset(DEFAULT_LIGHT_THEME_ID);
    setSelectedId(defaultPreset.id);
    setSelectedMode(defaultPreset.mode);
    setSelectedStyle(defaultPreset.style);
    applyEcommerceTheme(defaultPreset, defaultPreset.style);
    if (onPreviewPreset) onPreviewPreset(defaultPreset, defaultPreset.style);
    toast.info('Reset to default Tanti Heritage store theme');
  };

  // Handle dialog open/close with preview rollback if not saved
  const handleClose = () => {
    const savedPreset = getEcommerceThemePreset(effectivePresetId);
    applyEcommerceTheme(savedPreset, effectiveStyle);
    if (onPreviewPreset) onPreviewPreset(savedPreset, effectiveStyle);
    onOpenChange(false);
  };

  // Save theme permanently
  const handleSaveTheme = () => {
    // Update global state & persistence
    setThemePreset(selectedId);
    setColorMode(selectedMode);
    setThemeStyle(selectedStyle);
    applyEcommerceTheme(activePreset, selectedStyle);

    toast.success(`Applied ${activePreset.name} atmosphere!`);
    if (onSaved) onSaved(activePreset, selectedStyle);
    onOpenChange(false);
  };

  if (!open) return null;

  // Filter presets matching the currently selected mode (Daylight vs Midnight)
  const displayedPresets = ECOMMERCE_THEMES.filter(
    (t) => t.mode === selectedMode
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl border border-line bg-surface/95 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-200 text-ink">
        <div className="p-5 sm:p-6 space-y-5">
          {/* ================= HEADER: LIGHT / DARK PILL SWITCH ================= */}
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-[340px] mx-auto flex items-center p-1 rounded-full border border-line bg-subtle/50">
              <button
                type="button"
                onClick={() => handleModeChange('light')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer',
                  selectedMode === 'light'
                    ? 'bg-clay text-white shadow-md font-bold'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <Sun className="h-3.5 w-3.5" />
                Daylight (Light)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('dark')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer',
                  selectedMode === 'dark'
                    ? 'bg-clay text-white shadow-md font-bold'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <Moon className="h-3.5 w-3.5" />
                Midnight (Dark)
              </button>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-subtle transition-colors ml-2 cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ================= STYLE SELECTION: GRADIENT VS SOLID ================= */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Ambience Style
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleStyleChange('gradient')}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                  selectedStyle === 'gradient'
                    ? 'border-clay bg-clay/10 ring-1 ring-clay/40 shadow-xs'
                    : 'border-line bg-subtle/30 hover:bg-subtle/60'
                )}
              >
                <Sparkles
                  className={cn(
                    'h-5 w-5 shrink-0 mt-0.5',
                    selectedStyle === 'gradient' ? 'text-clay' : 'text-ink-muted'
                  )}
                />
                <div>
                  <div className="text-xs font-semibold text-ink">Gradient</div>
                  <div className="text-[11px] text-ink-muted leading-snug mt-0.5">
                    Atmospheric glows with soft luminous depth
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStyleChange('solid')}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                  selectedStyle === 'solid'
                    ? 'border-clay bg-clay/10 ring-1 ring-clay/40 shadow-xs'
                    : 'border-line bg-subtle/30 hover:bg-subtle/60'
                )}
              >
                <Square
                  className={cn(
                    'h-5 w-5 shrink-0 mt-0.5',
                    selectedStyle === 'solid' ? 'text-clay' : 'text-ink-muted'
                  )}
                />
                <div>
                  <div className="text-xs font-semibold text-ink">Solid</div>
                  <div className="text-[11px] text-ink-muted leading-snug mt-0.5">
                    Clean, editorial contrast for sharp retail
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ================= E-COMMERCE CONCEPT PRESETS GRID ================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Store Concept Presets
              </h4>
              <span className="text-[11px] text-ink-muted">
                {displayedPresets.length} curated palettes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
              {displayedPresets.map((preset) => {
                const isSelected = selectedId === preset.id;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      'flex flex-col gap-2 p-2.5 rounded-xl border text-left transition-all relative group cursor-pointer',
                      isSelected
                        ? 'border-clay bg-clay/15 ring-2 ring-clay/50 shadow-sm font-medium'
                        : 'border-line bg-subtle/20 hover:bg-subtle/50'
                    )}
                  >
                    {/* Glowing preview pill */}
                    <div
                      className="w-full h-8 rounded-lg relative overflow-hidden flex items-center justify-between px-2.5 shadow-inner"
                      style={{ background: preset.previewGradient }}
                    >
                      {/* Active checkmark */}
                      {isSelected ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-clay text-white shadow-xs">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div />
                      )}
                      {/* Glowing accent dot */}
                      <span
                        className="h-3 w-3 rounded-full shadow-sm ring-2 ring-black/20 shrink-0"
                        style={{ backgroundColor: preset.accentDot }}
                      />
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <div className="truncate text-xs font-semibold text-ink">
                        {preset.name}
                      </div>
                      <span className="text-ink-muted shrink-0 ml-1">
                        {preset.mode === 'dark' ? (
                          <Moon className="h-3 w-3" />
                        ) : (
                          <Sun className="h-3 w-3" />
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= HARMONIZED COLORS PREVIEW ================= */}
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Active Theme Swatches
              </h4>
              <span className="text-[11px] text-clay font-medium">
                Auto-balanced for readability
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg border border-line bg-canvas">
                <span
                  className="h-4 w-4 rounded-md border shrink-0 shadow-xs"
                  style={{ backgroundColor: activePreset.colors.accent }}
                />
                <div className="min-w-0">
                  <div className="text-[9px] uppercase font-bold text-ink-muted">Accent</div>
                  <div className="text-[11px] font-mono truncate">{activePreset.colors.accent}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg border border-line bg-canvas">
                <span
                  className="h-4 w-4 rounded-md border shrink-0 shadow-xs"
                  style={{ backgroundColor: activePreset.colors.background }}
                />
                <div className="min-w-0">
                  <div className="text-[9px] uppercase font-bold text-ink-muted">Canvas</div>
                  <div className="text-[11px] font-mono truncate">{activePreset.colors.background}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg border border-line bg-canvas">
                <span
                  className="h-4 w-4 rounded-md border shrink-0 shadow-xs"
                  style={{ backgroundColor: activePreset.colors.card }}
                />
                <div className="min-w-0">
                  <div className="text-[9px] uppercase font-bold text-ink-muted">Cards</div>
                  <div className="text-[11px] font-mono truncate">{activePreset.colors.card}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg border border-line bg-canvas">
                <span
                  className="h-4 w-4 rounded-md border shrink-0 shadow-xs"
                  style={{ backgroundColor: activePreset.colors.foreground }}
                />
                <div className="min-w-0">
                  <div className="text-[9px] uppercase font-bold text-ink-muted">Text</div>
                  <div className="text-[11px] font-mono truncate">{activePreset.colors.foreground}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= FOOTER ACTIONS ================= */}
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <button
              type="button"
              onClick={handleResetToStandard}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-subtle transition-colors flex items-center gap-1.5 text-ink-muted hover:text-ink cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Default
            </button>

            <button
              type="button"
              onClick={handleSaveTheme}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-clay text-white hover:opacity-95 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Save & Apply Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
