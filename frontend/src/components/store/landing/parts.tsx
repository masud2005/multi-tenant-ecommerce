'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Heart, Star } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import type { LandingConfig } from '@/lib/landing-config';
import type { LandingCategoryLink } from './useLandingModel';
import type { Product } from '@/types';
import { discountPercent, productPrice } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';
import { cn } from '@/utils/cn';

export function padSlide(value: number) {
  return String(value).padStart(2, '0');
}

export function useAutoSlide(length: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [length]);

  useEffect(() => {
    if (length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [length]);

  const prev = () => setIndex((current) => (current - 1 + length) % length);
  const next = () => setIndex((current) => (current + 1) % length);

  return { index, setIndex, prev, next };
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">
      {children}
    </p>
  );
}

export function InkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-medium text-canvas transition-colors hover:bg-ink/90"
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}

export function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, star) => (
        <Star
          key={star}
          className={cn(
            'h-3.5 w-3.5',
            star < filled ? 'fill-clay text-clay' : 'fill-transparent text-line-strong'
          )}
        />
      ))}
    </span>
  );
}

function prettyLabel(value: string) {
  if (!value) return '';
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function badgeFor(product: Product) {
  if (product.isNew) return 'New';
  if (product.isBestseller) return 'Bestseller';
  if ((product.rating || 0) >= 4.6 || (product.sold || 0) > 20) return 'Trending';
  return null;
}

export function CategoryLinks({
  categories,
  layout,
}: {
  categories: LandingCategoryLink[];
  layout: 'grid' | 'strip';
}) {
  return (
    <div
      className={
        layout === 'grid'
          ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'
          : 'flex gap-4 overflow-x-auto pb-1'
      }
    >
      {categories.map((category) => (
        <Link
          key={category.id}
          href={category.href}
          className={cn(
            'group min-w-0',
            layout === 'strip' && 'w-44 shrink-0'
          )}
        >
          <span className="block overflow-hidden rounded-lg bg-subtle">
            {category.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={category.image}
                alt={category.name}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <span className="flex aspect-[4/3] w-full items-center justify-center bg-subtle text-ink-muted text-sm font-medium">
                {category.name}
              </span>
            )}
          </span>
          <span className="mt-3 block text-sm font-medium text-ink">{category.name}</span>
        </Link>
      ))}
    </div>
  );
}

export function ProductPick({ product }: { product: Product }) {
  const { wishlist, toggleWishlist } = useStore();
  const wished = wishlist.includes(product.id);
  const price = productPrice(product);
  const compare = product.salePrice ? product.price : null;
  const off = discountPercent(product);
  const badge = badgeFor(product);
  const image = product.images[0];

  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-lg bg-subtle">
        <Link href={`/products/${product.slug}`} className="block">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.title}
              className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-subtle text-xs text-ink-muted p-4 text-center">
              {product.title}
            </div>
          )}
        </Link>
        {badge && (
          <span className="absolute left-3 top-3 rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-xs">
            {badge}
          </span>
        )}
        <button
          type="button"
          aria-label={wished ? `Remove ${product.title} from wishlist` : `Save ${product.title}`}
          onClick={() => toggleWishlist(product.id)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-surface/90 text-ink shadow-xs transition-colors hover:text-clay"
        >
          <Heart className={cn('h-4 w-4', wished && 'fill-clay text-clay')} />
        </button>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/products/${product.slug}`} className="block truncate text-sm font-medium text-ink">
            {product.title}
          </Link>
          <p className="mt-0.5 text-xs text-ink-muted">{prettyLabel(product.category)}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          {formatBDT(price)}
          {compare && compare > price && (
            <span className="ml-2 text-xs font-normal text-ink-muted line-through">
              {formatBDT(compare)}
            </span>
          )}
          {off > 0 && <span className="sr-only">, {off}% off</span>}
        </p>
        <p className="flex items-center gap-1 text-xs text-ink-muted">
          <Stars rating={product.rating || 0} />
          <span>{(product.rating || 0).toFixed(1)}</span>
          <span>({product.reviewCount || 0})</span>
        </p>
      </div>
    </article>
  );
}

export function NewsletterBand({
  config,
  tone,
}: {
  config: LandingConfig;
  tone: 'ink' | 'surface';
}) {
  const [email, setEmail] = useState('');

  const subscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid email address.');
      return;
    }
    setEmail('');
    toast.success('You are on the list. Newsletter delivery connects later.');
  };

  const ink = tone === 'ink';

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8">
      <div
        className={cn(
          'overflow-hidden rounded-lg px-6 py-10 sm:px-10 lg:px-14',
          ink ? 'bg-ink text-canvas' : 'border border-line bg-surface text-ink'
        )}
      >
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-[0.22em]',
                ink ? 'text-canvas/60' : 'text-ink-muted'
              )}
            >
              {config.newsletterEyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              {config.newsletterTitle}
            </h2>
            <p className={cn('mt-3 max-w-md text-sm', ink ? 'text-canvas/70' : 'text-ink-muted')}>
              {config.newsletterSubtitle}
            </p>
          </div>
          <form onSubmit={subscribe} className="flex flex-col gap-3 sm:flex-row" noValidate>
            <label className="sr-only" htmlFor={`landing-news-${tone}`}>
              Email address
            </label>
            <input
              id={`landing-news-${tone}`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email address"
              className={cn(
                'h-12 flex-1 rounded-lg border px-4 text-sm outline-none',
                ink
                  ? 'border-canvas/20 bg-canvas/10 text-canvas placeholder:text-canvas/45 focus:border-canvas/50'
                  : 'border-line bg-canvas text-ink placeholder:text-ink-muted focus:border-ink'
              )}
            />
            <button
              type="submit"
              className={cn(
                'inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-medium',
                ink ? 'bg-canvas text-ink' : 'bg-ink text-canvas'
              )}
            >
              Subscribe
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
