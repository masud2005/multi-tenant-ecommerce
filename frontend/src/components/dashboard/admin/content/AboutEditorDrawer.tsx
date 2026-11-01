'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Image as ImageIcon,
  BookOpen,
  Calendar,
  BarChart3,
  ExternalLink,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import {
  pageService,
  AboutPageData,
  MilestoneItem,
  StatItem,
} from '@/services/page-service';

export interface AboutEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function AboutEditorDrawer({
  open,
  onClose,
  onSaved,
}: AboutEditorDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<AboutPageData>({
    title: 'Our story',
    heading: 'Clothing that carries the hands that made it',
    heroImage:
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop',
    heroImageAlt: 'Two people in Tanti festive wear in a courtyard',
    storyParagraphs: [
      'Tanti means weaver. We started because the most beautiful textiles in the world were being made a few hours from Dhaka — and too few people could buy them without a middleman taking most of the value.',
      'Today we work directly with weavers, block-printers, cobblers and silversmiths across Bangladesh, paying fair, transparent rates and investing in the next generation of makers.',
    ],
    milestones: [
      {
        year: '2019',
        text: 'Started with 40 block-printed kurtas made with three families in Tangail.',
      },
      {
        year: '2021',
        text: 'Opened our flagship on Road 27, Dhanmondi, and launched Tanti Loom with Rupganj jamdani weavers.',
      },
      {
        year: '2023',
        text: 'Welcomed Pora — handmade leather from Bhairab — into the Tanti family.',
      },
      {
        year: '2026',
        text: '1,200+ artisans, delivery to all 64 districts and a new warehouse in Chattogram.',
      },
    ],
    stats: [
      { value: '1,200+', label: 'artisans we work with directly' },
      { value: '64', label: 'districts we deliver to' },
      { value: '38%', label: 'of every sale goes to makers' },
    ],
    ctaText: 'Read stories from our makers',
    ctaLink: '/journal',
    status: 'published',
    seoTitle: 'Our Story | Tanti',
    seoDescription:
      'Clothing that carries the hands that made it. Fair rates and craft empowerment across Bangladesh.',
  });

  // Load existing About page data when drawer opens
  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const data = await pageService.getOwnerAboutPage();
        if (isMounted && data) {
          setForm({
            title: data.title || 'Our story',
            heading:
              data.heading || 'Clothing that carries the hands that made it',
            heroImage:
              data.heroImage ||
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop',
            heroImageAlt: data.heroImageAlt || '',
            storyParagraphs:
              data.storyParagraphs && data.storyParagraphs.length > 0
                ? data.storyParagraphs
                : [
                    'Tanti means weaver. We started because the most beautiful textiles in the world were being made a few hours from Dhaka.',
                  ],
            milestones:
              data.milestones && data.milestones.length > 0
                ? data.milestones
                : [{ year: '2026', text: 'New milestone achieved.' }],
            stats:
              data.stats && data.stats.length > 0
                ? data.stats
                : [{ value: '100+', label: 'Dedicated team members' }],
            ctaText: data.ctaText || 'Read stories from our makers',
            ctaLink: data.ctaLink || '/journal',
            status: data.status || 'published',
            seoTitle: data.seoTitle || 'Our Story | Tanti',
            seoDescription: data.seoDescription || '',
          });
        }
      } catch (err) {
        console.error('Failed to load About Us page settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Handle paragraph changes
  const handleParagraphChange = (index: number, val: string) => {
    const next = [...form.storyParagraphs];
    next[index] = val;
    setForm({ ...form, storyParagraphs: next });
  };

  const handleAddParagraph = () => {
    setForm({
      ...form,
      storyParagraphs: [...form.storyParagraphs, ''],
    });
  };

  const handleRemoveParagraph = (index: number) => {
    const next = form.storyParagraphs.filter((_, i) => i !== index);
    setForm({ ...form, storyParagraphs: next });
  };

  // Handle milestone changes
  const handleMilestoneChange = (
    index: number,
    field: keyof MilestoneItem,
    val: string
  ) => {
    const next = [...form.milestones];
    next[index] = { ...next[index], [field]: val };
    setForm({ ...form, milestones: next });
  };

  const handleAddMilestone = () => {
    setForm({
      ...form,
      milestones: [...form.milestones, { year: '2026', text: '' }],
    });
  };

  const handleRemoveMilestone = (index: number) => {
    const next = form.milestones.filter((_, i) => i !== index);
    setForm({ ...form, milestones: next });
  };

  // Handle stat changes
  const handleStatChange = (
    index: number,
    field: keyof StatItem,
    val: string
  ) => {
    const next = [...form.stats];
    next[index] = { ...next[index], [field]: val };
    setForm({ ...form, stats: next });
  };

  const handleAddStat = () => {
    setForm({
      ...form,
      stats: [...form.stats, { value: '', label: '' }],
    });
  };

  const handleRemoveStat = (index: number) => {
    const next = form.stats.filter((_, i) => i !== index);
    setForm({ ...form, stats: next });
  };

  // Save changes to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await pageService.updateOwnerAboutPage({
        title: form.title,
        heading: form.heading,
        heroImage: form.heroImage,
        heroImageAlt: form.heroImageAlt,
        storyParagraphs: form.storyParagraphs.filter((p) => p.trim() !== ''),
        milestones: form.milestones.filter(
          (m) => m.year.trim() !== '' && m.text.trim() !== ''
        ),
        stats: form.stats.filter(
          (s) => s.value.trim() !== '' && s.label.trim() !== ''
        ),
        ctaText: form.ctaText,
        ctaLink: form.ctaLink,
        status: form.status,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
      });

      if (res) {
        toast.success('About Us page updated and published to your store!');
        if (onSaved) onSaved();
        onClose();
      } else {
        toast.error('Failed to update About Us page');
      }
    } catch (err: any) {
      console.error('Failed to save about page:', err);
      toast.error(
        err?.response?.data?.message || 'Error saving About Us page'
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
      title="Edit “About Us” Page"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/about', '_blank')}
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Live Preview
          </Button>

          <div className="flex items-center gap-2">
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
      <div className="space-y-6 px-6 py-5">
        {/* Banner preview & Hero Settings */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <ImageIcon className="h-4 w-4 text-ink-muted" />
            Hero Banner & Titles
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Badge / Pre-title
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Our story"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Page Status
              </label>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as 'published' | 'draft',
                  })
                }
                options={['published', 'draft']}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              Main Display Heading
            </label>
            <Input
              value={form.heading}
              onChange={(e) => setForm({ ...form, heading: e.target.value })}
              placeholder="e.g. Clothing that carries the hands that made it"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              Hero Banner Image URL
            </label>
            <Input
              value={form.heroImage}
              onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
              placeholder="https://..."
            />
            {form.heroImage && (
              <div className="mt-3 overflow-hidden rounded-lg border border-line aspect-[16/7] bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.heroImage}
                  alt={form.heroImageAlt || 'Hero banner'}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Story Section */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <BookOpen className="h-4 w-4 text-ink-muted" />
              Brand Story Paragraphs
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddParagraph}
              className="h-7 text-xs flex items-center gap-1 text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add Paragraph
            </Button>
          </div>

          <div className="space-y-3">
            {form.storyParagraphs.map((para, idx) => (
              <div key={idx} className="relative flex gap-2">
                <Textarea
                  rows={3}
                  value={para}
                  onChange={(e) => handleParagraphChange(idx, e.target.value)}
                  placeholder={`Paragraph ${idx + 1}...`}
                  className="w-full text-sm leading-relaxed"
                />
                {form.storyParagraphs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveParagraph(idx)}
                    className="p-1.5 self-start text-ink-muted hover:text-red-500 transition-colors"
                    title="Remove paragraph"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline / Milestones */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <Calendar className="h-4 w-4 text-ink-muted" />
              Milestones & Timeline
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddMilestone}
              className="h-7 text-xs flex items-center gap-1 text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add Year
            </Button>
          </div>

          <div className="space-y-3">
            {form.milestones.map((m, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-line bg-canvas p-3"
              >
                <div className="w-24 shrink-0">
                  <Input
                    value={m.year}
                    onChange={(e) =>
                      handleMilestoneChange(idx, 'year', e.target.value)
                    }
                    placeholder="2026"
                    className="text-sm font-semibold"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={m.text}
                    onChange={(e) =>
                      handleMilestoneChange(idx, 'text', e.target.value)
                    }
                    placeholder="Description of milestone or event..."
                    className="text-sm"
                  />
                </div>
                {form.milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(idx)}
                    className="p-2 text-ink-muted hover:text-red-500 transition-colors"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Key Statistics / Highlights */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <BarChart3 className="h-4 w-4 text-ink-muted" />
              Key Statistics & Highlights
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddStat}
              className="h-7 text-xs flex items-center gap-1 text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add Stat
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {form.stats.map((s, idx) => (
              <div
                key={idx}
                className="relative rounded-lg border border-line bg-canvas p-3"
              >
                {form.stats.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStat(idx)}
                    className="absolute right-2 top-2 text-ink-muted hover:text-red-500 transition-colors"
                    title="Delete stat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Number / Value
                </label>
                <Input
                  value={s.value}
                  onChange={(e) =>
                    handleStatChange(idx, 'value', e.target.value)
                  }
                  placeholder="e.g. 1,200+"
                  className="font-bold text-base"
                />
                <label className="block text-[11px] font-medium text-ink-muted mt-2 mb-1">
                  Label
                </label>
                <Input
                  value={s.label}
                  onChange={(e) =>
                    handleStatChange(idx, 'label', e.target.value)
                  }
                  placeholder="e.g. Artisans empowered"
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <Sparkles className="h-4 w-4 text-ink-muted" />
            Bottom Call-To-Action (CTA)
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Button Label
              </label>
              <Input
                value={form.ctaText || ''}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                placeholder="Read stories from our makers"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Button Link / URL
              </label>
              <Input
                value={form.ctaLink || ''}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                placeholder="/journal"
              />
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
