'use client';

import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/button';
import {
  ShopFilters,
  emptyFilters,
  type FilterState,
  type ShopFiltersProps,
} from '../ShopFilters';

export interface ShopFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  facets: ShopFiltersProps['facets'];
  hideCategory?: boolean;
  resultsCount: number;
}

export function ShopFilterDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
  facets,
  hideCategory,
  resultsCount,
}: ShopFilterDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      side="left"
      width="max-w-sm"
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => onFiltersChange(emptyFilters)}
            className="flex-1 cursor-pointer"
          >
            Clear
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 cursor-pointer"
          >
            Show {resultsCount}
          </Button>
        </div>
      }
    >
      <div className="px-5 py-5">
        <ShopFilters
          value={filters}
          onChange={onFiltersChange}
          facets={facets}
          hideCategory={hideCategory}
        />
      </div>
    </Drawer>
  );
}
