import React from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RadioCardProps {
  checked: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  row?: boolean;
  className?: string;
}

export function RadioCard({
  checked,
  onSelect,
  children,
  row,
  className,
}: RadioCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-md border bg-surface p-4 text-left transition-colors duration-150 cursor-pointer',
        checked ? 'border-ink ring-1 ring-ink' : 'border-line-strong hover:border-ink/50',
        row && 'flex items-center gap-4',
        className
      )}
    >
      {!row && checked && (
        <CheckIcon className="absolute right-3 top-3 h-4 w-4" aria-hidden />
      )}
      {row && (
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
            checked ? 'border-ink' : 'border-line-strong'
          )}
        >
          {checked && <span className="h-2 w-2 rounded-full bg-ink" />}
        </span>
      )}
      {children}
    </button>
  );
}
