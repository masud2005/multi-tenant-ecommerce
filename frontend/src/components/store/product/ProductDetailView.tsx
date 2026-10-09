'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  HeartIcon,
  Share2Icon,
  TruckIcon,
  RotateCcwIcon,
  BellIcon,
  MinusIcon,
  PlusIcon,
  ChevronDownIcon,
  TagIcon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { sizeGuide } from '@/data/products';
import { districts, deliveryEstimate, shippingMethods } from '@/data/shipping';
import { VariantPicker } from './VariantPicker';
import { ProductCard } from './ProductCard';
import { ProductReviews } from './ProductReviews';
import { SectionHeading } from '@/components/store/shared/SectionHeading';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Rating } from '@/components/ui/Rating';
import { Input } from '@/components/ui/Input';
import { available, discountPercent, variantPrice } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';
import { cn } from '@/lib/utils';

const galleryPositions = [
  'object-center',
  'object-top scale-[1.35] origin-top',
  'object-bottom scale-[1.5] origin-center',
];

export function ProductDetailView({ slug }: { slug: string }) {
  const {
    products,
    addToCart,
    setMiniCartOpen,
    wishlist,
    toggleWishlist,
    trackView,
    recentlyViewed,
  } = useStore();

  const product = products.find(
    (p) => p.slug === slug && p.status === 'published'
  );
  const [image, setImage] = useState(0);
  const [color, setColor] = useState('');
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState<null | 'stock' | 'price'>(null);
  const [alertContact, setAlertContact] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [openSection, setOpenSection] = useState<string | null>('details');

  // Auto-initialize color & size on load
  useEffect(() => {
    if (!product) return;

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
    setQty(1);
    setImage(0);
    trackView(product.id);
  }, [product, trackView]);

  // Robust variant resolution
  const variant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return undefined;

    if (size) {
      // 1. Match both color and size (case-insensitive & trimmed)
      const exact = product.variants.find(
        (v) =>
          v.color?.trim().toLowerCase() === color?.trim().toLowerCase() &&
          v.size?.trim().toLowerCase() === size?.trim().toLowerCase()
      );
      if (exact) return exact;

      // 2. Match size only
      const bySize = product.variants.find(
        (v) => v.size?.trim().toLowerCase() === size?.trim().toLowerCase()
      );
      if (bySize) return bySize;
    }

    // 3. Match color only
    if (color) {
      const byColor = product.variants.find(
        (v) => v.color?.trim().toLowerCase() === color?.trim().toLowerCase()
      );
      if (byColor) return byColor;
    }

    // 4. Default to first variant
    return product.variants[0];
  }, [product, color, size]);

  // Handle color change and keep size in sync
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setImage(0);
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

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-medium text-ink">
          Product Not Found
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          The item you are looking for might have been moved or is currently
          unavailable.
        </p>
        <div className="mt-6">
          <Button href="/shop" className="cursor-pointer">
            Return to shop
          </Button>
        </div>
      </div>
    );
  }

  const qtyAvailable = variant ? available(variant) : 0;
  const isOut = !!variant && !product.preorder && qtyAvailable === 0;
  const price = variant
    ? variantPrice(variant)
    : product.salePrice ?? product.price;
  const wished = wishlist.includes(product.id);
  const off = discountPercent(product);

  const related = products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.status === 'published' &&
        p.category === product.category
    )
    .slice(0, 4);
  const recent = recentlyViewed
    .filter((id) => id !== product.id)
    .map((id) => products.find((p) => p.id === id)!)
    .filter(Boolean)
    .slice(0, 4);
  const standard = shippingMethods[0];

  const add = () => {
    const targetVariant = variant || product.variants[0];
    if (!targetVariant) {
      setSizeError(true);
      toast.error('Please select a size');
      return;
    }
    setSizeError(false);
    addToCart(product.id, targetVariant.id, qty);
    toast.success(`${product.title} added to bag`);
    setMiniCartOpen(true);
  };

  const share = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {}
  };

  const sections = [
    {
      id: 'details',
      title: 'Description',
      body: <p>{product.description}</p>,
    },
    {
      id: 'specs',
      title: 'Specifications',
      body: (
        <dl className="grid grid-cols-[120px_1fr] gap-y-2">
          {product.specs.map((s) => (
            <React.Fragment key={s.label}>
              <dt className="text-ink-muted">{s.label}</dt>
              <dd className="text-ink">{s.value}</dd>
            </React.Fragment>
          ))}
          <dt className="text-ink-muted">SKU</dt>
          <dd className="font-mono text-xs leading-5 text-ink">
            {variant?.sku ?? product.variants[0]?.sku}
          </dd>
        </dl>
      ),
    },
    {
      id: 'shipping',
      title: 'Delivery & returns',
      body: (
        <div className="space-y-2">
          <p>
            Inside Dhaka ৳70 (free over ৳2,500) · 1–2 days. Outside Dhaka ৳130 ·
            3–5 days. Cash on delivery available.
          </p>
          <p>
            Easy 7-day returns on unworn items with tags.{' '}
            {product.subcategory === 'Sarees' ||
            product.subcategory === 'Jewellery'
              ? 'This item can only be returned if damaged.'
              : 'Free size exchange inside Dhaka.'}
          </p>
          <Link href="/policies/returns" className="underline text-clay">
            Read return policy
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 pb-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
        <ol className="flex flex-wrap gap-1.5">
          <li>
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={`/shop?category=${product.category}`}
              className="capitalize hover:text-ink"
            >
              {product.category}
            </Link>
          </li>
          {product.subcategory && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/shop?category=${product.category}&sub=${encodeURIComponent(
                    product.subcategory
                  )}`}
                  className="hover:text-ink"
                >
                  {product.subcategory}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink font-medium">
            {product.title}
          </li>
        </ol>
      </nav>

      {/* Main PDP Grid */}
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_440px] lg:gap-14">
        {/* Left: Gallery */}
        <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
          <div className="order-2 flex gap-2 sm:order-1 sm:flex-col">
            {product.images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImage(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={image === i}
                className={cn(
                  'overflow-hidden rounded border-2 cursor-pointer transition-colors',
                  image === i ? 'border-ink' : 'border-transparent'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80'}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80';
                  }}
                  className={cn(
                    'aspect-[3/4] w-16 object-cover sm:w-full bg-subtle',
                    galleryPositions[i]
                  )}
                />
              </button>
            ))}
          </div>
          <div className="relative order-1 overflow-hidden rounded-lg bg-subtle sm:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[image] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80'}
              alt={`${product.title} — ${color}`}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80';
              }}
              className={cn(
                'aspect-[3/4] w-full object-cover bg-subtle',
                galleryPositions[image]
              )}
            />
            {off > 0 && (
              <span className="absolute left-4 top-4 rounded bg-clay px-2 py-1 text-xs font-semibold text-white">
                −{off}%
              </span>
            )}
          </div>
        </div>

        {/* Right: Info & Purchase */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Link
            href={`/brands/${product.brand.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-sm text-ink-muted hover:text-ink"
          >
            {product.brand}
          </Link>
          <h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl text-ink">
            {product.title}
          </h1>
          <a
            href="#reviews"
            className="mt-2 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
          >
            <Rating value={product.rating} /> {product.rating} ·{' '}
            {product.reviewCount} reviews
          </a>

          <div className="mt-5 flex items-baseline gap-3">
            <span
              className={cn(
                'text-2xl font-semibold tabular-nums text-ink',
                product.salePrice && 'text-clay'
              )}
            >
              {formatBDT(price)}
            </span>
            {product.salePrice && (
              <span className="text-base text-ink-muted line-through tabular-nums">
                {formatBDT(product.price)}
              </span>
            )}
            {product.salePrice && (
              <span className="text-sm font-medium text-clay">
                Save {formatBDT(product.price - product.salePrice)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            VAT included. Use <b>EID500</b> for ৳500 off orders over ৳3,000.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-ink-soft">
            {product.shortDescription}
          </p>

          <div className="mt-6">
            <VariantPicker
              product={product}
              color={color}
              size={size}
              onColor={handleColorChange}
              onSize={(s) => {
                setSize(s);
                setSizeError(false);
                setQty(1);
              }}
              sizeError={sizeError}
              onSizeGuide={
                product.sizes.length > 1 &&
                ['women', 'men'].includes(product.category)
                  ? () => setGuideOpen(true)
                  : undefined
              }
            />
          </div>

          <div className="mt-4 min-h-[20px] text-sm" aria-live="polite">
            {product.preorder ? (
              <span className="text-info font-medium">
                Pre-order · ships from 10 October
              </span>
            ) : variant ? (
              isOut ? (
                <span className="text-danger font-medium">
                  Sold out in {variant.size}
                </span>
              ) : qtyAvailable <= 3 ? (
                <span className="font-medium text-warning">
                  Only {qtyAvailable} left in {variant.size}
                </span>
              ) : (
                <span className="text-success font-medium">
                  In stock — ready to ship
                </span>
              )
            ) : null}
          </div>

          <div className="mt-3 flex gap-2">
            {!isOut && (
              <div className="flex h-12 items-center rounded-md border border-line-strong bg-surface">
                <button
                  type="button"
                  className="px-3 disabled:opacity-40 cursor-pointer"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span
                  className="w-8 text-center tabular-nums font-medium text-ink"
                  aria-label="Quantity"
                >
                  {qty}
                </span>
                <button
                  type="button"
                  className="px-3 disabled:opacity-40 cursor-pointer"
                  onClick={() => setQty((q) => q + 1)}
                  disabled={
                    !!variant && !product.preorder && qty >= qtyAvailable
                  }
                  aria-label="Increase quantity"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            {isOut ? (
              <Button
                size="lg"
                variant="secondary"
                className="flex-1 cursor-pointer"
                onClick={() => setAlertOpen('stock')}
              >
                <BellIcon className="h-4 w-4" aria-hidden /> Notify me when back
              </Button>
            ) : (
              <Button
                size="lg"
                className="flex-1 cursor-pointer"
                onClick={add}
              >
                {product.preorder ? 'Pre-order now' : 'Add to bag'}
              </Button>
            )}
            <Button
              size="lg"
              variant="secondary"
              className="w-12 px-0 cursor-pointer"
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={wished}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <HeartIcon
                className={cn('h-5 w-5', wished && 'fill-clay text-clay')}
              />
            </Button>
          </div>

          <div className="mt-3 flex gap-4 text-xs text-ink-muted">
            <button
              type="button"
              onClick={() => setAlertOpen('price')}
              className="inline-flex items-center gap-1 hover:text-ink cursor-pointer"
            >
              <TagIcon className="h-3.5 w-3.5" aria-hidden /> Price drop alert
            </button>
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1 hover:text-ink cursor-pointer"
            >
              <Share2Icon className="h-3.5 w-3.5" aria-hidden /> Share
            </button>
          </div>

          {/* Delivery & Returns Info Card */}
          <div className="mt-6 rounded-lg border border-line bg-surface p-4 text-sm">
            <div className="flex items-start gap-3">
              <TruckIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted"
                aria-hidden
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-ink">
                  Delivery to
                  <select
                    aria-label="Delivery district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="rounded border-none bg-transparent font-medium underline underline-offset-2 focus:outline-none cursor-pointer"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-0.5 text-ink-muted">
                  {deliveryEstimate(district)} ·{' '}
                  {standard.price(district, price * qty) === 0
                    ? 'Free'
                    : formatBDT(standard.price(district, price * qty))}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3 border-t border-line pt-3">
              <RotateCcwIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted"
                aria-hidden
              />
              <p className="text-ink-muted">
                7-day easy returns & free size exchange in Dhaka
              </p>
            </div>
          </div>

          {/* Accordion Specs */}
          <div className="mt-6 divide-y divide-line border-y border-line">
            {sections.map((s) => (
              <div key={s.id}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenSection(openSection === s.id ? null : s.id)
                  }
                  aria-expanded={openSection === s.id}
                  className="flex w-full items-center justify-between py-4 text-sm font-medium text-ink cursor-pointer"
                >
                  {s.title}
                  <ChevronDownIcon
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      openSection === s.id && 'rotate-180'
                    )}
                    aria-hidden
                  />
                </button>
                {openSection === s.id && (
                  <div className="pb-5 text-sm leading-relaxed text-ink-soft">
                    {s.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <div className="mt-20 border-t border-line pt-12">
        <ProductReviews product={product} />
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="rel-h">
          <SectionHeading id="rel-h" title="You may also like" />
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recent.length > 0 && (
        <section className="mt-20" aria-labelledby="rv-h">
          <SectionHeading id="rv-h" title="Recently viewed" />
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {recent.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Size guide"
        description="Body measurements in inches. Between sizes? Size up for a relaxed fit."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {sizeGuide.headers.map((h) => (
                  <th key={h} className="py-2 font-medium text-ink">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizeGuide.rows.map((r) => (
                <tr key={r[0]} className="border-b border-line last:border-0">
                  {r.map((c, i) => (
                    <td
                      key={i}
                      className={cn(
                        'py-2 tabular-nums text-ink',
                        i === 0 && 'font-medium'
                      )}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Back in stock / Price alert Modal */}
      <Modal
        open={!!alertOpen}
        onClose={() => setAlertOpen(null)}
        title={
          alertOpen === 'stock'
            ? 'Get notified when it’s back'
            : 'Price drop alert'
        }
        description={
          alertOpen === 'stock'
            ? `We’ll let you know as soon as ${product.title} in ${color}${
                size ? `, ${size}` : ''
              } is back in stock.`
            : `We’ll message you if ${product.title} drops below ${formatBDT(
                price
              )}.`
        }
        footer={
          <Button
            onClick={() => {
              if (alertContact.trim().length < 6)
                return toast.error('Enter your email or phone number');
              setAlertOpen(null);
              setAlertContact('');
              toast.success('Alert set — we’ll be in touch.');
            }}
            className="cursor-pointer"
          >
            Notify me
          </Button>
        }
      >
        <Input
          label="Email or mobile number"
          value={alertContact}
          onChange={(e) => setAlertContact(e.target.value)}
          placeholder="01XXX-XXXXXX or you@example.com"
        />
      </Modal>
    </div>
  );
}
