'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/Switch';
import { useLandingConfig } from '@/components/store/landing';
import {
  DEFAULT_LANDING_CONFIG,
  LANDING_SECTION_IDS,
  SECTION_DESIGNS,
  SECTION_LABELS,
  type LandingConfig,
  type LandingSectionId,
} from '@/lib/landing-config';
import { cn } from '@/utils/cn';

const COPY_BY_SECTION: Record<
  LandingSectionId,
  { key: keyof LandingConfig; label: string; multiline?: boolean }[]
> = {
  hero: [
    { key: 'heroEyebrow', label: 'Small label' },
    { key: 'heroTitle', label: 'Headline' },
    { key: 'heroSubtitle', label: 'Description', multiline: true },
    { key: 'heroCta', label: 'Button' },
    { key: 'heroScript', label: 'Script line' },
  ],
  categories: [],
  featured: [
    { key: 'featuredEyebrow', label: 'Small label' },
    { key: 'featuredTitle', label: 'Headline' },
    { key: 'featuredSubtitle', label: 'Description', multiline: true },
    { key: 'featuredCta', label: 'Button' },
  ],
  promo: [
    { key: 'promoEyebrow', label: 'Small label' },
    { key: 'promoTitle', label: 'Headline' },
    { key: 'promoSubtitle', label: 'Detail' },
    { key: 'promoCta', label: 'Button' },
    { key: 'promoScript', label: 'Script line' },
  ],
  picks: [
    { key: 'picksEyebrow', label: 'Small label' },
    { key: 'picksTitle', label: 'Headline' },
    { key: 'picksSubtitle', label: 'Description' },
  ],
  trust: [],
  reviews: [
    { key: 'reviewsEyebrow', label: 'Small label' },
    { key: 'reviewsTitle', label: 'Headline' },
    { key: 'reviewsSubtitle', label: 'Description' },
  ],
  newsletter: [
    { key: 'newsletterEyebrow', label: 'Small label' },
    { key: 'newsletterTitle', label: 'Headline' },
    { key: 'newsletterSubtitle', label: 'Description', multiline: true },
  ],
};

export function LandingTemplateStudio() {
  const { config, ready, save } = useLandingConfig();
  const [draft, setDraft] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<LandingSectionId | null>(null);

  useEffect(() => {
    if (!ready || hydrated) return;
    setDraft(config);
    setHydrated(true);
  }, [ready, hydrated, config]);

  const commit = (next: LandingConfig, message?: string) => {
    setDraft(next);
    save(next);
    if (message) toast.success(message);
  };

  if (selected) {
    const setting = draft.designs[selected];
    const options = SECTION_DESIGNS[selected];
    const fields = COPY_BY_SECTION[selected];
    const active = options.find((option) => option.id === setting.design) || options[0];

    return (
      <div className="space-y-4 rounded-lg border border-line bg-surface p-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          All sections
        </button>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">{SECTION_LABELS[selected]}</h2>
          <Switch
            checked={setting.visible}
            onChange={(visible) =>
              commit({
                ...draft,
                designs: { ...draft.designs, [selected]: { ...setting, visible } },
              })
            }
            label={`Show ${SECTION_LABELS[selected]}`}
            hideLabel
          />
        </div>
        <p className="text-sm text-ink-muted">{active.summary}</p>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => {
            const isOn = setting.design === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isOn}
                onClick={() =>
                  commit(
                    {
                      ...draft,
                      designs: {
                        ...draft.designs,
                        [selected]: { ...setting, design: option.id },
                      },
                    },
                    `${SECTION_LABELS[selected]} now uses ${option.name}.`
                  )
                }
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium',
                  isOn ? 'border-clay bg-clay-soft/50 text-ink' : 'border-line bg-canvas text-ink-muted'
                )}
              >
                {option.name}
              </button>
            );
          })}
        </div>
        {fields.length > 0 && (
          <div className="space-y-3 border-t border-line pt-4">
            {fields.map((field) => {
              const value = String(draft[field.key] ?? '');
              const className =
                'mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink';
              return (
                <label key={field.key} className="block">
                  <span className="text-sm text-ink-muted">{field.label}</span>
                  {field.multiline ? (
                    <textarea
                      rows={3}
                      value={value}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      onBlur={(event) => save({ ...draft, [field.key]: event.currentTarget.value })}
                      className={className}
                    />
                  ) : (
                    <input
                      value={value}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      onBlur={(event) => save({ ...draft, [field.key]: event.currentTarget.value })}
                      className={className}
                    />
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Homepage sections</h2>
        <p className="mt-1 text-sm text-ink-muted">Open a section to choose its design and edit its text.</p>
      </div>
      <ul>
        {LANDING_SECTION_IDS.map((sectionId) => {
          const setting = draft.designs[sectionId];
          const designName =
            SECTION_DESIGNS[sectionId].find((option) => option.id === setting.design)?.name ||
            SECTION_DESIGNS[sectionId][0].name;
          return (
            <li key={sectionId} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => setSelected(sectionId)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-canvas"
              >
                <span>
                  <span className="block text-sm font-medium text-ink">{SECTION_LABELS[sectionId]}</span>
                  <span className="block text-sm text-ink-muted">
                    {setting.visible ? designName : 'Hidden'}
                  </span>
                </span>
                <span className="text-sm text-ink-muted">Edit</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
