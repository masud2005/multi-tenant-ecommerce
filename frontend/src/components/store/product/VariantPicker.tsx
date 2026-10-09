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
      {/* Color Selector */}
      {product.colors && product.colors.length > 0 && (
        <fieldset>
          <legend className="text-sm">
            <span className="text-ink-muted">Colour:</span>{' '}
            <span className="font-medium text-ink">{color || product.colors[0]?.name}</span>
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const isSelected =
                c.name.trim().toLowerCase() === (color || '').trim().toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onColor(c.name)}
                  aria-pressed={isSelected}
                  aria-label={c.name}
                  title={c.name}
                  className={cn(
                    'h-9 w-9 rounded-full border-2 p-0.5 transition-colors duration-150 cursor-pointer',
                    isSelected
                      ? 'border-ink ring-1 ring-ink/30'
                      : 'border-transparent hover:border-line-strong'
                  )}
                >
                  <span
                    className="block h-full w-full rounded-full border border-ink/10"
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Size Selector */}
      {!singleSize && (
        <fieldset>
          <div className="flex items-center justify-between">
            <legend className={cn('text-sm', sizeError && !size && 'text-danger font-medium')}>
              <span className={sizeError && !size ? 'text-danger' : 'text-ink-muted'}>Size:</span>{' '}
              <span className={cn('font-medium', sizeError && !size ? 'text-danger' : 'text-ink')}>
                {size ?? (sizeError ? 'Please select a size' : 'Select a size')}
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
              // Find variant for this size in the current color (case-insensitive)
              const v =
                product.variants.find(
                  (x) =>
                    x.color?.trim().toLowerCase() === (color || '').trim().toLowerCase() &&
                    x.size?.trim().toLowerCase() === s?.trim().toLowerCase()
                ) ||
                product.variants.find(
                  (x) => x.size?.trim().toLowerCase() === s?.trim().toLowerCase()
                );

              const qty = v ? available(v) : 0;
              const out = !product.preorder && (qty === 0 || !v?.enabled);
              const low = !out && !product.preorder && qty > 0 && qty <= 3;
              const isSelected =
                Boolean(size) && size?.trim().toLowerCase() === s?.trim().toLowerCase();

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSize(s)}
                  aria-pressed={isSelected}
                  aria-label={`${s}${
                    out ? ', sold out' : low ? `, only ${qty} left` : ''
                  }`}
                  className={cn(
                    'relative h-11 rounded-md border text-sm transition-colors duration-150 cursor-pointer font-medium',
                    isSelected
                      ? 'border-ink bg-ink text-canvas shadow-xs font-semibold'
                      : 'border-line-strong bg-surface hover:border-ink text-ink',
                    out &&
                      !isSelected &&
                      'text-ink-muted line-through decoration-ink-muted/60 bg-subtle/50'
                  )}
                >
                  {s}
                  {low && !isSelected && (
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
