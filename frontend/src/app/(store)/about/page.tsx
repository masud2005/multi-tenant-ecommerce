'use client';

import React, { useEffect, useState } from 'react';
import { images } from '@/data/images';
import { Button } from '@/components/ui/button';
import { pageService, AboutPageData } from '@/services/page-service';

const DEFAULT_ABOUT: AboutPageData = {
  title: 'Our story',
  heading: 'Clothing that carries the hands that made it',
  heroImage: images.hero,
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
};

export default function AboutPage() {
  const [data, setData] = useState<AboutPageData>(DEFAULT_ABOUT);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dynamic page content from backend on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAboutPage() {
      try {
        setIsLoading(true);
        const res = await pageService.getPublicPage('about');
        if (isMounted && res) {
          setData({
            ...DEFAULT_ABOUT,
            ...res,
            title: res.title || DEFAULT_ABOUT.title,
            heading: res.heading || DEFAULT_ABOUT.heading,
            heroImage: res.heroImage || DEFAULT_ABOUT.heroImage,
            storyParagraphs:
              res.storyParagraphs && res.storyParagraphs.length > 0
                ? res.storyParagraphs
                : DEFAULT_ABOUT.storyParagraphs,
            milestones:
              res.milestones && res.milestones.length > 0
                ? res.milestones
                : DEFAULT_ABOUT.milestones,
            stats:
              res.stats && res.stats.length > 0
                ? res.stats
                : DEFAULT_ABOUT.stats,
            ctaText: res.ctaText || DEFAULT_ABOUT.ctaText,
            ctaLink: res.ctaLink || DEFAULT_ABOUT.ctaLink,
          });
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

  return (
    <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-90' : 'opacity-100'}`}>
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
      <div className="mt-12 overflow-hidden mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-subtle border border-line shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.heroImage || images.hero}
            alt={data.heroImageAlt || 'About us banner'}
            className="h-[380px] sm:h-[460px] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
          />
        </div>
      </div>

      {/* Story & Milestones Timeline Section */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="space-y-6 text-lg leading-relaxed text-ink-soft">
          {data.storyParagraphs.map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>

        {/* Milestones Timeline */}
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
      </section>

      {/* Key Highlights / Stats Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {data.stats && data.stats.length > 0 && (
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
        )}

        {/* Call to action (CTA) */}
        {data.ctaText && (
          <div className="mt-16 pb-20 text-center">
            <Button size="lg" href={data.ctaLink || '/journal'} className="shadow-xs">
              {data.ctaText}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
