'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Award,
  CheckCircle2,
  Package,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { BrandRow, type BrandItem } from './BrandRow';
import { CreateBrandModal } from './CreateBrandModal';
import { brandService } from '@/services/brand-service';
import { formatBDT } from '@/utils/format';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface BrandsManagerProps {
  initialBrands: BrandItem[];
  products: Product[];
}

type FilterTab = 'all' | 'active' | 'inactive';
type SortOption = 'default' | 'name-asc' | 'products-desc';

export function BrandsManager({
  initialBrands,
  products,
}: BrandsManagerProps) {
  const [brandList, setBrandList] = useState<BrandItem[]>(initialBrands);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<BrandItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Fetch real brands from backend database
  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const res = await brandService.getBrands(
        'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2'
      );
      if (res?.data && Array.isArray(res.data)) {
        const backendBrands: BrandItem[] = res.data.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description,
          logo: b.logo,
          isActive: b.isActive,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          _count: b._count,
        }));
        setBrandList(backendBrands);
      }
    } catch (error) {
      console.error('Failed to fetch brands from DB:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingBrand(null);
    setModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (brand: BrandItem) => {
    setEditingBrand(brand);
    setModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveBrand = (savedBrand: BrandItem, isNew: boolean) => {
    if (isNew) {
      setBrandList((prev) => [savedBrand, ...prev.filter((b) => b.slug !== savedBrand.slug)]);
    } else {
      setBrandList((prev) => prev.map((b) => (b.slug === savedBrand.slug ? savedBrand : b)));
    }
    fetchBrands();
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingBrand) return;
    const name = deletingBrand.name;
    const identifier = deletingBrand.id || deletingBrand.slug;
    setIsDeleting(true);

    try {
      await brandService.deleteBrand(
        identifier,
        'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2'
      );
      // Remove locally
      setBrandList((prev) =>
        prev.filter((b) => b.slug !== deletingBrand.slug && b.id !== deletingBrand.id)
      );
      setDeletingBrand(null);
      toast.success(`Brand "${name}" deleted successfully`);
    } catch (error: any) {
      console.error('Failed to delete brand:', error);
      toast.error(error?.message || 'Failed to delete brand');
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute Overall KPI Metrics
  const stats = useMemo(() => {
    const totalBrands = brandList.length;
    const activeBrands = brandList.filter((b) => b.isActive !== false).length;
    
    let totalAssignedProducts = 0;
    let totalRevenue = 0;

    brandList.forEach((b) => {
      const bProducts = products.filter(
        (p) => p.brand === b.slug || p.brand === b.name
      );
      totalAssignedProducts += b._count?.products ?? bProducts.length;
      totalRevenue += bProducts.reduce(
        (sum, p) => sum + ((p.salePrice ?? p.price) || 0) * (p.sold || 0),
        0
      );
    });

    return {
      totalBrands,
      activeBrands,
      totalAssignedProducts,
      totalRevenue,
    };
  }, [brandList, products]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: brandList.length,
      active: brandList.filter((b) => b.isActive !== false).length,
      inactive: brandList.filter((b) => b.isActive === false).length,
    };
  }, [brandList]);

  // Filtered & Sorted brands
  const filteredBrands = useMemo(() => {
    let list = [...brandList];

    // Tab filter
    if (activeTab === 'active') {
      list = list.filter((b) => b.isActive !== false);
    } else if (activeTab === 'inactive') {
      list = list.filter((b) => b.isActive === false);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'products-desc') {
      list.sort((a, b) => {
        const countA =
          a._count?.products ??
          products.filter((p) => p.brand === a.slug || p.brand === a.name).length;
        const countB =
          b._count?.products ??
          products.filter((p) => p.brand === b.slug || p.brand === b.name).length;
        return countB - countA;
      });
    }

    return list;
  }, [brandList, activeTab, searchQuery, sortBy, products]);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Brands"
        description="Each brand gets its own storefront page and filter."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span>Add brand</span>
          </Button>
        }
      />

      {/* Top Overview KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
        <div className="flex flex-col rounded-2xl border border-line bg-surface p-4 transition-all duration-200 hover:border-line-strong hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Total Brands</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-clay/10 text-clay">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {stats.totalBrands}
          </p>
          <span className="text-[11px] text-ink-muted mt-0.5">Registered labels</span>
        </div>

        <div className="flex flex-col rounded-2xl border border-line bg-surface p-4 transition-all duration-200 hover:border-line-strong hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Active Brands</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.activeBrands}
          </p>
          <span className="text-[11px] text-ink-muted mt-0.5">Live on storefront</span>
        </div>

        <div className="flex flex-col rounded-2xl border border-line bg-surface p-4 transition-all duration-200 hover:border-line-strong hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Assigned Products</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {stats.totalAssignedProducts}
          </p>
          <span className="text-[11px] text-ink-muted mt-0.5">Catalog items</span>
        </div>

        <div className="flex flex-col rounded-2xl border border-line bg-surface p-4 transition-all duration-200 hover:border-line-strong hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">30d Brand Sales</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {formatBDT(stats.totalRevenue)}
          </p>
          <span className="text-[11px] text-ink-muted mt-0.5">Volume generated</span>
        </div>
      </div>

      {/* Filter and Search Bar with View Switcher */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'all'
                ? 'bg-ink text-canvas shadow-xs'
                : 'text-ink-muted hover:bg-subtle hover:text-ink'
            )}
          >
            All ({counts.all})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'active'
                ? 'bg-ink text-canvas shadow-xs'
                : 'text-ink-muted hover:bg-subtle hover:text-ink'
            )}
          >
            Active ({counts.active})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inactive'}
            onClick={() => setActiveTab('inactive')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'inactive'
                ? 'bg-ink text-canvas shadow-xs'
                : 'text-ink-muted hover:bg-subtle hover:text-ink'
            )}
          >
            Inactive ({counts.inactive})
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-full rounded-lg border border-line bg-canvas/60 pl-8.5 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            aria-label="Sort brands"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-8.5 rounded-lg border border-line bg-canvas/60 px-2.5 text-xs text-ink focus:border-clay focus:outline-none cursor-pointer"
          >
            <option value="default">Sort: Default</option>
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="products-desc">Sort: Most products</option>
          </select>
        </div>
      </div>

      {/* Brands List Panel, Loading, or Empty State */}
      {loading && brandList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-16 text-center shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-clay" />
          <p className="mt-3 text-sm font-medium text-ink">Loading brands from database...</p>
          <p className="mt-1 text-xs text-ink-muted">Connecting to your store database</p>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 shadow-xs">
          <EmptyState
            icon={Award}
            title={searchQuery ? 'No brands found' : 'No brands registered yet'}
            description={
              searchQuery
                ? `No brands match "${searchQuery}". Try a different search term or clear filters.`
                : 'Create your first brand partner to feature on your storefront.'
            }
            action={
              searchQuery ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="cursor-pointer"
                >
                  Clear search
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreate}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add brand</span>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <Panel
          title="All brands"
          description="Curated labels and partners featured in your storefront catalog."
          flush
        >
          <ul className="divide-y divide-line">
            {filteredBrands.map((brand) => (
              <BrandRow
                key={brand.slug}
                brand={brand}
                products={products}
                onEdit={handleOpenEdit}
                onDelete={setDeletingBrand}
              />
            ))}
          </ul>
        </Panel>
      )}

      {/* Create / Edit Brand Modal */}
      <CreateBrandModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBrand(null);
        }}
        initialBrand={editingBrand}
        onSaveBrand={handleSaveBrand}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingBrand)}
        onClose={() => setDeletingBrand(null)}
        size="sm"
        title="Delete brand?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingBrand(null)}
              type="button"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              type="button"
              loading={isDeleting}
            >
              Delete brand
            </Button>
          </>
        }
      >
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-ink">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p>
              Are you sure you want to delete{' '}
              <strong className="font-semibold text-ink">
                &ldquo;{deletingBrand?.name}&rdquo;
              </strong>
              ? This brand will be removed from your active partner list.
            </p>
          </div>
          <p className="text-xs text-ink-muted">
            Existing products assigned to this brand will not be deleted.
          </p>
        </div>
      </Modal>
    </div>
  );
}


