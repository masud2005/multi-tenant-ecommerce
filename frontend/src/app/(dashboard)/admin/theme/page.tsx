'use client';

import React, { useState } from 'react';
import { Reorder } from 'framer-motion';
import { toast } from 'sonner';
import {
  Monitor,
  Tablet,
  Smartphone,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Layers,
  Palette,
  Type,
  History,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  Sliders,
  Store,
} from 'lucide-react';
import { images } from '@/data/images';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { ThemePreset, TenantTheme, ThemeSection, ThemeVersion } from '@/types/theme';

// Pre-packaged Presets matching backend ThemePreset schema
const PRESET_TEMPLATES: ThemePreset[] = [
  {
    id: 'preset-minimal',
    name: 'Minimalist Craft',
    slug: 'minimalist-craft',
    description: 'Earthy organic tones, editorial serif typography, and warm tactile accents for boutique fashion.',
    previewImage: images.kurta,
    defaultTokens: {
      primaryColor: '#B5562F',
      secondaryColor: '#2E3A67',
      accentColor: '#5C6B4E',
      canvasColor: '#F7F4EF',
      surfaceColor: '#FFFFFF',
      inkColor: '#1C1A17',
      fontHeading: 'Fraunces',
      fontBody: 'Inter',
      borderRadius: '0.5rem',
      cardStyle: 'portrait-hover',
    },
    defaultSections: [
      { sectionType: 'HERO_BANNER', label: 'Hero Banner', isVisible: true },
      { sectionType: 'CATEGORY_GRID', label: 'Shop by Category', isVisible: true },
      { sectionType: 'BESTSELLERS', label: 'Bestseller Products', isVisible: true },
      { sectionType: 'SUMMER_SPOTLIGHT', label: 'Spotlight Banner', isVisible: true },
      { sectionType: 'NEW_ARRIVALS', label: 'New Arrivals', isVisible: true },
      { sectionType: 'TRUST_POINTS', label: 'Brand Trust Points', isVisible: true },
      { sectionType: 'TESTIMONIALS', label: 'Customer Reviews', isVisible: true },
      { sectionType: 'RECOMMENDED', label: 'Recommended For You', isVisible: true },
    ],
    isActive: true,
  },
  {
    id: 'preset-luxe',
    name: 'Modern Luxe',
    slug: 'modern-luxe',
    description: 'Sophisticated midnight navy, gold accents, and sharp luxurious borders for high-end designer stores.',
    previewImage: images.saree,
    defaultTokens: {
      primaryColor: '#1E293B',
      secondaryColor: '#C5A880',
      accentColor: '#D97706',
      canvasColor: '#F8FAFC',
      surfaceColor: '#FFFFFF',
      inkColor: '#0F172A',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      borderRadius: '0.25rem',
      cardStyle: 'portrait-minimal',
    },
    defaultSections: [
      { sectionType: 'HERO_BANNER', label: 'Hero Banner', isVisible: true },
      { sectionType: 'CATEGORY_GRID', label: 'Curated Collections', isVisible: true },
      { sectionType: 'BESTSELLERS', label: 'Curated Picks', isVisible: true },
      { sectionType: 'SUMMER_SPOTLIGHT', label: 'Exclusive Spotlight', isVisible: true },
      { sectionType: 'NEW_ARRIVALS', label: 'New Season Launch', isVisible: true },
      { sectionType: 'TESTIMONIALS', label: 'Client Voices', isVisible: true },
      { sectionType: 'RECOMMENDED', label: 'Recommended For You', isVisible: true },
    ],
    isActive: true,
  },
  {
    id: 'preset-urban',
    name: 'Urban Streetwear',
    slug: 'urban-streetwear',
    description: 'High contrast brutalist design with bold dark accents and rounded pill geometry for streetwear.',
    previewImage: images.sneakers,
    defaultTokens: {
      primaryColor: '#0F172A',
      secondaryColor: '#EA580C',
      accentColor: '#10B981',
      canvasColor: '#F1F5F9',
      surfaceColor: '#FFFFFF',
      inkColor: '#020617',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      borderRadius: '0.75rem',
      cardStyle: 'square-badge',
    },
    defaultSections: [
      { sectionType: 'HERO_BANNER', label: 'Hero Drop Banner', isVisible: true },
      { sectionType: 'NEW_ARRIVALS', label: 'Latest Drops', isVisible: true },
      { sectionType: 'CATEGORY_GRID', label: 'Departments', isVisible: true },
      { sectionType: 'BESTSELLERS', label: 'Hype Items', isVisible: true },
      { sectionType: 'TRUST_POINTS', label: 'Express Shipping & Guarantee', isVisible: true },
      { sectionType: 'TESTIMONIALS', label: 'Community Feedback', isVisible: true },
    ],
    isActive: true,
  },
];

