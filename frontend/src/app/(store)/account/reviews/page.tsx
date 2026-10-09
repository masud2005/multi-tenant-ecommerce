'use client';

import React from 'react';
import Link from 'next/link';
import {
  Star,
  Sparkles,
  BadgeCheck,
  MessageSquare,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/format';

export default function AccountReviewsPage() {
  const { reviews, orders, products, user } = useStore();

  const userFirstName = user?.name?.split(' ')[0]?.toLowerCase() || '';
  const mine = reviews.filter((r) => {
    if (r.customerId && user?.id && r.customerId === user.id) return true;
    if (userFirstName && r.author.toLowerCase().includes(userFirstName)) return true;
    return false;
  });

  const reviewedIds = mine.map((r) => r.productId);

  // Delivered items awaiting customer review
  const toReview = Array.from(
    new Set(
      orders
        .filter((o) => (o.customerId === user?.id || !o.customerId) && o.status === 'delivered')
        .flatMap((o) => o.items.map((i) => i.productId))
    )
  )
    .filter((id) => !reviewedIds.includes(id))
    .map((id) => products.find((p) => p.id === id)!)
    .filter(Boolean);

  return (
    <div className="space-y-8">
      <AccountHeader
        title="My Reviews"
        description="View your shared experiences, ratings, and write reviews for purchased items."
      />

      {/* Items Waiting for Review */}
      {toReview.length > 0 && (
        <section className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 via-surface to-surface p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h2 className="font-display text-lg font-semibold text-ink">
              Waiting for Your Review ({toReview.length})
            </h2>
          </div>
          <p className="text-xs text-ink-muted -mt-2 mb-4">
            You recently received these items. Share your honest feedback with other shoppers!
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {toReview.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface p-3.5 transition-all hover:border-ink hover:shadow-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={p.title}
                  className="h-16 w-14 rounded-lg object-cover border border-line shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{p.title}</p>
                  <p className="text-xs text-ink-muted">৳{p.price.toLocaleString()}</p>
                </div>
                <Button
                  size="sm"
                  href={`/products/${p.slug}#reviews`}
                  className="cursor-pointer gap-1 shrink-0"
                >
                  <span>Review</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Submitted Customer Reviews List */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Published Reviews ({mine.length})
        </h2>

        {mine.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews published yet"
            description="When you share feedback on products you purchased, they will appear here with instant live publication."
          />
        ) : (
          <div className="space-y-4">
            {mine.map((r) => {
              const matchedProduct = products.find((p) => p.id === r.productId);

              return (
                <article
                  key={r.id}
                  className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/products/${matchedProduct?.slug || '#'}`}
                      className="text-sm font-semibold text-ink hover:underline"
                    >
                      {matchedProduct?.title || r.productTitle || 'Product'}
                    </Link>
                    <Badge tone="success" className="gap-1">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Live & Published
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Rating value={r.rating} size="sm" />
                    <h3 className="text-sm font-semibold text-ink">{r.title}</h3>
                  </div>

                  <p className="text-sm text-ink-soft leading-relaxed">{r.body}</p>

                  {/* Attached Photos */}
                  {r.photos && r.photos.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {r.photos.map((ph, idx) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          key={idx}
                          src={ph}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover border border-line"
                        />
                      ))}
                    </div>
                  )}

                  {/* Store Reply if available */}
                  {r.reply && (
                    <div className="rounded-xl border border-line bg-subtle/70 p-3.5 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Store Response</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">{r.reply}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
                    <span>{formatDate(r.date || (r as any).createdAt || new Date().toISOString())}</span>
                    <span>{r.helpful} people found this helpful</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
