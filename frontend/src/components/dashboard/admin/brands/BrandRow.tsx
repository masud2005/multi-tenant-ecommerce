'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreVertical, Pencil, ExternalLink, Trash2 } from 'lucide-react';
import { formatBDT } from '@/utils/format';
import type { BrandItem } from '@/types/brand';
import type { Product } from '@/types/product';

export type { BrandItem };

interface BrandRowProps {
  brand: BrandItem;
  products: Product[];
  onEdit?: (brand: BrandItem) => void;
  onDelete?: (brand: BrandItem) => void;
}

export function BrandRow({ brand, products, onEdit, onDelete }: BrandRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const brandProducts = products.filter(
    (p) => p.brand === brand.slug || p.brand === brand.name
  );
  const productCount =
    brand._count?.products ??
    brand.productsCount ??
    brandProducts.length;

  const revenue = brandProducts.reduce(
    (sum, p) => sum + ((p.salePrice ?? p.price) || 0) * (p.sold || 0),
    0
  );

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-6 py-4.5 transition-colors hover:bg-subtle/25">
      {/* Left: Avatar + Title & Description */}
      <div className="flex items-center gap-4 min-w-[240px] flex-1">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-subtle/80 font-display text-base font-semibold text-ink shadow-2xs overflow-hidden">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-serif text-lg">{brand.name[0]?.toUpperCase() || 'B'}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm sm:text-[15px] font-semibold text-ink leading-snug truncate">
              {brand.name}
            </p>
            {brand.isActive === false && (
              <span className="rounded bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-muted border border-line">
                Inactive
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted line-clamp-1 mt-0.5 leading-relaxed">
            {brand.description || 'Curated partner brand on store.'}
          </p>
        </div>
      </div>

      {/* Right: Metrics + Brand page link + 3-Dot Actions Menu */}
      <div className="flex items-center gap-6 sm:gap-8 shrink-0">
        <div className="text-right">
          <p className="text-sm font-normal text-ink tabular-nums">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </p>
          <p className="text-xs text-ink-muted tabular-nums mt-0.5">
            {formatBDT(revenue)} · 30d
          </p>
        </div>

        <Link
          href={`/brands/${brand.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`View ${brand.name} storefront page`}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-clay shrink-0 transition-colors cursor-pointer"
        >
          <span className="underline underline-offset-4 decoration-line-strong group-hover:decoration-clay">
            Brand page
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-ink-muted transition-colors group-hover:text-clay" />
        </Link>

        {/* 3-Dot Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Brand actions"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-ink-muted transition-all duration-150 hover:border-line hover:bg-surface hover:text-ink hover:shadow-xs focus:outline-none cursor-pointer"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-30 w-36 rounded-xl border border-line bg-surface p-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 text-left">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(brand);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-subtle cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-ink-muted" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(brand);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger/10 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-danger" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}




