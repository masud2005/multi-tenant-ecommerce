'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  PackageIcon,
  MapPinIcon,
  RotateCcwIcon,
  HeartIcon,
  UserIcon,
  ShieldIcon,
  LifeBuoyIcon,
  Loader2Icon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { returnService } from '@/services/return-service';
import { Badge } from '@/components/ui/Badge';
import { OrderProgress } from '@/components/store/shared';
import { orderStatusMeta, returnStatusMeta } from '@/utils/status';
import { formatBDT, formatDate } from '@/utils/format';
import type { ReturnRequest } from '@/types/commerce';

type AccountCard = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  meta?: string;
};

export default function AccountDashboardPage() {
  const {
    orders,
    wishlist,
    wishlistProducts,
    addresses,
    refreshOrders,
    isOrdersLoading,
  } = useStore();

  const [returnsList, setReturnsList] = useState<ReturnRequest[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(true);

  useEffect(() => {
    if (refreshOrders) refreshOrders();
  }, [refreshOrders]);

  const loadReturns = useCallback(async () => {
    setReturnsLoading(true);
    try {
      const res = await returnService.getCustomerReturns();
      setReturnsList(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setReturnsList([]);
    } finally {
      setReturnsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const mine = orders;
  const activeOrder = mine.find((o) =>
    ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(
      o.status
    )
  );
  const activeReturn = returnsList.find(
    (r) => !['refunded', 'exchanged', 'rejected'].includes(r.status)
  );
  const defaultAddr = addresses.find((a) => a.isDefaultShipping);
  const recent = mine.slice(0, 3);
  const wished = (wishlistProducts || []).slice(0, 4);

  const cards: AccountCard[] = [
    {
      title: 'Your orders',
      description: 'Track, invoice, reorder, or start a return',
      href: '/account/orders',
      icon: PackageIcon,
      meta: mine.length > 0 ? `${mine.length} order${mine.length === 1 ? '' : 's'}` : undefined,
    },
    {
      title: 'Addresses',
      description: 'Saved shipping addresses for checkout',
      href: '/account/addresses',
      icon: MapPinIcon,
      meta:
        addresses.length > 0
          ? `${addresses.length} saved`
          : undefined,
    },
    {
      title: 'Returns',
      description: 'Return and exchange requests',
      href: '/account/returns',
      icon: RotateCcwIcon,
      meta:
        returnsList.length > 0
          ? `${returnsList.length} request${returnsList.length === 1 ? '' : 's'}`
          : undefined,
    },
    {
      title: 'Wishlist',
      description: 'Items you saved for later',
      href: '/wishlist',
      icon: HeartIcon,
      meta:
        wishlist.length > 0
          ? `${wishlist.length} item${wishlist.length === 1 ? '' : 's'}`
          : undefined,
    },
    {
      title: 'Profile',
      description: 'Name, phone, and contact details',
      href: '/account/profile',
      icon: UserIcon,
    },
    {
      title: 'Login & security',
      description: 'Change your password',
      href: '/account/security',
      icon: ShieldIcon,
    },
    {
      title: 'Help & support',
      description: 'Chat with the store or send a message',
      href: '/account/support',
      icon: LifeBuoyIcon,
    },
  ];

  return (
    <div className="space-y-8">
      {isOrdersLoading && mine.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-8 text-sm text-ink-soft">
          <Loader2Icon className="h-4 w-4 animate-spin" />
          Loading your orders…
        </div>
      ) : activeOrder ? (
        <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Current order
              </p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {activeOrder.number}
              </p>
              <p className="text-sm text-ink-soft">
                {activeOrder.items.length} item
                {activeOrder.items.length === 1 ? '' : 's'} ·{' '}
                {formatBDT(activeOrder.total)} · placed{' '}
                {formatDate(activeOrder.createdAt)}
              </p>
            </div>
            <Badge tone={orderStatusMeta[activeOrder.status]?.tone || 'neutral'} dot>
              {orderStatusMeta[activeOrder.status]?.label || activeOrder.status}
            </Badge>
          </div>
          <div className="mt-5">
            <OrderProgress order={activeOrder} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex -space-x-2">
              {activeOrder.items.slice(0, 4).map((item) =>
                item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${item.variantId || item.productId}-${item.title}`}
                    src={item.image}
                    alt=""
                    className="h-11 w-9 rounded border-2 border-surface object-cover"
                  />
                ) : null
              )}
            </div>
            <Link
              href={`/account/orders/${activeOrder.number}`}
              className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-ink hover:underline"
            >
              Track order <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-line bg-surface px-5 py-6 text-sm text-ink-soft">
          No active orders right now.{' '}
          <Link href="/shop" className="font-medium text-ink underline">
            Continue shopping
          </Link>
        </section>
      )}

      {!returnsLoading && activeReturn ? (
        <section className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-5">
          {activeReturn.items?.[0]?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeReturn.items[0].image}
              alt=""
              className="h-14 w-11 rounded object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">
              Return in progress
              {activeReturn.resolution
                ? ` · ${activeReturn.resolution === 'exchange' ? 'Exchange' : 'Refund'}`
                : ''}
            </p>
            <p className="truncate text-sm text-ink-soft">
              {activeReturn.items?.[0]?.title || activeReturn.reason || activeReturn.id}
            </p>
          </div>
          <Badge tone={returnStatusMeta[activeReturn.status]?.tone || 'neutral'}>
            {returnStatusMeta[activeReturn.status]?.label || activeReturn.status}
          </Badge>
          <Link
            href="/account/returns"
            className="text-sm font-medium text-ink underline"
          >
            View
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="account-sections-h">
        <h2 id="account-sections-h" className="sr-only">
          Account sections
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group flex gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-subtle/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink group-hover:underline">
                      {card.title}
                    </span>
                    {card.meta ? (
                      <span className="text-xs font-medium text-ink-soft whitespace-nowrap">
                        {card.meta}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    {card.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {defaultAddr ? (
        <section className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Default address
              </p>
              <p className="mt-2 text-sm text-ink">
                {[defaultAddr.name, defaultAddr.line1, defaultAddr.area, defaultAddr.district]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {defaultAddr.phone ? (
                <p className="mt-1 text-sm text-ink-soft">{defaultAddr.phone}</p>
              ) : null}
            </div>
            <Link
              href="/account/addresses"
              className="text-sm font-medium text-ink underline shrink-0"
            >
              Manage
            </Link>
          </div>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section aria-labelledby="recent-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-h" className="text-base font-semibold text-ink">
              Recent orders
            </h2>
            <Link href="/account/orders" className="text-sm text-ink underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.number}`}
                  className="flex flex-wrap items-center gap-4 px-4 py-3.5 transition-colors hover:bg-subtle/50 sm:px-5"
                >
                  {o.items?.[0]?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.items[0].image}
                      alt=""
                      className="h-12 w-9 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-9 items-center justify-center rounded bg-subtle text-ink-soft">
                      <PackageIcon className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{o.number}</p>
                    <p className="text-sm text-ink-soft">
                      {formatDate(o.createdAt)} · {formatBDT(o.total)}
                    </p>
                  </div>
                  <Badge tone={orderStatusMeta[o.status]?.tone || 'neutral'}>
                    {orderStatusMeta[o.status]?.label || o.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {wished.length > 0 ? (
        <section aria-labelledby="wish-h">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="wish-h" className="text-base font-semibold text-ink">
              Wishlist
            </h2>
            <Link href="/wishlist" className="text-sm text-ink underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {wished.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="group">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0]}
                    alt=""
                    className="aspect-[3/4] w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="aspect-[3/4] w-full rounded-lg bg-subtle" />
                )}
                <p className="mt-2 text-sm text-ink group-hover:underline line-clamp-2">
                  {p.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
