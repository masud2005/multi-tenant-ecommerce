'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Camera,
  ChevronDown,
  MessageSquare,
  Sparkles,
  Star,
  ThumbsUp,
  Upload,
  X,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import type { Product } from '@/types/commerce';
import type { Review, ReviewStats, ProductReviewsQuery } from '@/types/review';
import { reviewService } from '@/services/review-service';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { formatDateTime, formatNumber } from '@/utils/format';
import { getDisplayReviewTitle } from '@/utils/review';
import { cn } from '@/utils/cn';

interface ProductReviewsProps {
  product: Product;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor — Disappointed',
  2: 'Fair — Could be better',
  3: 'Average — Met expectations',
  4: 'Very Good — Highly satisfied',
  5: 'Exceptional — Loved it!',
};

const MAX_REVIEW_PHOTOS = 5;

type ListTab = 'all' | 'photos' | 'description';

function formatReviewCount(n: number) {
  if (n >= 1000) {
    const value = n / 1000;
    return `${value >= 10 ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, '')}k`;
  }
  return formatNumber(n);
}

function RatingRing({ value }: { value: number }) {
  const clamped = Math.min(5, Math.max(0, value));
  const pct = (clamped / 5) * 100;
  const size = 112;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-line"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-ink transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold tabular-nums tracking-tight text-ink">
          {clamped.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function StarRow({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-amber-500', className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i <= Math.round(value) ? 'fill-amber-500 text-amber-500' : 'fill-line text-line',
          )}
        />
      ))}
    </span>
  );
}

