'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Download, Plus, Search, Tag, Upload, RefreshCw, Loader2 } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { categories as seedCategories } from '@/data/products';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { DataTable, type Column } from '@/components/dashboard/shared/DataTable';
import { BulkBar } from '@/components/dashboard/shared/BulkBar';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { productPrice, productStock, LOW_STOCK_THRESHOLD } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';
import type { Product, ProductStatus } from '@/types';
import { productService, categoryService, CategoryResponseData } from '@/services';

type Tab = 'all' | ProductStatus;
const statusTone = { published: 'success', draft: 'neutral', archived: 'warning' } as const;

export default function AdminProductsPage() {
  const { products: storeProducts, saveProduct } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [stock, setStock] = useState<'all' | 'low' | 'out'>('all');
  const [selected, setSelected] = useState<string[]>([]);

  // Live Database States
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<CategoryResponseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Products & Categories from Backend
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, catRes] = await Promise.allSettled([
        productService.getProducts(),
        categoryService.getCategories(),
      ]);

      if (prods.status === 'fulfilled') {
        setLiveProducts(prods.value);
      }
      if (catRes.status === 'fulfilled' && catRes.value?.data) {
        setDbCategories(catRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load products from database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Prioritize live products from database, fallback to store products
  const products = liveProducts.length > 0 ? liveProducts : storeProducts;

  // Process Category List for Filter Dropdown
  const categoryFilterOptions = useMemo(() => {
    if (dbCategories.length > 0) {
      const parents = dbCategories.filter((c) => !c.parentId);
      return parents.map((c) => ({ key: c.slug || c.id, name: c.name }));
    }
    return [];
  }, [dbCategories]);

  const rows = useMemo(
    () =>
      products.filter((p) => {
        const s = productStock(p);
        const pCat = (p.category || '').toLowerCase();
        const catFilter = cat.toLowerCase();

        const matchesCat =
          catFilter === 'all' ||
          pCat === catFilter ||
          categoryFilterOptions.some(
            (c) =>
              c.key.toLowerCase() === catFilter &&
              (pCat === c.key.toLowerCase() || pCat === c.name.toLowerCase())
          );

        const matchesTab =
          tab === 'all' || (p.status || '').toLowerCase() === tab.toLowerCase();

        const matchesStock =
          stock === 'all' ||
          (stock === 'out'
            ? s === 0 && !p.preorder
            : s > 0 && s <= LOW_STOCK_THRESHOLD * 2);

        const matchesSearch =
          !q ||
          `${p.title} ${p.variants?.map((v) => v.sku).join(' ') || ''} ${p.brand}`
            .toLowerCase()
            .includes(q.toLowerCase());

        return matchesCat && matchesTab && matchesStock && matchesSearch;
      }),
    [products, tab, cat, stock, q, categoryFilterOptions]
  );

  const bulk = (status: ProductStatus) => {
    selected.forEach((id) => {
      const p = products.find((x) => x.id === id);
      if (p) saveProduct({ ...p, status });
    });
    toast.success(`${selected.length} products set to ${status}`);
    setSelected([]);
  };

  const columns: Column<Product>[] = [
    {
      key: 'p',
      header: 'Product',
      render: (p) => (
        <span className="flex items-center gap-3">
          <img
            src={
              p.images?.[0] ||
              'https://raw.githubusercontent.com/masud2005/fashion-shop/HEAD/public/f00f02c2-3aa1-48e5-9485-304d964dcbb5.jpg'
            }
            alt={p.title}
            className="h-11 w-9 rounded object-cover border border-line/60"
          />
          <span>
            <span className="block font-medium text-ink">{p.title}</span>
            <span className="block text-xs text-ink-muted">
              {p.variants?.length || 0} variants · {p.brand}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge tone={statusTone[p.status] || 'neutral'} dot>
          {p.status ? p.status[0].toUpperCase() + p.status.slice(1) : 'Draft'}
        </Badge>
      ),
    },
    {
      key: 'stock',
      header: 'Inventory',
      render: (p) => {
        const s = productStock(p);
        if (p.preorder) return <span className="text-info font-medium">Pre-order</span>;
        return (
          <span
            className={
              s === 0
                ? 'text-danger font-medium'
                : s <= LOW_STOCK_THRESHOLD * 2
                ? 'text-warning font-medium'
                : 'text-ink'
            }
          >
            {s} in stock
          </span>
        );
      },
    },
    {
      key: 'cat',
      header: 'Category',
      render: (p) => {
        const matchedCat = categoryFilterOptions.find((c) => c.key === p.category);
        return (
          <span className="text-ink-muted">
            {matchedCat?.name || p.category}
            {p.subcategory ? ` / ${p.subcategory}` : ''}
          </span>
        );
      },
      hideOnMobile: true,
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (p) => (
        <span className="tabular-nums font-medium text-ink">
          {formatBDT(productPrice(p))}
          {p.salePrice && (
            <span className="ml-1.5 text-xs text-ink-muted line-through">
              {formatBDT(p.price)}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'sold',
      header: 'Sold · 30d',
      align: 'right',
      render: (p) => <span className="tabular-nums text-ink-muted">{p.sold ?? 0}</span>,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Products"
        description={`${products.length} products · ${products.reduce(
          (s, p) => s + (p.variants?.length || 0),
          0
        )} variants`}
        actions={
          <>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-subtle/50 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Refresh product list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <GuardedButton
              module="products"
              action="create"
              variant="secondary"
              size="sm"
              to="/admin/products/import"
            >
              <Upload className="h-4 w-4" aria-hidden /> Import
            </GuardedButton>
            <GuardedButton
              module="products"
              action="export"
              variant="secondary"
              size="sm"
              onClick={() => toast.success(`Exported ${rows.length} products to CSV`)}
            >
              <Download className="h-4 w-4" aria-hidden /> Export
            </GuardedButton>
            <GuardedButton module="products" action="create" size="sm" to="/admin/products/new">
              <Plus className="h-4 w-4" aria-hidden /> Add product
            </GuardedButton>
          </>
        }
      />

      <div className="rounded-lg border border-line bg-surface overflow-hidden shadow-xs">
        <div className="px-4 pt-2">
          <Tabs
            value={tab}
            onChange={(t) => {
              setTab(t as Tab);
              setSelected([]);
            }}
            tabs={[
              { value: 'all', label: 'All', count: products.length },
              {
                value: 'published',
                label: 'Published',
                count: products.filter((p) => p.status === 'published').length,
              },
              {
                value: 'draft',
                label: 'Draft',
                count: products.filter((p) => p.status === 'draft').length,
              },
              {
                value: 'archived',
                label: 'Archived',
                count: products.filter((p) => p.status === 'archived').length,
              },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, SKU or brand…"
              aria-label="Search products"
              className="h-9 w-full rounded-md border border-line bg-canvas pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
            />
          </div>
          <select
            aria-label="Category"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm text-ink focus:outline-none"
          >
            <option value="all">All categories</option>
            {categoryFilterOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value as typeof stock)}
            className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm text-ink focus:outline-none"
          >
            <option value="all">Any stock level</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-muted gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-clay" />
            <p className="text-xs">Loading products from database...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(p) => p.id}
            onRowClick={(p) => router.push(`/admin/products/${p.id}`)}
            selectable
            selected={selected}
            onSelectedChange={setSelected}
            empty={
              <EmptyState
                icon={Tag}
                title="No products match"
                description="Adjust filters or add a new product."
              />
            }
            mobileCard={(p) => (
              <div className="flex items-center gap-3">
                <img
                  src={
                    p.images?.[0] ||
                    'https://raw.githubusercontent.com/masud2005/fashion-shop/HEAD/public/f00f02c2-3aa1-48e5-9485-304d964dcbb5.jpg'
                  }
                  alt={p.title}
                  className="h-12 w-10 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{p.title}</p>
                  <p className="text-xs text-ink-muted">
                    {productStock(p)} in stock · {formatBDT(productPrice(p))}
                  </p>
                </div>
                <Badge tone={statusTone[p.status] || 'neutral'}>{p.status}</Badge>
              </div>
            )}
          />
        )}
      </div>

      <BulkBar count={selected.length} onClear={() => setSelected([])}>
        <button onClick={() => bulk('published')}>Publish</button>
        <button onClick={() => bulk('draft')}>Set as draft</button>
        <button onClick={() => bulk('archived')}>Archive</button>
        <button
          onClick={() => {
            toast.success('Price update applied: −10% to selected');
            setSelected([]);
          }}
        >
          Adjust prices
        </button>
      </BulkBar>
    </div>
  );
}
