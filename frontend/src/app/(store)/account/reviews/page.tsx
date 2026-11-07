'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Star,
  Sparkles,
  BadgeCheck,
  MessageSquare,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { reviewService } from '@/services/review-service';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/format';
import type { Review } from '@/types/review';

type ReviewableProduct = {
  id: string;
  title: string;
  slug: string;
  images: string[];
  price?: number;
  salePrice?: number | null;
};

export default function AccountReviewsPage() {
  const [mine, setMine] = useState<Review[]>([]);
  const [toReview, setToReview] = useState<ReviewableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reviewService.getMyReviews();
      setMine(res?.data?.reviews || []);
      setToReview(res?.data?.reviewableProducts || []);
    } catch (err) {
      console.warn('Could not load customer reviews:', err);
      setMine([]);
      setToReview([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  return (
    <div className="space-y-8">
      <AccountHeader
        title="My Reviews"
        description="View your shared experiences, ratings, and write reviews for purchased items."
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMyReviews}
            disabled={isLoading}
            className="cursor-pointer gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-ink-muted" />
        </div>
      ) : (
        <>
          {toReview.length > 0 && (
            <section className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 via-surface to-surface p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <h2 className="font-display text-lg font-semibold text-ink">
                  Waiting for Your Review ({toReview.length})
                </h2>
              </div>
              <p className="text-xs text-ink-muted -mt-2 mb-4">
                These delivered purchases do not have a review yet. Share honest feedback with other shoppers.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {toReview.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 rounded-xl border border-line bg-surface p-3.5 transition-all hover:border-ink hover:shadow-xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        p.images[0] ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'
                      }
                      alt={p.title}
                      className="h-16 w-14 rounded-lg object-cover border border-line shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{p.title}</p>
                      <p className="text-xs text-ink-muted">
                        ৳{Number(p.price || 0).toLocaleString()}
                      </p>
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

          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              Published Reviews ({mine.length})
            </h2>

            {mine.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews published yet"
                description="After you buy and receive a product, you can leave a review from the product page. Your reviews will appear here."
              />
            ) : (
              <div className="space-y-4">
                {mine.map((r) => {
                  const productTitle = r.product?.title || r.productTitle || 'Product';
                  const productSlug = r.product?.slug;

                  return (
                    <article
                      key={r.id}
                      className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {productSlug ? (
                          <Link
                            href={`/products/${productSlug}`}
                            className="text-sm font-semibold text-ink hover:underline"
                          >
                            {productTitle}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-ink">{productTitle}</p>
                        )}
                        <Badge
                          tone={
                            r.status === 'PUBLISHED' || r.status === 'published'
                              ? 'success'
                              : 'neutral'
                          }
                          className="gap-1"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {r.status === 'PUBLISHED' || r.status === 'published'
                            ? 'Live & Published'
                            : String(r.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <Rating value={r.rating} size="sm" />
                        <h3 className="text-sm font-semibold text-ink">{r.title}</h3>
                      </div>

                      <p className="text-sm text-ink-soft leading-relaxed">{r.body}</p>

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
                        <span>
                          {formatDate(
                            r.date || r.createdAt || new Date().toISOString(),
                          )}
                        </span>
                        {r.verified && <span>Verified purchase</span>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
