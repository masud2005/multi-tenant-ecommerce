'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Edit3, Save } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { FaqEditorDrawer, FaqItemData } from '@/components/dashboard/admin/content/FaqEditorDrawer';
import { ContactEditorDrawer } from '@/components/dashboard/admin/content/ContactEditorDrawer';
import { AboutEditorDrawer } from '@/components/dashboard/admin/content/AboutEditorDrawer';
import { PolicyEditorDrawer } from '@/components/dashboard/admin/content/PolicyEditorDrawer';
import { faqService } from '@/services/faq-service';
import { storeService } from '@/services/store-service';
import type { PolicySlug } from '@/services/page-service';
import { cn } from '@/utils/cn';

type Tab = 'pages' | 'faq';

type ContentEntry = {
  key: string;
  title: string;
  path: string;
  kind: 'about' | 'contact' | 'faq' | PolicySlug;
};

const PAGE_ENTRIES: ContentEntry[] = [
  { key: 'about', title: 'About', path: '/about', kind: 'about' },
  { key: 'contact', title: 'Contact', path: '/contact', kind: 'contact' },
  { key: 'faq', title: 'FAQ', path: '/faq', kind: 'faq' },
  { key: 'returns', title: 'Return policy', path: '/policies/returns', kind: 'returns' },
  { key: 'shipping', title: 'Shipping policy', path: '/policies/shipping', kind: 'shipping' },
  { key: 'privacy', title: 'Privacy policy', path: '/policies/privacy', kind: 'privacy' },
  { key: 'terms', title: 'Terms of service', path: '/policies/terms', kind: 'terms' },
  { key: 'cookies', title: 'Cookie policy', path: '/policies/cookies', kind: 'cookies' },
];

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>('pages');

  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementLoading, setAnnouncementLoading] = useState(true);
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [policySlug, setPolicySlug] = useState<PolicySlug | null>(null);

  const [faqTitle, setFaqTitle] = useState('Help & FAQ');
  const [faqCategories, setFaqCategories] = useState<string[]>([
    'Orders',
    'Delivery',
    'Returns',
    'Account',
  ]);
  const [faqList, setFaqList] = useState<FaqItemData[]>([]);
  const [activeFaqFilter, setActiveFaqFilter] = useState<string>('all');
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  const loadFaqs = useCallback(async () => {
    try {
      setLoadingFaqs(true);
      const data = await faqService.getOwnerFaqs();
      const mapped: FaqItemData[] = (data || []).map((item) => ({
        id: item.id,
        category: item.category,
        q: item.question,
        a: item.answer,
      }));
      setFaqList(mapped);
      const cats = Array.from(new Set(mapped.map((f) => f.category).filter(Boolean)));
      if (cats.length) setFaqCategories(cats);
    } catch {
      setFaqList([]);
      toast.error('Could not load FAQs');
    } finally {
      setLoadingFaqs(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadAnnouncement() {
      try {
        setAnnouncementLoading(true);
        const res = await storeService.getOwnerSettings();
        if (!alive || !res?.data) return;
        const d = res.data;
        setAnnouncementText(
          typeof d.announcement === 'string' ? d.announcement : '',
        );
        setAnnouncementEnabled(Boolean(d.announcementEnabled));
      } catch {
        /* empty */
      } finally {
        if (alive) setAnnouncementLoading(false);
      }
    }
    loadAnnouncement();
    loadFaqs();
    return () => {
      alive = false;
    };
  }, [loadFaqs]);

  const saveAnnouncement = async (overrides?: {
    text?: string;
    enabled?: boolean;
  }) => {
    const text = (overrides?.text ?? announcementText).trim();
    const enabled = overrides?.enabled ?? announcementEnabled;
    if (enabled && !text) {
      toast.error('Add announcement text before showing it on the storefront');
      return;
    }
    setAnnouncementSaving(true);
    try {
      await storeService.updateOwnerSettings({
        announcement: text,
        announcementEnabled: enabled,
      });
      toast.success('Announcement bar saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save announcement bar');
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleAnnouncementToggle = async (enabled: boolean) => {
    const previous = announcementEnabled;
    setAnnouncementEnabled(enabled);
    if (enabled && !announcementText.trim()) {
      setAnnouncementEnabled(previous);
      toast.error('Add announcement text before enabling');
      return;
    }
    await saveAnnouncement({ enabled });
  };

  const handleSaveFaq = async (data: {
    title: string;
    categories: string[];
    items: FaqItemData[];
    visibility: string;
    publishAt?: string;
  }) => {
    setFaqTitle(data.title);
    setFaqCategories(data.categories);
    setFaqList(data.items);
    try {
      const payload = data.items.map((item, order) => ({
        category: item.category,
        question: item.q,
        answer: item.a,
        order,
      }));
      const saved = await faqService.batchSaveFaqs(payload);
      if (saved?.length) {
        setFaqList(
          saved.map((item) => ({
            id: item.id,
            category: item.category,
            q: item.question,
            a: item.answer,
          })),
        );
      }
    } catch {
      toast.error('Failed to sync FAQs to database');
    }
  };

  const openEntry = (entry: ContentEntry) => {
    if (entry.kind === 'about') setAboutOpen(true);
    else if (entry.kind === 'contact') setContactOpen(true);
    else if (entry.kind === 'faq') {
      setTab('faq');
      setFaqOpen(true);
    } else setPolicySlug(entry.kind);
  };

  const filteredFaqs = useMemo(() => {
    if (activeFaqFilter === 'all') return faqList;
    return faqList.filter((f) => f.category === activeFaqFilter);
  }, [faqList, activeFaqFilter]);

  return (
    <ModuleGate module="content">
      <div className="w-full space-y-6">
        <PageHeader
          title="Content"
          description="Announcement, store pages, policies, and FAQ."
          actions={
            tab === 'faq' ? (
              <GuardedButton
                module="content"
                action="update"
                size="sm"
                onClick={() => setFaqOpen(true)}
              >
                <Edit3 className="h-4 w-4" aria-hidden /> Edit FAQ
              </GuardedButton>
            ) : null
          }
        />

        <Panel
          title="Announcement bar"
          description="Shown above the storefront navigation when enabled."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Switch
                checked={announcementEnabled}
                onChange={handleAnnouncementToggle}
                label="Show announcement bar on storefront"
                disabled={announcementLoading || announcementSaving}
              />
              <GuardedButton
                module="content"
                action="update"
                size="sm"
                variant="secondary"
                disabled={announcementLoading || announcementSaving}
                onClick={() => saveAnnouncement()}
              >
                <Save className="h-4 w-4" aria-hidden />
                {announcementSaving ? 'Saving…' : 'Save text'}
              </GuardedButton>
            </div>
            <Input
              label="Banner text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. Free delivery inside Dhaka on orders over ৳2,500"
              disabled={announcementLoading || announcementSaving}
              hint="Keep it short — one line works best on mobile."
            />
          </div>
        </Panel>

        <Tabs
          value={tab}
          onChange={(val) => setTab(val as Tab)}
          tabs={[
            { value: 'pages', label: 'Pages & policies' },
            { value: 'faq', label: `FAQ (${faqList.length})` },
          ]}
        />

        {tab === 'pages' ? (
          <Panel flush>
            <ul className="divide-y divide-line">
              {PAGE_ENTRIES.map((entry) => (
                <li key={entry.key}>
                  <button
                    type="button"
                    onClick={() => openEntry(entry)}
                    className="flex w-full flex-wrap items-center gap-3 px-5 py-3.5 text-left text-sm hover:bg-canvas transition-colors cursor-pointer"
                  >
                    <span className="min-w-[160px] flex-1">
                      <span className="block font-medium text-ink">
                        {entry.title}
                      </span>
                      <span className="text-xs text-ink-muted">{entry.path}</span>
                    </span>
                    <Badge tone="neutral">Edit</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {tab === 'faq' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveFaqFilter('all')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                    activeFaqFilter === 'all'
                      ? 'bg-ink text-canvas font-semibold'
                      : 'bg-canvas text-ink-muted hover:text-ink hover:bg-subtle',
                  )}
                >
                  All ({faqList.length})
                </button>
                {faqCategories.map((c) => {
                  const count = faqList.filter((f) => f.category === c).length;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveFaqFilter(c)}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                        activeFaqFilter === c
                          ? 'bg-ink text-canvas font-semibold'
                          : 'bg-canvas text-ink-muted hover:text-ink hover:bg-subtle',
                      )}
                    >
                      {c} ({count})
                    </button>
                  );
                })}
              </div>
              <GuardedButton
                module="content"
                action="update"
                size="sm"
                onClick={() => setFaqOpen(true)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit FAQ
              </GuardedButton>
            </div>

            <Panel flush>
              {loadingFaqs ? (
                <p className="px-5 py-10 text-center text-sm text-ink-muted">
                  Loading FAQs…
                </p>
              ) : filteredFaqs.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-ink-muted">
                  No FAQ items yet. Click Edit FAQ to add questions.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {filteredFaqs.map((f, i) => (
                    <li key={f.id || `faq-${i}`}>
                      <button
                        type="button"
                        onClick={() => setFaqOpen(true)}
                        className="flex w-full items-start justify-between gap-4 px-5 py-3.5 text-left hover:bg-subtle/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-clay/10 px-2 py-0.5 text-xs font-semibold text-clay uppercase tracking-wider">
                              {f.category}
                            </span>
                            <p className="font-semibold text-ink group-hover:text-clay transition-colors">
                              {f.q}
                            </p>
                          </div>
                          <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                            {f.a}
                          </p>
                        </div>
                        <Edit3 className="h-4 w-4 shrink-0 text-ink-muted" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        ) : null}

        <FaqEditorDrawer
          open={faqOpen}
          onClose={() => setFaqOpen(false)}
          categories={faqCategories}
          items={faqList}
          onSave={handleSaveFaq}
          initialTitle={faqTitle}
        />
        <ContactEditorDrawer
          open={contactOpen}
          onClose={() => setContactOpen(false)}
        />
        <AboutEditorDrawer
          open={aboutOpen}
          onClose={() => setAboutOpen(false)}
        />
        <PolicyEditorDrawer
          open={!!policySlug}
          slug={policySlug}
          onClose={() => setPolicySlug(null)}
        />
      </div>
    </ModuleGate>
  );
}
