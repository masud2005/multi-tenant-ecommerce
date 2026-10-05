import React from 'react';
import { testimonials } from '@/data/content';

export function Testimonials() {
  return (
    <section
      className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="t-h"
    >
      <h2 id="t-h" className="sr-only">
        What customers say
      </h2>
      <div className="grid gap-12 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="border-l-2 border-clay pl-5">
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