// Initial mock installed themes in tenant's library
const INITIAL_THEMES: TenantTheme[] = [
  {
    id: 'theme-live-1',
    tenantId: 'tanti-demo',
    presetId: 'preset-minimal',
    name: 'Default Live Theme',
    status: 'PUBLISHED',
    isLive: true,
    primaryColor: '#B5562F',
    secondaryColor: '#2E3A67',
    accentColor: '#5C6B4E',
    canvasColor: '#F7F4EF',
    surfaceColor: '#FFFFFF',
    inkColor: '#1C1A17',
    fontHeading: 'Fraunces',
    fontBody: 'Inter',
    borderRadius: '0.5rem',
    cardStyle: 'portrait-hover',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    sections: [
      { id: 'sec-1', sectionType: 'HERO_BANNER', label: 'Hero Banner', orderIndex: 0, isVisible: true },
      { id: 'sec-2', sectionType: 'CATEGORY_GRID', label: 'Shop by Category', orderIndex: 1, isVisible: true },
      { id: 'sec-3', sectionType: 'BESTSELLERS', label: 'Bestseller Products', orderIndex: 2, isVisible: true },
      { id: 'sec-4', sectionType: 'SUMMER_SPOTLIGHT', label: 'Summer Spotlight Banner', orderIndex: 3, isVisible: true },
      { id: 'sec-5', sectionType: 'NEW_ARRIVALS', label: 'New Arrivals', orderIndex: 4, isVisible: true },
      { id: 'sec-6', sectionType: 'TRUST_POINTS', label: 'Brand Trust Points', orderIndex: 5, isVisible: true },
      { id: 'sec-7', sectionType: 'TESTIMONIALS', label: 'Customer Reviews', orderIndex: 6, isVisible: true },
      { id: 'sec-8', sectionType: 'RECOMMENDED', label: 'Recommended For You', orderIndex: 7, isVisible: true },
    ],
    versions: [
      {
        id: 'ver-2',
        themeId: 'theme-live-1',
        version: 'v1.2',
        label: 'Published Eid 2026 Collection',
        publishedBy: 'Masud Rana',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        snapshot: {
          tokens: {
            primaryColor: '#B5562F',
            secondaryColor: '#2E3A67',
            accentColor: '#5C6B4E',
            canvasColor: '#F7F4EF',
            surfaceColor: '#FFFFFF',
            inkColor: '#1C1A17',
            fontHeading: 'Fraunces',
            fontBody: 'Inter',
            borderRadius: '0.5rem',
            cardStyle: 'portrait-hover',
          },
          sections: [],
        },
      },
      {
        id: 'ver-1',
        themeId: 'theme-live-1',
        version: 'v1.1',
        label: 'Initial Storefront Setup',
        publishedBy: 'Store Owner',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        snapshot: {
          tokens: {
            primaryColor: '#B5562F',
            secondaryColor: '#2E3A67',
            accentColor: '#5C6B4E',
            canvasColor: '#F7F4EF',
            surfaceColor: '#FFFFFF',
            inkColor: '#1C1A17',
            fontHeading: 'Fraunces',
            fontBody: 'Inter',
            borderRadius: '0.5rem',
            cardStyle: 'portrait-hover',
          },
          sections: [],
        },
      },
    ],
  },
  {
    id: 'theme-draft-2',
    tenantId: 'tanti-demo',
    presetId: 'preset-luxe',
    name: 'Festive Luxury Redesign (Draft)',
    status: 'DRAFT',
    isLive: false,
    primaryColor: '#1E293B',
    secondaryColor: '#C5A880',
    accentColor: '#D97706',
    canvasColor: '#F8FAFC',
    surfaceColor: '#FFFFFF',
    inkColor: '#0F172A',
    fontHeading: 'Playfair Display',
    fontBody: 'Inter',
    borderRadius: '0.25rem',
    cardStyle: 'portrait-minimal',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    sections: [
      { id: 'sec-201', sectionType: 'HERO_BANNER', label: 'Hero Banner', orderIndex: 0, isVisible: true },
      { id: 'sec-202', sectionType: 'CATEGORY_GRID', label: 'Curated Collections', orderIndex: 1, isVisible: true },
      { id: 'sec-203', sectionType: 'BESTSELLERS', label: 'Curated Picks', orderIndex: 2, isVisible: true },
      { id: 'sec-204', sectionType: 'NEW_ARRIVALS', label: 'New Season Launch', orderIndex: 3, isVisible: true },
      { id: 'sec-205', sectionType: 'TESTIMONIALS', label: 'Client Voices', orderIndex: 4, isVisible: true },
    ],
  },
];

const AVAILABLE_SECTIONS_CATALOG = [
  { sectionType: 'HERO_BANNER', label: 'Hero Banner', desc: 'Full-width visual banner with headline and CTA button' },
  { sectionType: 'CATEGORY_GRID', label: 'Shop by Category', desc: 'Visual category cards linking to catalog collections' },
  { sectionType: 'BESTSELLERS', label: 'Bestseller Products', desc: 'High-converting top product showcase carousel' },
  { sectionType: 'SUMMER_SPOTLIGHT', label: 'Spotlight Banner', desc: 'Mid-page split banner highlighting a collection' },
  { sectionType: 'NEW_ARRIVALS', label: 'New Arrivals', desc: 'Latest products added to your store' },
  { sectionType: 'TRUST_POINTS', label: 'Brand Trust Points', desc: 'Free shipping, cash on delivery, and return badges' },
  { sectionType: 'TESTIMONIALS', label: 'Customer Reviews', desc: 'Social proof cards with star ratings and quotes' },
  { sectionType: 'RECOMMENDED', label: 'Recommended For You', desc: 'Personalized product recommendations' },
  { sectionType: 'NEWSLETTER', label: 'Newsletter Signup', desc: 'Email subscription box with promotional discount offer' },
];

const FONT_HEADING_OPTIONS = [
  'Fraunces',
  'Playfair Display',
  'Plus Jakarta Sans',
  'Inter',
];

const FONT_BODY_OPTIONS = [
  'Inter',
  'Plus Jakarta Sans',
  'Geist',
];

const RADIUS_OPTIONS = [
  { label: '0px (Sharp & Crisp)', value: '0px' },
  { label: '4px (Slightly Rounded)', value: '0.25rem' },
  { label: '8px (Modern Rounded)', value: '0.5rem' },
  { label: '12px (Soft Geometry)', value: '0.75rem' },
  { label: '24px (Pill Style)', value: '1.5rem' },
];

