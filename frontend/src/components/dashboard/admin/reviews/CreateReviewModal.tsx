'use client';


import { asApiError } from '@/lib/api-error';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Star, X, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reviewService } from '@/services/review-service';
import { productService } from '@/services/product-service';
import type { Review, CreateOwnerReviewPayload } from '@/types/review';
import { cn } from '@/utils/cn';

interface CreateReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newReview: Review) => void;
}

export function CreateReviewModal({
  open,
  onClose,
  onSuccess,
}: CreateReviewModalProps) {
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [locationOrSize, setLocationOrSize] = useState('');
  const [productId, setProductId] = useState('');
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState<'PUBLISHED' | 'HIDDEN'>('PUBLISHED');
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoadingProducts(true);
      try {
        const list = await productService.getProducts();
        if (!cancelled) {
          setProducts(
            (list || []).map((p) => ({
              id: p.id,
              title: p.title,
            })),
          );
        }
      } catch (err) {
        console.warn('Failed to load products for review modal:', err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Please select a product for this review.');
      return;
    }
    if (!author.trim()) {
      toast.error('Please enter the reviewer name.');
      return;
    }
    if (!body.trim() || body.trim().length < 5) {
      toast.error('Please provide review feedback (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateOwnerReviewPayload = {
        author: author.trim(),
        rating,
        body: body.trim(),
        productId,
        size: locationOrSize.trim() || undefined,
        verified,
        status,
      };

      const res = await reviewService.createOwnerReview(payload);
      if (res?.data) {
        toast.success('Review created successfully');
        onSuccess(res.data);
        onClose();
        setAuthor('');
        setRating(5);
        setBody('');
        setLocationOrSize('');
        setProductId('');
        setVerified(false);
        setStatus('PUBLISHED');
      } else {
        toast.error('Failed to create review.');
      }
    } catch (err: unknown) {
      console.error('Error creating review:', err);
      toast.error(asApiError(err).message || 'Failed to create review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Add Customer Review
              </h3>
              <p className="text-xs text-ink-muted">
                Attach feedback to a specific product
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-subtle hover:text-ink cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={loadingProducts}
              className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              <option value="">
                {loadingProducts ? 'Loading products…' : 'Select a product'}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Customer / Reviewer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Ayesha Siddiqua"
              className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Star Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                >
                  <Star
                    className={cn(
                      'h-6 w-6 transition-colors',
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300 dark:text-stone-700',
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-ink">
                {rating}.0 out of 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Review Content <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the customer feedback..."
              className="w-full rounded-xl border border-line bg-canvas p-3 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Location / Tagline
            </label>
            <input
              type="text"
              value={locationOrSize}
              onChange={(e) => setLocationOrSize(e.target.value)}
              placeholder="e.g. Gulshan, Dhaka"
              className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-subtle/50 p-3.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="h-4 w-4 rounded border-line text-ink focus:ring-ink"
              />
              <span>Mark as verified</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink">Status:</span>
              <select
                value={status}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'PUBLISHED' || value === 'HIDDEN') setStatus(value);
                }}
                className="rounded-lg border border-line bg-surface px-2 py-1 text-xs font-semibold text-ink focus:border-ink focus:outline-none"
              >
                <option value="PUBLISHED">Published</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="cursor-pointer gap-2">
              <Plus className="h-4 w-4" />
              {submitting ? 'Saving…' : 'Save Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
