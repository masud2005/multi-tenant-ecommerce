import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href?: string; to?: string; label: string };
  meta?: React.ReactNode;
}

export function PageHeader({ title, description, actions, back, meta }: PageHeaderProps) {
  const backHref = back?.href || back?.to;
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-ink cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> {back?.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-ink">{title}</h1>
            {meta}
          </div>
          {description && <p className="mt-1 text-xs sm:text-sm text-ink-muted break-words">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 justify-start sm:justify-end">{actions}</div>}
      </div>
    </div>
  );
}
