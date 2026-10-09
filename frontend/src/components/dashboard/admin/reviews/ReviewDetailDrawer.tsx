'use client';

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
  X,
  Package,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';
import { reviewService } from '@/services/review-service';
import type { Review } from '@/types/review';
import { cn } from '@/utils/cn';

interface ReviewDetailDrawerProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
  onReviewUpdated: (updatedReview: Review) => void;
}

export function ReviewDetailDrawer({
  review,
  open,
  onClose,
  onReviewUpdated,
}: ReviewDetailDrawerProps) {
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    if (review) {
      setReplyText(review.reply || '');
    }
  }, [review]);

  if (!review) return null;

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
        // Fallback optimistic update
        const updated: Review = { ...review, reply: replyText.trim() };
        toast.success('Public store reply saved!');
        onReviewUpdated(updated);
      }
    } catch (err: any) {
      console.error('Failed to post reply:', err);
      toast.error(err.message || 'Failed to post reply. Please try again.');
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
        title="Review & Public Reply"
        subtitle={`Review ID: ${review.id.slice(0, 10)}…`}
        width="max-w-lg"
      >
        <div className="space-y-6 p-5">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between rounded-xl bg-subtle/60 p-3.5 border border-line">
            <div className="flex items-center gap-2">
              <Rating value={review.rating} size="md" />
              <span className="text-sm font-bold text-ink">
                {review.rating}.0 / 5.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="success" dot>
                Live & Published
              </Badge>
              {review.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified Buyer
                </span>
              )}
            </div>
          </div>

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

              {review.size && (
                <span className="rounded-md bg-subtle px-2 py-0.5 text-xs font-medium text-ink-soft">
                  {review.size}
                </span>
              )}
            </div>

            {/* Review Title & Body */}
            <div className="pt-2 border-t border-line/60">
              <h4 className="text-sm font-bold text-ink">{review.title}</h4>
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

          {/* Official Store Admin Reply Section */}
          <form onSubmit={handlePostReply} className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label htmlFor="admin-reply-textarea" className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-ink" />
                <span>Official Public Store Reply</span>
              </label>
              {review.reply && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
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
              <span className="text-[11px] text-ink-muted">
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

      {/* Lightbox for photos */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in"
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
    </>
  );
}
