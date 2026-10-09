'use client';

import React, { useState } from 'react';
import { Flag, BadgeCheck, MessageSquare } from 'lucide-react';
import { Rating } from '@/components/ui/Rating';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/format';
import type { Review, ReviewStatus } from '@/types/review';

const toneMap: Record<string, Tone> = {
  published: 'success',
  PUBLISHED: 'success',
  pending: 'warning',
  hidden: 'neutral',
  HIDDEN: 'neutral',
  rejected: 'danger',
  REJECTED: 'danger',
};

interface ReviewItemProps {
  review: Review;
  onUpdateStatus: (id: string, status: ReviewStatus, msg: string) => void;
  onPostReply: (id: string, reply: string) => void;
}

export function ReviewItem({ review, onUpdateStatus, onPostReply }: ReviewItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    onPostReply(review.id, replyText.trim());
    setIsReplying(false);
    setReplyText('');
  };

  return (
    <li className="px-5 py-5 transition-colors hover:bg-canvas/30">
      {/* Header: Rating, Author, Badges, Date */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Rating value={review.rating} size="sm" />
        <span className="font-medium text-ink">{review.author}</span>

        {review.verified && (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            <span>Verified purchase</span>
          </span>
        )}

        {review.reported && (
          <span className="inline-flex items-center gap-1 text-xs text-danger font-medium">
            <Flag className="h-3.5 w-3.5" aria-hidden />
            <span>Reported</span>
          </span>
        )}

        <span className="ml-auto text-xs text-ink-muted">
          {formatDate(review.date || review.createdAt || new Date().toISOString())}
        </span>
      </div>

      {/* Product Reference */}
      <p className="mt-1 text-xs text-ink-muted">
        on <b className="font-medium text-ink-soft">{review.productTitle}</b>
        {review.size && ` · size ${review.size}`}
      </p>

      {/* Review Title & Body */}
      <p className="mt-2 text-sm font-medium text-ink">{review.title}</p>
      <p className="mt-1 text-sm text-ink-soft leading-relaxed">{review.body}</p>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.photos.map((photo, idx) => (
            <div
              key={idx}
              className="relative h-16 w-14 overflow-hidden rounded border border-line bg-subtle"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="Customer photo"
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}

      {/* Public Reply from Brand */}
      {review.reply && (
        <p className="mt-3 rounded-md bg-canvas border border-line/60 p-3 text-sm text-ink">
          <b className="font-semibold text-ink">Store reply:</b> {review.reply}
        </p>
      )}

      {/* Inline Reply Form */}
      {isReplying && (
        <div className="mt-3 flex gap-2">
          <label htmlFor={`reply-${review.id}`} className="sr-only">
            Reply
          </label>
          <input
            id={`reply-${review.id}`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a public reply…"
            className="h-9 flex-1 rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25 transition-[border-color,box-shadow]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendReply();
            }}
          />
          <Button
            size="sm"
            disabled={!replyText.trim()}
            onClick={handleSendReply}
            className="cursor-pointer"
          >
            Post
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsReplying(false);
              setReplyText('');
            }}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Bottom Bar: Status Badge, Helpful count, Moderation Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={toneMap[review.status]} dot>
          {review.status}
        </Badge>
        <span className="text-xs text-ink-muted">
          {review.helpful} found helpful
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsReplying((prev) => !prev)}
            className="cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            <span>Reply</span>
          </Button>

          {review.status !== 'published' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                onUpdateStatus(review.id, 'published', 'Review published')
              }
              className="cursor-pointer"
            >
              Approve
            </Button>
          )}

          {review.status === 'published' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onUpdateStatus(review.id, 'hidden', 'Review hidden')}
              className="cursor-pointer"
            >
              Hide
            </Button>
          )}

          {review.status === 'pending' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                onUpdateStatus(review.id, 'rejected', 'Review rejected')
              }
              className="cursor-pointer text-danger hover:text-danger hover:bg-danger/10"
            >
              Reject
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
