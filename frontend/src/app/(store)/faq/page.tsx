'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import { faqs as initialFallbackFaqs } from '@/data/content';
import { faqService, FaqItemModel } from '@/services/faq-service';
import { cn } from '@/utils/cn';

export default function FaqPage() {
  const [q, setQ] = useState('');
  const [faqList, setFaqList] = useState<{ category: string; q: string; a: string }[]>(
    initialFallbackFaqs.filter((f) => f.category.toLowerCase() !== 'payments')
  );
  const [open, setOpen] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live FAQ items from the database
  useEffect(() => {
    let isMounted = true;
    async function loadStoreFaqs() {
      try {
        setIsLoading(true);
        const data = await faqService.getCustomerFaqs();
        if (isMounted && data && data.length > 0) {
          const mapped = data.map((item) => ({
            category: item.category,
            q: item.question,
            a: item.answer,
          }));
          setFaqList(mapped);
          if (mapped.length > 0) {
            setOpen(mapped[0].q);
          }
        }
      } catch (err) {
        console.error('Failed to load store FAQs:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStoreFaqs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute unique categories
  const cats = useMemo(() => {
    return Array.from(new Set(faqList.map((f) => f.category)));
  }, [faqList]);

  // Filtered FAQ items by search query and category
  const list = useMemo(() => {
    return faqList.filter(
      (f) =>
        (!cat || f.category.toLowerCase() === cat.toLowerCase()) &&
        (!q || `${f.q} ${f.a}`.toLowerCase().includes(q.toLowerCase()))
    );
  }, [faqList, q, cat]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">Help & FAQ</h1>

      {/* Search Bar */}
      <div className="relative mt-8">
        <SearchIcon
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search questions…"
          aria-label="Search FAQ"
          className="h-12 w-full rounded-md border border-line-strong bg-surface pl-10 pr-3 text-sm focus:border-clay focus:outline-none"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        {[null, ...cats].map((c) => (
          <button
            key={c ?? 'all'}
            onClick={() => setCat(c)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm cursor-pointer transition-colors',
              cat === c
                ? 'border-ink bg-ink text-canvas'
                : 'border-line-strong hover:border-ink'
            )}
          >
            {c ?? 'All'}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="mt-8 divide-y divide-line border-y border-line">
        {list.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">
            {isLoading ? (
              'Loading questions...'
            ) : (
              <>
                No answers match &ldquo;{q}&rdquo;.{' '}
                <Link href="/contact" className="underline">
                  Ask us directly
                </Link>
                .
              </>
            )}
          </p>
        )}
        {list.map((f) => (
          <div key={f.q}>
            <button
              onClick={() => setOpen(open === f.q ? null : f.q)}
              aria-expanded={open === f.q}
              className="flex w-full items-center justify-between gap-4 py-5 text-left cursor-pointer"
            >
              <span className="font-medium text-ink">{f.q}</span>
              <ChevronDownIcon
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-200 text-ink-muted',
                  open === f.q && 'rotate-180 text-ink'
                )}
                aria-hidden
              />
            </button>
            {open === f.q && (
              <p className="pb-5 text-sm leading-relaxed text-ink-soft">{f.a}</p>
            )}
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <p className="mt-10 text-sm text-ink-muted">
        Still stuck?{' '}
        <Link href="/contact" className="font-medium text-ink underline">
          Contact Tanti Care
        </Link>
      </p>
    </div>
  );
}
