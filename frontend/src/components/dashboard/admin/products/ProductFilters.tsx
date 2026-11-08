'use client';

import React from 'react';
import { Search } from 'lucide-react';

export type StockFilter = 'all' | 'low' | 'out';

export interface ProductFilterCategory {
  key: string;
  name: string;
}

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedStock: StockFilter;
  onStockChange: (stock: StockFilter) => void;
  /** Categories from API / product payload — empty shows only "All categories" */
  categories?: ProductFilterCategory[];
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStock,
  onStockChange,
  categories = [],
}: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
      {/* Search Input */}
      <div className="relative min-w-[200px] flex-1">
        <Search
          className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search title, SKU or brand…"
          aria-label="Search products"
          className="h-9 w-full rounded-md border border-line-strong bg-surface pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
        />
      </div>

      {/* Category Dropdown */}
      <select
        aria-label="Category"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-clay focus:outline-none cursor-pointer"
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.key} value={c.key}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Stock Level Dropdown */}
      <select
        aria-label="Stock"
        value={selectedStock}
        onChange={(e) => onStockChange(e.target.value as StockFilter)}
        className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-clay focus:outline-none cursor-pointer"
      >
        <option value="all">Any stock level</option>
        <option value="low">Low stock</option>
        <option value="out">Out of stock</option>
      </select>
    </div>
  );
}
