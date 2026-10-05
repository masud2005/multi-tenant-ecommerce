'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  BadgeCheckIcon,
  FlagIcon,
  ThumbsUpIcon,
  StarIcon,
  CameraIcon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import type { Product } from '@/types/commerce';
import { Rating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

export function ProductReviews({ product }: { product: Product }) {
  const { reviews, updateReview, addReview, user } = useStore();
  const [filter, setFilter] = useState<number | 'photos' | null>(null);
  const [sort, setSort] = useState<'helpful' | 'newest'>('helpful');
  const [voted, setVoted] = useState<string[]>([]);
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: '', body: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const published = reviews.filter(
    (r) => r.productId === product.id && r.status === 'published'
  );
  const dist = [5, 4, 3, 2, 1].map((s) => ({
    s,
    n: published.filter((r) => r.rating === s).length,
  }));
  const totalForBars = Math.max(1, published.length);

  const list = useMemo(() => {
    let l = published;
    if (filter === 'photos') l = l.filter((r) => r.photos.length);
    else if (filter) l = l.filter((r) => r.rating === filter);
    return [...l].sort((a, b) =>
      sort === 'helpful'
        ? b.helpful - a.helpful
        : b.date.localeCompare(a.date)
    );
  }, [published, filter, sort]);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!form.rating) e.rating = 'Choose a rating';
    if (form.title.trim().length < 3) e.title = 'Add a short title';
    if (form.body.trim().length < 20)
      e.body = 'Tell us a bit more (at least 20 characters)';
    setErrors(e);
    if (Object.keys(e).length) return;
    addReview({
      productId: product.id,
      productTitle: product.title,
      author: user
        ? `${user.name.split(' ')[0]} ${user.name.split(' ')[1]?.[0] ?? ''}.`
        : 'Guest',
      rating: form.rating,
      title: form.title,
      body: form.body,
      verified: !!user,
      photos: [],
    });
    setWriting(false);
    setForm({ rating: 0, title: '', body: '' });
    toast.success('Thanks! Your review will appear once approved.');
  };

  return (
    <section id="reviews" aria-labelledby="reviews-h" className="scroll-mt-32">
      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <h2 id="reviews-h" className="font-display text-2xl text-ink">
            Reviews
          </h2>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-ink">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-sm text-ink-muted">
              / 5 · {product.reviewCount} reviews
            </span>
          </div>
          <Rating value={product.rating} size="md" className="mt-1" />
          <ul className="mt-5 space-y-1.5">
            {dist.map(({ s, n }) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setFilter(filter === s ? null : s)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-subtle cursor-pointer transition-colors text-ink',
                    filter === s && 'bg-subtle'
                  )}
                >
                  <span className="w-3 tabular-nums">{s}</span>
                  <StarIcon className="h-3 w-3 fill-ink text-ink" aria-hidden />
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <span
                      className="block h-full bg-ink"
                      style={{ width: `${(n / totalForBars) * 100}%` }}
                    />
                  </span>
                  <span className="w-5 text-right tabular-nums text-ink-muted">
                    {n}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            className="mt-6 cursor-pointer"
            fullWidth
            onClick={() => setWriting(true)}
          >
            Write a review
          </Button>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
            <button
              type="button"
              onClick={() => setFilter(null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors',
                filter === null
                  ? 'border-ink bg-ink text-canvas font-medium'
                  : 'border-line-strong hover:border-ink text-ink'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('photos')}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors',
                filter === 'photos'
                  ? 'border-ink bg-ink text-canvas font-medium'
                  : 'border-line-strong hover:border-ink text-ink'
              )}
            >
              <CameraIcon className="h-3 w-3" aria-hidden /> With photos
            </button>
            <select
              aria-label="Sort reviews"
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as 'helpful' | 'newest')
              }
              className="ml-auto h-8 rounded-md border border-line-strong bg-surface px-2 text-xs text-ink focus:border-clay focus:outline-none"
            >
              <option value="helpful">Most helpful</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          {list.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">
              No reviews match this filter yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Rating value={r.rating} />
                    <span className="text-sm font-medium text-ink">{r.title}</span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                    {r.author} · {formatDate(r.date)}
                    {r.size && <span>· Size {r.size}</span>}
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 text-success font-medium">
                        <BadgeCheckIcon className="h-3.5 w-3.5" aria-hidden />{' '}
                        Verified purchase
                      </span>
                    )}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {r.body}
                  </p>
                  {r.photos.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {r.photos.map((ph, i) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          key={i}
                          src={ph}
                          alt={`Photo from ${r.author}`}
                          className="h-20 w-16 rounded object-cover border border-line"
                        />
                      ))}
                    </div>
                  )}
                  {r.reply && (
                    <div className="mt-4 rounded-md bg-subtle px-4 py-3 text-sm">
                      <p className="text-xs font-medium text-ink">Reply from Tanti</p>
                      <p className="mt-1 text-ink-soft">{r.reply}</p>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
                    <button
                      type="button"
                      disabled={voted.includes(r.id)}
                      onClick={() => {
                        updateReview(r.id, { helpful: r.helpful + 1 });
                        setVoted((v) => [...v, r.id]);
                      }}
                      className="inline-flex items-center gap-1 hover:text-ink disabled:text-success cursor-pointer"
                    >
                      <ThumbsUpIcon className="h-3.5 w-3.5" aria-hidden /> Helpful (
                      {r.helpful})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateReview(r.id, { reported: true });
                        toast('Thanks — our team will review this.');
                      }}
                      className="inline-flex items-center gap-1 hover:text-ink cursor-pointer"
                    >
                      <FlagIcon className="h-3.5 w-3.5" aria-hidden /> Report
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={writing}
        onClose={() => setWriting(false)}
        title="Write a review"
        description={product.title}
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setWriting(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={submit} className="cursor-pointer">
              Submit review
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink">
              Your rating
            </legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, rating: s })}
                  aria-label={`${s} stars`}
                  aria-pressed={form.rating === s}
                  className="cursor-pointer"
                >
                  <StarIcon
                    className={cn(
                      'h-7 w-7 transition-colors',
                      s <= form.rating
                        ? 'fill-ink text-ink'
                        : 'text-line-strong'
                    )}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="mt-1 text-xs text-danger">{errors.rating}</p>
            )}
          </fieldset>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            error={errors.title}
            placeholder="Sum it up in a few words"
          />
          <Textarea
            label="Review"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            error={errors.body}
            placeholder="How was the fit, fabric and quality?"
          />
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong py-4 text-sm text-ink-muted hover:border-ink hover:text-ink cursor-pointer transition-colors"
          >
            <CameraIcon className="h-4 w-4" aria-hidden /> Add photos or a video (optional)
          </button>
          {!user && (
            <p className="text-xs text-ink-muted">
              Reviews from signed-in customers who bought this item get a “Verified
              purchase” badge.
            </p>
          )}
        </div>
      </Modal>
    </section>
  );
}
