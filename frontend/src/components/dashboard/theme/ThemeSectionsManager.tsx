'use client';

import React from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Panel } from '@/components/dashboard/shared/Panel';
import { cn } from '@/utils/cn';
import type { ThemeSection } from '@/types/theme';

interface ThemeSectionsManagerProps {
  sections: ThemeSection[];
  onReorder: (newSections: ThemeSection[]) => void;
  onToggleVisibility: (sectionId: string) => void;
}

export function ThemeSectionsManager({
  sections,
  onReorder,
  onToggleVisibility,
}: ThemeSectionsManagerProps) {
  return (
    <Panel
      title="Landing page sections"
      description="Drag to set section priority. Toggle eye to show or hide."
    >
      <Reorder.Group
        axis="y"
        values={sections}
        onReorder={onReorder}
        className="space-y-1.5"
      >
        {sections.map((s) => (
          <Reorder.Item
            key={s.id}
            value={s}
            className="flex cursor-grab items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2 text-sm active:cursor-grabbing transition-colors"
          >
            <GripVertical className="h-4 w-4 text-ink-muted" aria-hidden />
            <span
              className={cn(
                'flex-1 text-ink select-none',
                !s.isVisible && 'text-ink-muted line-through'
              )}
            >
              {s.label}
            </span>
            <button
              type="button"
              onClick={() => onToggleVisibility(s.id)}
              aria-label={s.isVisible ? `Hide ${s.label}` : `Show ${s.label}`}
              className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink cursor-pointer transition-colors"
            >
              {s.isVisible ? (
                <Eye className="h-4 w-4 text-ink" />
              ) : (
                <EyeOff className="h-4 w-4 text-ink-muted" />
              )}
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </Panel>
  );
}
