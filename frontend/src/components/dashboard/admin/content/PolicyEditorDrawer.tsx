'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import {
  pageService,
  PolicyPageData,
  PolicySlug,
  ReturnSectionItem,
} from '@/services/page-service';

const POLICY_META: Record<
  PolicySlug,
  { label: string; storePath: string; emptyTitle: string }
> = {
  returns: {
    label: 'Return Policy',
    storePath: '/policies/returns',
    emptyTitle: 'Return Policy',
  },
  shipping: {
    label: 'Shipping Policy',
    storePath: '/policies/shipping',
    emptyTitle: 'Shipping Policy',
  },
  privacy: {
    label: 'Privacy Policy',
    storePath: '/policies/privacy',
    emptyTitle: 'Privacy Policy',
  },
  terms: {
    label: 'Terms of Service',
    storePath: '/policies/terms',
    emptyTitle: 'Terms of Service',
  },
  cookies: {
    label: 'Cookie Policy',
    storePath: '/policies/cookies',
    emptyTitle: 'Cookie Policy',
  },
};

const EMPTY_FORM = (slug: PolicySlug): PolicyPageData => ({
  title: POLICY_META[slug].emptyTitle,
  heading: '',
  sections: [],
  status: 'draft',
  slug,
  isEmpty: true,
});

export function PolicyEditorDrawer({
  open,
  slug,
  onClose,
  onSaved,
}: {
  open: boolean;
  slug: PolicySlug | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PolicyPageData>(EMPTY_FORM('returns'));

  useEffect(() => {
    if (!open || !slug) return;
    let alive = true;
    setForm(EMPTY_FORM(slug));

    async function load() {
      try {
        setLoading(true);
        const data = await pageService.getOwnerPolicyPage(slug!);
        if (!alive || !data) return;
        const fallbackTitle = POLICY_META[slug!].emptyTitle;
        setForm({
          title: data.isEmpty
            ? fallbackTitle
            : data.title?.trim() || fallbackTitle,
          heading: data.heading || '',
          sections: Array.isArray(data.sections) ? data.sections : [],
          status: data.status === 'published' ? 'published' : 'draft',
          slug,
          isEmpty: Boolean(data.isEmpty),
        });
      } catch {
        if (alive) setForm(EMPTY_FORM(slug!));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [open, slug]);

  if (!slug) return null;
  const meta = POLICY_META[slug];

  const updateSection = (
    index: number,
    field: keyof ReturnSectionItem,
    val: string,
  ) => {
    const next = [...form.sections];
    next[index] = { ...next[index], [field]: val };
    setForm({ ...form, sections: next });
  };

  const addSection = () => {
    setForm({
      ...form,
      sections: [...form.sections, { heading: '', body: '' }],
    });
  };

  const removeSection = (index: number) => {
    setForm({
      ...form,
      sections: form.sections.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    const sections = form.sections.filter(
      (s) => s.heading.trim() || s.body.trim(),
    );
    if (form.status === 'published' && sections.length === 0) {
      toast.error('Add at least one section before publishing');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      await pageService.updateOwnerPolicyPage(slug, {
        title: form.title.trim(),
        heading: form.heading?.trim() || undefined,
        sections,
        status: form.status,
      });
      toast.success(`${meta.label} saved`);
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || `Failed to save ${meta.label}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-xl"
      title={meta.label}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={loading}>
            Save
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="py-10 text-center text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-soft">
              Storefront:{' '}
              <a
                href={meta.storePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-ink underline"
              >
                {meta.storePath}
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as 'published' | 'draft',
                })
              }
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
              ]}
              className="w-36"
            />
          </div>

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={`e.g. ${meta.emptyTitle}`}
          />
          <Input
            label="Heading (optional)"
            value={form.heading || ''}
            onChange={(e) => setForm({ ...form, heading: e.target.value })}
            placeholder="Short intro line shown under the title"
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Sections</p>
              <Button type="button" size="sm" variant="secondary" onClick={addSection}>
                <Plus className="h-3.5 w-3.5" /> Add section
              </Button>
            </div>
            {form.sections.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
                No sections yet. Add a section to publish this policy on the
                storefront.
              </p>
            ) : (
              <div className="space-y-4">
                {form.sections.map((section, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-lg border border-line bg-canvas p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Input
                        label={`Section ${index + 1} heading`}
                        value={section.heading}
                        onChange={(e) =>
                          updateSection(index, 'heading', e.target.value)
                        }
                        placeholder="e.g. Delivery timeframes"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="mt-7 rounded-md p-2 text-ink-muted hover:bg-subtle hover:text-danger cursor-pointer"
                        aria-label="Remove section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Textarea
                      label="Body"
                      value={section.body}
                      onChange={(e) =>
                        updateSection(index, 'body', e.target.value)
                      }
                      placeholder="Write the policy details for this section…"
                      rows={4}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
