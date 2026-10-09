'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, WalletIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { OrderProgress } from '@/components/store/shared';
import { orderStatusMeta, returnStatusMeta } from '@/utils/status';
import { formatBDT, formatDate } from '@/utils/format';

export default function AccountDashboardPage() {
  const { user, orders, returns, wishlist, products, storeCredit, addresses, refreshOrders } = useStore();
  
  React.useEffect(() => {
    if (refreshOrders) refreshOrders();
  }, [refreshOrders]);

  const mine = orders.filter((o) => {
    if (!user) return false;
    const matchId = o.customerId === user.id;
    const matchEmail = Boolean(user.email && o.email && o.email.toLowerCase() === user.email.toLowerCase());
    return matchId || matchEmail;
  });
  const activeOrder = mine.find((o) =>
    ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(o.status)
  );
  const activeReturn = returns.find(
    (r) =>
      r.customerName === user?.name &&
      !['refunded', 'exchanged', 'rejected'].includes(r.status)
  );
  const wished = wishlist
    .map((id) => products.find((p) => p.id === id)!)
    .filter(Boolean)
    .slice(0, 4);
  const defaultAddr = addresses.find((a) => a.isDefaultShipping);

  return (
    <div>
      <h1 className="font-display text-3xl">
        Hi, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Customer'}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">Welcome to your account overview</p>

      {activeOrder ? (
        <section
          className="mt-8 rounded-lg border border-line bg-surface p-6"
          aria-labelledby="active-h"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p id="active-h" className="text-xs text-ink-muted">
                On its way
              </p>
              <p className="mt-0.5 text-lg font-semibold">{activeOrder.number}</p>
              <p className="text-sm text-ink-muted">
                {activeOrder.items.length} items · {formatBDT(activeOrder.total)} · placed{' '}
                {formatDate(activeOrder.createdAt)}
              </p>
            </div>
            <Badge tone={orderStatusMeta[activeOrder.status].tone} dot>
              {orderStatusMeta[activeOrder.status].label}
            </Badge>
          </div>
          <div className="mt-6">
            <OrderProgress order={activeOrder} />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-3">
              {activeOrder.items.map((i) => (
                <img
                  key={i.variantId}
                  src={i.image}
                  alt=""
                  className="h-12 w-9 rounded border-2 border-surface object-cover"
                />
              ))}
            </div>
            <Link
              href={`/account/orders/${activeOrder.number}`}
              className="ml-auto inline-flex items-center gap-1 text-sm font-medium hover:text-clay"
            >
              Track order <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-lg border border-line bg-surface p-6 text-sm text-ink-muted">
          No active orders right now.{' '}
          <Link href="/shop" className="font-medium text-ink underline">
            Start shopping
          </Link>
        </section>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <WalletIcon className="h-4 w-4" aria-hidden /> Store credit
          </p>
          <p className="mt-2 text-2xl font-semibold">{formatBDT(storeCredit)}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Applied automatically at checkout if you choose
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <p className="text-sm text-ink-muted">Default address</p>
          {defaultAddr ? (
            <p className="mt-2 text-sm">
              {defaultAddr.line1}, {defaultAddr.area}, {defaultAddr.district}
            </p>
          ) : (
            <p className="mt-2 text-sm">Not set</p>
          )}
          <Link
            href="/account/addresses"
            className="mt-1 inline-block text-xs font-medium underline"
          >
            Manage
          </Link>
        </div>
      </div>

      {activeReturn && (
        <section className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface p-5">
          <img
            src={activeReturn.items[0].image}
            alt=""
            className="h-14 w-11 rounded object-cover"
          />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Return {activeReturn.id} ·{' '}
              {activeReturn.resolution === 'exchange' ? 'Exchange' : 'Refund'}
            </p>
            <p className="text-xs text-ink-muted">
              {activeReturn.items[0].title} · {activeReturn.reason}
            </p>
          </div>
          <Badge tone={returnStatusMeta[activeReturn.status].tone}>
            {returnStatusMeta[activeReturn.status].label}
          </Badge>
          <Link href="/account/returns" className="text-sm font-medium underline">
            View
          </Link>
        </section>
      )}

      <section className="mt-10" aria-labelledby="recent-h">
        <div className="flex items-center justify-between">
          <h2 id="recent-h" className="text-base font-semibold">
            Recent orders
          </h2>
          <Link href="/account/orders" className="text-sm underline">
            All orders
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
          {mine.slice(0, 3).map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.number}`}
                className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-canvas transition-colors"
              >
                <img
                  src={o.items[0].image}
                  alt=""
                  className="h-12 w-9 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{o.number}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDate(o.createdAt)} · {formatBDT(o.total)}
                  </p>
                </div>
                <Badge tone={orderStatusMeta[o.status].tone}>
                  {orderStatusMeta[o.status].label}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {wished.length > 0 && (
        <section className="mt-10" aria-labelledby="wish-h">
          <div className="flex items-center justify-between">
            <h2 id="wish-h" className="text-base font-semibold">
              Wishlist ({wishlist.length})
            </h2>
            <Button variant="link" href="/wishlist">
              View all
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {wished.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="group">
                <img
                  src={p.images[0]}
                  alt=""
                  className="aspect-[3/4] w-full rounded-md object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <p className="mt-2 text-sm group-hover:underline">{p.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
