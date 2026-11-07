'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import {
  resolveDesign,
  type LandingConfig,
  type LandingSectionId,
} from '@/lib/landing-config';
import type { LandingModel } from './useLandingModel';
import {
  CategoryLinks,
  Eyebrow,
  InkButton,
  NewsletterBand,
  ProductPick,
  Stars,
  padSlide,
  useAutoSlide,
} from './parts';
import { cn } from '@/utils/cn';

function SlideControls({
  index,
  total,
  onPrev,
  onNext,
  onPhoto,
}: {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onPhoto?: boolean;
}) {
  const buttonClass = onPhoto
    ? 'flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white'
    : 'flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas text-ink';

  return (
    <div className={`flex items-center gap-3 ${onPhoto ? 'text-white' : 'text-ink'}`}>
      <button type="button" onClick={onPrev} aria-label="Previous look" className={buttonClass}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs font-semibold tracking-[0.18em]">
        {padSlide(index + 1)}
        <span className="mx-2 opacity-60">/</span>
        {padSlide(total)}
      </span>
      {!onPhoto && <span className="h-px w-12 bg-ink/25" aria-hidden />}
      <button type="button" onClick={onNext} aria-label="Next look" className={buttonClass}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function useHeroOverlay(active: boolean) {
  useEffect(() => {
    if (active) {
      document.documentElement.dataset.heroOverlay = 'true';
    } else {
      delete document.documentElement.dataset.heroOverlay;
    }
    return () => {
      delete document.documentElement.dataset.heroOverlay;
    };
  }, [active]);
}

// ==========================================
// 1. HERO SECTION & SKELETON
// ==========================================
function HeroSkeleton({ design }: { design: string }) {
  if (design === 'panel') {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8" aria-label="Loading hero">
        <div className="grid items-stretch gap-4 lg:grid-cols-12">
          <div className="min-h-[460px] animate-pulse rounded-lg bg-subtle/80 lg:col-span-7 lg:min-h-[620px] flex items-end p-6 border border-line/40">
            <div className="h-6 w-36 rounded bg-line/60" />
          </div>
          <div className="flex flex-col justify-center rounded-lg border border-line bg-surface p-7 sm:p-10 lg:col-span-5 space-y-5 animate-pulse">
            <div className="h-4 w-28 rounded bg-subtle" />
            <div className="h-10 w-4/5 rounded bg-subtle" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-subtle/70" />
              <div className="h-4 w-3/4 rounded bg-subtle/70" />
            </div>
            <div className="h-12 w-36 rounded-lg bg-subtle" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-subtle/30 animate-pulse flex items-center" aria-label="Loading hero">
      <div className="w-full px-4 pb-16 pt-36 sm:px-6 lg:pl-[max(1.5rem,calc((100vw-80rem)/2+2rem))] lg:pr-16">
        <div className="max-w-xl space-y-5">
          <div className="h-4 w-28 rounded bg-subtle" />
          <div className="h-12 w-4/5 rounded bg-subtle" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-subtle/70" />
            <div className="h-4 w-2/3 rounded bg-subtle/70" />
          </div>
          <div className="h-12 w-36 rounded-lg bg-subtle" />
          <div className="h-8 w-28 rounded bg-subtle/50" />
        </div>
      </div>
    </section>
  );
}

function HeroSection({ config, model, design }: SectionProps) {
  const slides = model.slides;
  const { index, prev, next } = useAutoSlide(slides.length);
  const slide = slides[index] || slides[0];

  useHeroOverlay(design !== 'panel');

  // If initial collections/products are still fetching and no slides exist yet, display HeroSkeleton
  if ((model.isCollectionsLoading || model.isProductsLoading) && slides.length === 0) {
    return <HeroSkeleton design={design} />;
  }

  if (design === 'panel') {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-4 lg:grid-cols-12">
          <div className="relative min-h-[460px] overflow-hidden rounded-lg bg-subtle lg:col-span-7 lg:min-h-[620px]">
            {slide && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slide.image} alt={slide.alt} className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-ink/70 to-transparent p-5 text-white">
              <p className="font-display text-2xl italic">{config.heroScript}</p>
              {slides.length > 1 && (
                <SlideControls index={index} total={slides.length} onPrev={prev} onNext={next} onPhoto />
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-lg border border-line bg-surface p-7 sm:p-10 lg:col-span-5">
            <Eyebrow>{config.heroEyebrow}</Eyebrow>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">{config.heroTitle}</h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">{config.heroSubtitle}</p>
            <div className="mt-7">
              <InkButton href="/shop">{config.heroCta}</InkButton>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-canvas">
      {slide && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image}
          alt={slide.alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-canvas/75 via-transparent to-ink/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-canvas from-[6%] via-canvas/80 via-[42%] to-transparent to-[74%]" />
      <div className="relative z-10 flex min-h-[100svh] items-center">
        <div className="w-full px-4 pb-16 pt-36 sm:px-6 lg:pl-[max(1.5rem,calc((100vw-80rem)/2+2rem))] lg:pr-16">
          <div className="max-w-xl">
            <Eyebrow>{config.heroEyebrow}</Eyebrow>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-ink sm:text-6xl">{config.heroTitle}</h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">{config.heroSubtitle}</p>
            <div className="mt-8">
              <InkButton href="/shop">{config.heroCta}</InkButton>
            </div>
            {slides.length > 1 && (
              <div className="mt-10">
                <SlideControls index={index} total={slides.length} onPrev={prev} onNext={next} />
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-10 right-8 z-10 max-w-[14rem] text-right font-display text-3xl italic leading-none text-white drop-shadow-md sm:right-12 sm:text-4xl">
        {config.heroScript}
      </p>
    </section>
  );
}

// ==========================================
// 2. CATEGORIES SECTION & SKELETON
// ==========================================
function CategoriesSkeleton({ layout }: { layout: 'grid' | 'strip' }) {
  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Loading categories">
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'
            : 'flex gap-4 overflow-x-auto pb-1'
        }
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn('min-w-0 animate-pulse', layout === 'strip' && 'w-44 shrink-0')}>
            <div className="aspect-[4/3] w-full rounded-lg bg-subtle border border-line/40" />
            <div className="mt-3 h-4 w-2/3 rounded bg-subtle" />
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoriesSection({ model, design }: SectionProps) {
  const layout = design === 'strip' ? 'strip' : 'grid';

  if (model.isCategoriesLoading) {
    return <CategoriesSkeleton layout={layout} />;
  }

  // Do not show fake categories if none returned from server
  if (model.categoryLinks.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Shop by category">
      <CategoryLinks categories={model.categoryLinks} layout={layout} />
    </section>
  );
}

// ==========================================
// 3. FEATURED / LOOKS SECTION & SKELETON
// ==========================================
function FeaturedSkeleton({ design }: { design: string }) {
  if (design === 'feature') {
    return (
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8" aria-label="Loading collections">
        <div className="flex items-end justify-between gap-6 animate-pulse">
          <div className="max-w-xl space-y-3">
            <div className="h-4 w-24 rounded bg-subtle" />
            <div className="h-8 w-64 rounded bg-subtle" />
            <div className="h-4 w-80 rounded bg-subtle/70" />
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 animate-pulse">
          <div className="min-h-[360px] rounded-lg bg-subtle md:row-span-2 border border-line/40" />
          <div className="grid gap-4">
            <div className="aspect-[16/10] rounded-lg bg-subtle border border-line/40" />
            <div className="aspect-[16/10] rounded-lg bg-subtle border border-line/40" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8" aria-label="Loading collections">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(220px,0.72fr)_1.7fr] lg:gap-10 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 w-24 rounded bg-subtle" />
          <div className="h-9 w-48 rounded bg-subtle" />
          <div className="h-4 w-60 rounded bg-subtle/70" />
          <div className="h-10 w-32 rounded-lg bg-subtle" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-subtle border border-line/40" />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedSection({ config, model, design }: SectionProps) {
  if (model.isCollectionsLoading) {
    return <FeaturedSkeleton design={design} />;
  }

  // If no collections exist in database, do not show mock items
  if (model.looks.length === 0) {
    return null;
  }

  if (design === 'feature') {
    return (
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-xl">
            <Eyebrow>{config.featuredEyebrow}</Eyebrow>
            <h2 className="mt-3 font-display text-4xl text-ink">{config.featuredTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{config.featuredSubtitle}</p>
          </div>
          <Link href="/collections" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-ink sm:inline-flex">
            {config.featuredCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {model.looks[0] && (
            <Link href={model.looks[0].href} className="group relative min-h-[360px] overflow-hidden rounded-lg bg-subtle md:row-span-2">
              {model.looks[0].image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={model.looks[0].image} alt={model.looks[0].title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              ) : (
                <div className="absolute inset-0 bg-subtle flex items-center justify-center text-ink-muted">{model.looks[0].title}</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-6 text-white">
                <p className="font-display text-3xl">{model.looks[0].title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-white/80">{model.looks[0].subtitle}</p>
              </div>
            </Link>
          )}
          <div className="grid gap-4">
            {model.looks.slice(1).map((look) => (
              <Link key={look.id} href={look.href} className="group relative overflow-hidden rounded-lg bg-subtle">
                {look.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={look.image} alt={look.title} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="aspect-[16/10] bg-subtle flex items-center justify-center text-ink-muted">{look.title}</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-5 text-white">
                  <p className="font-display text-2xl">{look.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-white/80">{look.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(220px,0.72fr)_1.7fr] lg:gap-10">
        <div>
          <Eyebrow>{config.featuredEyebrow}</Eyebrow>
          <h2 className="mt-3 font-display text-4xl leading-[1.08] text-ink">{config.featuredTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{config.featuredSubtitle}</p>
          <div className="mt-6">
            <InkButton href="/collections">{config.featuredCta}</InkButton>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {model.looks.map((look) => (
            <Link key={look.id} href={look.href} className="group relative block overflow-hidden rounded-lg bg-subtle">
              {look.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={look.image} alt={look.title} className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              ) : (
                <div className="aspect-[3/4] bg-subtle flex items-center justify-center text-ink-muted text-sm">{look.title}</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent p-4 text-white">
                <p className="font-display text-xl leading-tight">{look.title}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-white/85">
                  Shop now
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 4. PROMO SECTION & SKELETON
// ==========================================
function PromoSkeleton({ design }: { design: string }) {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Loading promotion">
      <div
        className={cn(
          'grid overflow-hidden rounded-lg animate-pulse',
          design === 'aside'
            ? 'border border-line bg-surface lg:grid-cols-[0.9fr_1.1fr]'
            : 'gap-4 lg:grid-cols-2'
        )}
      >
        <div className="min-h-[260px] rounded-lg bg-subtle border border-line/40" />
        <div className="flex flex-col justify-center rounded-lg border border-line bg-surface p-8 space-y-4">
          <div className="h-4 w-24 rounded bg-subtle" />
          <div className="h-9 w-3/4 rounded bg-subtle" />
          <div className="h-4 w-1/2 rounded bg-subtle/70" />
          <div className="h-10 w-32 rounded-lg bg-subtle" />
        </div>
      </div>
    </section>
  );
}

function PromoSection({ config, model, design }: SectionProps) {
  if ((model.isCollectionsLoading || model.isProductsLoading) && !model.promoImage) {
    return <PromoSkeleton design={design} />;
  }

  if (design === 'aside') {
    return (
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-lg border border-line bg-surface lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[240px] bg-subtle">
            {model.promoImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={model.promoImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col justify-center px-6 py-8 sm:px-10">
            <Eyebrow>{config.promoEyebrow}</Eyebrow>
            <h2 className="mt-3 font-display text-4xl text-ink">{config.promoTitle}</h2>
            <p className="mt-2 text-sm text-ink-muted">{config.promoSubtitle}</p>
            <p className="mt-4 font-display text-2xl italic text-ink">{config.promoScript}</p>
            <div className="mt-6">
              <InkButton href="/shop?sale=1">{config.promoCta}</InkButton>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-h-[280px] flex-col justify-between rounded-lg border border-line bg-surface p-8 sm:p-10">
          <Eyebrow>{config.promoEyebrow}</Eyebrow>
          <div>
            <h2 className="mt-6 font-display text-4xl text-ink sm:text-5xl">{config.promoTitle}</h2>
            <p className="mt-2 text-sm text-ink-muted">{config.promoSubtitle}</p>
            <div className="mt-6">
              <InkButton href="/shop?sale=1">{config.promoCta}</InkButton>
            </div>
          </div>
        </div>
        <div className="relative min-h-[280px] overflow-hidden rounded-lg bg-subtle">
          {model.promoImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={model.promoImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/45 to-transparent" />
          <p className="absolute bottom-8 right-8 max-w-[14rem] text-right font-display text-3xl italic leading-none text-white drop-shadow-md">
            {config.promoScript}
          </p>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 5. PRODUCT PICKS SECTION & SKELETON
// ==========================================
function PicksSkeleton({ design }: { design: string }) {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8" aria-label="Loading products">
      <div className="flex items-end justify-between gap-4 animate-pulse">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-subtle" />
          <div className="h-9 w-48 rounded bg-subtle" />
          <div className="h-4 w-64 rounded bg-subtle/70" />
        </div>
        <div className="h-5 w-20 rounded bg-subtle" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] w-full rounded-lg bg-subtle border border-line/40" />
            <div className="mt-3 h-4 w-3/4 rounded bg-subtle" />
            <div className="mt-1 h-3 w-1/3 rounded bg-subtle/70" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="h-4 w-1/3 rounded bg-subtle" />
              <div className="h-3 w-1/4 rounded bg-subtle/60" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PicksSection({ config, model, design }: SectionProps) {
  if (model.isProductsLoading) {
    return <PicksSkeleton design={design} />;
  }

  const [lead, ...rest] = model.picks;
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>{config.picksEyebrow}</Eyebrow>
          <h2 className="mt-3 font-display text-4xl text-ink">{config.picksTitle}</h2>
          <p className="mt-2 text-sm text-ink-muted">{config.picksSubtitle}</p>
        </div>
        <Link href="/shop?sort=popular" className="inline-flex items-center gap-1 text-sm font-medium text-ink">
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {model.picks.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
          Published products will appear here.
        </p>
      ) : design === 'feature' && lead ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ProductPick product={lead} />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
            {rest.map((product) => (
              <ProductPick key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {model.picks.map((product) => (
            <ProductPick key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

// ==========================================
// 6. TRUST SECTION
// ==========================================
function TrustSection({ model, design }: SectionProps) {
  if (design === 'cards') {
    return (
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Store promises">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {model.trustPoints.map((point) => (
            <li key={point.title} className="rounded-lg bg-subtle px-5 py-5">
              <p className="text-sm font-semibold text-ink">{point.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{point.body}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Store promises">
      <div className="grid gap-6 rounded-lg border border-line bg-surface px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {model.trustPoints.map((point) => (
          <div key={point.title}>
            <p className="text-sm font-semibold text-ink">{point.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{point.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// 7. REVIEWS SECTION
// ==========================================
function ReviewsSection({ config, model, design }: SectionProps) {
  if (design === 'quotes') {
    return (
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-line bg-surface p-8">
            <Eyebrow>{config.reviewsEyebrow}</Eyebrow>
            <h2 className="mt-3 font-display text-4xl text-ink">{config.reviewsTitle}</h2>
            <p className="mt-3 text-sm text-ink-muted">{config.reviewsSubtitle}</p>
          </div>
          <div className="grid gap-4">
            {model.testimonials.map((review) => (
              <figure key={review.name} className="rounded-lg bg-subtle px-6 py-5">
                <Quote className="h-5 w-5 text-clay" aria-hidden />
                <blockquote className="mt-3 font-display text-xl leading-snug text-ink">“{review.quote}”</blockquote>
                <figcaption className="mt-4 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-ink">
                    {review.name}
                    <span className="font-normal text-ink-muted"> · {review.location}</span>
                  </span>
                  <Stars rating={5} />
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8">
      <Eyebrow>{config.reviewsEyebrow}</Eyebrow>
      <h2 className="mt-3 font-display text-4xl text-ink">{config.reviewsTitle}</h2>
      <p className="mt-2 max-w-md text-sm text-ink-muted">{config.reviewsSubtitle}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {model.testimonials.map((review) => (
          <figure key={review.name} className="rounded-lg border border-line bg-surface p-5">
            <figcaption>
              <p className="text-sm font-semibold text-ink">{review.name}</p>
              <p className="text-xs text-ink-muted">{review.location}</p>
            </figcaption>
            <div className="mt-4">
              <Stars rating={5} />
            </div>
            <blockquote className="mt-3 text-sm leading-relaxed text-ink-soft">“{review.quote}”</blockquote>
          </figure>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// 8. NEWSLETTER SECTION
// ==========================================
function NewsletterSection({ config, design }: SectionProps) {
  return <NewsletterBand config={config} tone={design === 'surface' ? 'surface' : 'ink'} />;
}

interface SectionProps {
  config: LandingConfig;
  model: LandingModel;
  design: string;
}

const RENDERERS: Record<LandingSectionId, (props: SectionProps) => React.ReactElement | null> = {
  hero: HeroSection,
  categories: CategoriesSection,
  featured: FeaturedSection,
  promo: PromoSection,
  picks: PicksSection,
  trust: TrustSection,
  reviews: ReviewsSection,
  newsletter: NewsletterSection,
};

export function LandingSections({ config, model }: { config: LandingConfig; model: LandingModel }) {
  return (
    <div>
      {(Object.keys(RENDERERS) as LandingSectionId[]).map((id) => {
        const setting = config.designs[id];
        if (!setting?.visible) return null;
        const Section = RENDERERS[id];
        return <Section key={id} config={config} model={model} design={resolveDesign(id, setting.design)} />;
      })}
    </div>
  );
}
