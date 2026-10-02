'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  FolderOpen,
  Sparkles,
  Hand,
  Star,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { CollectionCard } from './CollectionCard';
import { CreateCollectionModal } from './CreateCollectionModal';
import { collectionService } from '@/services/collection-service';
import { images } from '@/data/images';
import type { CollectionItem } from '@/types/collection';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface CollectionsManagerProps {
  initialCollections: CollectionItem[];
  products: Product[];
}

type FilterTab = 'all' | 'automated' | 'manual' | 'featured';
type SortOption = 'default' | 'name-asc' | 'products-desc';

/**
 * Helper to compute real-time product count for any collection (manual or automated)
 */
function getCollectionProductCount(col: CollectionItem, products: Product[]): number {
  if (col.type === 'manual') {
    if (col.productSlugs && col.productSlugs.length > 0) {
      return col.productSlugs.length;
    }
    return products.filter((p) => p.collections?.includes(col.slug)).length;
  }

  // Automated collection evaluation
  if (col.ruleDetails) {
    const v = col.ruleDetails.value.toLowerCase().trim();
    if (!v) return 0;
    return products.filter((p) => {
      if (col.ruleDetails!.field === 'Tag') {
        return p.tags?.some((t) => t.toLowerCase().includes(v));
      }
      if (col.ruleDetails!.field === 'Price') {
        const num = Number(col.ruleDetails!.value);
        if (isNaN(num)) return false;
        return (p.salePrice ?? p.price) < num;
      }
      return p.title.toLowerCase().includes(v);
    }).length;
  }

  // Fallback for mock collections with string rules
  return products.filter((p) => p.collections?.includes(col.slug)).length;
}

