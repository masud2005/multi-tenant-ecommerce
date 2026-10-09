'use client';

import React from 'react';
import { Panel } from '@/components/dashboard/shared/Panel';
import { Select } from '@/components/ui/Select';
import type { TenantTheme } from '@/types/theme';

// Values must match what gets stored in the DB and used in CSS (--font-display / --font-sans)
const FONT_HEADING_OPTIONS = [
  { label: 'Fraunces (Serif)', value: 'Fraunces' },
  { label: 'Playfair Display (Serif)', value: 'Playfair Display' },
  { label: 'Plus Jakarta Sans (Modern)', value: 'Plus Jakarta Sans' },
  { label: 'Inter (Neutral Sans)', value: 'Inter' },
];

const FONT_BODY_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
  { label: 'Geist', value: 'Geist' },
];

const CARD_STYLE_OPTIONS = [
  { label: 'Portrait 3:4, hover second image', value: 'portrait-hover' },
  { label: 'Square 1:1, minimal', value: 'square-minimal' },
  { label: 'Portrait with quick add', value: 'portrait-quickadd' },
];

const RADIUS_OPTIONS = [
  { label: '0px (Sharp)', value: '0px' },
  { label: '4px (Slightly rounded)', value: '0.25rem' },
  { label: '8px (Modern rounded)', value: '0.5rem' },
  { label: '12px (Soft curve)', value: '0.75rem' },
  { label: '24px (Pill style)', value: '1.5rem' },
];

interface BrandCustomizerProps {
  theme: TenantTheme;
  onChange: (fields: Partial<TenantTheme>) => void;
}

export function BrandCustomizer({ theme, onChange }: BrandCustomizerProps) {
  return (
    <Panel
      title="Brand styling"
      description="Customize colors and typography for your store"
    >
      <div className="space-y-4">
        {/* Brand Colors */}
        <div className="space-y-3">
          {/* Primary Color */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Primary brand color</p>
              <p className="text-[11px] text-ink-muted">Buttons, badges, highlights</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="h-7 w-7 cursor-pointer rounded-full border border-line p-0 bg-transparent"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="w-20 rounded border border-line bg-surface px-1.5 py-1 text-xs font-mono uppercase text-ink text-center"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Accent color</p>
              <p className="text-[11px] text-ink-muted">Offers, sale tags, secondary actions</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                className="h-7 w-7 cursor-pointer rounded-full border border-line p-0 bg-transparent"
              />
              <input
                type="text"
                value={theme.accentColor}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                className="w-20 rounded border border-line bg-surface px-1.5 py-1 text-xs font-mono uppercase text-ink text-center"
              />
            </div>
          </div>

          {/* Canvas (Background) Color */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Background color</p>
              <p className="text-[11px] text-ink-muted">Storefront canvas background</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.canvasColor}
                onChange={(e) => onChange({ canvasColor: e.target.value })}
                className="h-7 w-7 cursor-pointer rounded-full border border-line p-0 bg-transparent"
              />
              <input
                type="text"
                value={theme.canvasColor}
                onChange={(e) => onChange({ canvasColor: e.target.value })}
                className="w-20 rounded border border-line bg-surface px-1.5 py-1 text-xs font-mono uppercase text-ink text-center"
              />
            </div>
          </div>

          {/* Ink (Text) Color */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Text color</p>
              <p className="text-[11px] text-ink-muted">Primary text across storefront</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.inkColor}
                onChange={(e) => onChange({ inkColor: e.target.value })}
                className="h-7 w-7 cursor-pointer rounded-full border border-line p-0 bg-transparent"
              />
              <input
                type="text"
                value={theme.inkColor}
                onChange={(e) => onChange({ inkColor: e.target.value })}
                className="w-20 rounded border border-line bg-surface px-1.5 py-1 text-xs font-mono uppercase text-ink text-center"
              />
            </div>
          </div>
        </div>

        {/* Typography & Layout */}
        <div className="space-y-4 pt-3 border-t border-line">
          <Select
            label="Heading font"
            value={theme.fontHeading}
            onChange={(e) => onChange({ fontHeading: e.target.value })}
            options={FONT_HEADING_OPTIONS}
          />

          <Select
            label="Body font"
            value={theme.fontBody}
            onChange={(e) => onChange({ fontBody: e.target.value })}
            options={FONT_BODY_OPTIONS}
          />

          <Select
            label="Corner radius"
            value={theme.borderRadius}
            onChange={(e) => onChange({ borderRadius: e.target.value })}
            options={RADIUS_OPTIONS}
          />

          <Select
            label="Product card style"
            value={theme.cardStyle}
            onChange={(e) => onChange({ cardStyle: e.target.value })}
            options={CARD_STYLE_OPTIONS}
          />
        </div>
      </div>
    </Panel>
  );
}
