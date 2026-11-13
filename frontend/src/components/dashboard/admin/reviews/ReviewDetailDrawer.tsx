'use client';


import { asApiError } from '@/lib/api-error';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Send,
  ShieldAlert,
  Star,
  ThumbsUp,
  User,
  Package,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { MediaLightbox } from '@/components/ui/MediaLightbox';
import { formatDate } from '@/utils/format';
import { getDisplayReviewTitle } from '@/utils/review';
import { reviewService } from '@/services/review-service';
import type { Review, ReviewStatus } from '@/types/review';
import { cn } from '@/utils/cn';

interface ReviewDetailDrawerProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
  onReviewUpdated: (updatedReview: Review) => void;
  onReviewDeleted?: (id: string) => void;
}

export function ReviewDetailDrawer({
  review,
  open,
  onClose,
  onReviewUpdated,
  onReviewDeleted,
}: ReviewDetailDrawerProps) {
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Edit review state
  const [isEditing, setIsEditing] = useState(false);
  const [editAuthor, setEditAuthor] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editVerified, setEditVerified] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Status toggle state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (review) {
      setReplyText(review.reply || '');
      setEditAuthor(review.author || '');
      setEditRating(review.rating || 5);
      setEditTitle(review.title || '');
      setEditBody(review.body || '');
      setEditSize(review.size || '');
      setEditVerified(review.verified ?? true);
      setIsEditing(false);
    }
  }, [review]);

  if (!review) return null;

  const isPublished =
    review.status === 'PUBLISHED' || review.status === 'published';

  const handleToggleStatus = async () => {
    setUpdatingStatus(true);
    const newStatus: ReviewStatus = isPublished ? 'HIDDEN' : 'PUBLISHED';
    try {
      const res = await reviewService.updateReviewStatus(review.id, newStatus);
      if (res?.data) {
        toast.success(
          isPublished
            ? 'Review is now hidden from storefront'
            : 'Review is now published and live on storefront!'
        );
        onReviewUpdated(res.data);
      } else {
        const optimistic: Review = { ...review, status: newStatus };
        onReviewUpdated(optimistic);
      }
    } catch (err: unknown) {
      console.error('Failed to update status:', err);
      toast.error('Failed to change review status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAuthor.trim()) {
      toast.error('Author name is required');
      return;
    }
    if (!editBody.trim()) {
      toast.error('Review body is required');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await reviewService.updateOwnerReview(review.id, {
        author: editAuthor.trim(),
        rating: editRating,
        title: editTitle.trim(),
        body: editBody.trim(),
        size: editSize.trim() || undefined,
        verified: editVerified,
      });

      if (res?.data) {
        toast.success('Review details updated successfully! 🎉');
        onReviewUpdated(res.data);
        setIsEditing(false);
      } else {
        const optimistic: Review = {
          ...review,
          author: editAuthor.trim(),
          rating: editRating,
          title: editTitle.trim(),
          body: editBody.trim(),
          size: editSize.trim() || undefined,
          verified: editVerified,
        };
        onReviewUpdated(optimistic);
        setIsEditing(false);
      }
    } catch (err: unknown) {
      console.error('Failed to update review:', err);
      toast.error('Failed to update review');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setDeleting(true);
    try {
      await reviewService.deleteOwnerReview(review.id);
      toast.success('Review deleted');
      if (onReviewDeleted) onReviewDeleted(review.id);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to delete review:', err);
      toast.error('Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || replyText.trim().length < 5) {
      toast.error('Please write a reply with at least 5 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await reviewService.replyToReview(review.id, replyText.trim());
      if (res?.data) {
        toast.success('Public store reply posted successfully! 🎉');
        onReviewUpdated(res.data);
      } else {
        const updated: Review = { ...review, reply: replyText.trim() };
        toast.success('Public store reply saved!');
        onReviewUpdated(updated);
      }
    } catch (err: unknown) {
      console.error('Failed to post reply:', err);
      toast.error(asApiError(err).message || 'Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const productImg =
    review.product?.images?.[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Manage Review & Feedback"
        subtitle={`Review ID: ${review.id.slice(0, 10)}…`}
        width="max-w-lg"
      >
        <div className="space-y-6 p-5">
          {/* Top Moderation Toolbar */}
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-subtle p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={isPublished ? 'success' : 'neutral'} dot>
                {isPublished ? 'Live & Published' : 'Hidden from Store'}
              </Badge>
              {review.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={isPublished ? 'secondary' : 'primary'}
                onClick={handleToggleStatus}
                disabled={updatingStatus}
                className="cursor-pointer gap-1.5 text-xs h-8"
              >
                {isPublished ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide Review</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Publish Review</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(!isEditing)}
                className="cursor-pointer gap-1 text-xs h-8"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting}
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs h-8 p-1.5"
                title="Delete review"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Edit Form (if editing is toggled) */}
          {isEditing ? (
            <form
              onSubmit={handleSaveEdit}
              className="rounded-xl border border-line bg-surface p-4 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h4 className="text-sm font-bold text-ink flex items-center gap-1.5">
                  <Edit2 className="h-4 w-4 text-ink" /> Edit Review Details
                </h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Customer / Author Name
                </label>
                <input
                  type="text"
                  required
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Rating (1 - 5)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditRating(s)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={cn(
                          'h-5 w-5',
                          s <= editRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-ink">
                    {editRating}.0
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Feedback Body
                </label>
                <textarea
                  rows={3}
                  required
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas p-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Location / Tag
                </label>
                <input
                  type="text"
                  value={editSize}
                  onChange={(e) => setEditSize(e.target.value)}
                  placeholder="e.g. Gulshan, Dhaka"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={editVerified}
                    onChange={(e) => setEditVerified(e.target.checked)}
                    className="h-4 w-4 rounded border-line text-ink"
                  />
                  <span>Verified Buyer</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="cursor-pointer text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingEdit}
                    className="cursor-pointer gap-1.5 text-xs"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingEdit ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            /* Standard Review View */
            <>
              {/* Product Info Card */}
              <div className="rounded-xl border border-line bg-surface p-4 flex items-center gap-3 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={productImg}
                  alt={review.product?.title || review.productTitle || 'Product'}
                  className="h-16 w-14 rounded-lg object-cover border border-line shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-muted">Product</p>
                  <h4 className="text-sm font-semibold text-ink truncate">
                    {review.product?.title || review.productTitle || 'Product Item'}
                  </h4>
                  {review.product?.price && (
                    <p className="text-xs font-medium text-ink-soft">
                      ৳{review.product.price.toLocaleString()}
                    </p>
                  )}
                </div>
                {review.product?.slug && (
                  <a
                    href={`/products/${review.product.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg p-2 text-ink-muted hover:bg-subtle hover:text-ink transition-colors cursor-pointer"
                    title="View in store"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              {/* Customer Feedback Card */}
              <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-canvas font-semibold text-xs">
                      {(review.author || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-ink">{review.author}</h5>
                      <p className="text-xs text-ink-muted">
                        {formatDate(review.date || review.createdAt || new Date().toISOString())}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{review.rating}.0</span>
                    </div>
                    {review.size && (
                      <span className="rounded-md bg-subtle px-2 py-0.5 text-xs font-medium text-ink-soft">
                        {review.size}
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Title & Body */}
                <div className="pt-2 border-t border-line/60">
                  {(() => {
                    const displayTitle = getDisplayReviewTitle(review.title, review.body);
                    return displayTitle ? (
                      <h4 className="text-sm font-bold text-ink">{displayTitle}</h4>
                    ) : null;
                  })()}
                  <p className="mt-1 text-sm text-ink-soft leading-relaxed whitespace-pre-line">
                    {review.body}
                  </p>
                </div>

                {/* Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="text-xs font-semibold text-ink-muted flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" /> Customer Photos ({review.photos.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {review.photos.map((photo, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightboxImg(photo)}
                          className="group relative h-16 w-16 overflow-hidden rounded-lg border border-line bg-subtle transition-transform hover:scale-105 cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt="Customer upload"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement info */}
                <div className="flex items-center gap-4 text-xs text-ink-muted pt-2 border-t border-line/60">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                    {review.helpful} customers found this helpful
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Official Store Admin Reply Section */}
          <form onSubmit={handlePostReply} className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label htmlFor="admin-reply-textarea" className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-ink" />
                <span>Official Public Store Reply</span>
              </label>
              {review.reply && (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  ✓ Replied
                </span>
              )}
            </div>

            <p className="text-xs text-ink-muted">
              This response will appear publicly under the customer’s review on the storefront.
            </p>

            <textarea
              id="admin-reply-textarea"
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="e.g. Thank you for your wonderful feedback! We are thrilled to hear that the fabric and fit exceeded your expectations..."
              className="w-full rounded-xl border border-line bg-canvas p-3 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none transition-colors"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-ink-muted">
                {replyText.length} characters (min 5)
              </span>
              <Button
                type="submit"
                disabled={submitting || !replyText.trim()}
                className="cursor-pointer gap-2"
                size="sm"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? 'Posting…' : review.reply ? 'Update Reply' : 'Post Public Reply'}
              </Button>
            </div>
          </form>
        </div>
      </Drawer>

      <MediaLightbox
        src={lightboxImg}
        kind="image"
        alt="Customer upload"
        onClose={() => setLightboxImg(null)}
      />
    </>
  );
}
