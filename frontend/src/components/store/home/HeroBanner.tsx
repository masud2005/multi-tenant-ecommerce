'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { images } from '@/data/images';
import { Button } from '@/components/ui/button';
import { useStore } from '@/contexts/StoreContext';

export function HeroBanner() {
  const { collections } = useStore();

  const heroCollection =
    collections.find((c) => c.slug === 'eid-2026' || c.isFeatured) ||
    collections[0];

  const sideCollection =
    collections.find(
      (c) => c.slug !== heroCollection?.slug && (c.slug === 'heritage-weaves' || c.isFeatured)
    ) || collections[1];

  const heroTitle = heroCollection?.name || 'Eid Collection 2026';
  const heroDescription = heroCollection?.description || 'Made for long days with family';
  const heroImage = heroCollection?.image || images.hero;
  const heroHref = heroCollection ? `/collections/${heroCollection.slug}` : '/collections/eid-2026';

  const sideTitle = sideCollection?.name || 'Heritage Weaves';
  const sideDescription = sideCollection?.description || 'Jamdani & Rajshahi silk';
  const sideImage = sideCollection?.image || images.saree;
  const sideHref = sideCollection ? `/collections/${sideCollection.slug}` : '/collections/heritage-weaves';

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main Hero Banner */}
        <div className="relative overflow-hidden rounded-lg lg:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={heroTitle}
            className="h-[440px] w-full object-cover sm:h-[560px]"
          />
          <div className="absolute inset-0 bg-ink/25" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 p-6 text-canvas sm:p-10">
            <p className="text-sm font-medium text-canvas/85">
              {heroTitle}
            </p>
            <h1 className="mt-2 max-w-lg font-display text-4xl leading-[1.05] sm:text-6xl text-canvas">
              {heroDescription}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-canvas text-ink hover:bg-canvas/90 cursor-pointer"
                href={heroHref}
              >
                Shop the collection
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-canvas hover:bg-canvas/15 hover:text-canvas cursor-pointer"
                href="/journal/eid-styling-guide"
              >
                Read the styling guide
              </Button>
            </div>
          </div>
        </div>

        {/* Side Banners */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Link
            href={sideHref}
            className="group relative overflow-hidden rounded-lg block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sideImage}
              alt={sideTitle}
              className="h-64 w-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.03] lg:h-[272px]"
            />
            <div className="absolute inset-0 bg-ink/20" aria-hidden />
            <div className="absolute bottom-0 p-5 text-canvas">
              <p className="font-display text-2xl font-medium">{sideTitle}</p>
              <p className="mt-1 text-sm text-canvas/85 line-clamp-1">{sideDescription}</p>
            </div>
          </Link>

          <Link
            href="/shop?sale=1"
            className="group flex flex-col justify-between rounded-lg bg-clay p-6 text-white lg:h-[272px] transition-transform duration-150 hover:bg-clay-dark"
          >
            <p className="text-sm text-white/80">Pre-Eid offer · ends 5 Oct</p>
            <div>
              <p className="font-display text-4xl leading-tight">৳500 off</p>
              <p className="mt-1 text-sm text-white/85">
                orders over ৳3,000 with code{' '}
                <span className="rounded bg-white/15 px-1.5 py-0.5 font-semibold">
                  EID500
                </span>
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                Shop sale{' '}
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
