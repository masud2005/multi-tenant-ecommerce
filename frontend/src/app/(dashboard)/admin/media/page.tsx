'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Upload, AlertTriangle, Search } from 'lucide-react';
import { mediaAssets as seed } from '@/data/admin';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export default function AdminMediaPage() {
  const [assets, setAssets] = useState(seed);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'noalt' | 'unused'>('all');
  const [q, setQ] = useState('');
  const [alt, setAlt] = useState('');
  const active = assets.find((a) => a.id === activeId);
  const rows = assets.filter(
    (a) =>
      (filter === 'all' || (filter === 'noalt' ? !a.alt : a.usedIn === 0)) &&
      a.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <ModuleGate module="media">
      <div className="w-full space-y-6">
        <PageHeader
          title="Media library"
          description="Images are optimized to WebP/AVIF and resized for every screen automatically."
          actions={
            <GuardedButton
              module="media"
              action="create"
              size="sm"
              onClick={() => toast.success('3 files uploaded and optimized')}
            >
              <Upload className="h-4 w-4" aria-hidden /> Upload
            </GuardedButton>
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
              placeholder="Search files…"
              aria-label="Search media"
              className="h-9 w-full rounded-md border border-line-strong bg-surface pl-8 pr-3 text-sm text-ink focus:border-clay focus:outline-none"
            />
          </div>
          <div
            className="flex rounded-md border border-line bg-surface p-0.5 text-xs"
            role="group"
            aria-label="Filter"
          >
            {[
              ['all', 'All'],
              ['noalt', `Missing alt (${assets.filter((a) => !a.alt).length})`],
              ['unused', 'Unused'],
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
            <p>3.4 GB of 10 GB used</p>
            <div className="mt-1 h-1.5 rounded-full bg-subtle">
              <div className="h-full w-[34%] rounded-full bg-ink" />
            </div>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(a.id);
                  setAlt(a.alt);
                }}
                className="group block w-full text-left cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-md border border-line bg-surface">
                  <img
                    src={a.url}
                    alt={a.alt}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {!a.alt && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
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

        <Drawer
          open={!!active}
          onClose={() => setActiveId(null)}
          title={active?.name ?? ''}
          subtitle={active && `${active.dims} · ${active.size}`}
          footer={
            active && (
              <div className="flex justify-between gap-2 w-full">
                <GuardedButton
                  module="media"
                  action="delete"
                  variant="ghost"
                  disabled={active.usedIn > 0}
                  onClick={() => {
                    setAssets((x) => x.filter((y) => y.id !== active.id));
                    setActiveId(null);
                    toast.success('File deleted');
                  }}
                >
                  Delete
                </GuardedButton>
                <Button
                  onClick={() => {
                    setAssets((x) =>
                      x.map((y) => (y.id === active.id ? { ...y, alt } : y))
                    );
                    setActiveId(null);
                    toast.success('Alt text saved');
                  }}
                >
                  Save
                </Button>
              </div>
            )
          }
        >
          {active && (
            <div className="space-y-4 px-5 py-5">
              <img
                src={active.url}
                alt={active.alt}
                className="w-full rounded-md object-contain max-h-72 border border-line"
              />
              <Input
                label="Alt text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                hint="Describe the image for screen readers and search engines"
              />
              {active.usedIn > 0 && (
                <p className="text-xs text-ink-muted">
                  Used in {active.usedIn} places — remove it from those first to delete.
                </p>
              )}
            </div>
          )}
        </Drawer>
      </div>
    </ModuleGate>
  );
}
