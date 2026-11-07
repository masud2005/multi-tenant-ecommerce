'use client';

import React, { useEffect, useState } from 'react';
import { images } from '@/data/images';
import { Button } from '@/components/ui/button';
import { pageService, AboutPageData } from '@/services/page-service';
import { useTenant } from '@/contexts/TenantContext';

export default function AboutPage() {
  const { tenant } = useTenant();
  const [data, setData] = useState<AboutPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dynamic page content from backend on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAboutPage() {
      try {
        setIsLoading(true);
        const res = await pageService.getPublicPage('about');
        if (isMounted && res) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load dynamic About Us page:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAboutPage();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center animate-pulse">
        <div className="h-6 w-32 mx-auto rounded bg-subtle" />
        <div className="h-12 w-96 mx-auto mt-4 rounded bg-subtle" />
        <div className="h-64 w-full mt-12 rounded-2xl bg-subtle" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-sm font-medium tracking-wide uppercase text-ink-muted">About Us</p>
        <h1 className="mt-2 font-display text-5xl text-ink">{tenant.name}</h1>
        <p className="mt-4 text-lg text-ink-soft">
          {tenant.tagline || 'Welcome to our official online store'}
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">Brand story coming soon</p>
          <p className="mt-1 text-xs text-ink-muted">
            The story and milestones for {tenant.name} will be published here soon.
          </p>
        </div>
        <div className="mt-8">
          <Button href="/shop">Browse Catalog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="transition-opacity duration-300 opacity-100">
      {/* Title & Heading Section */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-wide uppercase text-ink-muted">
          {data.title || 'Our story'}
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-5xl leading-[1.05] sm:text-6xl text-ink">
          {data.heading}
        </h1>
      </section>

      {/* Hero Banner Section */}
      {data.heroImage && (
        <div className="mt-12 overflow-hidden mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-subtle border border-line shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.heroImage}
              alt={data.heroImageAlt || 'About us banner'}
              className="h-[380px] sm:h-[460px] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>
        </div>
      )}

      {/* Story & Milestones Timeline Section */}
      {((data.storyParagraphs && data.storyParagraphs.length > 0) || (data.milestones && data.milestones.length > 0)) && (
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-6 text-lg leading-relaxed text-ink-soft">
            {data.storyParagraphs?.map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>

          {/* Milestones Timeline */}
          {data.milestones && data.milestones.length > 0 && (
            <ol className="space-y-8 border-l-2 border-line pl-8 relative">
              {data.milestones.map((m, i) => (
                <li key={i} className="relative group">
                  <span
                    className="absolute -left-[39px] top-1.5 h-3 w-3 rounded-full bg-clay ring-4 ring-canvas"
                    aria-hidden
                  />
                  <p className="font-display text-2xl text-ink font-semibold">{m.year}</p>
                  <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">{m.text}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* Key Highlights / Stats Section */}
      {data.stats && data.stats.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`grid gap-10 rounded-2xl bg-surface p-8 border border-line shadow-2xs ${
              data.stats.length === 2
                ? 'sm:grid-cols-2'
                : data.stats.length >= 4
                ? 'grid-cols-2 lg:grid-cols-4'
                : 'sm:grid-cols-3'
            } sm:p-12`}
          >
            {data.stats.map((s, i) => (
              <div key={i} className="space-y-1">
                <p className="font-display text-4xl sm:text-5xl font-bold text-ink tracking-tight">
                  {s.value}
                </p>
                <p className="text-sm font-medium text-ink-muted leading-snug">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Call to action (CTA) */}
          {data.ctaText && (
            <div className="mt-16 pb-20 text-center">
              <Button size="lg" href={data.ctaLink || '/shop'} className="shadow-xs">
                {data.ctaText}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
