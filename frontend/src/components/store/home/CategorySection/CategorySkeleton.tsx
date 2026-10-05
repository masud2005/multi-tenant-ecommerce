import React from 'react';

export function CategorySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="scrollbar-none -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-40 shrink-0 sm:w-auto animate-pulse">
          <div className="aspect-[4/5] w-full rounded-md bg-subtle border border-line/60" />
          <div className="mt-3 h-4 w-3/4 rounded bg-subtle" />
          <div className="mt-1.5 h-3 w-1/2 rounded bg-subtle/70" />
        </div>
      ))}
    </div>
  );
}
