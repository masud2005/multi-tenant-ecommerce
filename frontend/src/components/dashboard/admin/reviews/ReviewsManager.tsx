'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/format';
import { getDisplayReviewTitle } from '@/utils/review';
import { reviewService } from '@/services/review-service';
import { ReviewDetailDrawer } from './ReviewDetailDrawer';
import { CreateReviewModal } from './CreateReviewModal';
import type { Review, ReviewStats, OwnerReviewsQuery } from '@/types/review';
import { cn } from '@/utils/cn';

interface ReviewsManagerProps {
  initialReviews?: Review[];
}

function isPublished(status?: string) {
  return status === 'PUBLISHED' || status === 'published';
}

export function ReviewsManager({ initialReviews = [] }: ReviewsManagerProps) {
  const [reviewsList, setReviewsList] = useState<Review[]>(initialReviews);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: initialReviews.length,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    withPhotosCount: 0,
    repliedCount: 0,
    pendingReplyCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [replyTab, setReplyTab] = useState<'all' | 'pending' | 'replied'>('all');
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const fetchOwnerReviews = useCallback(async () => {
    setLoading(true);
    try {
      const query: OwnerReviewsQuery = {
        page,
        limit: 20,
        rating: starFilter || undefined,
        withPhotosOnly: withPhotosOnly || undefined,
        search: searchQuery.trim() || undefined,
        hasReply:
          replyTab === 'replied' ? true : replyTab === 'pending' ? false : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const res = await reviewService.getOwnerReviews(query);
      if (res?.data) {
        setReviewsList(res.data.reviews || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load owner reviews:', err);
      toast.error('Failed to load reviews from server');
    } finally {
      setLoading(false);
    }
  }, [page, starFilter, withPhotosOnly, searchQuery, replyTab]);

  useEffect(() => {
    fetchOwnerReviews();
  }, [fetchOwnerReviews]);

  const handleReviewUpdated = (updated: Review) => {
    setReviewsList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedReview(updated);
    fetchOwnerReviews();
  };

  const handleReviewDeleted = (deletedId: string) => {
    setReviewsList((prev) => prev.filter((r) => r.id !== deletedId));
    if (selectedReview?.id === deletedId) {
      setSelectedReview(null);
      setIsDrawerOpen(false);
    }
    fetchOwnerReviews();
  };

  const handleToggleReviewStatus = async (review: Review, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const published = isPublished(review.status);
    const newStatus = published ? 'HIDDEN' : 'PUBLISHED';
    try {
      const res = await reviewService.updateReviewStatus(review.id, newStatus);
      if (res?.data) {
        toast.success(published ? 'Review hidden from store' : 'Review published live');
        setReviewsList((prev) => prev.map((r) => (r.id === review.id ? res.data : r)));
      } else {
        setReviewsList((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, status: newStatus } : r))
        );
      }
    } catch {
      toast.error('Failed to change status');
    }
  };

  const handleOpenDrawer = (review: Review) => {
    setSelectedReview(review);
    setIsDrawerOpen(true);
  };

  const totalCount = stats.totalReviews || reviewsList.length;
  const avgRating = stats.averageRating || 0;
  const repliedCount = stats.repliedCount || 0;
  const pendingCount = stats.pendingReplyCount ?? Math.max(0, totalCount - repliedCount);
  const responseRate = totalCount > 0 ? Math.round((repliedCount / totalCount) * 100) : 0;
  const filtersActive = Boolean(searchQuery || starFilter || withPhotosOnly || replyTab !== 'all');

  const resetFilters = () => {
    setSearchQuery('');
    setStarFilter(null);
    setWithPhotosOnly(false);
    setReplyTab('all');
    setPage(1);
  };

  const metrics = [
    { label: 'Reviews', value: String(totalCount), hint: 'On the store' },
    { label: 'Average', value: avgRating ? avgRating.toFixed(1) : '—', hint: 'Out of 5' },
    { label: 'Replied', value: String(repliedCount), hint: `${responseRate}% answered` },
    { label: 'Waiting', value: String(pendingCount), hint: 'Need a reply' },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Reviews"
        description="Read customer ratings, hide a review, or reply in public."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchOwnerReviews()}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add review
            </Button>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-line bg-surface px-4 py-3">
            <dt className="text-sm text-ink-muted">{metric.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">{metric.value}</dd>
            <p className="mt-0.5 text-sm text-ink-muted">{metric.hint}</p>
          </div>
        ))}
      </dl>

      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex gap-1 overflow-x-auto border-b border-line px-2">
          {(
            [
              ['all', `All (${totalCount})`],
              ['pending', `Waiting (${pendingCount})`],
              ['replied', `Replied (${repliedCount})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setReplyTab(value);
                setPage(1);
              }}
              className={cn(
                'shrink-0 border-b-2 px-3 py-3 text-sm font-medium',
                replyTab === value
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search customer, product, or review"
              aria-label="Search reviews"
              className="h-10 w-full rounded-md border border-line bg-canvas pl-9 pr-9 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select
              value={starFilter || ''}
              onChange={(e) => {
                setStarFilter(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
              aria-label="Filter by rating"
              className="h-10 min-w-0 rounded-md border border-line bg-canvas px-3 text-sm text-ink focus:border-ink focus:outline-none"
            >
              <option value="">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setWithPhotosOnly((prev) => !prev);
                setPage(1);
              }}
              aria-pressed={withPhotosOnly}
              className={cn(
                'inline-flex h-10 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium',
                withPhotosOnly
                  ? 'border-ink bg-ink text-canvas'
                  : 'border-line bg-canvas text-ink hover:bg-subtle'
              )}
            >
              <Camera className="h-4 w-4" aria-hidden />
              Photos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-line">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-3 px-4 py-4">
                <div className="h-4 w-40 rounded bg-subtle" />
                <div className="h-4 w-full max-w-md rounded bg-subtle" />
                <div className="h-4 w-2/3 rounded bg-subtle" />
              </div>
            ))}
          </div>
        ) : reviewsList.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews found"
            description={
              filtersActive
                ? 'Nothing matches these filters.'
                : 'Customer reviews will show up here after they are submitted.'
            }
            action={
              filtersActive ? (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {reviewsList.map((review) => {
              const productTitle = review.product?.title || review.productTitle || 'Product';
              const productImg = review.product?.images?.[0];
              const hasReply = Boolean(review.reply);
              const published = isPublished(review.status);
              const authorInitial = (review.author || 'C').charAt(0).toUpperCase();

              return (
                <li key={review.id}>
                  <article className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 gap-3 lg:w-56 lg:shrink-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-semibold text-ink">
                        {authorInitial}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{review.author}</p>
                        <p className="text-sm text-ink-muted">
                          {formatDate(review.date || review.createdAt || new Date().toISOString())}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Rating value={review.rating} size="sm" />
                          <span className="text-sm tabular-nums text-ink-muted">{review.rating}.0</span>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {productImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={productImg}
                            alt=""
                            className="h-10 w-8 shrink-0 rounded-md border border-line object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-subtle text-xs text-ink-muted">
                            —
                          </span>
                        )}
                        <p className="truncate text-sm text-ink">{productTitle}</p>
                      </div>
                      {(() => {
                        const displayTitle = getDisplayReviewTitle(review.title, review.body);
                        return displayTitle ? (
                          <p className="text-sm font-medium text-ink">{displayTitle}</p>
                        ) : null;
                      })()}
                      <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                      {review.photos && review.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {review.photos.map((photo, index) => (
                            <button
                              key={`${review.id}-photo-${index}`}
                              type="button"
                              onClick={() => setLightboxImg(photo)}
                              className="h-14 w-14 overflow-hidden rounded-md border border-line"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      {hasReply ? (
                        <p className="rounded-md bg-subtle px-3 py-2 text-sm text-ink">
                          <span className="font-medium">Store reply. </span>
                          <span className="text-ink-soft">{review.reply}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-ink-muted">No public reply yet.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:w-40 lg:shrink-0 lg:flex-col lg:items-stretch">
                      <Badge tone={published ? 'success' : 'neutral'} dot>
                        {published ? 'Live' : 'Hidden'}
                      </Badge>
                      {hasReply && (
                        <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Replied
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant={hasReply ? 'secondary' : 'primary'}
                        onClick={() => handleOpenDrawer(review)}
                      >
                        <MessageSquare className="h-4 w-4" aria-hidden />
                        {hasReply ? 'Manage' : 'Reply'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleToggleReviewStatus(review, e)}
                      >
                        {published ? 'Hide' : 'Publish'}
                      </Button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </section>

      <ReviewDetailDrawer
        open={isDrawerOpen}
        review={selectedReview}
        onClose={() => setIsDrawerOpen(false)}
        onReviewUpdated={handleReviewUpdated}
        onReviewDeleted={handleReviewDeleted}
      />

      <CreateReviewModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchOwnerReviews();
        }}
      />

      {lightboxImg && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white"
            aria-label="Close photo"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxImg} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
