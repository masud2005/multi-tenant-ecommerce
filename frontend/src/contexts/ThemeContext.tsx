'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  ECOMMERCE_THEMES,
  type EcommerceThemePreset,
  type ThemeMode,
  type ThemeStyle,
  getEcommerceThemePreset,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME_ID,
  applyEcommerceTheme,
} from '@/components/dashboard/theme/ecommerce-themes';

export const THEME_STORAGE_KEY = 'tanti_theme_settings';

export interface ThemeSettingsState {
  colorMode: ThemeMode;
  themePresetId: string;
  themeStyle: ThemeStyle;
}

export interface ThemeContextValue {
  colorMode: ThemeMode;
  themePresetId: string;
  themeStyle: ThemeStyle;
  activePreset: EcommerceThemePreset;
  isThemeModalOpen: boolean;
  setThemeModalOpen: (open: boolean) => void;
  setColorMode: (mode: ThemeMode) => void;
  toggleColorMode: () => void;
  setThemePreset: (presetId: string) => void;
  setThemeStyle: (style: ThemeStyle) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ThemeMode>('light');
  const [themePresetId, setThemePresetIdState] = useState<string>(DEFAULT_LIGHT_THEME_ID);
  const [themeStyle, setThemeStyleState] = useState<ThemeStyle>('solid');
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Helper to persist current settings to localStorage
  const persistSettings = useCallback((settings: ThemeSettingsState) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('tanti-theme-changed', { detail: settings }));
      }
    } catch {
      // ignore quota or access errors
    }
  }, []);

  // Hydrate admin preview state. The storefront follows the published theme, not this cache.
  useEffect(() => {
    const onAdmin = window.location.pathname.startsWith('/admin');
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ThemeSettingsState>;
        const validMode: ThemeMode = parsed.colorMode === 'dark' ? 'dark' : 'light';
        const validStyle: ThemeStyle = parsed.themeStyle === 'gradient' ? 'gradient' : 'solid';
        const validPresetId = parsed.themePresetId || (validMode === 'dark' ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID);

        setColorModeState(validMode);
        setThemeStyleState(validStyle);
        setThemePresetIdState(validPresetId);

        if (onAdmin) {
          applyEcommerceTheme(getEcommerceThemePreset(validPresetId), validStyle);
        }
      }
    } catch {
      if (onAdmin) {
        applyEcommerceTheme(getEcommerceThemePreset(DEFAULT_LIGHT_THEME_ID), 'solid');
      }
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY || !e.newValue) return;
      if (!window.location.pathname.startsWith('/admin')) return;
      try {
        const parsed = JSON.parse(e.newValue) as ThemeSettingsState;
        setColorModeState(parsed.colorMode);
        setThemePresetIdState(parsed.themePresetId);
        setThemeStyleState(parsed.themeStyle);
        const p = getEcommerceThemePreset(parsed.themePresetId);
        applyEcommerceTheme(p, parsed.themeStyle);
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Set theme preset: synchronizes mode & style from the preset
  const setThemePreset = useCallback((presetId: string) => {
    const preset = getEcommerceThemePreset(presetId);
    setThemePresetIdState(preset.id);
    setColorModeState(preset.mode);
    setThemeStyleState(preset.style);

    applyEcommerceTheme(preset, preset.style);
    persistSettings({
      themePresetId: preset.id,
      colorMode: preset.mode,
      themeStyle: preset.style,
    });
  }, [persistSettings]);

  // Set color mode: auto-switches to default preset of that mode if incompatible
  const setColorMode = useCallback((newMode: ThemeMode) => {
    setColorModeState(newMode);
    const current = getEcommerceThemePreset(themePresetId);
    let nextPresetId = themePresetId;

    if (current.mode !== newMode) {
      nextPresetId = newMode === 'dark' ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID;
      setThemePresetIdState(nextPresetId);
    }

    const nextPreset = getEcommerceThemePreset(nextPresetId);
    applyEcommerceTheme(nextPreset, themeStyle);
    persistSettings({
      themePresetId: nextPresetId,
      colorMode: newMode,
      themeStyle,
    });
  }, [themePresetId, themeStyle, persistSettings]);

  // Quick toggle mode (light <-> dark)
  const toggleColorMode = useCallback(() => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  }, [colorMode, setColorMode]);

  // Set theme style ("gradient" vs "solid")
  const setThemeStyle = useCallback((newStyle: ThemeStyle) => {
    setThemeStyleState(newStyle);
    const preset = getEcommerceThemePreset(themePresetId);
    applyEcommerceTheme(preset, newStyle);
    persistSettings({
      themePresetId,
      colorMode,
      themeStyle: newStyle,
    });
  }, [themePresetId, colorMode, persistSettings]);

  // Reset to standard default
  const resetToDefault = useCallback(() => {
    const defaultPreset = getEcommerceThemePreset(DEFAULT_LIGHT_THEME_ID);
    setThemePresetIdState(defaultPreset.id);
    setColorModeState(defaultPreset.mode);
    setThemeStyleState(defaultPreset.style);
    applyEcommerceTheme(defaultPreset, defaultPreset.style);
    persistSettings({
      themePresetId: defaultPreset.id,
      colorMode: defaultPreset.mode,
      themeStyle: defaultPreset.style,
    });
  }, [persistSettings]);

  const activePreset = useMemo(() => {
    return getEcommerceThemePreset(themePresetId);
  }, [themePresetId]);

  const value = useMemo<ThemeContextValue>(() => ({
    colorMode,
    themePresetId,
    themeStyle,
    activePreset,
    isThemeModalOpen,
    setThemeModalOpen,
    setColorMode,
    toggleColorMode,
    setThemePreset,
    setThemeStyle,
    resetToDefault,
  }), [
    colorMode,
    themePresetId,
    themeStyle,
    activePreset,
    isThemeModalOpen,
    setColorMode,
    toggleColorMode,
    setThemePreset,
    setThemeStyle,
    resetToDefault,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const defaultPreset = getEcommerceThemePreset(DEFAULT_LIGHT_THEME_ID);
    return {
      colorMode: 'light',
      themePresetId: DEFAULT_LIGHT_THEME_ID,
      themeStyle: 'solid',
      activePreset: defaultPreset,
      isThemeModalOpen: false,
      setThemeModalOpen: () => {},
      setColorMode: () => {},
      toggleColorMode: () => {},
      setThemePreset: () => {},
      setThemeStyle: () => {},
      resetToDefault: () => {},
    };
  }
  return ctx;
}

