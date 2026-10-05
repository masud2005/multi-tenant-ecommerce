'use client';

import React from 'react';
import {
  CategoryFilter,
  PriceFilter,
  SizeFilter,
  ColorFilter,
  BrandFilter,
  RatingFilter,
  AvailabilityFilter,
} from './filters';

export interface FilterState {
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  onSale: boolean;
  minRating: number;
}

export const emptyFilters: FilterState = {
  categories: [],
  brands: [],
  sizes: [],
  colors: [],
  minPrice: '',
  maxPrice: '',
  inStock: false,
  onSale: false,
  minRating: 0,
};

export interface ShopFiltersProps {
  value: FilterState;
  onChange: (f: FilterState) => void;
  facets: {
    categories: { key: string; label: string; count: number }[];
    brands: { key: string; count: number }[];
    sizes: string[];
    colors: { name: string; hex: string }[];
    inStockCount?: number;
    onSaleCount?: number;
  };
  hideCategory?: boolean;
}

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function ShopFilters({
  value,
  onChange,
  facets,
  hideCategory,
}: ShopFiltersProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <div>
      {/* 1. Category Filter */}
      {!hideCategory && (
        <CategoryFilter
          categories={facets.categories}
          selected={value.categories}
          onToggle={(key) => set({ categories: toggle(value.categories, key) })}
        />
      )}

      {/* 2. Price Range Filter */}
      <PriceFilter
        minPrice={value.minPrice}
        maxPrice={value.maxPrice}
        onChange={(minPrice, maxPrice) => set({ minPrice, maxPrice })}
      />

      {/* 3. Size Filter */}
      <SizeFilter
        sizes={facets.sizes}
        selected={value.sizes}
        onToggle={(size) => set({ sizes: toggle(value.sizes, size) })}
      />

      {/* 4. Color Filter */}
      <ColorFilter
        colors={facets.colors}
        selected={value.colors}
        onToggle={(color) => set({ colors: toggle(value.colors, color) })}
      />

      {/* 5. Brand Filter */}
      <BrandFilter
        brands={facets.brands}
        selected={value.brands}
        onToggle={(brand) => set({ brands: toggle(value.brands, brand) })}
      />

      {/* 6. Rating Filter */}
      <RatingFilter
        rating={value.minRating}
        onChange={(minRating) => set({ minRating })}
      />

      {/* 7. Availability Filter */}
      <AvailabilityFilter
        inStock={value.inStock}
        onSale={value.onSale}
        inStockCount={facets.inStockCount}
        onSaleCount={facets.onSaleCount}
        onChange={(patch) => set(patch)}
      />
    </div>
  );
}
