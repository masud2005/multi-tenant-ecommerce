'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Filter,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  ThumbsUp,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  LayoutGrid,
  List,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  Quote,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/format';
import { reviewService } from '@/services/review-service';
import { ReviewDetailDrawer } from './ReviewDetailDrawer';
import type { Review, ReviewStats, OwnerReviewsQuery } from '@/types/review';
import { cn } from '@/utils/cn';

interface ReviewsManagerProps {
  initialReviews?: Review[];
}

export function ReviewsManager({ initialReviews = [] }: ReviewsManagerProps) {
  // State for reviews and aggregate store stats
  const [reviewsList, setReviewsList] = useState<Review[]>(initialReviews);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: initialReviews.length,
    averageRating: 4.9,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    withPhotosCount: 0,
    repliedCount: 0,
    pendingReplyCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // View mode: 'grid' (eye-catching cards) vs 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and search controls
  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [replyTab, setReplyTab] = useState<'all' | 'pending' | 'replied'>('all');
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected review for drawer
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Lightbox for photos
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Load reviews from live backend API
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

  // Handle live update from drawer reply submission
  const handleReviewUpdated = (updated: Review) => {
    setReviewsList((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    setSelectedReview(updated);
    fetchOwnerReviews();
  };

  const handleOpenDrawer = (review: Review) => {
    setSelectedReview(review);
    setIsDrawerOpen(true);
  };

  const totalCount = stats.totalReviews || reviewsList.length;
  const avgRating = stats.averageRating || 5.0;
  const repliedCount = stats.repliedCount || 0;
  const pendingCount = stats.pendingReplyCount ?? Math.max(0, totalCount - repliedCount);
  const responseRate = totalCount > 0 ? Math.round((repliedCount / totalCount) * 100) : 100;

  return (
    <div className="w-full space-y-7">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 border border-amber-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Store Customer Feedback & Reputation Hub</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Customer Reviews
          </h1>
          <p className="mt-1 text-sm text-ink-muted max-w-2xl">
            Real customer experiences, star ratings, and public engagement. Reply directly to build trust.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchOwnerReviews()}
          disabled={loading}
          className="cursor-pointer gap-2 self-start sm:self-auto shrink-0 shadow-xs hover:border-ink"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh Data
        </Button>
      </div>

      {/* Hero KPI Metric Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Reviews */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface via-surface to-blue-500/5 p-5 shadow-xs transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Total Reviews
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              {totalCount}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" /> 100% Live
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Published directly to storefront</p>
        </div>

        {/* Metric 2: Store Rating Score */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface via-surface to-amber-500/5 p-5 shadow-xs transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Store Rating
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">/ 5.0 ★</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Rating value={avgRating} size="sm" />
            <span className="text-[11px] text-ink-muted">from {totalCount} ratings</span>
          </div>
        </div>

        {/* Metric 3: Response Rate & Replied */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface via-surface to-emerald-500/5 p-5 shadow-xs transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Public Replies
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              {repliedCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {responseRate}% rate
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${responseRate}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Needs Reply Alert */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface via-surface to-rose-500/5 p-5 shadow-xs transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Pending Reply
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              {pendingCount}
            </span>
            {pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 animate-pulse">
                Needs Attention
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600">All answered ✨</span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-muted">Reviews waiting for your official reply</p>
        </div>
      </div>

      {/* Control Toolbar: Tabs, Search, Filters, and Grid/List Switcher */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-subtle/80 border border-line/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setReplyTab('all');
                setPage(1);
              }}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                replyTab === 'all'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              All Reviews ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setReplyTab('pending');
                setPage(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                replyTab === 'pending'
                  ? 'bg-surface text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Needs Reply</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.2 text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setReplyTab('replied');
                setPage(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                replyTab === 'replied'
                  ? 'bg-surface text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Replied ({repliedCount})</span>
            </button>
          </div>

          {/* Search, Filter & Layout View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search customer, title, product…"
                className="w-full h-9 rounded-xl border border-line bg-canvas pl-9 pr-7 text-xs text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Star Filter Dropdown */}
            <select
              value={starFilter || ''}
              onChange={(e) => {
                setStarFilter(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-line bg-canvas px-3 text-xs font-medium text-ink focus:border-ink focus:outline-none cursor-pointer"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★</option>
              <option value="3">3 Stars ★★★</option>
              <option value="2">2 Stars ★★</option>
              <option value="1">1 Star ★</option>
            </select>

            {/* With Photos Button */}
            <button
              type="button"
              onClick={() => {
                setWithPhotosOnly((prev) => !prev);
                setPage(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 rounded-xl border px-3 text-xs font-semibold cursor-pointer transition-all',
                withPhotosOnly
                  ? 'border-ink bg-ink text-canvas shadow-xs'
                  : 'border-line bg-canvas text-ink-soft hover:border-ink hover:text-ink'
              )}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>With Photos</span>
            </button>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center rounded-xl border border-line bg-canvas p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                )}
                title="Card Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                )}
                title="Compact List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-line bg-surface p-5 space-y-4 animate-pulse shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-subtle" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-28 rounded bg-subtle" />
                  <div className="h-3 w-16 rounded bg-subtle" />
                </div>
              </div>
              <div className="h-14 rounded-xl bg-subtle" />
              <div className="h-4 w-3/4 rounded bg-subtle" />
              <div className="h-12 rounded bg-subtle" />
            </div>
          ))}
        </div>
      ) : reviewsList.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-16 text-center shadow-xs">
          <EmptyState
            icon={Star}
            title="No reviews found"
            description={
              searchQuery || starFilter || withPhotosOnly || replyTab !== 'all'
                ? 'No customer reviews match your active filters. Try clearing your search or filters.'
                : 'Customer reviews will appear here in beautiful cards once submitted on your store.'
            }
          />
          {(searchQuery || starFilter || withPhotosOnly || replyTab !== 'all') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStarFilter(null);
                setWithPhotosOnly(false);
                setReplyTab('all');
              }}
              className="mt-4 cursor-pointer"
            >
              Reset All Filters
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ========================================================
           ✨ LUXURY CARD GRID VIEW (2 or 3 Columns)
           ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviewsList.map((review) => {
            const productTitle = review.product?.title || review.productTitle || 'Product Item';
            const productImg =
              review.product?.images?.[0] ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=250';
            const hasReply = !!review.reply;
            const authorInitial = (review.author || 'C').charAt(0).toUpperCase();

            return (
              <article
                key={review.id}
                className={cn(
                  'group relative flex flex-col justify-between rounded-2xl border bg-surface p-5 shadow-xs transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                  hasReply
                    ? 'border-line hover:border-emerald-500/40'
                    : 'border-amber-200/80 dark:border-amber-900/60 hover:border-amber-500/50 bg-gradient-to-b from-surface via-surface to-amber-500/[0.02]'
                )}
              >
                {/* Top Section */}
                <div className="space-y-4">
                  {/* Card Header: Customer Info, Rating & Date */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-stone-900 via-stone-800 to-stone-700 font-bold text-canvas text-sm shadow-xs ring-2 ring-line">
                        {authorInitial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-ink truncate">
                            {review.author}
                          </h3>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                          {formatDate(review.date || review.createdAt || new Date().toISOString())}
                        </p>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{review.rating}.0</span>
                      </div>
                      {review.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <BadgeCheck className="h-3 w-3" /> Verified Buyer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Embedded Product Mini-Card */}
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle/40 p-2.5 transition-colors group-hover:bg-subtle/70">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productImg}
                      alt={productTitle}
                      className="h-12 w-11 rounded-lg object-cover border border-line shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                        Product
                      </p>
                      <h4 className="text-xs font-semibold text-ink truncate">
                        {productTitle}
                      </h4>
                      {review.product?.price && (
                        <p className="text-[11px] font-bold text-ink-soft">
                          ৳{review.product.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {review.product?.slug && (
                      <a
                        href={`/products/${review.product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors cursor-pointer"
                        title="View product storefront"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {/* Review Title & Body */}
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-ink leading-snug tracking-tight line-clamp-1">
                      {review.title || 'Customer Review'}
                    </h4>
                    <p className="text-xs sm:text-sm text-ink-soft leading-relaxed line-clamp-3 whitespace-pre-line">
                      {review.body}
                    </p>
                  </div>

                  {/* Sizing & Fit Badge if available */}
                  {review.size && (
                    <div className="inline-flex items-center gap-1 rounded-md bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                      <Tag className="h-3 w-3 text-ink-muted" />
                      <span>{review.size}</span>
                    </div>
                  )}

                  {/* Attached Photos Grid */}
                  {review.photos && review.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {review.photos.map((ph, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightboxImg(ph)}
                          className="group/photo relative h-14 w-14 overflow-hidden rounded-xl border border-line bg-subtle transition-transform hover:scale-105 cursor-pointer focus:outline-none"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ph}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-3.5 w-3.5 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Store Reply Preview Card */}
                  {hasReply ? (
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Official Store Reply
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(review)}
                          className="text-[11px] underline hover:text-emerald-950 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-emerald-950 dark:text-emerald-200/80 line-clamp-2 leading-relaxed">
                        {review.reply}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                        <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>No reply posted yet</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(review)}
                        className="font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950 cursor-pointer"
                      >
                        Reply now →
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer: Helpful counter & Primary Action */}
                <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-ink-muted">
                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{review.helpful} Helpful</span>
                  </span>

                  <Button
                    size="sm"
                    variant={hasReply ? 'secondary' : 'primary'}
                    onClick={() => handleOpenDrawer(review)}
                    className="cursor-pointer gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{hasReply ? 'Inspect / Edit' : 'Reply to Customer'}</span>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* ========================================================
           📋 COMPACT ROW LIST VIEW
           ======================================================== */
        <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs divide-y divide-line">
          {reviewsList.map((review) => {
            const productTitle = review.product?.title || review.productTitle || 'Product Item';
            const productImg =
              review.product?.images?.[0] ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
            const hasReply = !!review.reply;

            return (
              <div
                key={review.id}
                className="p-5 transition-colors hover:bg-subtle/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Product & Author */}
                <div className="flex items-start gap-4 min-w-0 md:max-w-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productImg}
                    alt={productTitle}
                    className="h-14 w-12 rounded-xl object-cover border border-line shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Rating value={review.rating} size="sm" />
                      <span className="text-xs font-bold text-ink">{review.rating}.0</span>
                    </div>
                    <h4 className="text-xs font-bold text-ink truncate">{productTitle}</h4>
                    <p className="text-[11px] text-ink-muted truncate">
                      by <strong className="text-ink">{review.author}</strong> ·{' '}
                      {formatDate(review.date || review.createdAt || new Date().toISOString())}
                    </p>
                  </div>
                </div>

                {/* Review Body & Snippet */}
                <div className="flex-1 min-w-0 space-y-1.5 md:px-4">
                  <h5 className="text-sm font-semibold text-ink truncate">{review.title}</h5>
                  <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">
                    {review.body}
                  </p>
                  {hasReply && (
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="font-bold">Store reply:</span>
                      <span className="truncate max-w-xs">{review.reply}</span>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                  {hasReply ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      ✓ Replied
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                      <Flame className="h-3 w-3" /> Needs Reply
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={hasReply ? 'secondary' : 'primary'}
                    onClick={() => handleOpenDrawer(review)}
                    className="cursor-pointer gap-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{hasReply ? 'Edit Reply' : 'Reply'}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-ink-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="cursor-pointer gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Slide-over Review Detail & Public Reply Drawer */}
      <ReviewDetailDrawer
        open={isDrawerOpen}
        review={selectedReview}
        onClose={() => setIsDrawerOpen(false)}
        onReviewUpdated={handleReviewUpdated}
      />

      {/* Lightbox for customer photos */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 animate-in fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImg}
            alt="Customer upload high-res"
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
