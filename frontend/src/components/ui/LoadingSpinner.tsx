import React from 'react';
import { cn } from '@/utils/cn';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  spinnerClassName?: string;
}

const sizeClasses = {
  xs: 'h-4 w-4 border-[1.5px]',
  sm: 'h-5 w-5 border-2',
  md: 'h-7 w-7 border-2',
  lg: 'h-10 w-10 border-[2.5px]',
};

export function LoadingSpinner({
  size = 'md',
  label,
  className,
  spinnerClassName,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2.5', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-clay/20 border-t-clay',
          sizeClasses[size],
          spinnerClassName
        )}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <p className="text-xs font-medium tracking-wide text-ink-muted select-none">
          {label}
        </p>
      )}
    </div>
  );
}
