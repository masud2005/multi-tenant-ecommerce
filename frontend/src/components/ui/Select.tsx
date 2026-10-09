import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[] | string[];
}

export function Select({ label, error, placeholder, options, className, id, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const isPlaceholderSelected = !rest.value;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error}
          className={cn(
            'h-10 w-full appearance-none rounded-md border bg-surface pl-3 pr-9 text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-clay/25 cursor-pointer',
            isPlaceholderSelected ? 'text-ink-muted/70' : 'text-ink',
            error ? 'border-danger' : 'border-line-strong focus:border-clay'
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled className="text-ink-muted">
              {placeholder}
            </option>
          )}
          {normalizedOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-ink">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
