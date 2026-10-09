'use client';

import React from 'react';
import { Tabs } from '@/components/ui/Tabs';

export type OrderFilter = 'all' | 'active' | 'delivered' | 'returns' | 'cancelled';

interface OrderFilterTabsProps {
  value: OrderFilter;
  onChange: (value: OrderFilter) => void;
  counts: {
    all: number;
    active: number;
    delivered?: number;
    returns?: number;
    cancelled?: number;
  };
}

export function OrderFilterTabs({
  value,
  onChange,
  counts,
}: OrderFilterTabsProps) {
  return (
    <Tabs<OrderFilter>
      value={value}
      onChange={onChange}
      tabs={[
        { value: 'all', label: 'All', count: counts.all },
        { value: 'active', label: 'In progress', count: counts.active },
        { value: 'delivered', label: 'Delivered', count: counts.delivered },
        { value: 'returns', label: 'Returns & refunds', count: counts.returns },
        { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
      ]}
    />
  );
}
