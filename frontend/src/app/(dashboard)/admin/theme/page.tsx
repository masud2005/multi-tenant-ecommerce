'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Layers, Palette, History } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { themeService } from '@/services/theme-service';
import {
  ThemeSectionsManager,
  BrandCustomizer,
  ThemeVersionHistory,
  ThemePreviewCanvas,
} from '@/components/dashboard/theme';
import { cn } from '@/utils/cn';
import type { TenantTheme, ThemeSection, ThemeVersion } from '@/types/theme';

export default function AdminThemePage() {
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'styling'>('sections');
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [dirty, setDirty] = useState<boolean>(false);

  // ─── Load theme data (single API call) ───────────────────────────────────────
  // GET /owner/theme → { liveTheme (with sections + versions), themes[] }
  // liveTheme already includes versions (last 10), enough for the UI.
  const loadThemeData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await themeService.getThemeData();
      if (res.success && res.data?.liveTheme) {
        setTheme(res.data.liveTheme);
      }
    } catch {
      toast.error('Failed to load theme data from server.');
    } finally {
      setIsLoading(false);
      setDirty(false);
    }
  }, []);

  useEffect(() => {
    loadThemeData();
  }, [loadThemeData]);

  // ─── Local state update (no API call) ────────────────────────────────────────
  const handleThemeChange = (fields: Partial<TenantTheme>) => {
    if (!theme) return;
    setTheme((prev) => (prev ? { ...prev, ...fields } : null));
    setDirty(true);
  };

  // ─── Internal save helper (no isSaving state — used inside other handlers) ───
  // Returns true on success, false on failure.
  const persistDraft = async (t: TenantTheme): Promise<boolean> => {
    try {
      const res = await themeService.updateTheme(t.id, {
        name: t.name,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        accentColor: t.accentColor,
        canvasColor: t.canvasColor,
        surfaceColor: t.surfaceColor,
        inkColor: t.inkColor,
        fontHeading: t.fontHeading,
        fontBody: t.fontBody,
        borderRadius: t.borderRadius,
        cardStyle: t.cardStyle,
        customCss: t.customCss,
      });
      if (res.success && res.data) {
        // Explicitly preserve versions — PATCH response doesn't include them
        setTheme((prev) =>
          prev ? { ...prev, ...res.data, versions: prev.versions } : null
        );
      }
      return true;
    } catch {
      return false;
    }
  };

  // ─── Save Draft button handler ────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!theme) return;
    try {
      setIsSaving(true);
      const ok = await persistDraft(theme);
      if (ok) {
        setDirty(false);
        toast.success('Draft saved.');
      } else {
        toast.error('Failed to save draft. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Publish ─────────────────────────────────────────────────────────────────
  // Auto-saves dirty changes first (under isPublishing state, no isSaving clash),
  // then publishes and re-fetches the full theme to pick up the new version entry.
  const handlePublish = async () => {
    if (!theme) return;
    try {
      setIsPublishing(true);

      // Save unsaved token changes before publishing (no separate isSaving toggle)
      if (dirty) {
        const ok = await persistDraft(theme);
        if (!ok) {
          toast.error('Could not save changes before publishing. Please try again.');
          return;
        }
        setDirty(false);
      }

      const res = await themeService.publishTheme(theme.id);
      if (res.success && res.data) {
        // Re-fetch to get the newly created version history entry
        const detailRes = await themeService.getThemeById(res.data.id);
        const finalTheme = detailRes.success && detailRes.data
          ? detailRes.data
          : { ...res.data, versions: theme.versions };
        setTheme(finalTheme);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tanti-theme-published', { detail: finalTheme }));
        }
      }
      setDirty(false);
      toast.success('Theme published live to storefront!');
    } catch {
      toast.error('Failed to publish theme. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // ─── Reorder sections → optimistic + immediate backend sync ──────────────────
  const handleReorderSections = async (newSections: ThemeSection[]) => {
    if (!theme) return;
    const updated = newSections.map((s, idx) => ({ ...s, orderIndex: idx }));
    setTheme((prev) => (prev ? { ...prev, sections: updated } : null));
    setDirty(true);
    try {
      await themeService.reorderSections(theme.id, {
        sections: updated.map((s) => ({
          id: s.id,
          orderIndex: s.orderIndex,
          isVisible: s.isVisible,
        })),
      });
    } catch {
      toast.error('Failed to save section order.');
    }
  };

  // ─── Toggle section visibility → optimistic + immediate backend sync ──────────
  const handleToggleVisibility = async (secId: string) => {
    if (!theme) return;
    const updated = theme.sections.map((s) =>
      s.id === secId ? { ...s, isVisible: !s.isVisible } : s
    );
    setTheme((prev) => (prev ? { ...prev, sections: updated } : null));
    setDirty(true);
    try {
      await themeService.reorderSections(theme.id, {
        sections: updated.map((s) => ({
          id: s.id,
          orderIndex: s.orderIndex,
          isVisible: s.isVisible,
        })),
      });
    } catch {
      toast.error('Failed to update section visibility.');
    }
  };

  // ─── Restore version snapshot ─────────────────────────────────────────────────
  const handleRestore = async (ver: ThemeVersion) => {
    if (!theme) return;
    try {
      setIsSaving(true);
      const res = await themeService.restoreVersion(theme.id, ver.id);
      if (res.success && res.data) {
        // Re-fetch to get updated version list after restore
        const detailRes = await themeService.getThemeById(res.data.id);
        const finalTheme = detailRes.success && detailRes.data
          ? detailRes.data
          : { ...res.data, versions: theme.versions };
        setTheme(finalTheme);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tanti-theme-published', { detail: finalTheme }));
        }
      }
      setDirty(false);
      setHistoryOpen(false);
      toast.success(`Rolled back to ${ver.version}`);
    } catch {
      toast.error('Failed to restore version snapshot.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── States ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <ModuleGate module="theme">
        <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
          <LoadingSpinner size="lg" label="Loading theme settings..." />
        </div>
      </ModuleGate>
    );
  }

  if (!theme) {
    return (
      <ModuleGate module="theme">
        <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3">
          <p className="text-sm text-ink-muted">Unable to load store theme from database.</p>
          <button
            type="button"
            onClick={loadThemeData}
            className="rounded bg-ink px-4 py-2 text-xs font-semibold text-canvas hover:bg-ink/90 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </ModuleGate>
    );
  }

  return (
    <ModuleGate module="theme">
      <div className="w-full space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Theme"
          description="Manage landing page section priority, visibility, and brand styling. Changes are saved as draft until published."
          meta={
            <div className="flex items-center gap-2">
              <Badge tone={dirty ? 'warning' : 'success'} dot>
                {dirty ? 'Unpublished changes' : 'Live'}
              </Badge>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-subtle transition-colors cursor-pointer"
                title="View version history and rollbacks"
              >
                <History className="h-3.5 w-3.5 text-ink-muted" />
                <span>History</span>
              </button>

              <GuardedButton
                module="theme"
                action="update"
                variant="secondary"
                size="sm"
                disabled={!dirty || isSaving || isPublishing}
                onClick={handleSaveDraft}
              >
                {isSaving ? 'Saving...' : 'Save draft'}
              </GuardedButton>

              <GuardedButton
                module="theme"
                action="publish"
                size="sm"
                disabled={isPublishing || isSaving}
                onClick={handlePublish}
              >
                {isPublishing ? 'Publishing...' : 'Publish'}
              </GuardedButton>
            </div>
          }
        />

        {/* 2-Column Layout */}
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Left: Tabs */}
          <div className="space-y-4">
            <div className="flex rounded-lg border border-line bg-surface p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'sections'
                    ? 'bg-subtle text-ink shadow-xs border border-line font-bold'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <Layers className="h-4 w-4" />
                <span>Sections</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('styling')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'styling'
                    ? 'bg-subtle text-ink shadow-xs border border-line font-bold'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <Palette className="h-4 w-4" />
                <span>Brand Styling</span>
              </button>
            </div>

            {activeTab === 'sections' && (
              <ThemeSectionsManager
                sections={theme.sections}
                onReorder={handleReorderSections}
                onToggleVisibility={handleToggleVisibility}
              />
            )}

            {activeTab === 'styling' && (
              <BrandCustomizer theme={theme} onChange={handleThemeChange} />
            )}
          </div>

          {/* Right: Live Preview */}
          <ThemePreviewCanvas theme={theme} />
        </div>

        {/* Version History Drawer */}
        <Drawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          title="Version History"
          subtitle="Past release snapshots with 1-click restore"
          width="max-w-md"
        >
          <div className="p-4">
            <ThemeVersionHistory
              versions={theme.versions || []}
              isLive={theme.isLive}
              onRestore={handleRestore}
              disabled={isSaving || isPublishing}
            />
          </div>
        </Drawer>
      </div>
    </ModuleGate>
  );
}
