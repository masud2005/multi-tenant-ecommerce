import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush,
}: PanelProps) {
  return (
    <section className={cn('min-w-0 rounded-lg border border-line bg-surface', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 sm:px-5 py-3 sm:py-3.5">
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-sm font-semibold text-ink truncate">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-ink-muted break-words">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && 'p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
