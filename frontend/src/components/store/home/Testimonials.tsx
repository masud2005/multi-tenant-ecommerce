'use client';

import React, { useEffect, useState } from 'react';
import { reviewService } from '@/services/review-service';

export function Testimonials() {
  const [reviews, setReviews] = useState<
    { name: string; location: string; quote: string }[]
  >([]);

  useEffect(() => {
    let mounted = true;
    reviewService
      .getStoreReviews({ page: 1, limit: 6 })
      .then((res) => {
        if (!mounted) return;
        if (res?.data?.reviews && res.data.reviews.length > 0) {
          setReviews(
            res.data.reviews.map((r) => ({
              name: r.author || 'Verified Customer',
              location:
                r.size ||
                (r.product?.title ? `Purchased ${r.product.title}` : 'Verified Buyer'),
              quote: r.body,
            }))
          );
        }
      })
      .catch(() => {
        if (mounted) setReviews([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section
      className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="t-h"
    >
      <h2 id="t-h" className="sr-only">
        What customers say
      </h2>
      <div className="grid gap-12 md:grid-cols-3">
        {reviews.map((t, idx) => (
          <figure key={`${t.name}-${idx}`} className="border-l-2 border-clay pl-5">
            <blockquote className="font-display text-xl leading-snug text-ink">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-medium text-ink">{t.name}</span>{' '}
              <span className="text-ink-muted">· {t.location}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// Alias for backward-compatibility
export const TestimonialsSection = Testimonials;
