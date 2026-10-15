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
  Sparkles,
  Banknote,
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
  title: 'Return & Refund Policy',
  heading: 'Easy 7-day returns & Cash on Delivery refunds',
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
      heading: 'Cash on Delivery (COD) refunds',
      body: 'For cash on delivery orders, refunds are processed via bKash or Nagad within 3–5 working days after quality inspection, or issued instantly as store credit for your next purchase.',
    },
    {
      heading: 'How refunds work',
      body: 'Once we receive and inspect your item (usually within 2 working days), refunds are issued to your original payment method: bKash/Nagad within 3 days, cards within 7–10 days. You may choose store credit for an instant refund.',
    },
    {
      heading: 'Exchanges',
      body: 'Size exchanges are free inside Dhaka. Our courier delivers the replacement and collects the original in a single visit.',
    },
  ],
  status: 'published',
  seoTitle: 'Return & Refund Policy | Tanti',
  seoDescription:
    'Learn about our easy 7-day return process, cash on delivery refund terms and doorstep size exchange.',
};

export function ReturnsEditorDrawer({
  open,
  onClose,
  onSaved,
}: ReturnsEditorDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ReturnsPageData>(DEFAULT_FORM);

  // Load existing Returns page data when drawer opens
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
            seoTitle: data.seoTitle || DEFAULT_FORM.seoTitle,
            seoDescription: data.seoDescription || DEFAULT_FORM.seoDescription,
          });
        }
      } catch (err) {
        console.error('Failed to load Returns page settings:', err);
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
          heading: 'New Policy Section',
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
        seoTitle: form.seoTitle?.trim() || DEFAULT_FORM.seoTitle,
        seoDescription: form.seoDescription?.trim() || DEFAULT_FORM.seoDescription,
      });

      if (res) {
        toast.success('Return & Refund policy updated and published!');
        if (onSaved) onSaved();
        onClose();
      } else {
        toast.error('Failed to update Return & Refund page');
      }
    } catch (err: any) {
      console.error('Failed to save returns page:', err);
      toast.error(
        err?.response?.data?.message || 'Error saving Return & Refund policy'
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
      title="Edit “Return & Refund Policy” Page"
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
        {/* COD Educational Notice Card */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <Banknote className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-amber-950 dark:text-amber-100">
              Cash on Delivery (COD) Refund Policy
            </p>
            <p className="mt-1 text-amber-800 dark:text-amber-300">
              Customers who pay cash at delivery cannot receive cash back from couriers. Make sure your policy explains how you refund COD orders (e.g., via <strong>bKash / Nagad</strong> or instant <strong>Store Credit</strong>).
            </p>
          </div>
        </div>

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
                placeholder="Return & Refund Policy"
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
              placeholder="e.g. Easy 7-day returns & Cash on Delivery refunds"
            />
          </div>
        </div>

        {/* Dynamic Policy Sections */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <ShieldCheck className="h-4 w-4 text-ink-muted" />
              Policy Sections ({form.sections.length})
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
                      placeholder="e.g. Cash on Delivery (COD) refunds"
                      className="font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      Section Terms & Details
                    </label>
                    <Textarea
                      rows={3}
                      value={section.body}
                      onChange={(e) =>
                        handleSectionChange(idx, 'body', e.target.value)
                      }
                      placeholder="Write the policy clauses and instructions for customers..."
                      className="text-sm leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEO Settings */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <Sparkles className="h-4 w-4 text-ink-muted" />
            SEO & Search Preview
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              SEO Meta Title
            </label>
            <Input
              value={form.seoTitle || ''}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              placeholder="Return & Refund Policy | Store Name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              SEO Meta Description
            </label>
            <Textarea
              rows={2}
              value={form.seoDescription || ''}
              onChange={(e) =>
                setForm({ ...form, seoDescription: e.target.value })
              }
              placeholder="Summary of return rules, delivery swap and refund timelines for search results..."
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
