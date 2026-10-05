'use client';

import React from 'react';
import Link from 'next/link';
import { images } from '@/data/images';
import { Button } from '@/components/ui/button';
import { useStore } from '@/contexts/StoreContext';

export function SummerLinenSpotlight() {
  const { collections } = useStore();

  const spotlight =
    collections.find((c) => c.slug === 'summer-linen') ||
    collections[2] ||
    collections[0];

  const otherCollections = collections
    .filter((c) => c.slug !== spotlight?.slug)
    .slice(0, 3);

  const spotlightName = spotlight?.name || 'Summer Linen';
  const spotlightDesc =
    spotlight?.description ||
    'Pre-washed linen and cotton voile, cut loose for the monsoon heat. Pieces that breathe, crease beautifully and only get softer.';
  const spotlightImg = spotlight?.image || images.coord;
  const spotlightSlug = spotlight?.slug || 'summer-linen';

  return (
    <section
      className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="col-h"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spotlightImg}
          alt={`${spotlightName} collection`}
          className="aspect-[4/5] w-full rounded-lg object-cover border border-line shadow-sm"
        />
        <div className="lg:pl-8">
          <p className="text-sm font-medium tracking-wide uppercase text-ink-muted">Collection Spotlight</p>
          <h2
            id="col-h"
            className="mt-2 font-display text-4xl leading-tight sm:text-5xl text-ink"
          >
            {spotlightName}
          </h2>
          <p className="mt-4 max-w-md text-ink-soft leading-relaxed">
            {spotlightDesc}
          </p>
          <Button
            className="mt-8 cursor-pointer"
            size="lg"
            href={`/collections/${spotlightSlug}`}
          >
            Explore {spotlightName}
          </Button>
          {otherCollections.length > 0 && (
            <div className="mt-12 grid grid-cols-3 gap-3">
              {otherCollections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="group block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image || images.hero}
                    alt={c.name}
                    className="aspect-square w-full rounded-md object-cover object-top border border-line transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                  <p className="mt-2 text-xs font-semibold text-ink group-hover:underline line-clamp-1">
                    {c.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
