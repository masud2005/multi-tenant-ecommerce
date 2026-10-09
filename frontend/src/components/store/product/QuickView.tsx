'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/Rating';
import { VariantPicker } from './VariantPicker';
import { available, variantPrice } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';

export function QuickView() {
  const { quickViewId, setQuickViewId, products, addToCart, setMiniCartOpen } =
    useStore();
  const product = products.find((p) => p.id === quickViewId);
  const [color, setColor] = useState('');
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    if (product) {
      const initialColor = product.colors[0]?.name || '';
      setColor(initialColor);

      // Find available size for this color or default to first size
      const matchingVariants = product.variants.filter(
        (v) => v.color?.trim().toLowerCase() === initialColor.trim().toLowerCase()
      );
      const firstInStockSize =
        matchingVariants.find((v) => available(v) > 0)?.size ||
        matchingVariants[0]?.size ||
        product.sizes[0] ||
        null;

      setSize(firstInStockSize);
      setSizeError(false);
    }
  }, [product]);

  // Robust variant matching
  const variant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return undefined;

    if (size) {
      const exact = product.variants.find(
        (v) =>
          v.color?.trim().toLowerCase() === color?.trim().toLowerCase() &&
          v.size?.trim().toLowerCase() === size?.trim().toLowerCase()
      );
      if (exact) return exact;

      const bySize = product.variants.find(
        (v) => v.size?.trim().toLowerCase() === size?.trim().toLowerCase()
      );
      if (bySize) return bySize;
    }

    if (color) {
      const byColor = product.variants.find(
        (v) => v.color?.trim().toLowerCase() === color?.trim().toLowerCase()
      );
      if (byColor) return byColor;
    }

    return product.variants[0];
  }, [product, color, size]);

  if (!product)
    return <Modal open={false} onClose={() => setQuickViewId(null)} />;

  const qtyAvailable = variant ? available(variant) : 0;
  const out = variant && !product.preorder && qtyAvailable === 0;

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setSizeError(false);

    if (product) {
      const hasCurrentSize = product.variants.some(
        (v) =>
          v.color?.trim().toLowerCase() === newColor.trim().toLowerCase() &&
          v.size?.trim().toLowerCase() === (size || '').trim().toLowerCase()
      );

      if (!hasCurrentSize) {
        const matching = product.variants.filter(
          (v) => v.color?.trim().toLowerCase() === newColor.trim().toLowerCase()
        );
        const newSize =
          matching.find((v) => available(v) > 0)?.size ||
          matching[0]?.size ||
          product.sizes[0] ||
          null;
        setSize(newSize);
      }
    }
  };

  const add = () => {
    const targetVariant = variant || product.variants[0];
    if (!targetVariant) {
      setSizeError(true);
      toast.error('Please select a size');
      return;
    }
    setSizeError(false);
    addToCart(product.id, targetVariant.id);
    setQuickViewId(null);
    toast.success(`${product.title} added to bag`);
    setMiniCartOpen(true);
  };

  return (
    <Modal
      open={!!quickViewId}
      onClose={() => setQuickViewId(null)}
      size="xl"
      bare
    >
      <div className="grid md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.title}
          className="aspect-[3/4] h-full w-full object-cover"
        />
        <div className="flex flex-col p-6 md:p-8">
          <p className="text-xs text-ink-muted">{product.brand}</p>
          <h2 className="mt-1 font-display text-2xl text-ink">{product.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
            <Rating value={product.rating} /> {product.rating} ·{' '}
            {product.reviewCount} reviews
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums text-ink">
              {formatBDT(
                variant
                  ? variantPrice(variant)
                  : product.salePrice ?? product.price
              )}
            </span>
            {product.salePrice && (
              <span className="text-sm text-ink-muted line-through">
                {formatBDT(product.price)}
              </span>
            )}
          </div>
          <p className="mt-4 text-sm text-ink-soft">{product.shortDescription}</p>
          <div className="mt-6">
            <VariantPicker
              product={product}
              color={color}
              size={size}
              onColor={handleColorChange}
              onSize={(s) => {
                setSize(s);
                setSizeError(false);
              }}
              sizeError={sizeError}
            />
          </div>
          <div className="mt-auto space-y-2 pt-8">
            <Button
              size="lg"
              fullWidth
              onClick={add}
              disabled={!!out}
              className="cursor-pointer"
            >
              {out
                ? 'Sold out'
                : product.preorder
                ? 'Pre-order'
                : 'Add to bag'}
            </Button>
            <Link
              href={`/products/${product.slug}`}
              onClick={() => setQuickViewId(null)}
              className="block text-center text-sm text-ink-soft underline underline-offset-4 hover:text-ink cursor-pointer"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
