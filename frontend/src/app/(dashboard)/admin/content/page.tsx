'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit3, HelpCircle } from 'lucide-react';
import { cmsPages, menus } from '@/data/admin';
import { blogPosts, faqs as initialFaqs, announcement } from '@/data/content';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/utils/format';
import { FaqEditorDrawer, FaqItemData } from '@/components/dashboard/admin/content/FaqEditorDrawer';
import { ContactEditorDrawer } from '@/components/dashboard/admin/content/ContactEditorDrawer';
import { faqService } from '@/services/faq-service';
import { cn } from '@/utils/cn';

type Tab = 'pages' | 'blog' | 'navigation' | 'faq';
const tone = {
  published: 'success',
  draft: 'neutral',
  scheduled: 'info',
} as const;

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>('pages');
  const [editing, setEditing] = useState<string | null>(null);
  const [bar, setBar] = useState(true);
  const [publishMode, setPublishMode] = useState('Publish now');
  const page = cmsPages.find((p) => p.id === editing);

  // FAQ & Contact Editor state
  const [contactOpen, setContactOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqTitle, setFaqTitle] = useState('Help & FAQ');
  const [faqCategories, setFaqCategories] = useState<string[]>([
    'Orders',
    'Delivery',
    'Returns',
    'Account',
  ]);
  const [faqList, setFaqList] = useState<FaqItemData[]>(
    initialFaqs
      .filter((f) => f.category.toLowerCase() !== 'payments')
      .map((f, i) => ({
        id: `faq-${i + 1}`,
        category: f.category,
        q: f.q,
        a: f.a,
      }))
  );
  const [activeFaqFilter, setActiveFaqFilter] = useState<string>('all');
  const [loadingFaqs, setLoadingFaqs] = useState(false);

  // Fetch real FAQs from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFaqs() {
      try {
        setLoadingFaqs(true);
        const data = await faqService.getOwnerFaqs();
        if (isMounted && data && data.length > 0) {
          const mapped: FaqItemData[] = data.map((item) => ({
            id: item.id,
            category: item.category,
            q: item.question,
            a: item.answer,
          }));
          setFaqList(mapped);

          // Update unique categories list
          const uniqueCats = Array.from(new Set(mapped.map((it) => it.category)));
          if (uniqueCats.length > 0) {
            setFaqCategories(uniqueCats);
          }
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
      } finally {
        if (isMounted) setLoadingFaqs(false);
      }
    }
    loadFaqs();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFaqs =
    activeFaqFilter === 'all'
      ? faqList
      : faqList.filter((f) => f.category === activeFaqFilter);

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
      // Sync to real backend database atomically
      const payload = data.items.map((item, idx) => ({
        category: item.category,
        question: item.q,
        answer: item.a,
        order: idx,
      }));

      const saved = await faqService.batchSaveFaqs(payload);
      if (saved && saved.length > 0) {
        setFaqList(
          saved.map((item) => ({
            id: item.id,
            category: item.category,
            q: item.question,
            a: item.answer,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to sync FAQs to backend:', err);
      toast.error('Failed to sync FAQs to database');
    }
  };

  return (
    <ModuleGate module="content">
      <div className="w-full space-y-6">
        <PageHeader
          title="Content"
          description="Pages, journal, navigation, and FAQs."
          actions={
            tab === 'faq' ? (
              <GuardedButton
                module="content"
                action="update"
                size="sm"
                onClick={() => setFaqOpen(true)}
              >
                <Edit3 className="h-4 w-4" aria-hidden /> Edit FAQ Page
              </GuardedButton>
            ) : (
              <GuardedButton
                module="content"
                action="create"
                size="sm"
                onClick={() => setEditing('new')}
              >
                <Plus className="h-4 w-4" aria-hidden /> New page
              </GuardedButton>
            )
          }
        />
        <Panel className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[240px] flex-1">
              <p className="text-sm font-medium text-ink">Announcement bar</p>
              <p className="text-sm text-ink-muted">{announcement}</p>
            </div>
            <Switch
              checked={bar}
              onChange={(v) => {
                setBar(v);
                toast.success(
                  v ? 'Announcement bar shown' : 'Announcement bar hidden'
                );
              }}
              label="Show announcement bar"
              hideLabel
            />
          </div>
        </Panel>
        <div className="mb-6">
          <Tabs
            value={tab}
            onChange={(val) => setTab(val as Tab)}
            tabs={[
              { value: 'pages', label: 'Pages' },
              { value: 'blog', label: 'Journal' },
              { value: 'navigation', label: 'Navigation' },
              { value: 'faq', label: `FAQ (${faqList.length})` },
            ]}
          />
        </div>

        {tab === 'pages' && (
          <Panel flush>
            <ul className="divide-y divide-line">
              {cmsPages.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (p.id === 'pg3' || p.slug === '/faq' || p.title.toLowerCase() === 'faq') {
                        setFaqOpen(true);
                      } else if (p.id === 'pg2' || p.slug === '/contact' || p.title.toLowerCase() === 'contact') {
                        setContactOpen(true);
                      } else {
                        setEditing(p.id);
                      }
                    }}
                    className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left text-sm hover:bg-canvas transition-colors cursor-pointer"
                  >
                    <span className="min-w-[160px] flex-1">
                      <span className="block font-medium text-ink">{p.title}</span>
                      <span className="text-xs text-ink-muted">{p.slug}</span>
                    </span>
                    <span className="text-xs text-ink-muted">
                      Updated {formatDate(p.updated)} · {p.author}
                    </span>
                    <Badge tone={tone[p.status as keyof typeof tone]}>
                      {p.status === 'scheduled' && 'publishAt' in p
                        ? `Scheduled ${formatDateTime(p.publishAt as string)}`
                        : p.status}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {tab === 'blog' && (
          <Panel
            flush
            actions={
              <GuardedButton
                module="content"
                action="create"
                size="sm"
                variant="secondary"
                onClick={() => setEditing('new')}
              >
                New post
              </GuardedButton>
            }
            title="Journal posts"
          >
            <ul className="divide-y divide-line">
              {blogPosts.map((b) => (
                <li
                  key={b.slug}
                  className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-subtle/30"
                >
                  <img
                    src={b.image}
                    alt=""
                    className="h-12 w-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-ink">{b.title}</p>
                    <p className="text-xs text-ink-muted">
                      {b.category} · {b.author} · {formatDate(b.date)}
                    </p>
                  </div>
                  <Badge tone="success">Published</Badge>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {tab === 'navigation' && (
          <div className="grid gap-5 md:grid-cols-3">
            {menus.map((m) => (
              <Panel key={m.id} title={m.name} description={m.location}>
                <ol className="space-y-1.5 text-sm">
                  {m.items.map((i) => (
                    <li
                      key={i}
                      className="rounded border border-line bg-surface px-3 py-1.5 text-ink"
                    >
                      {i}
                    </li>
                  ))}
                </ol>
                <GuardedButton
                  module="content"
                  action="update"
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => toast('Menu editor opened')}
                >
                  Edit menu
                </GuardedButton>
              </Panel>
            ))}
          </div>
        )}

        {tab === 'faq' && (
          <div className="space-y-4">
            {/* FAQ Category Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveFaqFilter('all')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                    activeFaqFilter === 'all'
                      ? 'bg-ink text-canvas font-semibold'
                      : 'bg-canvas text-ink-muted hover:text-ink hover:bg-subtle'
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
                          : 'bg-canvas text-ink-muted hover:text-ink hover:bg-subtle'
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
                className="cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit FAQ Page</span>
              </GuardedButton>
            </div>

            {/* FAQ Items List Panel */}
            <Panel flush>
              <ul className="divide-y divide-line">
                {filteredFaqs.map((f, i) => (
                  <li key={f.id || `faq-${i}`}>
                    <button
                      type="button"
                      onClick={() => setFaqOpen(true)}
                      className="flex w-full items-start justify-between gap-4 px-5 py-3.5 text-left hover:bg-subtle/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-clay/10 px-2 py-0.5 text-[10px] font-semibold text-clay uppercase tracking-wider">
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
                      <span className="rounded p-1.5 text-ink-muted group-hover:bg-surface group-hover:text-ink transition-colors">
                        <Edit3 className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}

        {/* Dedicated FAQ Editor Drawer */}
        <FaqEditorDrawer
          open={faqOpen}
          onClose={() => setFaqOpen(false)}
          categories={faqCategories}
          items={faqList}
          onSave={handleSaveFaq}
          initialTitle={faqTitle}
        />

        {/* Dedicated Contact Us Page Editor Drawer */}
        <ContactEditorDrawer
          open={contactOpen}
          onClose={() => setContactOpen(false)}
        />


        <Drawer
          open={!!editing}
          onClose={() => setEditing(null)}
          width="max-w-2xl"
          title={page ? `Edit “${page.title}”` : 'New page'}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  toast.success('Preview link copied');
                }}
              >
                Preview
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  toast.success('Draft saved');
                }}
              >
                Save draft
              </Button>
              <GuardedButton
                module="content"
                action="publish"
                onClick={() => {
                  setEditing(null);
                  toast.success(
                    publishMode === 'Publish now'
                      ? 'Page published'
                      : 'Page scheduled'
                  );
                }}
              >
                {publishMode === 'Publish now' ? 'Publish' : 'Schedule'}
              </GuardedButton>
            </div>
          }
        >
          <div className="space-y-4 px-5 py-5">
            <Input
              label="Title"
              defaultValue={page?.title}
              key={`t${editing}`}
            />
            <Textarea
              label="Content"
              rows={10}
              defaultValue={
                page
                  ? `${page.title} — write your content here. Use reusable blocks for banners, FAQs and product grids.`
                  : ''
              }
              key={`c${editing}`}
            />
            <Input
              label="URL"
              defaultValue={page?.slug ?? '/pages/'}
              key={`u${editing}`}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Visibility"
                value={publishMode}
                onChange={(e) => setPublishMode(e.target.value)}
                options={['Publish now', 'Schedule']}
              />
              {publishMode === 'Schedule' && (
                <Input
                  label="Publish at"
                  type="datetime-local"
                  defaultValue="2026-10-01T09:00"
                />
              )}
            </div>
            <Input
              label="SEO title"
              defaultValue={page ? `${page.title} | Tanti` : ''}
              key={`s${editing}`}
            />
          </div>
        </Drawer>
      </div>
    </ModuleGate>
  );
}
