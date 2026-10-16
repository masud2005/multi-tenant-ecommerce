'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import {
  pageService,
  ReturnsPageData,
  ReturnSectionItem,
} from '@/services/page-service';

export interface ReturnsEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const DEFAULT_FORM: ReturnsPageData = {
  title: 'Return Policy',
  heading: 'Easy 7-day returns & doorstep size exchange',
  sections: [
    {
      heading: 'Return window',
      body: 'You may request a return within 7 days of delivery. Items must be unworn, unwashed and have all original tags attached.',
    },
    {
      heading: 'Non-returnable items',
      body: 'Sarees, jewellery and innerwear are non-returnable unless they arrive damaged or defective. Sale items marked “Final sale” cannot be returned.',
    },
    {
      heading: 'Exchanges',
      body: 'Size exchanges are free inside Dhaka. Our courier delivers the replacement and collects the original in a single visit.',
    },
  ],
  status: 'published',
};

export function ReturnsEditorDrawer({
  open,
  onClose,
  onSaved,
}: ReturnsEditorDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ReturnsPageData>(DEFAULT_FORM);

  // Load existing Return page data when drawer opens
  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const data = await pageService.getOwnerReturnsPage();
        if (isMounted && data) {
          setForm({
            title: data.title || DEFAULT_FORM.title,
            heading: data.heading || DEFAULT_FORM.heading,
            sections:
              data.sections && data.sections.length > 0
                ? data.sections
                : DEFAULT_FORM.sections,
            status: data.status || 'published',
          });
        }
      } catch (err) {
        console.error('Failed to load Return page settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Handle section changes
  const handleSectionChange = (
    index: number,
    field: keyof ReturnSectionItem,
    val: string
  ) => {
    const next = [...form.sections];
    next[index] = { ...next[index], [field]: val };
    setForm({ ...form, sections: next });
  };

  const handleAddSection = () => {
    setForm({
      ...form,
      sections: [
        ...form.sections,
        {
          heading: 'New Return Clause',
          body: '',
        },
      ],
    });
  };

  const handleRemoveSection = (index: number) => {
    if (form.sections.length <= 1) {
      toast.error('You must keep at least one policy section.');
      return;
    }
    const next = form.sections.filter((_, i) => i !== index);
    setForm({ ...form, sections: next });
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm('Are you sure you want to restore the recommended policy template?')) {
      setForm(DEFAULT_FORM);
      toast.info('Template reset to recommended defaults.');
    }
  };

  // Save changes to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      const validSections = form.sections.filter(
        (s) => s.heading.trim() !== '' || s.body.trim() !== ''
      );

      const res = await pageService.updateOwnerReturnsPage({
        title: form.title?.trim() || DEFAULT_FORM.title,
        heading: form.heading?.trim() || DEFAULT_FORM.heading,
        sections: validSections.length > 0 ? validSections : DEFAULT_FORM.sections,
        status: form.status || 'published',
      });

      if (res) {
        toast.success('Return policy updated and published!');
        if (onSaved) onSaved();
        onClose();
      } else {
        toast.error('Failed to update Return page');
      }
    } catch (err: any) {
      console.error('Failed to save return page:', err);
      toast.error(
        err?.response?.data?.message || 'Error saving Return policy'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title="Edit “Return Policy” Page"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/policies/returns', '_blank')}
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Live Preview
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
              disabled={saving}
              className="text-xs text-ink-muted hover:text-ink flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save & Publish'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <FileText className="h-4 w-4 text-ink-muted" />
            Page Settings
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink mb-1.5">
                Page Title
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Return Policy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Status
              </label>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as 'published' | 'draft' })
                }
                options={[
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft (Hidden)' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              Main Display Heading / Subtitle
            </label>
            <Input
              value={form.heading || ''}
              onChange={(e) => setForm({ ...form, heading: e.target.value })}
              placeholder="e.g. Easy 7-day returns & doorstep size exchange"
            />
          </div>
        </div>

        {/* Dynamic Return Policy Sections */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <ShieldCheck className="h-4 w-4 text-ink-muted" />
              Return Sections ({form.sections.length})
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddSection}
              className="h-7 text-xs flex items-center gap-1 text-primary hover:bg-subtle"
            >
              <Plus className="h-3.5 w-3.5" /> Add Section
            </Button>
          </div>

          <div className="space-y-4">
            {form.sections.map((section, idx) => (
              <div
                key={idx}
                className="relative rounded-lg border border-line bg-canvas p-4 transition-colors focus-within:border-primary/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-ink-muted tracking-wide uppercase">
                    Section {idx + 1}
                  </span>
                  {form.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(idx)}
                      className="text-ink-muted hover:text-red-500 transition-colors p-1"
                      title="Delete section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      Section Heading
                    </label>
                    <Input
                      value={section.heading}
                      onChange={(e) =>
                        handleSectionChange(idx, 'heading', e.target.value)
                      }
                      placeholder="e.g. Return window"
                      className="font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      Section Details
                    </label>
                    <Textarea
                      rows={3}
                      value={section.body}
                      onChange={(e) =>
                        handleSectionChange(idx, 'body', e.target.value)
                      }
                      placeholder="Write the return terms, conditions and instructions for customers..."
                      className="text-sm leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
