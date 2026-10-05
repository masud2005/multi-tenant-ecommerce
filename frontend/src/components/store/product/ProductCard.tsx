'use client';

import React from 'react';
import Link from 'next/link';
import { EyeIcon, HeartIcon, ScaleIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import type { Product } from '@/types/commerce';
import { discountPercent, productPrice, variantStockState } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';
import { cn } from '@/utils/cn';

export function ProductCard({
  product,
  layout = 'grid',
}: {
  product: Product;
  layout?: 'grid' | 'list';
}) {
  const {
    wishlist,
    toggleWishlist,
    setQuickViewId,
    compare,
    toggleCompare,
    setCompareOpen,
  } = useStore();
  const wished = wishlist.includes(product.id);
  const compared = compare.includes(product.id);
  const stock = variantStockState(product);
  const off = discountPercent(product);

  const flag =
    stock === 'out'
      ? { text: 'Sold out', cls: 'bg-surface text-ink' }
      : stock === 'preorder'
      ? { text: 'Pre-order', cls: 'bg-info text-white' }
      : off
      ? { text: `−${off}%`, cls: 'bg-clay text-white' }
      : product.isNew
      ? { text: 'New', cls: 'bg-surface text-ink' }
      : null;

  return (
    <article
      className={cn(
        'group relative',
        layout === 'list' &&
          'grid grid-cols-[160px_1fr] gap-5 sm:grid-cols-[200px_1fr]'
      )}
    >
      <div className="relative overflow-hidden rounded-md bg-subtle">
        <Link href={`/products/${product.slug}`} aria-label={product.title}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0]}
            alt={product.title}
            loading="lazy"
            className={cn(
              'aspect-[3/4] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]',
              stock === 'out' && 'opacity-70'
            )}
          />
        </Link>
        {flag && (
          <span
            className={cn(
              'absolute left-2.5 top-2.5 rounded px-2 py-0.5 text-xs font-semibold',
              flag.cls
            )}
          >
            {flag.text}
          </span>
        )}
        <button
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wished}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-ink hover:bg-surface cursor-pointer shadow-xs transition-colors"
        >
          <HeartIcon
            className={cn('h-4 w-4', wished && 'fill-clay text-clay')}
          />
        </button>
        {layout === 'grid' && (
          <div className="absolute inset-x-2.5 bottom-2.5 hidden gap-2 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
            <button
              onClick={() => setQuickViewId(product.id)}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-surface text-sm font-medium text-ink hover:bg-canvas cursor-pointer shadow-xs transition-colors"
            >
              <EyeIcon className="h-4 w-4" aria-hidden /> Quick view
            </button>
            <button
              onClick={() => {
                toggleCompare(product.id);
                if (!compared) setCompareOpen(true);
              }}
              aria-pressed={compared}
              aria-label={compared ? 'Remove from compare' : 'Add to compare'}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md cursor-pointer shadow-xs transition-colors',
                compared ? 'bg-ink text-canvas' : 'bg-surface hover:bg-canvas text-ink'
              )}
            >
              <ScaleIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className={cn(layout === 'grid' ? 'mt-3' : 'py-1')}>
        <p className="text-xs text-ink-muted">{product.brand}</p>
        <h3 className="mt-0.5 text-sm font-medium leading-snug">
          <Link href={`/products/${product.slug}`} className="hover:underline text-ink">
            {product.title}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span
            className={cn(
              'text-sm font-semibold tabular-nums text-ink',
              product.salePrice && 'text-clay'
            )}
          >
            {formatBDT(productPrice(product))}
          </span>
          {product.salePrice && (
            <span className="text-xs text-ink-muted line-through tabular-nums">
              {formatBDT(product.price)}
            </span>
          )}
        </div>
        {product.colors.length > 1 && (
          <div
            className="mt-2 flex gap-1"
            aria-label={`${product.colors.length} colours`}
          >
            {product.colors.map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-3 w-3 rounded-full border border-line-strong"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
        {layout === 'list' && (
          <>
            <p className="mt-3 line-clamp-2 max-w-lg text-sm text-ink-muted">
              {product.shortDescription}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setQuickViewId(product.id)}
                className="h-9 rounded-md border border-line-strong px-3 text-sm font-medium text-ink hover:bg-subtle cursor-pointer"
              >
                Quick view
              </button>
              <button
                onClick={() => toggleCompare(product.id)}
                className="h-9 rounded-md px-3 text-sm font-medium text-ink-soft hover:bg-subtle cursor-pointer"
              >
                {compared ? 'Comparing' : 'Compare'}
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
