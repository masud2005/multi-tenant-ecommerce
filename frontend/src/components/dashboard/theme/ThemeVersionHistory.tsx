'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/utils/format';
import type { ThemeVersion } from '@/types/theme';

interface ThemeVersionHistoryProps {
  versions: ThemeVersion[];
  isLive: boolean;
  onRestore: (version: ThemeVersion) => void;
  disabled?: boolean;
}

export function ThemeVersionHistory({
  versions,
  isLive,
  onRestore,
  disabled,
}: ThemeVersionHistoryProps) {
  return (
    <Panel title="Version history" flush>
      <ul className="divide-y divide-line">
        {(!versions || versions.length === 0) ? (
          <li className="px-5 py-4 text-xs text-ink-muted text-center">
            No published versions recorded yet.
          </li>
        ) : (
          versions.map((v, idx) => (
            <li
              key={v.id}
              className="flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{v.version}</span>
                  <span className="text-xs text-ink-muted truncate">{v.label}</span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  {formatDateTime(v.createdAt)} · {v.publishedBy || 'Owner'}
                </p>
              </div>
              {idx === 0 && isLive ? (
                <Badge tone="success">Live</Badge>
              ) : (
                <GuardedButton
                  module="theme"
                  action="publish"
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onRestore(v)}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Restore
                </GuardedButton>
              )}
            </li>
          ))
        )}
      </ul>
    </Panel>
  );
}
