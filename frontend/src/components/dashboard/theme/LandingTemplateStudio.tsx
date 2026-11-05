'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
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

const COPY_FIELDS: { key: keyof LandingConfig; label: string; multiline?: boolean }[] = [
  { key: 'heroEyebrow', label: 'Hero eyebrow' },
  { key: 'heroTitle', label: 'Hero headline' },
  { key: 'heroSubtitle', label: 'Hero description', multiline: true },
  { key: 'heroCta', label: 'Hero button' },
  { key: 'heroScript', label: 'Hero script line' },
  { key: 'featuredEyebrow', label: 'Featured eyebrow' },
  { key: 'featuredTitle', label: 'Featured headline' },
  { key: 'featuredSubtitle', label: 'Featured description', multiline: true },
  { key: 'featuredCta', label: 'Featured button' },
  { key: 'promoEyebrow', label: 'Offer eyebrow' },
  { key: 'promoTitle', label: 'Offer headline' },
  { key: 'promoSubtitle', label: 'Offer detail' },
  { key: 'promoCta', label: 'Offer button' },
  { key: 'promoScript', label: 'Offer script line' },
  { key: 'picksEyebrow', label: 'Picks eyebrow' },
  { key: 'picksTitle', label: 'Picks headline' },
  { key: 'picksSubtitle', label: 'Picks description' },
  { key: 'reviewsEyebrow', label: 'Reviews eyebrow' },
  { key: 'reviewsTitle', label: 'Reviews headline' },
  { key: 'reviewsSubtitle', label: 'Reviews description' },
  { key: 'newsletterEyebrow', label: 'Newsletter eyebrow' },
  { key: 'newsletterTitle', label: 'Newsletter headline' },
  { key: 'newsletterSubtitle', label: 'Newsletter description', multiline: true },
];

export function LandingTemplateStudio() {
  const { config, ready, save } = useLandingConfig();
  const [draft, setDraft] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
  const [hydrated, setHydrated] = useState(false);

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

  const restoreCopy = () => {
    commit(
      { ...DEFAULT_LANDING_CONFIG, designs: draft.designs },
      'Landing copy restored to the suggested text.'
    );
  };

  return (
    <div className="space-y-4">
      <Panel
        title="Section designs"
        description="One homepage. Pick a design for each section. Saved on this browser until the backend is connected."
      >
        <div className="space-y-3">
          {LANDING_SECTION_IDS.map((sectionId) => {
            const setting = draft.designs[sectionId];
            const options = SECTION_DESIGNS[sectionId];
            const active = options.find((option) => option.id === setting.design) || options[0];
            return (
              <div key={sectionId} className="rounded-lg border border-line bg-canvas p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{SECTION_LABELS[sectionId]}</p>
                  <Switch
                    checked={setting.visible}
                    onChange={(visible) => toggleSection(sectionId, visible)}
                    label={`${SECTION_LABELS[sectionId]} visibility`}
                    hideLabel
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {options.map((option) => {
                    const selected = setting.design === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => chooseDesign(sectionId, option.id)}
                        className={cn(
                          'rounded-lg border px-2 py-2 text-xs font-semibold',
                          selected
                            ? 'border-clay bg-clay-soft/50 text-ink'
                            : 'border-line bg-surface text-ink-muted hover:text-ink'
                        )}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">{active.summary}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Landing copy"
        description="The same text is used by every design of a section. Edits apply when you leave a field."
        actions={
          <button
            type="button"
            onClick={restoreCopy}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore
          </button>
        }
      >
        <div className="space-y-3">
          {COPY_FIELDS.map((field) => {
            const value = String(draft[field.key] ?? '');
            const shared =
              'mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink';
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
                    onBlur={(event) => save({ ...draft, [field.key]: event.currentTarget.value })}
                    className={shared}
                  />
                ) : (
                  <input
                    value={value}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    onBlur={(event) => save({ ...draft, [field.key]: event.currentTarget.value })}
                    className={shared}
                  />
                )}
              </label>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
