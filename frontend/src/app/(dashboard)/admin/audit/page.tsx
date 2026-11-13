'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Download, ChevronDown, RefreshCw, Loader2, Search, ShieldCheck } from 'lucide-react';
import { auditService, type AuditLogEntry } from '@/services/audit-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/utils/cn';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cat, setCat] = useState('All');
  const [actor, setActor] = useState('All');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [actors, setActors] = useState<string[]>(['All']);
  const [open, setOpen] = useState<string | null>(null);

  // Fetch audit logs from backend
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await auditService.getAuditLogs({
        category: cat !== 'All' ? cat : undefined,
        actor: actor !== 'All' ? actor : undefined,
        search: search.trim() || undefined,
      });

      if (res?.data) {
        setLogs(res.data.logs || []);
        if (res.data.filters) {
          const uniqueCats = ['All', ...Array.from(new Set(res.data.filters.categories || []))];
          const uniqueActors = ['All', ...Array.from(new Set(res.data.filters.actors || []))];
          setCategories(uniqueCats);
          setActors(uniqueActors);
        }
      }
    } catch (err: unknown) {
      console.warn('Could not fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cat, actor, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Export audit log data as CSV
  const handleExport = () => {
    if (logs.length === 0) {
      toast.error('No audit records to export');
      return;
    }

    const headers = ['ID', 'Date & Time', 'Actor', 'Action', 'Resource', 'Category'];
    const csvRows = [headers.join(',')];

    for (const l of logs) {
      const row = [
        `"${l.id}"`,
        `"${formatDateTime(l.createdAt)}"`,
        `"${(l.actor || '').replace(/"/g, '""')}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${(l.resource || '').replace(/"/g, '""')}"`,
        `"${(l.category || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${logs.length} audit records`);
  };

  return (
    <ModuleGate module="audit">
      <div className="w-full space-y-6">
        <PageHeader
          title="Audit Log"
          description="Every sensitive change, order update, and security event — who performed it, when, and what changed."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchLogs}
                disabled={isLoading}
                className="cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <GuardedButton
                module="audit"
                action="view"
                variant="secondary"
                size="sm"
                onClick={handleExport}
                className="cursor-pointer"
              >
                <Download className="h-4 w-4 mr-1" aria-hidden /> Export CSV
              </GuardedButton>
            </div>
          }
        />

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by action, resource, or staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-line bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
            />
          </div>

          <select
            aria-label="Category"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select
            aria-label="Actor"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none"
          >
            {actors.map((a) => (
              <option key={a} value={a}>
                {a === 'All' ? 'All Staff / Actors' : a}
              </option>
            ))}
          </select>
        </div>

        {/* Logs List */}
        {isLoading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-clay mb-2" />
            <p className="text-sm text-ink-muted">Loading audit records from database...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-ink-muted mx-auto mb-3" />
            <p className="text-base font-medium text-ink">No audit entries found</p>
            <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
              Sensitive operations, permissions, and security events will automatically appear here as store staff make changes.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {logs.map((l) => {
              const hasDiff = !!(l.before || l.after);
              const expanded = open === l.id;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={!hasDiff}
                    onClick={() => setOpen(expanded ? null : l.id)}
                    aria-expanded={hasDiff ? expanded : undefined}
                    className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left text-sm enabled:hover:bg-subtle/30 transition-colors disabled:cursor-default"
                  >
                    <span className="w-36 text-xs text-ink-muted shrink-0">
                      {formatDateTime(l.createdAt)}
                    </span>
                    <span className="min-w-[200px] flex-1">
                      <b className="font-medium text-ink">{l.actor}</b>{' '}
                      <span className="text-ink">
                        {l.action.charAt(0).toLowerCase() + l.action.slice(1)}
                      </span>
                      <span className="block text-xs text-ink-muted mt-0.5">
                        {l.resource}
                      </span>
                    </span>
                    <Badge
                      tone={
                        l.category === 'Security' || l.category === 'Staff'
                          ? 'warning'
                          : l.category === 'Orders'
                          ? 'success'
                          : 'neutral'
                      }
                    >
                      {l.category}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-ink-muted transition-transform duration-150',
                        expanded && 'rotate-180',
                        !hasDiff && 'invisible'
                      )}
                      aria-hidden
                    />
                  </button>
                  {expanded && (
                    <div className="grid gap-3 px-5 pb-4 sm:grid-cols-2">
                      <div className="rounded-md bg-red-500/10 p-3 font-mono text-xs text-ink border border-red-500/20">
                        <p className="mb-1 font-sans text-xs font-semibold text-danger">
                          Before Change
                        </p>
                        <pre className="whitespace-pre-wrap break-all text-xs">
                          {l.before || '—'}
                        </pre>
                      </div>
                      <div className="rounded-md bg-emerald-500/10 p-3 font-mono text-xs text-ink border border-emerald-500/20">
                        <p className="mb-1 font-sans text-xs font-semibold text-emerald-600">
                          After Change
                        </p>
                        <pre className="whitespace-pre-wrap break-all text-xs">
                          {l.after || '—'}
                        </pre>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ModuleGate>
  );
}
