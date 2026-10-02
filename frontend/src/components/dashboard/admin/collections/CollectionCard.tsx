'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Hand, Star, ExternalLink, EyeOff, Trash2 } from 'lucide-react';
import type { CollectionItem } from '@/types/collection';

interface CollectionCardProps {
  collection: CollectionItem;
  productCount: number;
  onEdit?: (col: CollectionItem) => void;
  onDelete?: (col: CollectionItem) => void;
}

export function CollectionCard({
  collection,
  productCount,
  onEdit,
  onDelete,
}: CollectionCardProps) {
  return (
    <li className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 hover:shadow-md hover:border-line-strong relative">
      {/* Top Banner Image with Aspect Ratio 16/9 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={collection.image}
          alt={collection.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Floating Badges (Left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
          {collection.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-clay px-2 py-0.5 text-[11px] font-medium text-white shadow-xs">
              <Star className="h-3 w-3 fill-white" />
              <span>Featured</span>
            </span>
          )}

          {collection.isActive === false && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/80 backdrop-blur-xs px-2 py-0.5 text-[11px] font-medium text-canvas">
              <EyeOff className="h-3 w-3" />
              <span>Draft</span>
            </span>
          )}
        </div>

        {/* Top Floating Delete Button (Right) */}
        {onDelete && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(collection);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/90 text-ink-muted backdrop-blur-xs border border-line/60 shadow-xs transition-all duration-200 hover:bg-danger hover:text-white hover:border-danger hover:scale-105 cursor-pointer opacity-90 group-hover:opacity-100"
              title="Delete collection"
              aria-label="Delete collection"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title & Type Badge */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink leading-snug line-clamp-1">
            {collection.name}
          </h2>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-0.5 text-xs text-ink-muted border border-line">
            {collection.type === 'rule' ? (
              <Sparkles className="h-3 w-3 text-clay" aria-hidden />
            ) : (
              <Hand className="h-3 w-3 text-ink-muted" aria-hidden />
            )}
            <span>{collection.type === 'rule' ? 'Automated' : 'Manual'}</span>
          </span>
        </div>

        {/* Description */}
        <p className="mt-1.5 line-clamp-2 text-xs text-ink-muted leading-relaxed">
          {collection.description}
        </p>

        {/* Rule badge if Automated */}
        {collection.rule && (
          <p className="mt-2.5 rounded bg-canvas/80 px-2 py-1 font-mono text-[11px] text-ink-soft border border-line/60 truncate">
            {collection.rule}
          </p>
        )}

        {/* Card Footer: Product Count & Action Buttons */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-line/50 text-xs">
          <span className="font-medium text-ink-muted">
            <strong className="text-ink font-semibold">{productCount}</strong> {productCount === 1 ? 'product' : 'products'}
          </span>

          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(collection)}
                className="font-medium text-ink hover:text-clay transition-colors cursor-pointer"
              >
                Edit
              </button>
            )}

            <Link
              href={`/collections/${collection.slug}`}
              className="inline-flex items-center gap-1 font-medium text-clay hover:text-clay-dark transition-colors"
            >
              <span>View</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
