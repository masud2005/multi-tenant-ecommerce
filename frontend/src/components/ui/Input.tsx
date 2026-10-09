import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
}

export function Input({ label, hint, error, prefix, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'h-10 w-full rounded-md border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/50 placeholder:font-normal transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-clay/25',
            error ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-clay',
            prefix && 'pl-8'
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
