'use client';

import React from 'react';
import type { Product } from '@/types/commerce';
import { available } from '@/utils/pricing';
import { cn } from '@/utils/cn';

export interface VariantPickerProps {
  product: Product;
  color: string;
  size: string | null;
  onColor: (c: string) => void;
  onSize: (s: string) => void;
  sizeError?: boolean;
  onSizeGuide?: () => void;
}

export function VariantPicker({
  product,
  color,
  size,
  onColor,
  onSize,
  sizeError,
  onSizeGuide,
}: VariantPickerProps) {
  const singleSize = product.sizes.length === 1;

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm">
          <span className="text-ink-muted">Colour:</span>{' '}
          <span className="font-medium text-ink">{color}</span>
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {product.colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => onColor(c.name)}
              aria-pressed={c.name === color}
              aria-label={c.name}
              title={c.name}
              className={cn(
                'h-9 w-9 rounded-full border-2 p-0.5 transition-colors duration-150 cursor-pointer',
                c.name === color
                  ? 'border-ink'
                  : 'border-transparent hover:border-line-strong'
              )}
            >
              <span
                className="block h-full w-full rounded-full border border-ink/10"
                style={{ backgroundColor: c.hex }}
              />
            </button>
          ))}
        </div>
      </fieldset>
      {!singleSize && (
        <fieldset>
          <div className="flex items-center justify-between">
            <legend className={cn('text-sm', sizeError && 'text-danger')}>
              <span className={sizeError ? '' : 'text-ink-muted'}>Size:</span>{' '}
              <span className="font-medium text-ink">
                {size ?? (sizeError ? 'Please select a size' : 'Select')}
              </span>
            </legend>
            {onSizeGuide && (
              <button
                type="button"
                onClick={onSizeGuide}
                className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink cursor-pointer"
              >
                Size guide
              </button>
            )}
          </div>
          <div className="mt-2.5 grid grid-cols-5 gap-2">
            {product.sizes.map((s) => {
              const v = product.variants.find(
                (x) => x.color === color && x.size === s
              );
              const qty = v ? available(v) : 0;
              const out = !product.preorder && (qty === 0 || !v?.enabled);
              const low = !out && !product.preorder && qty <= 3;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSize(s)}
                  aria-pressed={size === s}
                  aria-label={`${s}${
                    out ? ', sold out' : low ? `, only ${qty} left` : ''
                  }`}
                  className={cn(
                    'relative h-11 rounded-md border text-sm transition-colors duration-150 cursor-pointer font-medium',
                    size === s
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line-strong bg-surface hover:border-ink text-ink',
                    out &&
                      size !== s &&
                      'text-ink-muted line-through decoration-ink-muted/60'
                  )}
                >
                  {s}
                  {low && size !== s && (
                    <span
                      className="absolute -top-1 right-1 h-1.5 w-1.5 rounded-full bg-warning"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
