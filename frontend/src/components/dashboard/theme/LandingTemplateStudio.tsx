'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '@/components/dashboard/shared/Panel';
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

const SECTION_COPY: Record<
  LandingSectionId,
  { key: keyof LandingConfig; label: string; multiline?: boolean }[]
> = {
  hero: [
    { key: 'heroEyebrow', label: 'Eyebrow' },
    { key: 'heroTitle', label: 'Headline' },
    { key: 'heroSubtitle', label: 'Description', multiline: true },
    { key: 'heroCta', label: 'Button' },
    { key: 'heroScript', label: 'Script line' },
  ],
  categories: [],
  featured: [
    { key: 'featuredEyebrow', label: 'Eyebrow' },
    { key: 'featuredTitle', label: 'Headline' },
    { key: 'featuredSubtitle', label: 'Description', multiline: true },
    { key: 'featuredCta', label: 'Button' },
  ],
  promo: [
    { key: 'promoEyebrow', label: 'Eyebrow' },
    { key: 'promoTitle', label: 'Headline' },
    { key: 'promoSubtitle', label: 'Detail' },
    { key: 'promoCta', label: 'Button' },
    { key: 'promoScript', label: 'Script line' },
  ],
  picks: [
    { key: 'picksEyebrow', label: 'Eyebrow' },
    { key: 'picksTitle', label: 'Headline' },
    { key: 'picksSubtitle', label: 'Description' },
  ],
  trust: [],
  reviews: [
    { key: 'reviewsEyebrow', label: 'Eyebrow' },
    { key: 'reviewsTitle', label: 'Headline' },
    { key: 'reviewsSubtitle', label: 'Description' },
  ],
  newsletter: [
    { key: 'newsletterEyebrow', label: 'Eyebrow' },
    { key: 'newsletterTitle', label: 'Headline' },
    { key: 'newsletterSubtitle', label: 'Description', multiline: true },
  ],
};

export function LandingTemplateStudio() {
  const { config, ready, save } = useLandingConfig();
  const [draft, setDraft] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState<LandingSectionId | null>(null);

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

  const chooseDesign = (sectionId: LandingSectionId, design: string) => {
    if (draft.designs[sectionId].design === design) return;
    const option = SECTION_DESIGNS[sectionId].find((item) => item.id === design);
    commit(
      {
        ...draft,
        designs: {
          ...draft.designs,
          [sectionId]: { ...draft.designs[sectionId], design },
        },
      },
      `${SECTION_LABELS[sectionId]} is using ${option?.name || 'this design'}.`
    );
  };

  const toggleSection = (sectionId: LandingSectionId, visible: boolean) => {
    commit({
      ...draft,
      designs: {
        ...draft.designs,
        [sectionId]: { ...draft.designs[sectionId], visible },
      },
    });
  };

  const saveField = (key: keyof LandingConfig, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    save(next);
  };

  if (editing) {
    const sectionId = editing;
    const setting = draft.designs[sectionId];
    const options = SECTION_DESIGNS[sectionId];
    const fields = SECTION_COPY[sectionId];
    const inputClass =
      'mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink';

    return (
      <Panel
        title={SECTION_LABELS[sectionId]}
        description="Choose a design, then edit only this section’s text."
        actions={
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
            Sections
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink">Show on the homepage</p>
            <Switch
              checked={setting.visible}
              onChange={(visible) => toggleSection(sectionId, visible)}
              label={`${SECTION_LABELS[sectionId]} visibility`}
              hideLabel
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {options.map((option) => {
              const selected = setting.design === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseDesign(sectionId, option.id)}
                  className={cn(
                    'rounded-lg border px-3 py-3 text-left',
                    selected
                      ? 'border-clay bg-clay-soft/40 text-ink'
                      : 'border-line bg-surface text-ink-muted hover:text-ink'
                  )}
                >
                  <span className="block text-sm font-semibold">{option.name}</span>
                  <span className="mt-1 block text-xs leading-relaxed">{option.summary}</span>
                </button>
              );
            })}
          </div>

          {fields.length > 0 && (
            <div className="space-y-3 border-t border-line pt-4">
              {fields.map((field) => {
                const value = String(draft[field.key] ?? '');
                return (
                  <label key={field.key} className="block">
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                      {field.label}
                    </span>
                    {field.multiline ? (
                      <textarea
                        value={value}
                        rows={3}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                        }
                        onBlur={(event) => saveField(field.key, event.currentTarget.value)}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        value={value}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                        }
                        onBlur={(event) => saveField(field.key, event.currentTarget.value)}
                        className={inputClass}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Homepage sections"
      description="Open a section to choose its design and edit its text."
    >
      <ul className="divide-y divide-line">
        {LANDING_SECTION_IDS.map((sectionId) => {
          const setting = draft.designs[sectionId];
          const options = SECTION_DESIGNS[sectionId];
          const active = options.find((option) => option.id === setting.design) || options[0];
          return (
            <li key={sectionId}>
              <button
                type="button"
                onClick={() => setEditing(sectionId)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {SECTION_LABELS[sectionId]}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {setting.visible ? active.name : 'Hidden'}
                  </span>
                </span>
                <span className="text-sm font-medium text-ink-muted">Edit</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
