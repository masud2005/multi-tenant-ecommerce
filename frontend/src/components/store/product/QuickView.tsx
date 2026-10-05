'use client';

import React, { useEffect, useState } from 'react';
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
      setColor(product.colors[0].name);
      setSize(product.sizes.length === 1 ? product.sizes[0] : null);
      setSizeError(false);
    }
  }, [product]);

  if (!product)
    return <Modal open={false} onClose={() => setQuickViewId(null)} />;
  const variant = size
    ? product.variants.find((v) => v.color === color && v.size === size)
    : undefined;
  const out = variant && !product.preorder && available(variant) === 0;

  const add = () => {
    if (!variant) {
      setSizeError(true);
      return;
    }
    addToCart(product.id, variant.id);
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
              onColor={setColor}
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
