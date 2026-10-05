'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PackageSearchIcon, ExternalLinkIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { OrderProgress } from '@/components/store/shared';
import { orderStatusMeta } from '@/utils/status';
import { formatDateTime } from '@/utils/format';
import type { Order } from '@/types/commerce';

export default function TrackOrderPage() {
  const { orders } = useStore();
  const [number, setNumber] = useState('TN-10487');
  const [phone, setPhone] = useState('01712-345678');
  const [result, setResult] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 500));
    const o = orders.find(
      (x) =>
        x.number.toLowerCase() === number.trim().toLowerCase() &&
        x.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')
    );
    setLoading(false);
    if (!o) {
      setResult(null);
      setError(
        'We couldn’t find an order with those details. Check the order number in your confirmation SMS.'
      );
      return;
    }
    setResult(o);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl">Track your order</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Enter the order number from your confirmation SMS or email and the phone number used at
        checkout.
      </p>
      <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Input
          label="Order number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="TN-10487"
        />
        <Input
          label="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXX-XXXXXX"
        />
        <Button type="submit" loading={loading}>
          Track
        </Button>
      </form>
      {error && (
        <p className="mt-4 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {result ? (
        <div className="mt-10 rounded-lg border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-ink-muted">Order</p>
              <p className="text-lg font-semibold">{result.number}</p>
            </div>
            <Badge tone={orderStatusMeta[result.status].tone} dot>
              {orderStatusMeta[result.status].label}
            </Badge>
          </div>
          <div className="mt-8">
            <OrderProgress order={result} />
          </div>
          {result.tracking && (
            <p className="mt-8 flex flex-wrap items-center gap-2 rounded-md bg-subtle px-4 py-3 text-sm">
              {result.courier} tracking: <span className="font-mono">{result.tracking}</span>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="ml-auto inline-flex items-center gap-1 font-medium underline"
              >
                Open courier page <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden />
              </a>
            </p>
          )}
          <ol className="mt-8 space-y-4 border-l border-line pl-5">
            {result.timeline.map((t, i) => (
              <li key={i} className="relative">
                <span
                  className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ${
                    i === 0 ? 'bg-ink' : 'bg-line-strong'
                  }`}
                  aria-hidden
                />
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-ink-muted">{formatDateTime(t.at)}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        !error && (
          <div className="mt-12 flex items-center gap-3 text-sm text-ink-muted">
            <PackageSearchIcon className="h-5 w-5" aria-hidden /> Signed in? See all your orders
            in{' '}
            <Link href="/account/orders" className="font-medium text-ink underline">
              My Account
            </Link>
            .
          </div>
        )
      )}
    </div>
  );
}
