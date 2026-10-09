'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronLeftIcon,
  CameraIcon,
  XIcon,
  CheckIcon,
  Loader2,
  AlertCircle,
  Package,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { orderService } from '@/services/order-service';
import { returnService } from '@/services/return-service';
import { returnReasons } from '@/data/orders';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { formatBDT } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Order } from '@/types/commerce';

const steps = ['Select Items', 'Reason & Photos', 'Exchange Option', 'Review & Submit'];

interface ReturnWizardPageProps {
  params: Promise<{ number: string }>;
}

export default function ReturnRequestWizardPage({ params }: ReturnWizardPageProps) {
  const { number } = use(params);
  const router = useRouter();
  const { orders: storeOrders, user } = useStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [reason, setReason] = useState(returnReasons[0]);
  const [details, setDetails] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [exchangeSize, setExchangeSize] = useState('L');
  const [exchangeNote, setExchangeNote] = useState('');
  const [error, setError] = useState('');

  // Load Order details from backend API (or store cache)
  const fetchOrder = useCallback(async () => {
    setIsLoadingOrder(true);
    try {
      const found = storeOrders.find(
        (o) => o.number === number || o.id === number,
      );
      if (found) {
        setOrder(found);
      }

      const res = await orderService.getOrderDetail(number);
      if (res?.data) {
        setOrder(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch order detail:', err);
    } finally {
      setIsLoadingOrder(false);
    }
  }, [number, storeOrders]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Pre-select first item once order is loaded
  useEffect(() => {
    if (order && order.items.length > 0 && selectedIndices.length === 0) {
      setSelectedIndices([0]);
    }
  }, [order]);

  if (isLoadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-clay mb-2" />
        <p className="text-sm text-ink-muted">Loading order #{number}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <div className="h-12 w-12 rounded-full bg-subtle flex items-center justify-center mx-auto text-ink-muted">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl">Order not found</h2>
        <p className="text-sm text-ink-muted">
          We couldn&apos;t find order #{number} to request a return or exchange for.
        </p>
        <Button href="/account/orders" variant="secondary">
          Back to My Orders
        </Button>
      </div>
    );
  }

  const selectedItems = selectedIndices
    .map((idx) => order.items[idx])
    .filter(Boolean);

  const amount = selectedItems.reduce((s, i) => s + i.price * i.qty, 0);
  const needsPhotos =
    reason === 'Damaged / defective' || reason === 'Wrong item received';

  // Toggle item selection
  const toggleItemIndex = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  // Add dummy/uploaded photo
  const handleAddPhoto = () => {
    if (photoUrls.length >= 4) return;
    const samplePhotos = [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
    ];
    const nextPhoto = samplePhotos[photoUrls.length % samplePhotos.length];
    setPhotoUrls((prev) => [...prev, nextPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    setError('');

    if (step === 0 && selectedIndices.length === 0) {
      setError('Please select at least one item to return or exchange.');
      return;
    }

    if (step === 1 && needsPhotos && photoUrls.length === 0) {
      setError('Please attach at least one photo showing the issue.');
      return;
    }

    // Submit Step
    if (step === 3) {
      setIsSubmitting(true);
      try {
        const fullDetails = [
          details ? `Issue: ${details}` : '',
          exchangeSize ? `Preferred replacement size: ${exchangeSize}` : '',
          exchangeNote ? `Exchange note: ${exchangeNote}` : '',
        ]
          .filter(Boolean)
          .join(' · ');

        const payload = {
          orderId: order.id || order.number,
          customerName: user?.name || order.customerName || 'Customer',
          reason,
          details: fullDetails,
          photos: photoUrls,
          resolution: 'EXCHANGE',
          items: selectedItems.map((item) => ({
            title: item.title,
            image: item.image || undefined,
            qty: item.qty || 1,
            price: item.price || 0,
            size: item.size || undefined,
            color: item.color || undefined,
          })),
        };

        const res = await returnService.createCustomerReturn(payload);

        if (res?.data || res?.success) {
          toast.success(
            `Return & exchange request #${res?.data?.id?.slice(0, 8) || 'R-100'} submitted successfully!`,
          );
          router.push('/account/returns');
        } else {
          throw new Error(res?.message || 'Could not submit request');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to submit request. Please try again.');
        setError(err?.message || 'Failed to submit request');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setStep((s) => s + 1);
  };

  return (
    <div className="max-w-2xl">
      <Link
        href={`/account/orders/${order.number}`}
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden /> Back to Order {order.number}
      </Link>

      <h1 className="mt-4 font-display text-3xl text-ink">Return & Exchange</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Items can be returned for size or product exchange within 7 days of delivery.
      </p>

      {/* Progress Steps Header */}
      <ol className="mt-8 flex items-center gap-2" aria-label="Progress">
        {steps.map((s, i) => (
          <li
            key={s}
            className="flex flex-1 items-center gap-2"
            aria-current={i === step ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i < step
                  ? 'bg-ink text-canvas'
                  : i === step
                  ? 'border-2 border-clay bg-surface text-clay font-bold'
                  : 'border border-line-strong text-ink-muted',
              )}
            >
              {i < step ? <CheckIcon className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm sm:inline',
                i === step ? 'font-semibold text-ink' : 'text-ink-muted',
              )}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>

      {/* Step Content Container */}
      <div className="mt-8 rounded-lg border border-line bg-surface p-6 shadow-xs">
        {/* Step 0: Item Selection */}
        {step === 0 && (
          <fieldset>
            <legend className="text-sm font-semibold text-ink">
              Which items would you like to exchange/return?
            </legend>
            <ul className="mt-4 space-y-3">
              {order.items.map((i, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                  <li
                    key={idx}
                    onClick={() => toggleItemIndex(idx)}
                    className={cn(
                      'flex items-center gap-4 rounded-lg border p-3.5 cursor-pointer transition-colors',
                      isSelected
                        ? 'border-clay bg-clay-soft/20 ring-1 ring-clay'
                        : 'border-line hover:border-line-strong bg-surface',
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleItemIndex(idx)}
                      ariaLabel={`Select ${i.title}`}
                    />
                    {i.image ? (
                      <img
                        src={i.image}
                        alt=""
                        className="h-16 w-12 rounded object-cover border border-line"
                      />
                    ) : (
                      <div className="h-16 w-12 rounded bg-canvas border border-line flex items-center justify-center text-xs text-ink-muted">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-ink">{i.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {[i.color, i.size].filter(Boolean).join(' / ') || 'Standard'} · Qty{' '}
                        {i.qty} · {formatBDT(i.price)}
                      </p>
                    </div>
                    <span className="font-semibold text-ink tabular-nums">
                      {formatBDT(i.price * i.qty)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}

        {/* Step 1: Reason & Photos */}
        {step === 1 && (
          <div className="space-y-5">
            <Select
              label="Reason for return / exchange"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={returnReasons}
            />
            <Textarea
              label="Tell us more about the issue (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Size 41 was too tight, looking to get size 42 instead."
              rows={3}
            />
            <div>
              <p className="text-sm font-medium text-ink">
                Photos{' '}
                {needsPhotos ? (
                  <span className="text-red-500 font-semibold">(required for this reason)</span>
                ) : (
                  <span className="font-normal text-ink-muted">(optional, helps expedite review)</span>
                )}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {photoUrls.map((photo, i) => (
                  <div
                    key={i}
                    className="relative h-20 w-20 overflow-hidden rounded-md border border-line bg-canvas group"
                  >
                    <img
                      src={photo}
                      alt={`Issue photo ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-white hover:bg-red-600 transition-colors cursor-pointer"
                      aria-label="Remove photo"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photoUrls.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong text-xs text-ink-muted hover:border-clay hover:text-clay transition-colors cursor-pointer"
                  >
                    <CameraIcon className="h-5 w-5" aria-hidden />
                    <span>Add photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Exchange & Replacement Options */}
        {step === 2 && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-ink">
              Exchange & Replacement Option
            </legend>

            <div className="rounded-lg border-2 border-clay bg-clay-soft/15 p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-clay text-white flex items-center justify-center shrink-0">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Doorstep Product & Size Exchange
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Our courier will deliver the replacement size/product to your doorstep and collect the return item simultaneously.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 max-w-xs space-y-4">
              <Select
                label="Select preferred replacement size"
                value={exchangeSize}
                onChange={(e) => setExchangeSize(e.target.value)}
                options={['S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44']}
              />
              <Textarea
                label="Any specific instruction for replacement (optional)"
                value={exchangeNote}
                onChange={(e) => setExchangeNote(e.target.value)}
                placeholder="e.g. Please send Dark Brown instead of Tan Brown if available."
                rows={2}
              />
            </div>
          </fieldset>
        )}

        {/* Step 3: Review and Submit */}
        {step === 3 && (
          <div className="space-y-4 text-sm">
            <h2 className="font-semibold text-ink text-base">Review your exchange request</h2>
            <ul className="space-y-2.5 border-b border-line pb-4">
              {selectedItems.map((i, idx) => (
                <li key={idx} className="flex justify-between items-center text-ink">
                  <span>
                    {i.title} {[i.color, i.size].filter(Boolean).length > 0 && `(${[i.color, i.size].filter(Boolean).join('/')})`} × {i.qty}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatBDT(i.price * i.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="grid grid-cols-[140px_1fr] gap-y-2.5 text-xs">
              <dt className="text-ink-muted">Reason</dt>
              <dd className="font-medium text-ink">{reason}</dd>

              {details && (
                <>
                  <dt className="text-ink-muted">Details</dt>
                  <dd className="text-ink italic">“{details}”</dd>
                </>
              )}

              <dt className="text-ink-muted">Requested Size</dt>
              <dd className="font-semibold text-ink">{exchangeSize}</dd>

              {exchangeNote && (
                <>
                  <dt className="text-ink-muted">Exchange Note</dt>
                  <dd className="text-ink">{exchangeNote}</dd>
                </>
              )}

              <dt className="text-ink-muted">Photos attached</dt>
              <dd className="font-medium text-ink">{photoUrls.length} photo(s)</dd>

              <dt className="text-ink-muted">Pickup & Delivery</dt>
              <dd className="text-ink">
                {order.shippingAddress?.line1 || ''}, {order.shippingAddress?.area || ''},{' '}
                {order.shippingAddress?.district || ''}
              </dd>
            </dl>

            <div className="rounded-lg bg-canvas border border-line p-3 text-xs text-ink-muted">
              Doorstep courier exchange will be dispatched upon review and approval by store admin.
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-4 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded border border-red-200" role="alert">
            {error}
          </p>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between items-center border-t border-line pt-4">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
            disabled={isSubmitting}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={handleNext} disabled={isSubmitting} className="bg-clay text-white hover:bg-clay-dark">
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {step === 3 ? 'Submit Exchange Request' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
