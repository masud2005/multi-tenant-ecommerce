'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalItems?: number;
  pageSize?: number;
  showItemCount?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  totalItems,
  pageSize,
  showItemCount = true,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers with ellipsis (e.g. 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis-prev' | 'ellipsis-next')[] = [];
    const delta = 1; // Number of pages around current page

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (left > 2) {
      pages.push('ellipsis-prev');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push('ellipsis-next');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const startItem = totalItems !== undefined && pageSize !== undefined
    ? (currentPage - 1) * pageSize + 1
    : null;
  const endItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min(currentPage * pageSize, totalItems)
    : null;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 pb-4',
        className
      )}
      aria-label="Pagination Navigation"
    >
      {/* Information text (e.g. Showing 1-12 of 48 products) */}
      {showItemCount && totalItems !== undefined && startItem && endItem ? (
        <p className="text-xs text-ink-muted">
          Showing <span className="font-medium text-ink tabular-nums">{startItem}–{endItem}</span> of{' '}
          <span className="font-medium text-ink tabular-nums">{totalItems}</span> products
        </p>
      ) : (
        <div className="hidden sm:block" />
      )}

      {/* Page controls */}
      <nav className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-2xs">
        {/* Previous page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className={cn(
            'inline-flex h-9 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer',
            currentPage <= 1
              ? 'opacity-40 cursor-not-allowed text-ink-muted'
              : 'hover:bg-subtle text-ink'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === 'ellipsis-prev' || p === 'ellipsis-next') {
              return (
                <span
                  key={`${p}-${idx}`}
                  className="inline-flex h-9 w-9 items-center justify-center text-ink-muted select-none"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors cursor-pointer tabular-nums',
                  isCurrent
                    ? 'bg-ink text-canvas shadow-xs font-semibold'
                    : 'text-ink hover:bg-subtle'
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className={cn(
            'inline-flex h-9 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer',
            currentPage >= totalPages
              ? 'opacity-40 cursor-not-allowed text-ink-muted'
              : 'hover:bg-subtle text-ink'
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}

