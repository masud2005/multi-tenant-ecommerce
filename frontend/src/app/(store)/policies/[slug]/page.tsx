'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { policies } from '@/data/content';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import { pageService, ReturnsPageData } from '@/services/page-service';

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

export default function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = use(params);
  const staticPolicy = slug ? policies[slug] : undefined;
  const [dynamicReturns, setDynamicReturns] = useState<ReturnsPageData | null>(null);

  // Fetch dynamic Returns policy from backend if viewing returns
  useEffect(() => {
    if (slug !== 'returns') return;
    let isMounted = true;

    async function loadReturns() {
      try {
        const data = await pageService.getPublicReturnsPage();
        if (isMounted && data) {
          setDynamicReturns(data);
        }
      } catch (err) {
        console.error('Failed to load dynamic return policy:', err);
      }
    }

    loadReturns();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!staticPolicy && !dynamicReturns) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-medium text-ink">Policy not found</p>
        <Link href="/" className="mt-4 inline-block text-sm text-clay underline">
          Return to home
        </Link>
      </div>
    );
  }

  // Determine active policy data (dynamic if returns and loaded, otherwise static)
  const isReturns = slug === 'returns';
  const displayTitle = (isReturns && dynamicReturns?.title) || staticPolicy?.title || 'Policy';
  const displayHeading = isReturns && dynamicReturns?.heading;
  const displaySections =
    isReturns && dynamicReturns?.sections && dynamicReturns.sections.length > 0
      ? dynamicReturns.sections
      : staticPolicy?.sections || [];
  const displayUpdated =
    (isReturns && dynamicReturns?.updatedAt) || staticPolicy?.updated || '2026-08-01';

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
      <nav aria-label="Policies" className="lg:sticky lg:top-32 lg:self-start">
        <p className="text-xs font-medium text-ink-muted">Policies</p>
        <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          {Object.entries(policies).map(([key, p]) => {
            const isActive = slug === key;
            return (
              <li key={key}>
                <Link
                  href={`/policies/${key}`}
                  className={cn(
                    'block rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-subtle font-medium text-ink'
                      : 'text-ink-soft hover:text-ink'
                  )}
                >
                  {p.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <article className="max-w-2xl">
        <h1 className="font-display text-4xl">{displayTitle}</h1>
        {displayHeading && (
          <p className="mt-2 text-base text-ink-soft font-medium">
            {displayHeading}
          </p>
        )}
        <p className="mt-2 text-sm text-ink-muted">
          Last updated {formatDate(displayUpdated)}
        </p>
        <div className="mt-10 space-y-8">
          {displaySections.map((s) => (
            <section key={s.heading} className="space-y-2">
              <h2 className="text-lg font-semibold text-ink">{s.heading}</h2>
              <p className="leading-relaxed text-ink-soft whitespace-pre-line">{s.body}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

