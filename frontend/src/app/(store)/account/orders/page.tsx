'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PackageIcon, Loader2Icon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  OrderCard,
  OrderFilterTabs,
  type OrderFilter,
} from '@/components/store/account/orders';

export default function AccountOrdersPage() {
  const { user, orders, addToCart, setMiniCartOpen, isOrdersLoading, refreshOrders } = useStore();
  const [filter, setFilter] = useState<OrderFilter>('all');

  // Refresh latest orders from backend when customer opens this page
  useEffect(() => {
    if (refreshOrders) {
      refreshOrders();
    }
  }, [refreshOrders]);

  // Match orders by customer ID or by authenticated email
  const mine = orders.filter((o) => {
    if (!user) return false;
    const matchId = o.customerId === user.id;
    const matchEmail = Boolean(user.email && o.email && o.email.toLowerCase() === user.email.toLowerCase());
    return matchId || matchEmail;
  });

  const groups: Record<OrderFilter, (s: string) => boolean> = {
    all: () => true,
    active: (s) =>
      [
        'pending_payment',
        'confirmed',
        'processing',
        'packed',
        'shipped',
        'out_for_delivery',
      ].includes(s),
    delivered: (s) => s === 'delivered',
    returns: (s) =>
      ['return_requested', 'returned', 'refunded', 'partially_refunded'].includes(s),
    cancelled: (s) => ['cancelled', 'failed'].includes(s),
  };

  const list = mine.filter((o) => groups[filter](o.status));

  // Reorder items by adding them back to cart
  const handleReorder = (id: string) => {
    const o = mine.find((x) => x.id === id);
    if (!o) return;
    o.items.forEach((i) => addToCart(i.productId, i.variantId, i.qty));
    toast.success('Items added to your bag');
    setMiniCartOpen(true);
  };

  return (
    <div>
      <AccountHeader title="Orders" description={`${mine.length} orders placed`} />

      <OrderFilterTabs
        value={filter}
        onChange={setFilter}
        counts={{
          all: mine.length,
          active: mine.filter((o) => groups.active(o.status)).length,
        }}
      />

      {isOrdersLoading && mine.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2Icon className="h-8 w-8 animate-spin text-clay" />
            <p className="text-sm text-ink-muted">Loading your orders...</p>
          </div>
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="No orders here"
          description="Orders in this category will show up here."
          action={<Button href="/shop">Shop now</Button>}
        />
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onReorder={handleReorder}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
