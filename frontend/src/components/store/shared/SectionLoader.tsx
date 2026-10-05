import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

export interface SectionLoaderProps {
  label?: string;
  height?: string;
  className?: string;
}

export function SectionLoader({
  label = 'Loading collection...',
  height = 'h-48',
  className,
}: SectionLoaderProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center py-10 transition-opacity duration-300',
        height,
        className
      )}
    >
      <LoadingSpinner size="md" label={label} />
    </div>
  );
}