const CARD_STYLE_OPTIONS = [
  { label: 'Portrait 3:4 (Hover Second Image)', value: 'portrait-hover' },
  { label: 'Portrait 3:4 (Minimal Clean)', value: 'portrait-minimal' },
  { label: 'Square 1:1 (Urban Streetwear)', value: 'square-badge' },
];

export default function AdminThemePage() {
  const [themes, setThemes] = useState<TenantTheme[]>(INITIAL_THEMES);
  const [activeThemeId, setActiveThemeId] = useState<string>(INITIAL_THEMES[0].id);

  // Active theme being edited
  const currentTheme = themes.find((t) => t.id === activeThemeId) || themes[0];

  // Studio tabs: 'sections' | 'colors' | 'typography' | 'versions'
  const [activeTab, setActiveTab] = useState<'sections' | 'colors' | 'typography' | 'versions'>('sections');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [dirty, setDirty] = useState<boolean>(false);

  // Modals
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);

  const markDirty = () => setDirty(true);

  // Update theme fields in state
  const updateThemeField = (updates: Partial<TenantTheme>) => {
    setThemes((prev) =>
      prev.map((t) => (t.id === activeThemeId ? { ...t, ...updates } : t))
    );
    markDirty();
  };

  // Reorder sections
  const handleReorderSections = (newSections: ThemeSection[]) => {
    const updated = newSections.map((sec, idx) => ({ ...sec, orderIndex: idx }));
    updateThemeField({ sections: updated });
  };

  // Toggle section visibility
  const toggleSectionVisibility = (secId: string) => {
    const updated = currentTheme.sections.map((s) =>
      s.id === secId ? { ...s, isVisible: !s.isVisible } : s
    );
    updateThemeField({ sections: updated });
  };

  // Remove section
  const handleRemoveSection = (secId: string) => {
    const updated = currentTheme.sections.filter((s) => s.id !== secId);
    updateThemeField({ sections: updated });
    toast.success('Section removed from layout');
  };

  // Add section
  const handleAddSection = (catalogItem: (typeof AVAILABLE_SECTIONS_CATALOG)[0]) => {
    const newSec: ThemeSection = {
      id: `sec-user-${Date.now()}`,
      sectionType: catalogItem.sectionType,
      label: catalogItem.label,
      orderIndex: currentTheme.sections.length,
      isVisible: true,
    };
    updateThemeField({ sections: [...currentTheme.sections, newSec] });
    setIsAddSectionModalOpen(false);
    toast.success(`Added "${catalogItem.label}" to homepage`);
  };

  // Apply a preset template
  const handleApplyPreset = (preset: ThemePreset) => {
    const newSections: ThemeSection[] = preset.defaultSections.map((s, idx) => ({
      id: `sec-${preset.slug}-${idx}-${Date.now()}`,
      sectionType: s.sectionType,
      label: s.label,
      orderIndex: idx,
      isVisible: s.isVisible !== false,
    }));

    updateThemeField({
      presetId: preset.id,
      primaryColor: preset.defaultTokens.primaryColor,
      secondaryColor: preset.defaultTokens.secondaryColor,
      accentColor: preset.defaultTokens.accentColor,
      canvasColor: preset.defaultTokens.canvasColor,
      surfaceColor: preset.defaultTokens.surfaceColor,
      inkColor: preset.defaultTokens.inkColor,
      fontHeading: preset.defaultTokens.fontHeading,
      fontBody: preset.defaultTokens.fontBody,
      borderRadius: preset.defaultTokens.borderRadius,
      cardStyle: preset.defaultTokens.cardStyle,
      sections: newSections,
    });

    setIsPresetModalOpen(false);
    toast.success(`Applied "${preset.name}" preset tokens and layout`);
  };

  // Duplicate current theme
  const handleDuplicateTheme = () => {
    const newTheme: TenantTheme = {
      ...currentTheme,
      id: `theme-cloned-${Date.now()}`,
      name: `${currentTheme.name} (Copy)`,
      isLive: false,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: currentTheme.sections.map((s) => ({ ...s, id: `sec-${Date.now()}-${s.id}` })),
    };
    setThemes((prev) => [...prev, newTheme]);
    setActiveThemeId(newTheme.id);
    setDirty(false);
    toast.success('Theme duplicated successfully');
  };

  // Save Draft action
  const handleSaveDraft = () => {
    setDirty(false);
    toast.success(`Draft saved for "${currentTheme.name}"`);
  };

  // Publish action
  const handlePublish = () => {
    const newVersionTag = `v1.${(currentTheme.versions?.length || 0) + 1}`;
    const newVersion: ThemeVersion = {
      id: `ver-${Date.now()}`,
      themeId: currentTheme.id,
      version: newVersionTag,
      label: `Published by Masud Rana`,
      publishedBy: 'Masud Rana',
      createdAt: new Date().toISOString(),
      snapshot: {
        tokens: {
          primaryColor: currentTheme.primaryColor,
          secondaryColor: currentTheme.secondaryColor,
          accentColor: currentTheme.accentColor,
          canvasColor: currentTheme.canvasColor,
          surfaceColor: currentTheme.surfaceColor,
          inkColor: currentTheme.inkColor,
          fontHeading: currentTheme.fontHeading,
          fontBody: currentTheme.fontBody,
          borderRadius: currentTheme.borderRadius,
          cardStyle: currentTheme.cardStyle,
        },
        sections: currentTheme.sections,
      },
    };

    setThemes((prev) =>
      prev.map((t) => {
        if (t.id === currentTheme.id) {
          return {
            ...t,
            isLive: true,
            status: 'PUBLISHED',
            publishedAt: new Date().toISOString(),
            versions: [newVersion, ...(t.versions || [])],
          };
        }
        return { ...t, isLive: false };
      })
    );
    setDirty(false);
    toast.success(`Theme "${currentTheme.name}" published live to storefront! (${newVersionTag})`);
  };

  // Restore past version
  const handleRestoreVersion = (ver: ThemeVersion) => {
    updateThemeField({
      primaryColor: ver.snapshot.tokens.primaryColor,
      secondaryColor: ver.snapshot.tokens.secondaryColor,
      accentColor: ver.snapshot.tokens.accentColor,
      canvasColor: ver.snapshot.tokens.canvasColor,
      surfaceColor: ver.snapshot.tokens.surfaceColor,
      inkColor: ver.snapshot.tokens.inkColor,
      fontHeading: ver.snapshot.tokens.fontHeading,
      fontBody: ver.snapshot.tokens.fontBody,
      borderRadius: ver.snapshot.tokens.borderRadius,
      cardStyle: ver.snapshot.tokens.cardStyle,
      ...(ver.snapshot.sections.length > 0 ? { sections: ver.snapshot.sections } : {}),
    });
    toast.success(`Rolled back to snapshot ${ver.version}`);
  };

  // Heading font family inline style for preview
  const headingFontFamily = currentTheme.fontHeading.includes('Playfair')
    ? 'Georgia, serif'
    : currentTheme.fontHeading.includes('Fraunces')
    ? 'Fraunces, Georgia, serif'
    : currentTheme.fontHeading.includes('Jakarta')
    ? 'system-ui, sans-serif'
    : 'sans-serif';

  return (
    <ModuleGate module="theme">
      <div className="w-full space-y-6 pb-12">
        {/* Page Header */}
        <PageHeader
          title="Theme Studio"
          description="Design and customize your storefront appearance, design tokens, typography, and dynamic homepage sections."
          meta={
            <div className="flex items-center gap-2">
              <Badge tone={currentTheme.isLive ? 'success' : 'warning'} dot>
                {currentTheme.isLive ? 'Live on Storefront' : 'Draft Mode'}
              </Badge>
              {dirty && (
                <Badge tone="info" dot>
                  Unsaved Changes
                </Badge>
              )}
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-subtle transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                Explore Presets
              </button>

              <GuardedButton
                module="theme"
                action="update"
                variant="secondary"
                size="sm"
                disabled={!dirty}
                onClick={handleSaveDraft}
              >
                Save Draft
              </GuardedButton>

              <GuardedButton
                module="theme"
                action="publish"
                size="sm"
                onClick={handlePublish}
              >
                <Store className="h-3.5 w-3.5 mr-1" />
                Publish Live
              </GuardedButton>
            </div>
          }
        />

        {/* Theme Library Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Theme Library:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveThemeId(t.id);
                    setDirty(false);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer border',
                    t.id === activeThemeId
                      ? 'border-ink bg-ink text-canvas shadow-xs'
                      : 'border-line bg-subtle text-ink hover:border-ink-muted'
                  )}
                >
                  {t.isLive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <span>{t.name}</span>
                  {t.isLive ? (
                    <span className="rounded px-1 text-[10px] bg-emerald-500/20 text-emerald-200">
                      Live
                    </span>
                  ) : (
                    <span className="rounded px-1 text-[10px] bg-zinc-700 text-zinc-300">
                      Draft
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDuplicateTheme}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2.5 py-1 text-xs text-ink hover:bg-subtle transition-colors cursor-pointer"
              title="Duplicate current theme"
            >
              <Copy className="h-3.5 w-3.5 text-ink-muted" />
              Duplicate
            </button>
          </div>
        </div>

        {/* Main Customizer Workspace: Controls + Live Canvas */}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left Column: Studio Controls */}
          <div className="space-y-4">
            {/* Customizer Navigation Tabs */}
            <div className="grid grid-cols-4 rounded-lg border border-line bg-surface p-1 shadow-xs">
              {[
                { key: 'sections', label: 'Layout', icon: Layers },
                { key: 'colors', label: 'Colors', icon: Palette },
                { key: 'typography', label: 'Styles', icon: Type },
                { key: 'versions', label: 'History', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-md py-2 text-xs font-medium transition-all cursor-pointer',
                      isActive
                        ? 'bg-subtle text-ink shadow-xs border border-line font-semibold'
                        : 'text-ink-muted hover:text-ink'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: SECTIONS & HOMEPAGE BUILDER */}
            {activeTab === 'sections' && (
              <Panel
                title="Homepage Sections"
                description="Drag to reorder sections. Toggle visibility or add new content blocks."
                actions={
                  <button
                    type="button"
                    onClick={() => setIsAddSectionModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-canvas hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Block
                  </button>
                }
              >
                <Reorder.Group
                  axis="y"
                  values={currentTheme.sections}
                  onReorder={handleReorderSections}
                  className="space-y-2"
                >
                  {currentTheme.sections.map((s) => (
                    <Reorder.Item
                      key={s.id}
                      value={s}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border bg-surface px-3 py-2.5 text-sm transition-all shadow-xs cursor-grab active:cursor-grabbing',
                        s.isVisible
                          ? 'border-line text-ink'
                          : 'border-line/60 bg-subtle/50 text-ink-muted opacity-75'
                      )}
                    >
                      <GripVertical className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
                      <div className="flex-1 truncate">
                        <p className={cn('text-xs font-medium', !s.isVisible && 'line-through')}>
                          {s.label}
                        </p>
                        <p className="text-[10px] text-ink-muted font-mono uppercase">
                          {s.sectionType}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(s.id)}
                          aria-label={s.isVisible ? `Hide ${s.label}` : `Show ${s.label}`}
                          className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink cursor-pointer transition-colors"
                        >
                          {s.isVisible ? (
                            <Eye className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-ink-muted" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveSection(s.id)}
                          aria-label={`Remove ${s.label}`}
                          className="rounded p-1 text-ink-muted hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </Panel>
            )}

            {/* TAB 2: COLOR PALETTE */}
            {activeTab === 'colors' && (
              <Panel
                title="Design Tokens & Palette"
                description="Fine-tune brand colors. Updates are injected dynamically into CSS custom properties."
              >
                <div className="space-y-4">
                  {/* Quick Color Swatches Presets */}
                  <div>
                    <label className="text-xs font-medium text-ink">Quick Palette Presets</label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {[
                        { name: 'Terracotta', p: '#B5562F', a: '#5C6B4E', c: '#F7F4EF' },
                        { name: 'Midnight', p: '#1E293B', a: '#D97706', c: '#F8FAFC' },
                        { name: 'Street', p: '#0F172A', a: '#10B981', c: '#F1F5F9' },
                        { name: 'Berry Luxe', p: '#831843', a: '#BE185D', c: '#FFF1F2' },
                      ].map((pal) => (
                        <button
                          key={pal.name}
                          type="button"
                          onClick={() => {
                            updateThemeField({
                              primaryColor: pal.p,
                              accentColor: pal.a,
                              canvasColor: pal.c,
                            });
                          }}
                          className="flex flex-col items-center gap-1 rounded-md border border-line p-2 hover:border-ink transition-colors cursor-pointer bg-surface"
                        >
                          <div className="flex gap-1">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pal.p }} />
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pal.a }} />
                          </div>
                          <span className="text-[10px] text-ink-muted">{pal.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Individual Color Fields */}
                  <div className="space-y-3 pt-2">
                    {[
                      { key: 'primaryColor', label: 'Primary Brand Color', desc: 'Main CTA buttons, highlights' },
                      { key: 'secondaryColor', label: 'Secondary Brand Color', desc: 'Sub-headers, borders' },
                      { key: 'accentColor', label: 'Accent Highlight Color', desc: 'Badges, discounts, banners' },
                      { key: 'canvasColor', label: 'Storefront Canvas (Background)', desc: 'Page background' },
                      { key: 'surfaceColor', label: 'Surface (Card Background)', desc: 'Product cards, modal background' },
                      { key: 'inkColor', label: 'Main Ink (Text Color)', desc: 'Headings and paragraph text' },
                    ].map((item) => {
                      const colorVal = (currentTheme as any)[item.key] || '#000000';
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas/40 p-2.5"
                        >
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-ink">{item.label}</p>
                            <p className="text-[10px] text-ink-muted">{item.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={colorVal}
                              onChange={(e) => updateThemeField({ [item.key]: e.target.value })}
                              className="h-8 w-8 cursor-pointer rounded-md border border-line p-0.5 bg-transparent"
                            />
                            <input
                              type="text"
                              value={colorVal}
                              onChange={(e) => updateThemeField({ [item.key]: e.target.value })}
                              className="w-20 rounded border border-line bg-surface px-1.5 py-1 text-xs font-mono uppercase text-ink text-center"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            )}

            {/* TAB 3: TYPOGRAPHY & GEOMETRY */}
            {activeTab === 'typography' && (
              <Panel
                title="Typography & Component Styling"
                description="Choose fonts and corner geometry for product cards and buttons."
              >
                <div className="space-y-4">
                  <Select
                    label="Heading Font (Editorial & Banners)"
                    value={currentTheme.fontHeading}
                    onChange={(e) => updateThemeField({ fontHeading: e.target.value })}
                    options={FONT_HEADING_OPTIONS}
                  />

                  <Select
                    label="Body Font (Paragraphs & Navigation)"
                    value={currentTheme.fontBody}
                    onChange={(e) => updateThemeField({ fontBody: e.target.value })}
                    options={FONT_BODY_OPTIONS}
                  />

                  <div>
                    <label className="text-xs font-medium text-ink">Corner Radius (Geometry)</label>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {RADIUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateThemeField({ borderRadius: opt.value })}
                          className={cn(
                            'flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors cursor-pointer',
                            currentTheme.borderRadius === opt.value
                              ? 'border-ink bg-subtle font-semibold text-ink'
                              : 'border-line bg-surface text-ink-muted hover:border-ink-muted'
                          )}
                        >
                          <span>{opt.label}</span>
                          <span
                            className="h-4 w-8 border border-ink bg-ink/10"
                            style={{ borderRadius: opt.value }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink">Product Card Style</label>
                    <div className="mt-2 space-y-2">
                      {CARD_STYLE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateThemeField({ cardStyle: opt.value })}
                          className={cn(
                            'w-full text-left rounded-md border px-3 py-2 text-xs transition-colors cursor-pointer',
                            currentTheme.cardStyle === opt.value
                              ? 'border-ink bg-subtle font-semibold text-ink'
                              : 'border-line bg-surface text-ink-muted hover:border-ink-muted'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            {/* TAB 4: VERSION HISTORY & ROLLBACK */}
            {activeTab === 'versions' && (
              <Panel
                title="Version History & Snapshots"
                description="Every published version creates an immutable audit snapshot for instant rollback."
                flush
              >
                <div className="divide-y divide-line">
                  {(currentTheme.versions || []).length === 0 ? (
                    <div className="p-4 text-center text-xs text-ink-muted">
                      No published snapshots yet. Publish your theme to record version history.
                    </div>
                  ) : (
                    currentTheme.versions?.map((ver, idx) => (
                      <div key={ver.id} className="flex items-center justify-between p-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-ink">{ver.version}</span>
                            {idx === 0 && currentTheme.isLive && (
                              <Badge tone="success" dot>Live</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-muted">{ver.label || 'Release snapshot'}</p>
                          <p className="text-[10px] text-ink-muted">
                            {formatDateTime(ver.createdAt)} · {ver.publishedBy}
                          </p>
                        </div>

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(ver)}
                            className="inline-flex items-center gap-1 rounded border border-line bg-canvas px-2 py-1 text-xs text-ink hover:bg-subtle cursor-pointer transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            )}
          </div>

          {/* Right Column: Live Interactive Storefront Preview Canvas */}
          <div className="space-y-3">
            {/* Device Switcher Bar */}
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface p-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink">Live Storefront Preview</span>
                <span className="text-[10px] text-ink-muted hidden sm:inline">
                  (Simulating dynamic tokens in real-time)
                </span>
              </div>

              <div
                className="flex rounded-md border border-line bg-canvas p-0.5"
                role="group"
                aria-label="Preview device"
              >
                {(
                  [
                    ['desktop', Monitor, 'Desktop View'],
                    ['tablet', Tablet, 'Tablet View'],
                    ['mobile', Smartphone, 'Mobile View'],
                  ] as const
                ).map(([d, Icon, tooltip]) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    aria-pressed={device === d}
                    title={tooltip}
                    className={cn(
                      'flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                      device === d
                        ? 'bg-ink text-canvas shadow-xs'
                        : 'text-ink-muted hover:text-ink'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="capitalize hidden md:inline">{d}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Device Frame */}
            <div
              className={cn(
                'mx-auto overflow-hidden rounded-xl border border-line shadow-pop transition-all duration-300 ease-out',
                device === 'mobile'
                  ? 'max-w-[375px]'
                  : device === 'tablet'
                  ? 'max-w-[680px]'
                  : 'max-w-full'
              )}
              style={{
                backgroundColor: currentTheme.canvasColor,
                color: currentTheme.inkColor,
              }}
            >
              {/* Simulated Browser Address Bar */}
              <div className="flex items-center justify-between border-b border-line/60 bg-surface/80 px-3 py-1.5 backdrop-blur-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="rounded-full bg-subtle px-4 py-0.5 text-[10px] font-mono text-ink-muted">
                  tanti.store / storefront preview
                </div>
                <div className="w-8" />
              </div>

              {/* Simulated Store Navigation Header */}
              <header
                className="flex items-center justify-between border-b px-4 py-3 border-line/40 transition-colors"
                style={{ backgroundColor: currentTheme.surfaceColor }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="text-lg font-bold tracking-tight"
                    style={{ fontFamily: headingFontFamily }}
                  >
                    Tanti
                  </span>
                  {device !== 'mobile' && (
                    <nav className="flex gap-3 text-xs font-medium text-ink-muted">
                      <span>Women</span>
                      <span>Men</span>
                      <span>Festive</span>
                      <span style={{ color: currentTheme.accentColor }}>Sale</span>
                    </nav>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs"
                    style={{ backgroundColor: currentTheme.primaryColor }}
                  >
                    Cart (0)
                  </span>
                </div>
              </header>

              {/* Simulated Scrollable Body Content */}
              <div className="max-h-[680px] space-y-4 overflow-y-auto p-4">
                {currentTheme.sections
                  .filter((s) => s.isVisible)
                  .map((sec) => (
                    <div key={sec.id}>
                      {/* 1. HERO BANNER */}
                      {sec.sectionType === 'HERO_BANNER' && (
                        <div
                          className="relative overflow-hidden shadow-xs"
                          style={{ borderRadius: currentTheme.borderRadius }}
                        >
                          <img
                            src={images.hero}
                            alt="Hero"
                            className="aspect-[16/7] w-full object-cover"
                          />
                          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 text-white">
                            <span
                              className="w-fit rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1"
                              style={{ backgroundColor: currentTheme.accentColor }}
                            >
                              New Season Launch
                            </span>
                            <h2
                              className="text-xl sm:text-2xl font-semibold text-white"
                              style={{ fontFamily: headingFontFamily }}
                            >
                              The Heritage & Linen Edit 2026
                            </h2>
                            <p className="text-xs text-white/80 mt-1 max-w-sm">
                              Handcrafted silhouettes tailored for elegance and festive comfort.
                            </p>
                            <button
                              type="button"
                              className="mt-3 w-fit px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform active:scale-95 cursor-pointer"
                              style={{
                                backgroundColor: currentTheme.primaryColor,
                                borderRadius: currentTheme.borderRadius,
                              }}
                            >
                              Shop The Collection
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. CATEGORY GRID */}
                      {sec.sectionType === 'CATEGORY_GRID' && (
                        <div
                          className="p-4 shadow-xs border border-line/40"
                          style={{
                            backgroundColor: currentTheme.surfaceColor,
                            borderRadius: currentTheme.borderRadius,
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3
                              className="text-sm font-bold text-ink"
                              style={{ fontFamily: headingFontFamily }}
                            >
                              Shop by Category
                            </h3>
                            <span className="text-xs font-medium cursor-pointer" style={{ color: currentTheme.primaryColor }}>
                              View all →
                            </span>
                          </div>
                          <div
                            className={cn(
                              'grid gap-2.5',
                              device === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'
                            )}
                          >
                            {[
                              { label: 'Panjabi & Kurta', img: images.panjabi },
                              { label: 'Designer Sarees', img: images.saree },
                              { label: 'Coord Sets', img: images.coord },
                              { label: 'Footwear & Bags', img: images.loafers },
                            ]
                              .slice(0, device === 'mobile' ? 2 : 4)
                              .map((cat, i) => (
                                <div
                                  key={i}
                                  className="group relative overflow-hidden bg-canvas border border-line/30"
                                  style={{ borderRadius: currentTheme.borderRadius }}
                                >
                                  <img
                                    src={cat.img}
                                    alt={cat.label}
                                    className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2">
                                    <span className="text-xs font-semibold text-white">
                                      {cat.label}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* 3. BESTSELLERS */}
                      {sec.sectionType === 'BESTSELLERS' && (
                        <div
                          className="p-4 shadow-xs border border-line/40"
                          style={{
                            backgroundColor: currentTheme.surfaceColor,
                            borderRadius: currentTheme.borderRadius,
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3
                                className="text-sm font-bold text-ink"
                                style={{ fontFamily: headingFontFamily }}
                              >
                                Bestseller Products
                              </h3>
                              <p className="text-[11px] text-ink-muted">Loved by over 10,000+ patrons</p>
                            </div>
                            <span
                              className="rounded px-2 py-0.5 text-[10px] font-bold text-white"
                              style={{ backgroundColor: currentTheme.accentColor }}
                            >
                              Popular
                            </span>
                          </div>
                          <div
                            className={cn(
                              'grid gap-3',
                              device === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'
                            )}
                          >
                            {[
                              { title: 'Tanti Royal Kurta', price: '৳ 3,450', img: images.kurta },
                              { title: 'Handloom Cotton Panjabi', price: '৳ 4,200', img: images.panjabi },
                              { title: 'Chiffon Floral Saree', price: '৳ 6,800', img: images.saree },
                              { title: 'Linen Casual Shirt', price: '৳ 2,150', img: images.shirt },
                            ]
                              .slice(0, device === 'mobile' ? 2 : 4)
                              .map((prod, i) => (
                                <div
                                  key={i}
                                  className="space-y-1.5 p-2 bg-canvas/60 border border-line/40"
                                  style={{ borderRadius: currentTheme.borderRadius }}
                                >
                                  <img
                                    src={prod.img}
                                    alt={prod.title}
                                    className="aspect-[3/4] w-full object-cover rounded"
                                  />
                                  <p className="text-xs font-medium text-ink truncate">{prod.title}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-ink">{prod.price}</span>
                                    <button
                                      type="button"
                                      className="rounded px-2 py-0.5 text-[10px] font-semibold text-white cursor-pointer"
                                      style={{ backgroundColor: currentTheme.primaryColor }}
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* 4. SUMMER SPOTLIGHT */}
                      {sec.sectionType === 'SUMMER_SPOTLIGHT' && (
                        <div
                          className="relative overflow-hidden p-5 text-white flex flex-col justify-center min-h-[160px]"
                          style={{
                            backgroundColor: currentTheme.primaryColor,
                            borderRadius: currentTheme.borderRadius,
                          }}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">
                            Exclusive Spotlight
                          </span>
                          <h3
                            className="text-lg font-bold text-white mt-1"
                            style={{ fontFamily: headingFontFamily }}
                          >
                            Summer Linen Edition 2026
                          </h3>
                          <p className="text-xs text-white/90 mt-1 max-w-xs">
                            Naturally breathable fibers woven with artisanal precision.
                          </p>
                          <button
                            type="button"
                            className="mt-3 w-fit rounded px-3 py-1 text-xs font-bold text-ink bg-white shadow-xs cursor-pointer"
                          >
                            Explore Collection
                          </button>
                        </div>
                      )}

                      {/* 5. NEW ARRIVALS */}
                      {sec.sectionType === 'NEW_ARRIVALS' && (
                        <div
                          className="p-4 shadow-xs border border-line/40"
                          style={{
                            backgroundColor: currentTheme.surfaceColor,
                            borderRadius: currentTheme.borderRadius,
                          }}
                        >
                          <h3
                            className="text-sm font-bold text-ink mb-2"
                            style={{ fontFamily: headingFontFamily }}
                          >
                            New Arrivals
                          </h3>
                          <div
                            className={cn(
                              'grid gap-2',
                              device === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'
                            )}
                          >
                            {[images.tunic, images.koti, images.dupatta, images.bag]
                              .slice(0, device === 'mobile' ? 2 : 4)
                              .map((src, i) => (
                                <img
                                  key={i}
                                  src={src}
                                  alt=""
                                  className="aspect-[3/4] w-full rounded object-cover border border-line/30"
                                />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* 6. TRUST POINTS */}
                      {sec.sectionType === 'TRUST_POINTS' && (
                        <div
                          className="grid grid-cols-3 gap-2 p-3 text-center border border-line/40"
                          style={{
                            backgroundColor: currentTheme.surfaceColor,
                            borderRadius: currentTheme.borderRadius,
                          }}
                        >
                          <div>
                            <p className="text-xs font-bold text-ink">Free Delivery</p>
                            <p className="text-[10px] text-ink-muted">On orders over ৳3,000</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ink">Cash on Delivery</p>
                            <p className="text-[10px] text-ink-muted">All over Bangladesh</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ink">Easy 7-Day Returns</p>
                            <p className="text-[10px] text-ink-muted">Hassle-free guarantee</p>
                          </div>
                        </div>
                      )}

                      {/* 7. TESTIMONIALS */}
                      {sec.sectionType === 'TESTIMONIALS' && (
                        <div
                          className="p-4 shadow-xs border border-line/40"
                          style={{
                            backgroundColor: currentTheme.surfaceColor,
                            borderRadius: currentTheme.borderRadius,
                          }}
                        >
                          <h3
                            className="text-sm font-bold text-ink mb-2"
                            style={{ fontFamily: headingFontFamily }}
                          >
                            Customer Voices
                          </h3>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded p-2.5 bg-canvas/60 text-xs border border-line/30">
                              <p className="italic text-ink">“The fabric quality and craftsmanship are unmatched. Truly world-class.”</p>
                              <p className="mt-1 font-bold text-ink-muted text-[10px]">— Farzana Ahmed, Dhaka</p>
                            </div>
                            {device !== 'mobile' && (
                              <div className="rounded p-2.5 bg-canvas/60 text-xs border border-line/30">
                                <p className="italic text-ink">“Super fast shipping and the packaging felt extremely premium.”</p>
                                <p className="mt-1 font-bold text-ink-muted text-[10px]">— Tanvir Rahman, Chittagong</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 8. NEWSLETTER / RECOMMENDED */}
                      {(sec.sectionType === 'NEWSLETTER' || sec.sectionType === 'RECOMMENDED') && (
                        <div
                          className="p-4 text-center border border-line/40"
                          style={{
                            backgroundColor: currentTheme.surfaceColor,
                            borderRadius: currentTheme.borderRadius,
                          }}
                        >
                          <h4
                            className="text-sm font-bold text-ink"
                            style={{ fontFamily: headingFontFamily }}
                          >
                            Join The Tanti Circle
                          </h4>
                          <p className="text-[11px] text-ink-muted mt-1">
                            Enjoy 10% off your first festive order & exclusive drops.
                          </p>
                          <div className="mt-3 flex justify-center gap-2 max-w-xs mx-auto">
                            <input
                              type="email"
                              placeholder="Enter your email"
                              className="rounded border border-line px-2.5 py-1 text-xs bg-canvas text-ink flex-1"
                            />
                            <button
                              type="button"
                              className="rounded px-3 py-1 text-xs font-semibold text-white"
                              style={{ backgroundColor: currentTheme.primaryColor }}
                            >
                              Subscribe
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Simulated Store Footer */}
              <footer
                className="border-t p-4 text-center text-xs text-ink-muted border-line/40"
                style={{ backgroundColor: currentTheme.surfaceColor }}
              >
                <p className="font-semibold text-ink" style={{ fontFamily: headingFontFamily }}>
                  Tanti Boutique & Atelier
                </p>
                <p className="text-[10px] mt-1">
                  © 2026 Tanti Fashion Ltd. Powered by Orvio Multi-Tenant Platform.
                </p>
              </footer>
            </div>
          </div>
        </div>

        {/* MODAL 1: EXPLORE BASE PRESETS */}
        <Modal
          open={isPresetModalOpen}
          onClose={() => setIsPresetModalOpen(false)}
          title="Theme Presets Catalog"
          description="Choose a pre-designed base theme. Applying a preset copies tokens, typography, and section layouts into your editor."
          size="lg"
        >
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 pt-2">
            {PRESET_TEMPLATES.map((preset) => {
              const isSelected = currentTheme.presetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={cn(
                    'flex flex-col justify-between overflow-hidden rounded-xl border bg-surface p-3 transition-all shadow-xs',
                    isSelected ? 'border-ink ring-2 ring-ink/20' : 'border-line hover:border-ink-muted'
                  )}
                >
                  <div className="space-y-2">
                    <img
                      src={preset.previewImage}
                      alt={preset.name}
                      className="aspect-[4/3] w-full rounded-lg object-cover border border-line"
                    />
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-ink">{preset.name}</h4>
                        {isSelected && (
                          <Badge tone="success">Current</Badge>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted line-clamp-2 mt-1">
                        {preset.description}
                      </p>
                    </div>

                    {/* Tokens preview tags */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-ink-muted">Tokens:</span>
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-line"
                        style={{ backgroundColor: preset.defaultTokens.primaryColor }}
                        title="Primary"
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-line"
                        style={{ backgroundColor: preset.defaultTokens.accentColor }}
                        title="Accent"
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-line"
                        style={{ backgroundColor: preset.defaultTokens.canvasColor }}
                        title="Canvas"
                      />
                      <span className="ml-auto text-[10px] font-mono text-ink-muted">
                        {preset.defaultTokens.fontHeading}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="mt-4 w-full rounded-md border border-line bg-subtle py-1.5 text-xs font-medium text-ink hover:bg-ink hover:text-canvas transition-colors cursor-pointer"
                  >
                    Apply Preset
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>

        {/* MODAL 2: ADD SECTION BLOCK */}
        <Modal
          open={isAddSectionModalOpen}
          onClose={() => setIsAddSectionModalOpen(false)}
          title="Add Section Block"
          description="Select a section component to add to your homepage layout."
          size="md"
        >
          <div className="divide-y divide-line pt-2">
            {AVAILABLE_SECTIONS_CATALOG.map((sec) => (
              <div
                key={sec.sectionType}
                className="flex items-center justify-between py-2.5 hover:bg-subtle/50 px-2 rounded transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-ink">{sec.label}</p>
                  <p className="text-[11px] text-ink-muted">{sec.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddSection(sec)}
                  className="rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-canvas hover:opacity-90 transition-opacity cursor-pointer shrink-0 ml-3"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </ModuleGate>
  );
}