export function CollectionsManager({
  initialCollections,
  products,
}: CollectionsManagerProps) {
  const [collectionsList, setCollectionsList] =
    useState<CollectionItem[]>(initialCollections);
  const [loading, setLoading] = useState(false);

  // Fetch collections from backend database
  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await collectionService.getCollections(
        'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2'
      );
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const backendCols: CollectionItem[] = res.data.map((c) => ({
          slug: c.slug,
          name: c.name,
          description: c.description || '',
          image: c.image || images.hero,
          type: (c.type?.toLowerCase() === 'rule' ? 'rule' : 'manual') as 'manual' | 'rule',
          ruleDetails: c.rule || undefined,
          rule:
            c.rule && typeof c.rule === 'object'
              ? `${c.rule.field || 'Tag'} ${c.rule.op || 'contains'} "${c.rule.value || ''}"`
              : undefined,
          isFeatured: Boolean(c.isFeatured),
          isActive: c.isActive ?? true,
          seoTitle: c.seoTitle || undefined,
          seoDescription: c.seoDescription || undefined,
        }));
        setCollectionsList(backendCols);
      }
    } catch (error) {
      console.error('Failed to fetch collections from DB:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<CollectionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCollection(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (col: CollectionItem) => {
    setEditingCollection(col);
    setModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveCollection = (col: CollectionItem, isNew: boolean) => {
    if (isNew) {
      // Prepend newly created collection
      setCollectionsList((prev) => [col, ...prev.filter((c) => c.slug !== col.slug)]);
    } else {
      // Update existing
      setCollectionsList((prev) => prev.map((c) => (c.slug === col.slug ? col : c)));
    }
    // Sync with database
    fetchCollections();
  };

  // Delete Collection
  const handleConfirmDelete = async () => {
    if (!deletingCollection) return;
    const name = deletingCollection.name;
    const slug = deletingCollection.slug;
    setIsDeleting(true);
    try {
      // 1. Delete in database
      await collectionService.deleteCollection(
        slug,
        'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2'
      );
      // 2. Update local state
      setCollectionsList((prev) => prev.filter((c) => c.slug !== slug));
      setDeletingCollection(null);
      toast.success(`Collection "${name}" deleted successfully`);
    } catch (error: any) {
      console.error('Failed to delete collection:', error);
      toast.error(error?.message || 'Failed to delete collection');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Featured status
  const handleToggleFeatured = (col: CollectionItem) => {
    setCollectionsList((prev) =>
      prev.map((c) => (c.slug === col.slug ? { ...c, isFeatured: !c.isFeatured } : c))
    );
    toast.success(
      col.isFeatured
        ? `Removed "${col.name}" from featured`
        : `Marked "${col.name}" as featured on homepage`
    );
  };

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: collectionsList.length,
      automated: collectionsList.filter((c) => c.type === 'rule').length,
      manual: collectionsList.filter((c) => c.type === 'manual').length,
      featured: collectionsList.filter((c) => Boolean(c.isFeatured)).length,
    };
  }, [collectionsList]);

  // Filtered & Sorted collections
  const filteredCollections = useMemo(() => {
    let list = [...collectionsList];

    // Filter by Tab
    if (activeTab === 'automated') {
      list = list.filter((c) => c.type === 'rule');
    } else if (activeTab === 'manual') {
      list = list.filter((c) => c.type === 'manual');
    } else if (activeTab === 'featured') {
      list = list.filter((c) => Boolean(c.isFeatured));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.rule?.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'products-desc') {
      list.sort(
        (a, b) =>
          getCollectionProductCount(b, products) - getCollectionProductCount(a, products)
      );
    }

    return list;
  }, [collectionsList, activeTab, searchQuery, sortBy, products]);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Collections"
        description="Group products for campaigns and navigation — pick them by hand or let rules keep them up to date."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span>Create collection</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between">
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
            aria-selected={activeTab === 'automated'}
            onClick={() => setActiveTab('automated')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'automated'
                ? 'bg-ink text-canvas shadow-xs'
                : 'text-ink-muted hover:bg-subtle hover:text-ink'
            )}
          >
            <Sparkles className="h-3 w-3 text-clay" />
            <span>Automated ({counts.automated})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manual'}
            onClick={() => setActiveTab('manual')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'manual'
                ? 'bg-ink text-canvas shadow-xs'
                : 'text-ink-muted hover:bg-subtle hover:text-ink'
            )}
          >
            <Hand className="h-3 w-3 text-ink-muted" />
            <span>Manual ({counts.manual})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'featured'}
            onClick={() => setActiveTab('featured')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'featured'
                ? 'bg-ink text-canvas shadow-xs'
                : 'text-ink-muted hover:bg-subtle hover:text-ink'
            )}
          >
            <Star className="h-3 w-3 text-clay fill-clay" />
            <span>Featured ({counts.featured})</span>
          </button>
        </div>

        {/* Search & Sort Inputs */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-full rounded-lg border border-line bg-canvas/60 pl-8.5 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            aria-label="Sort collections"
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

      {/* Collections Grid or Empty State */}
      {filteredCollections.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8">
          <EmptyState
            icon={FolderOpen}
            title={searchQuery ? 'No collections found' : 'No collections in this view'}
            description={
              searchQuery
                ? `No collections match "${searchQuery}". Try a different search term or clear filters.`
                : 'Create a new collection or switch tabs to view other collections.'
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
                  <span>Create collection</span>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((col) => {
            const productCount = getCollectionProductCount(col, products);
            return (
              <CollectionCard
                key={col.slug}
                collection={col}
                productCount={productCount}
                onEdit={handleOpenEdit}
                onDelete={setDeletingCollection}
              />
            );
          })}
        </ul>
      )}

      {/* Create / Edit Collection Modal */}
      <CreateCollectionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCollection(null);
        }}
        products={products}
        initialCollection={editingCollection}
        onSaveCollection={handleSaveCollection}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deletingCollection)}
        onClose={() => setDeletingCollection(null)}
        size="sm"
        title="Delete collection?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingCollection(null)}
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
              Delete collection
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
                &ldquo;{deletingCollection?.name}&rdquo;
              </strong>
              ? This action will remove the collection from your storefront navigation and marketing.
            </p>
          </div>
          <p className="text-xs text-ink-muted">
            Products inside this collection will not be deleted.
          </p>
        </div>
      </Modal>
    </div>
  );
}
