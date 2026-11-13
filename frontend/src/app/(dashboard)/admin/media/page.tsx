'use client';


import { asApiError } from '@/lib/api-error';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, AlertTriangle, Search, Loader2, RefreshCw, Trash2, CheckCircle2, Image as ImageIcon, Plus } from 'lucide-react';
import { mediaService, type MediaAsset } from '@/services/media-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { cn } from '@/utils/cn';

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'noalt' | 'unused'>('all');
  const [q, setQ] = useState('');
  const [alt, setAlt] = useState('');
  const [isSavingAlt, setIsSavingAlt] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');

  const [metrics, setMetrics] = useState({
    total: 0,
    noAltCount: 0,
    unusedCount: 0,
    storageUsedFormatted: '0 MB',
    storageLimitFormatted: '10 GB',
    storagePercent: 0,
  });

  // Fetch media from backend
  const fetchMedia = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await mediaService.getMedia({
        filter: filter !== 'all' ? filter : undefined,
        search: q.trim() || undefined,
      });

      if (res?.data) {
        setAssets(res.data.assets || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err: unknown) {
      console.warn('Could not fetch media library:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, q]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const active = assets.find((a) => a.id === activeId);

  // Save updated alt text
  const handleSaveAlt = async () => {
    if (!active) return;
    try {
      setIsSavingAlt(true);
      await mediaService.updateMedia(active.id, { alt });
      setAssets((prev) =>
        prev.map((a) => (a.id === active.id ? { ...a, alt } : a)),
      );
      toast.success('Alt text updated successfully');
      setActiveId(null);
      fetchMedia();
    } catch (err: unknown) {
      toast.error(asApiError(err).response?.data?.message || asApiError(err).message || 'Failed to save alt text');
    } finally {
      setIsSavingAlt(false);
    }
  };

  // Delete media asset
  const handleDeleteMedia = async () => {
    if (!active) return;
    if (active.usedIn > 0) {
      toast.error('Cannot delete: this media asset is referenced in catalog products');
      return;
    }
    try {
      setIsDeleting(true);
      await mediaService.deleteMedia(active.id);
      setAssets((prev) => prev.filter((a) => a.id !== active.id));
      toast.success('Media asset removed from library');
      setActiveId(null);
      fetchMedia();
    } catch (err: unknown) {
      toast.error(asApiError(err).response?.data?.message || asApiError(err).message || 'Failed to delete media asset');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeUploadModal = () => {
    setUploadOpen(false);
    setUploadPreviewUrl('');
    setUploadAlt('');
  };

  const handleUploadComplete = (url: string) => {
    setUploadPreviewUrl(url);
    if (url) {
      closeUploadModal();
      fetchMedia();
    }
  };

  return (
    <ModuleGate module="media">
      <div className="w-full space-y-6">
        <PageHeader
          title="Media Library"
          description="Centralized cloud asset storage. Images are automatically organized, compressed, and linked across products."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchMedia}
                disabled={isLoading}
                className="cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <GuardedButton
                module="media"
                action="create"
                size="sm"
                onClick={() => setUploadOpen(true)}
                className="cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-1" aria-hidden /> Add Media
              </GuardedButton>
            </div>
          }
        />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search files by name…"
              aria-label="Search media"
              className="h-9 w-full rounded-md border border-line bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
            />
          </div>

          <div
            className="flex rounded-md border border-line bg-surface p-0.5 text-xs"
            role="group"
            aria-label="Filter"
          >
            {[
              ['all', `All (${metrics.total || assets.length})`],
              ['noalt', `Missing alt (${metrics.noAltCount || assets.filter((a) => !a.alt).length})`],
              ['unused', `Unused (${metrics.unusedCount || assets.filter((a) => a.usedIn === 0).length})`],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFilter(v as typeof filter)}
                aria-pressed={filter === v}
                className={cn(
                  'whitespace-nowrap rounded px-2.5 py-1 cursor-pointer transition-colors',
                  filter === v
                    ? 'bg-ink text-canvas font-medium'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="w-48 text-xs text-ink-muted">
            <p>
              {metrics.storageUsedFormatted} of {metrics.storageLimitFormatted} used
            </p>
            <div className="mt-1 h-1.5 rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-ink transition-all"
                style={{ width: `${Math.max(5, Math.min(100, metrics.storagePercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        {isLoading && assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-clay mb-2" />
            <p className="text-sm text-ink-muted">Loading media library from database...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface py-16 text-center">
            <ImageIcon className="h-10 w-10 text-ink-muted mx-auto mb-3" />
            <p className="text-base font-medium text-ink">No media assets found</p>
            <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
              Add catalog photos, banners, and product variants to build your store media collection.
            </p>
            <Button
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="mt-4 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Your First Image
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {assets.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(a.id);
                    setAlt(a.alt || '');
                  }}
                  className="group block w-full text-left cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-md border border-line bg-surface">
                    <img
                      src={a.url}
                      alt={a.alt || a.name}
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                      }}
                    />
                    {!a.alt && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-amber-500/90 text-white px-1.5 py-0.5 text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" aria-hidden /> No alt
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-sm font-medium text-ink group-hover:underline">
                    {a.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {a.size} · {a.usedIn ? `Used in ${a.usedIn}` : 'Unused'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Image Detail Drawer */}
        <Drawer
          open={!!active}
          onClose={() => setActiveId(null)}
          title={active?.name ?? ''}
          subtitle={active && `${active.dimensions || active.dims || 'Standard'} · ${active.size}`}
          footer={
            active && (
              <div className="flex justify-between gap-2 w-full">
                <GuardedButton
                  module="media"
                  action="delete"
                  variant="ghost"
                  disabled={active.usedIn > 0 || isDeleting}
                  onClick={handleDeleteMedia}
                  className="text-danger hover:bg-danger/10"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Delete
                </GuardedButton>
                <Button
                  onClick={handleSaveAlt}
                  disabled={isSavingAlt}
                >
                  {isSavingAlt ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save Alt Text
                </Button>
              </div>
            )
          }
        >
          {active && (
            <div className="space-y-4 px-5 py-5">
              <img
                src={active.url}
                alt={active.alt || active.name}
                className="w-full rounded-md object-contain max-h-72 border border-line bg-canvas"
              />
              <Input
                label="Alt text (SEO & Accessibility)"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="e.g. Crimson Jamdani saree with gold border"
                hint="Describe the image content accurately for screen readers and SEO"
              />
              <div className="rounded-md border border-line bg-surface p-3 text-xs space-y-1">
                <p className="text-ink font-medium">Media Information</p>
                <p className="text-ink-muted">Direct URL: <span className="font-mono text-ink text-[11px] break-all">{active.url}</span></p>
                <p className="text-ink-muted">References: <span className="font-medium text-ink">{active.usedIn} active products</span></p>
              </div>
              {active.usedIn > 0 && (
                <p className="text-xs text-amber-600">
                  This asset is currently in use by store catalog items. Unlink it from products before deletion.
                </p>
              )}
            </div>
          )}
        </Drawer>

        {/* Add Media Modal */}
        <Modal
          open={uploadOpen}
          onClose={closeUploadModal}
          title="Upload media asset"
        >
          <div className="space-y-4 py-2">
            <ImageUploadField
              label="Store image"
              hint="Uploads to Cloudinary and saves in your media library · max 5MB"
              value={uploadPreviewUrl}
              onChange={handleUploadComplete}
              alt={uploadAlt}
              onAltChange={setUploadAlt}
              aspectClassName="aspect-[4/3] min-h-[180px]"
            />
            <div className="flex justify-end border-t border-line pt-3">
              <Button type="button" variant="ghost" onClick={closeUploadModal}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ModuleGate>
  );
}
