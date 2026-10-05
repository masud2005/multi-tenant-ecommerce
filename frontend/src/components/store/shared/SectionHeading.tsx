import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';

export interface SectionHeadingProps {
  id?: string;
  title: string;
  subtitle?: string;
  link?: { to: string; label: string };
}

export function SectionHeading({ id, title, subtitle, link }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="font-display text-2xl sm:text-3xl text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {link && (
        <Link
          href={link.to}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ink hover:text-clay transition-colors"
        >
          {link.label}
          <ArrowRightIcon
            className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}
