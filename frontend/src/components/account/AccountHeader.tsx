import React from 'react';

export function AccountHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
