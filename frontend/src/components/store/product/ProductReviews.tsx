'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  BadgeCheck,
  Camera,
  Flag,
  MessageSquare,
  Sparkles,
  Star,
  ThumbsUp,
  Upload,
  X,
  ChevronRight,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import type { Product } from '@/types/commerce';
import type { Review, ReviewStats, ProductReviewsQuery } from '@/types/review';
import { reviewService } from '@/services/review-service';
import { Rating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate } from '@/utils/format';
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

const FIT_OPTIONS = [
  { id: 'runs_small', label: 'Runs Small' },
  { id: 'true_to_size', label: 'True to Size' },
  { id: 'runs_large', label: 'Runs Large' },
];

export function ProductReviews({ product }: ProductReviewsProps) {
  const { user } = useStore();

  // State for reviews and live backend data
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 5.0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    withPhotosCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [photosOnly, setPhotosOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'helpful' | 'rating'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Interactive UI states
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Modal form states
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number>(0);
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
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Load reviews from live backend API
  const fetchReviews = useCallback(async () => {
    const productKey = product?.slug || product?.id;
    if (!productKey) return;
    setLoading(true);
    try {
      const query: ProductReviewsQuery = {
        rating: starFilter || undefined,
        withPhotosOnly: photosOnly || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
        limit: 50,
      };

      const res = await reviewService.getProductReviews(productKey, query);
      if (res?.data) {
        setReviews(res.data.reviews || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching product reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [product?.slug, product?.id, starFilter, photosOnly, sortBy, sortOrder]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle live helpful upvote
  const handleHelpfulVote = async (reviewId: string) => {
    if (votedIds.includes(reviewId)) return;

    // Optimistic update
    setVotedIds((prev) => [...prev, reviewId]);
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r)),
    );

    try {
      await reviewService.markReviewHelpful(reviewId);
      toast.success('Thank you for your feedback!');
    } catch {
      // Revert if failed
      setVotedIds((prev) => prev.filter((id) => id !== reviewId));
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpful: Math.max(0, r.helpful - 1) } : r)),
      );
    }
  };

  // Handle local file upload with FileReader
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.photos.length + files.length > 5) {
      toast.error('You can upload up to 5 photos.');
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setForm((prev) => ({
            ...prev,
            photos: [...prev.photos, result],
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Handle adding image via direct URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (form.photos.length >= 5) {
      toast.error('Maximum 5 photos allowed.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, imageUrlInput.trim()],
    }));
    setImageUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemovePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // Submit direct instant review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!form.rating || form.rating < 1 || form.rating > 5) {
      errors.rating = 'Please select a star rating.';
    }
    if (!form.body.trim() || form.body.trim().length < 3) {
      errors.body = 'Please share your thoughts (at least 3 characters).';
    }
    if (!user && !form.author.trim()) {
      errors.author = 'Please enter your name.';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const authorName = user?.name || form.author.trim() || 'Customer';
      const autoTitle =
        form.body.trim().length > 40
          ? `${form.body.trim().slice(0, 37)}...`
          : form.body.trim() || `${form.rating} Star Review`;

      const payload = {
        productId: product.slug || product.id,
        rating: form.rating,
        title: autoTitle,
        body: form.body.trim(),
        author: authorName,
        photos: form.photos,
      };

      const res = await reviewService.createReview(payload);
      if (res?.data) {
        toast.success('Your review has been published instantly! 🎉');
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
  const avgRatingNumber = stats.averageRating || 5.0;
  const isAdmin =
    user?.role === 'OWNER' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'STAFF';

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-32">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-line">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-subtle text-xs font-medium text-ink-soft mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>100% Authentic Customer Feedback</span>
          </div>
          <h2 id="reviews-heading" className="font-display text-2xl md:text-3xl text-ink font-semibold">
            Customer Reviews & Ratings
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Read real feedback from verified customers or share your own experience.
          </p>
        </div>

        {isAdmin ? (
          <Button
            href="/admin/reviews"
            variant="secondary"
            className="cursor-pointer gap-2 shadow-xs shrink-0 text-xs font-semibold"
          >
            <MessageSquare className="h-4 w-4" />
            Manage in Admin Dashboard
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (user?.name) {
                setForm((prev) => ({ ...prev, author: user.name }));
              }
              setIsWriteModalOpen(true);
            }}
            className="cursor-pointer gap-2 shadow-sm shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Main Grid: Left Scorecard & Right Reviews Feed */}
      <div className="mt-10 grid gap-12 lg:grid-cols-[320px_1fr]">
        {/* Left Column: Rating Scorecard & Star Breakdown */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-extrabold tracking-tight text-ink">
                {avgRatingNumber.toFixed(1)}
              </span>
              <div className="space-y-1">
                <Rating value={avgRatingNumber} size="md" />
                <p className="text-xs font-medium text-ink-muted">
                  Based on {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            {/* Star Distribution Breakdown */}
            <div className="mt-6 space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution?.[star] || 0;
                const percentage =
                  totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                const isSelected = starFilter === star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarFilter(isSelected ? null : star)}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer text-left',
                      isSelected
                        ? 'bg-ink text-canvas font-medium shadow-sm'
                        : 'hover:bg-subtle text-ink-soft'
                    )}
                  >
                    <span className="w-4 font-semibold">{star}</span>
                    <Star
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        isSelected ? 'fill-canvas text-canvas' : 'fill-amber-400 text-amber-400'
                      )}
                    />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isSelected ? 'bg-canvas' : 'bg-amber-400'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'w-8 text-right tabular-nums text-xs',
                        isSelected ? 'text-canvas' : 'text-ink-muted group-hover:text-ink'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Filter Reset if active */}
            {(starFilter !== null || photosOnly) && (
              <button
                type="button"
                onClick={() => {
                  setStarFilter(null);
                  setPhotosOnly(false);
                }}
                className="mt-4 flex w-full items-center justify-center gap-1 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer pt-3 border-t border-line"
              >
                <X className="h-3 w-3" /> Clear active filters
              </button>
            )}
          </div>

          {/* Value Propositions / Trust Info */}
          <div className="rounded-xl border border-line/60 bg-subtle/40 p-5 space-y-3 text-xs text-ink-soft">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Verified Purchases:</strong> Badges indicate real verified orders from our store.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Direct & Transparent:</strong> All customer reviews are published instantly.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Reviews Feed, Sorting & Filter Pills */}
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStarFilter(null);
                  setPhotosOnly(false);
                }}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-all',
                  starFilter === null && !photosOnly
                    ? 'bg-ink text-canvas shadow-sm'
                    : 'border border-line bg-surface text-ink-soft hover:border-ink hover:text-ink'
                )}
              >
                All ({totalReviewsCount})
              </button>

              <button
                type="button"
                onClick={() => setPhotosOnly((prev) => !prev)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-all',
                  photosOnly
                    ? 'bg-ink text-canvas shadow-sm'
                    : 'border border-line bg-surface text-ink-soft hover:border-ink hover:text-ink'
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                With Photos ({stats.withPhotosCount || 0})
              </button>

              {starFilter !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {starFilter} Star only
                  <button
                    type="button"
                    onClick={() => setStarFilter(null)}
                    className="ml-1 hover:text-amber-950 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="review-sort" className="text-xs text-ink-muted">
                Sort by:
              </label>
              <select
                id="review-sort"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'newest') {
                    setSortBy('createdAt');
                    setSortOrder('desc');
                  } else if (val === 'helpful') {
                    setSortBy('helpful');
                    setSortOrder('desc');
                  } else if (val === 'rating-desc') {
                    setSortBy('rating');
                    setSortOrder('desc');
                  } else if (val === 'rating-asc') {
                    setSortBy('rating');
                    setSortOrder('asc');
                  }
                }}
                className="h-8.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink focus:border-ink focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="helpful">Most Helpful</option>
                <option value="rating-desc">Highest Rating</option>
                <option value="rating-asc">Lowest Rating</option>
              </select>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-xl border border-line bg-surface p-6 space-y-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-subtle" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-32 rounded bg-subtle" />
                      <div className="h-3 w-20 rounded bg-subtle" />
                    </div>
                  </div>
                  <div className="h-4 w-48 rounded bg-subtle" />
                  <div className="h-16 rounded bg-subtle" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-ink-muted">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">No reviews found</h3>
              <p className="mx-auto max-w-md text-sm text-ink-muted">
                {starFilter !== null || photosOnly
                  ? 'There are no reviews matching your selected filters. Try clearing the filter.'
                  : 'Be the first to review this product and share your thoughts with other shoppers!'}
              </p>
              {starFilter !== null || photosOnly ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStarFilter(null);
                    setPhotosOnly(false);
                  }}
                  className="cursor-pointer"
                >
                  Reset Filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsWriteModalOpen(true)}
                  className="cursor-pointer gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Write First Review
                </Button>
              )}
            </div>
          ) : (
            /* Reviews List Feed */
            <div className="space-y-6">
              {reviews.map((rev) => {
                const authorInitial = (rev.author || 'C').charAt(0).toUpperCase();
                const isVoted = votedIds.includes(rev.id);

                return (
                  <article
                    key={rev.id}
                    className="rounded-2xl border border-line bg-surface p-6 shadow-xs transition-shadow hover:shadow-sm"
                  >
                    {/* Review Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* Author Avatar */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-stone-800 to-stone-600 font-semibold text-canvas text-sm shadow-xs">
                          {authorInitial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-ink">{rev.author}</h4>
                            {rev.verified && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                <BadgeCheck className="h-3.5 w-3.5" />
                                Verified Buyer
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted">
                            {formatDate(rev.date || rev.createdAt || new Date().toISOString())}
                            {rev.size && (
                              <span className="ml-2 font-medium text-ink-soft">
                                · Option: {rev.size}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Rating Stars */}
                      <Rating value={rev.rating} size="sm" />
                    </div>

                    {/* Review Title & Body */}
                    <div className="mt-4 space-y-2">
                      <h5 className="text-base font-semibold text-ink tracking-tight">{rev.title}</h5>
                      <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-line">
                        {rev.body}
                      </p>
                    </div>

                    {/* Photos Gallery */}
                    {rev.photos && rev.photos.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {rev.photos.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setLightboxImage(imgUrl)}
                            className="group relative h-20 w-20 overflow-hidden rounded-xl border border-line bg-subtle transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                            aria-label={`View photo ${idx + 1}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`Customer photo ${idx + 1}`}
                              className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="h-4 w-4 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Store Admin Official Public Reply */}
                    {rev.reply && (
                      <div className="mt-5 rounded-xl border border-line bg-subtle/60 p-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-ink" />
                        <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Store Response</span>
                        </div>
                        <p className="mt-1.5 text-xs sm:text-sm text-ink-soft leading-relaxed">
                          {rev.reply}
                        </p>
                      </div>
                    )}

                    {/* Bottom Actions: Helpful & Report */}
                    <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-ink-muted">
                      <button
                        type="button"
                        disabled={isVoted}
                        onClick={() => handleHelpfulVote(rev.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer',
                          isVoted
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : 'hover:bg-subtle hover:text-ink'
                        )}
                      >
                        <ThumbsUp className={cn('h-3.5 w-3.5', isVoted && 'fill-emerald-600')} />
                        <span>Helpful ({rev.helpful})</span>
                        {isVoted && <span className="text-[10px] font-bold">✓ Voted</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => toast.info('Thank you! This review has been flagged for check.')}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-subtle hover:text-ink transition-colors cursor-pointer text-[11px]"
                      >
                        <Flag className="h-3 w-3" />
                        <span>Report</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Write a Review Modal Form - Clean, Fast, Simple */}
      <Modal
        open={isWriteModalOpen}
        onClose={() => !submitting && setIsWriteModalOpen(false)}
        title="Write a Review"
        description={product.title}
        size="md"
      >
        <form onSubmit={handleSubmitReview} className="space-y-5 pt-2">
          {/* 1. Star Rating Selector */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-subtle/50 border border-line/60 text-center space-y-1.5">
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
                    className="p-1 cursor-pointer transition-transform hover:scale-115 focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={cn(
                        'h-9 w-9 transition-colors',
                        active ? 'fill-amber-400 text-amber-400' : 'text-line-strong'
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
              <p className="text-xs text-rose-500 font-medium">{formErrors.rating}</p>
            )}
          </div>

          {/* 2. Author Name (Only if not logged in) */}
          {!user && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Your Name *</label>
              <Input
                placeholder="e.g. Sarah Jenkins"
                value={form.author}
                onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                error={formErrors.author}
              />
            </div>
          )}

          {/* 3. Review Details Textarea */}
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

          {/* 4. Photo Attachments */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-ink-muted" />
                <span>Add Photos (Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput((prev) => !prev)}
                className="text-[11px] font-semibold text-ink-muted hover:text-ink cursor-pointer"
              >
                {showUrlInput ? 'Hide URL' : '+ Image Link'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-strong hover:border-ink bg-subtle/30 text-ink-muted hover:text-ink cursor-pointer transition-colors shrink-0">
                <Upload className="h-4 w-4 mb-0.5" />
                <span className="text-[10px] font-bold">Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoFileUpload}
                  className="hidden"
                />
              </label>

              {form.photos.map((photo, i) => (
                <div key={i} className="relative h-16 w-16 rounded-xl overflow-hidden border border-line group shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1 right-1 rounded-full bg-black/80 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-rose-600"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {showUrlInput && (
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Paste image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="text-xs h-8.5"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddImageUrl}
                  className="cursor-pointer shrink-0"
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* 5. Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
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

      {/* Photo Lightbox Modal */}
      {lightboxImage && (
        <Modal
          open={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
          size="lg"
          bare
        >
          <div className="relative p-2 bg-black/90 flex flex-col items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Customer product review high resolution"
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
          </div>
        </Modal>
      )}
    </section>
  );
}