export function ProductReviews({ product }: ProductReviewsProps) {
  const { user } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    withPhotosCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [listTab, setListTab] = useState<ListTab>('all');
  const [ratingFilterOpen, setRatingFilterOpen] = useState(true);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [form, setForm] = useState({
    rating: 5,
    title: '',
    body: '',
    author: '',
    size: '',
    fit: 'true_to_size',
    photos: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);

  const fetchReviews = useCallback(async () => {
    const productKey = product?.slug || product?.id;
    if (!productKey) return;
    setLoading(true);
    try {
      const query: ProductReviewsQuery = {
        withPhotosOnly: listTab === 'photos' || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 100,
      };

      const res = await reviewService.getProductReviews(productKey, query);
      if (res?.data) {
        setReviews(res.data.reviews || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching product reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [product?.slug, product?.id, listTab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const displayedReviews = useMemo(() => {
    let list = reviews;

    if (selectedRatings.length > 0) {
      list = list.filter((r) => selectedRatings.includes(Math.round(r.rating)));
    }

    if (listTab === 'description') {
      list = list.filter((r) => (r.body || '').trim().length >= 15);
    }

    return list;
  }, [reviews, selectedRatings, listTab]);

  const handleHelpfulVote = async (reviewId: string) => {
    if (!user) {
      toast.error('Please sign in to mark a review as helpful.');
      router.push(`/login?next=${encodeURIComponent(`${pathname || '/'}#reviews`)}`);
      return;
    }

    const current = reviews.find((r) => r.id === reviewId);
    if (!current) return;

    const wasVoted = Boolean(current.helpfulVotedByMe);
    const prevHelpful = current.helpful;

    // Optimistic Facebook-style toggle
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              helpfulVotedByMe: !wasVoted,
              helpful: wasVoted ? Math.max(0, r.helpful - 1) : r.helpful + 1,
            }
          : r,
      ),
    );

    try {
      const res = await reviewService.markReviewHelpful(reviewId);
      if (res?.data) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  helpful: Number(res.data.helpful) || 0,
                  helpfulVotedByMe: Boolean(res.data.helpfulVotedByMe),
                }
              : r,
          ),
        );
      }
    } catch (err: any) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, helpful: prevHelpful, helpfulVotedByMe: wasVoted }
            : r,
        ),
      );
      toast.error(err?.message || 'Failed to update helpful vote');
    }
  };

  const compressImageFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.onload = () => {
          const maxSide = 1200;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });

  const processPhotoFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (form.photos.length + files.length > MAX_REVIEW_PHOTOS) {
      toast.error(`You can upload up to ${MAX_REVIEW_PHOTOS} photos.`);
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB.`);
        continue;
      }

      try {
        const compressed = await compressImageFile(file);
        setForm((prev) => {
          if (prev.photos.length >= MAX_REVIEW_PHOTOS) return prev;
          return { ...prev, photos: [...prev.photos, compressed] };
        });
      } catch {
        toast.error(`Failed to process ${file.name}`);
      }
    }
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void processPhotoFiles(e.target.files);
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const toggleRatingFilter = (star: number) => {
    setSelectedRatings((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star],
    );
  };

  const openWriteModal = () => {
    if (!user) {
      toast.error('Please sign in to write a review.');
      router.push(`/login?next=${encodeURIComponent(`${pathname || '/'}#reviews`)}`);
      return;
    }
    setForm((prev) => ({ ...prev, author: user.name || '' }));
    setIsWriteModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!user) {
      toast.error('Please sign in to submit a review.');
      router.push(`/login?next=${encodeURIComponent(`${pathname || '/'}#reviews`)}`);
      return;
    }

    if (!form.rating || form.rating < 1 || form.rating > 5) {
      errors.rating = 'Please select a star rating.';
    }
    if (!form.body.trim() || form.body.trim().length < 3) {
      errors.body = 'Please share your thoughts (at least 3 characters).';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await reviewService.createReview({
        productId: product.slug || product.id,
        rating: form.rating,
        body: form.body.trim(),
        author: user.name || 'Customer',
        photos: form.photos,
      });

      if (res?.data) {
        toast.success('Your review has been published.');
        setIsWriteModalOpen(false);
        setForm({
          rating: 5,
          title: '',
          body: '',
          author: '',
          size: '',
          fit: 'true_to_size',
          photos: [],
        });
        setFormErrors({});
        await fetchReviews();
      }
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      toast.error(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalReviewsCount = stats.totalReviews || 0;
  const avgRatingNumber = stats.averageRating || 0;
  const isAdmin =
    user?.role === 'OWNER' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'STAFF';

  const tabs: { id: ListTab; label: string }[] = [
    { id: 'all', label: 'All Reviews' },
    { id: 'photos', label: 'With Photo & Video' },
    { id: 'description', label: 'With Description' },
  ];

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-32 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="reviews-heading" className="font-display text-2xl font-semibold text-ink md:text-3xl">
            Product Reviews
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Ratings and feedback from customers who bought this item.
          </p>
        </div>
        {isAdmin ? (
          <Button href="/admin/reviews" variant="secondary" className="cursor-pointer gap-2 shrink-0">
            <MessageSquare className="h-4 w-4" />
            Manage reviews
          </Button>
        ) : (
          <Button onClick={openWriteModal} className="cursor-pointer gap-2 shrink-0">
            <Sparkles className="h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Summary: ring + distribution */}
      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(220px,280px)_1fr] lg:items-center">
          <div className="flex items-center gap-4">
            <RatingRing value={avgRatingNumber} />
            <div className="min-w-0 space-y-1.5">
              <StarRow value={avgRatingNumber} />
              <p className="text-sm text-ink-muted">
                from{' '}
                <span className="font-medium text-ink">
                  {formatReviewCount(totalReviewsCount)}
                </span>{' '}
                {totalReviewsCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution?.[star] || 0;
              const percentage =
                totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;

              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-8 tabular-nums text-ink-muted">{star.toFixed(1)}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-subtle">
                    <div
                      className="h-full rounded-full bg-ink transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right tabular-nums text-ink-muted">
                    {formatNumber(count)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters + list */}
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        {/* Rating filter sidebar */}
        <aside className="rounded-xl border border-line bg-surface p-4 h-fit lg:sticky lg:top-28">
          <button
            type="button"
            onClick={() => setRatingFilterOpen((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-ink cursor-pointer"
          >
            Rating
            <ChevronDown
              className={cn(
                'h-4 w-4 text-ink-muted transition-transform',
                ratingFilterOpen && 'rotate-180',
              )}
            />
          </button>

          {ratingFilterOpen && (
            <ul className="mt-4 space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const checked = selectedRatings.includes(star);
                return (
                  <li key={star}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRatingFilter(star)}
                        className="h-4 w-4 rounded border-line text-ink accent-ink cursor-pointer"
                      />
                      <StarRow value={star} />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedRatings.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedRatings([])}
              className="mt-4 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer"
            >
              Clear rating filter
            </button>
          )}
        </aside>

        {/* Review list */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListTab(tab.id)}
                className={cn(
                  'rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer',
                  listTab === tab.id
                    ? 'border-line bg-subtle text-ink'
                    : 'border-line bg-surface text-ink-muted hover:text-ink hover:bg-subtle/60',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-line bg-surface">
            {loading ? (
              <div className="space-y-0 divide-y divide-line">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="animate-pulse space-y-3 p-5">
                    <div className="h-4 w-28 rounded bg-subtle" />
                    <div className="h-5 w-2/3 rounded bg-subtle" />
                    <div className="h-3 w-40 rounded bg-subtle" />
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-subtle" />
                      <div className="h-3 w-24 rounded bg-subtle" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedReviews.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-ink-muted">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">No reviews found</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                  {selectedRatings.length > 0 || listTab !== 'all'
                    ? 'No reviews match your current filters.'
                    : 'Be the first to review this product.'}
                </p>
                {(selectedRatings.length > 0 || listTab !== 'all') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4 cursor-pointer"
                    onClick={() => {
                      setSelectedRatings([]);
                      setListTab('all');
                    }}
                  >
                    Reset filters
                  </Button>
                )}
                {!isAdmin && selectedRatings.length === 0 && listTab === 'all' && (
                  <Button size="sm" className="mt-4 cursor-pointer gap-2" onClick={openWriteModal}>
                    <Sparkles className="h-4 w-4" /> Write a Review
                  </Button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {displayedReviews.map((rev) => {
                  const authorInitial = (rev.author || 'C').charAt(0).toUpperCase();
                  const isVoted = Boolean(rev.helpfulVotedByMe);
                  const displayTitle = getDisplayReviewTitle(rev.title, rev.body);
                  const stamped = rev.date || rev.createdAt || new Date().toISOString();

                  return (
                    <li key={rev.id} className="p-5 sm:p-6">
                      <StarRow value={rev.rating} />

                      {displayTitle ? (
                        <h3 className="mt-2 text-base font-semibold text-ink">{displayTitle}</h3>
                      ) : null}

                      <p
                        className={cn(
                          'text-sm leading-relaxed text-ink-soft whitespace-pre-line',
                          displayTitle ? 'mt-1.5' : 'mt-2',
                        )}
                      >
                        {rev.body}
                      </p>

                      <p className="mt-2 text-xs text-ink-muted">{formatDateTime(stamped)}</p>

                      {rev.photos && rev.photos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {rev.photos.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setLightboxImage(imgUrl)}
                              className="h-16 w-16 overflow-hidden rounded-lg border border-line cursor-pointer"
                              aria-label={`View photo ${idx + 1}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {rev.reply && (
                        <div className="mt-4 rounded-lg border border-line bg-subtle/70 p-3.5">
                          <p className="text-xs font-semibold text-ink">Store Response</p>
                          <p className="mt-1 text-xs text-ink-soft leading-relaxed">{rev.reply}</p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink">
                            {authorInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{rev.author}</p>
                            {rev.verified && (
                              <p className="text-[11px] text-ink-muted">Verified purchase</p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleHelpfulVote(rev.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                            isVoted
                              ? 'border-ink bg-ink text-canvas'
                              : 'border-line bg-surface text-ink-muted hover:text-ink hover:bg-subtle/70',
                          )}
                          aria-pressed={isVoted}
                          aria-label={isVoted ? 'Remove helpful vote' : 'Mark review as helpful'}
                        >
                          <ThumbsUp className={cn('h-3.5 w-3.5', isVoted && 'fill-canvas')} />
                          <span className="tabular-nums">{rev.helpful}</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Write review modal */}
      <Modal
        open={isWriteModalOpen}
        onClose={() => !submitting && setIsWriteModalOpen(false)}
        title="Write a Review"
        description={product.title}
        size="md"
      >
        <form onSubmit={handleSubmitReview} className="space-y-5 pt-2">
          <div className="flex flex-col items-center justify-center space-y-1.5 rounded-xl border border-line bg-subtle/40 p-3 text-center">
            <span className="text-xs font-semibold text-ink-muted">Rate your experience</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || form.rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                    className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={cn(
                        'h-9 w-9 transition-colors',
                        active ? 'fill-amber-400 text-amber-400' : 'text-line-strong',
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {RATING_LABELS[hoverRating || form.rating] || 'Select your rating'}
            </span>
            {formErrors.rating && (
              <p className="text-xs font-medium text-rose-500">{formErrors.rating}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Your Review *</label>
            <Textarea
              placeholder="What did you like or dislike? How was the quality, comfort, and delivery?"
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              error={formErrors.body}
              className="min-h-[120px] rounded-xl"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-ink">
                Photos <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <span className="text-[11px] tabular-nums text-ink-muted">
                {form.photos.length}/{MAX_REVIEW_PHOTOS}
              </span>
            </div>

            {form.photos.length < MAX_REVIEW_PHOTOS && (
              <label
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingPhotos(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingPhotos(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingPhotos(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingPhotos(false);
                  if (e.dataTransfer.files?.length) {
                    void processPhotoFiles(e.dataTransfer.files);
                  }
                }}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition-colors',
                  isDraggingPhotos
                    ? 'border-ink bg-subtle'
                    : 'border-line bg-canvas hover:border-ink/40 hover:bg-subtle/60',
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-ink-muted">
                  <Upload className="h-4 w-4" />
                </span>
                <span className="mt-3 text-sm font-medium text-ink">
                  {isDraggingPhotos ? 'Drop photos here' : 'Click to upload or drag & drop'}
                </span>
                <span className="mt-1 text-xs text-ink-muted">
                  JPG, PNG up to 5MB · max {MAX_REVIEW_PHOTOS} photos
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {form.photos.length > 0 && (
              <div className="grid grid-cols-5 gap-2.5">
                {form.photos.map((photo, i) => (
                  <div
                    key={i}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-subtle"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-canvas cursor-pointer hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {form.photos.length < MAX_REVIEW_PHOTOS && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line text-ink-muted transition-colors hover:border-ink/50 hover:bg-subtle/50 hover:text-ink">
                    <Camera className="h-4 w-4" />
                    <span className="mt-1 text-[10px] font-medium">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-line pt-3">
            <Button
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={() => setIsWriteModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="cursor-pointer gap-2">
              {submitting ? 'Submitting…' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </Modal>

      {lightboxImage && (
        <Modal open={!!lightboxImage} onClose={() => setLightboxImage(null)} size="lg" bare>
          <div className="relative flex flex-col items-center justify-center bg-black/90 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Review photo"
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
          </div>
        </Modal>
      )}
    </section>
  );
}
