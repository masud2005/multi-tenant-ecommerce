'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import { pageService, PolicyPageData, PolicySlug } from '@/services/page-service';

const POLICY_NAV: { slug: PolicySlug; label: string }[] = [
  { slug: 'shipping', label: 'Shipping' },
  { slug: 'returns', label: 'Returns' },
  { slug: 'privacy', label: 'Privacy' },
  { slug: 'terms', label: 'Terms' },
  { slug: 'cookies', label: 'Cookies' },
];

const ALLOWED = new Set(POLICY_NAV.map((p) => p.slug));

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

export default function PolicyPage({ params }: PolicyPageProps) {
  const { slug: rawSlug } = use(params);
  const slug = (rawSlug || '').toLowerCase() as PolicySlug;
  const [data, setData] = useState<PolicyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!ALLOWED.has(slug)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setNotFound(false);
        const page = await pageService.getPublicPage<PolicyPageData>(slug);
        if (!alive) return;
        if (!page) {
          setData(null);
          setNotFound(true);
        } else {
          setData(page);
          setNotFound(false);
        }
      } catch {
        if (alive) {
          setData(null);
          setNotFound(true);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 animate-pulse">
        <div className="h-8 w-48 rounded bg-subtle" />
        <div className="mt-6 h-4 w-full rounded bg-subtle" />
        <div className="mt-3 h-4 w-5/6 rounded bg-subtle" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
      <nav aria-label="Policies" className="lg:sticky lg:top-32 lg:self-start">
        <p className="text-xs font-medium text-ink-muted">Policies</p>
        <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          {POLICY_NAV.map((p) => {
            const isActive = slug === p.slug;
            return (
              <li key={p.slug}>
                <Link
                  href={`/policies/${p.slug}`}
                  className={cn(
                    'block rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-subtle font-medium text-ink'
                      : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {p.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <article className="max-w-2xl">
        {notFound || !data ? (
          <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
            <h1 className="font-display text-3xl text-ink">
              {POLICY_NAV.find((p) => p.slug === slug)?.label || 'Policy'}
            </h1>
            <p className="mt-3 text-sm text-ink-soft">
              This policy has not been published yet.
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Check back soon, or{' '}
              <Link href="/contact" className="underline text-ink">
                contact us
              </Link>{' '}
              if you have questions.
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl">{data.title}</h1>
            {data.heading ? (
              <p className="mt-2 text-base font-medium text-ink-soft">
                {data.heading}
              </p>
            ) : null}
            {data.updatedAt ? (
              <p className="mt-2 text-sm text-ink-muted">
                Last updated {formatDate(data.updatedAt)}
              </p>
            ) : null}
            <div className="mt-10 space-y-8">
              {(data.sections || []).map((section, i) => (
                <section key={`${section.heading}-${i}`}>
                  {section.heading ? (
                    <h2 className="text-lg font-semibold text-ink">
                      {section.heading}
                    </h2>
                  ) : null}
                  {section.body ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                      {section.body}
                    </p>
                  ) : null}
                </section>
              ))}
            </div>
          </>
        )}
      </article>
    </div>
  );
}
