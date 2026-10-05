'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Package,
  Layers,
  Image as ImageIcon,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { productService } from '@/services/product-service';
import { categoryService } from '@/services/category-service';
import { Panel } from '@/components/dashboard/shared/Panel';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { formatBDT } from '@/utils/format';
import { images } from '@/data/images';
import { cn } from '@/utils/cn';
import type { CategoryItemData } from '@/types/commerce';
import type { Product } from '@/types/product';

interface CategoryDetailPanelProps {
  category: CategoryItemData;
  activeSubcategory?: string | null;
  onSelectSubcategory?: (sub: string | null) => void;
  onSelectCategory?: (key: string) => void;
  allCategories?: CategoryItemData[];
  products?: Product[];
  productCount: number;
  getProductCount?: (categoryKey: string, subcategory?: string) => number;
  onRefresh?: () => void;
}

const sampleImages = [
  { label: 'Kurta', src: images.kurta },
  { label: 'Panjabi', src: images.panjabi },
  { label: 'Saree', src: images.saree },
  { label: 'Sneakers', src: images.sneakers },
  { label: 'Bag', src: images.bag },
  { label: 'Kids', src: images.kids },
  { label: 'Co-ord', src: images.coord },
  { label: 'Sandals', src: images.sandals },
  { label: 'Tunic', src: images.tunic },
];

export function CategoryDetailPanel({
  category,
  activeSubcategory,
  onSelectSubcategory,
  allCategories = [],
  products = [],
  productCount,
  getProductCount,
  onRefresh,
}: CategoryDetailPanelProps) {
  const router = useRouter();
  const {
    saveCategory,
    deleteCategory,
    addSubcategory,
    removeSubcategory,
    renameSubcategory,
  } = useStore();

  // Local form state for category
  const [name, setName] = useState(category.name);
  const [blurb, setBlurb] = useState(category.blurb || '');
  const [imageUrl, setImageUrl] = useState(category.image || images.kurta);
  const [parentKey, setParentKey] = useState<string>(category.parentKey || 'none');
  const [status, setStatus] = useState<'published' | 'draft' | 'hidden'>(
    category.status || 'published'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState(false);

  // Subcategory management state
  const [newSubName, setNewSubName] = useState('');
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editingSubValue, setEditingSubValue] = useState('');
  const [deleteSubTarget, setDeleteSubTarget] = useState<string | null>(null);

  // Subcategory detail view rename state
  const [subRenameValue, setSubRenameValue] = useState('');

  // Search & filter in category products
  const [productSearch, setProductSearch] = useState('');
  const [activeFilterSub, setActiveFilterSub] = useState<string>('all');

  // Sync state when category changes
  useEffect(() => {
    setName(category.name);
    setBlurb(category.blurb || '');
    setImageUrl(category.image || images.kurta);
    setParentKey(category.parentKey || 'none');
    setStatus(category.status || 'published');
    setIsEditingCategory(false);
    setShowImagePicker(false);
    setConfirmDeleteCategory(false);
    setEditingSub(null);
    setDeleteSubTarget(null);
    setNewSubName('');
    setActiveFilterSub('all');
  }, [category]);

  // Sync subcategory rename input
  useEffect(() => {
    if (activeSubcategory) {
      setSubRenameValue(activeSubcategory);
    }
  }, [activeSubcategory]);

  // Filtered products for current view
  const categoryProducts = useMemo(() => {
    const cKeyNorm = (category.key || '').toLowerCase();
    const cNameNorm = (category.name || '').toLowerCase();
    return products.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      return pCat === cKeyNorm || pCat === cNameNorm;
    });
  }, [products, category.key, category.name]);

  const displayedProducts = useMemo(() => {
    let list = categoryProducts;
    if (activeSubcategory) {
      const activeSubNorm = activeSubcategory.toLowerCase();
      list = list.filter((p) => (p.subcategory || '').toLowerCase() === activeSubNorm);
    } else if (activeFilterSub !== 'all') {
      const filterSubNorm = activeFilterSub.toLowerCase();
      list = list.filter((p) => (p.subcategory || '').toLowerCase() === filterSubNorm);
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categoryProducts, activeSubcategory, activeFilterSub, productSearch]);

  // Cancel editing category
  const handleCancelEdit = () => {
    setName(category.name);
    setBlurb(category.blurb || '');
    setImageUrl(category.image || images.kurta);
    setParentKey(category.parentKey || 'none');
    setStatus(category.status || 'published');
    setShowImagePicker(false);
    setIsEditingCategory(false);
  };

  // Handle saving category details
  const handleSaveCategory = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!name.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      const patch: Partial<CategoryItemData> = {
        name: name.trim(),
        blurb: blurb.trim(),
        image: imageUrl.trim(),
        parentKey: parentKey === 'none' ? undefined : parentKey,
        status,
      };
      saveCategory(category.key, patch);
      await categoryService.updateCategory(category.key, {
        name: name.trim(),
        description: blurb.trim() || undefined,
        image: imageUrl.trim() || undefined,
        status,
      });
      toast.success(`Category "${name.trim()}" updated successfully`);
      setIsEditingCategory(false);
      setShowImagePicker(false);
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error?.message || 'Failed to update category');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async () => {
    setIsDeletingCategory(true);
    try {
      deleteCategory(category.key);
      await categoryService.deleteCategory(category.key);
      toast.success(`Category "${category.name}" has been deleted`);
      setConfirmDeleteCategory(false);
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      toast.error(error?.message || 'Failed to delete category');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Handle quick add subcategory
  const handleAddSubcategory = async () => {
    const trimmed = newSubName.trim();
    if (!trimmed) {
      toast.error('Please enter a subcategory name');
      return;
    }
    if (category.subcategories.includes(trimmed)) {
      toast.error(`"${trimmed}" already exists in ${category.name}`);
      return;
    }

    setIsAddingSub(true);
    try {
      await categoryService.createCategory({
        name: trimmed,
        parentId: category.key,
        status: 'published',
      });

      addSubcategory(category.key, trimmed);
      toast.success(`Added subcategory "${trimmed}" to ${category.name}`);
      setNewSubName('');
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to add subcategory:', error);
      toast.error(error?.message || 'Failed to add subcategory');
    } finally {
      setIsAddingSub(false);
    }
  };

  // Handle inline rename subcategory
  const handleInlineRenameSubmit = async (oldSub: string) => {
    const trimmed = editingSubValue.trim();
    if (!trimmed) {
      toast.error('Subcategory name cannot be empty');
      return;
    }
    if (trimmed !== oldSub && category.subcategories.includes(trimmed)) {
      toast.error(`"${trimmed}" already exists in ${category.name}`);
      return;
    }

    try {
      await categoryService.updateCategory(oldSub, {
        name: trimmed,
      });
      renameSubcategory(category.key, oldSub, trimmed);
      toast.success(`Renamed "${oldSub}" to "${trimmed}"`);
      setEditingSub(null);
      if (activeSubcategory === oldSub) {
        onSelectSubcategory?.(trimmed);
      }
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to rename subcategory:', error);
      toast.error(error?.message || 'Failed to rename subcategory');
    }
  };

  // Handle delete subcategory
  const handleDeleteSubcategory = async (sub: string) => {
    try {
      removeSubcategory(category.key, sub);
      await categoryService.deleteCategory(sub);
      toast.success(`Subcategory "${sub}" removed`);
      setDeleteSubTarget(null);
      if (activeSubcategory === sub) {
        onSelectSubcategory?.(null);
      }
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to remove subcategory:', error);
      toast.error('Failed to remove subcategory');
    }
  };

  // Subcategory Detail View (when activeSubcategory is set)
  if (activeSubcategory) {
    const subProductsCount = categoryProducts.filter(
      (p) => p.subcategory === activeSubcategory
    ).length;

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => onSelectSubcategory?.(null)}
              className="inline-flex items-center gap-1.5 font-medium text-ink-muted hover:text-ink cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to {category.name}</span>
            </button>
            <span className="text-line-strong">/</span>
            <span className="text-ink-soft">Subcategory</span>
            <span className="text-line-strong">/</span>
            <span className="font-semibold text-clay">{activeSubcategory}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              href={`/admin/products/new?category=${category.key}&subcategory=${encodeURIComponent(
                activeSubcategory
              )}`}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add product to this subcategory</span>
            </Button>
          </div>
        </div>

        {/* Subcategory Edit Panel */}
        <Panel
          title={activeSubcategory}
          description={`Subcategory of ${category.name} · ${subProductsCount} ${
            subProductsCount === 1 ? 'product' : 'products'
          } assigned`}
        >
          <div className="space-y-5">
            <div className="rounded-md border border-line bg-canvas p-4">
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Subcategory Name
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={subRenameValue}
                  onChange={(e) => setSubRenameValue(e.target.value)}
                  placeholder="Subcategory name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={async () => {
                    const trimmed = subRenameValue.trim();
                    if (!trimmed) {
                      toast.error('Subcategory name cannot be empty');
                      return;
                    }
                    if (
                      trimmed !== activeSubcategory &&
                      category.subcategories.includes(trimmed)
                    ) {
                      toast.error(`"${trimmed}" already exists in ${category.name}`);
                      return;
                    }
                    try {
                      await categoryService.updateCategory(activeSubcategory, {
                        name: trimmed,
                      });
                      renameSubcategory(category.key, activeSubcategory, trimmed);
                      toast.success(
                        `Updated "${activeSubcategory}" to "${trimmed}". Assigned products were updated.`
                      );
                      onSelectSubcategory?.(trimmed);
                      onRefresh?.();
                    } catch (error: any) {
                      console.error('Failed to update subcategory:', error);
                      toast.error(error?.message || 'Failed to update subcategory');
                    }
                  }}
                  className="cursor-pointer shrink-0"
                >
                  <Check className="h-4 w-4" />
                  <span>Update name</span>
                </Button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Renaming this subcategory will automatically update all matching products
                in the store.
              </p>
            </div>

            {/* Subcategory Danger Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div>
                <p className="text-sm font-medium text-ink">Remove subcategory</p>
                <p className="text-xs text-ink-muted">
                  Products in this subcategory will remain in {category.name} with an
                  unassigned subcategory.
                </p>
              </div>
              {deleteSubTarget === activeSubcategory ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteSubTarget(null)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteSubcategory(activeSubcategory)}
                    className="cursor-pointer"
                  >
                    Confirm delete
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteSubTarget(activeSubcategory)}
                  className="text-danger hover:bg-danger/10 hover:text-danger cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  <span>Delete {activeSubcategory}</span>
                </Button>
              )}
            </div>
          </div>
        </Panel>

        {/* Products in this Subcategory */}
        <Panel
          title={`Products in "${activeSubcategory}"`}
          description={`${displayedProducts.length} items`}
        >
          {displayedProducts.length > 0 ? (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/50 text-xs text-ink-muted font-medium">
                    <th className="py-2.5 px-5">Product</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {displayedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-subtle/30 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || images.kurta}
                            alt=""
                            className="h-10 w-10 rounded object-cover border border-line bg-subtle shrink-0"
                          />
                          <div>
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="font-medium text-ink hover:text-clay transition-colors line-clamp-1"
                            >
                              {p.title}
                            </Link>
                            <span className="text-xs text-ink-muted">
                              {p.brand || 'Tanti Studio'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 tabular-nums font-medium text-ink">
                        {formatBDT(p.salePrice ?? p.price)}
                      </td>
                      <td className="py-3 px-3 text-xs text-ink-muted tabular-nums">
                        {p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0} in stock
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          tone={
                            p.status === 'published'
                              ? 'success'
                              : p.status === 'draft'
                              ? 'neutral'
                              : 'warning'
                          }
                          dot
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-clay hover:underline cursor-pointer"
                        >
                          <span>Edit</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Package className="mx-auto h-10 w-10 text-ink-muted/50" />
              <p className="mt-3 text-sm font-medium text-ink">
                No products found in {activeSubcategory}
              </p>
              <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
                Add a new product or edit existing products to assign them to this
                subcategory.
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  href={`/admin/products/new?category=${category.key}&subcategory=${encodeURIComponent(
                    activeSubcategory
                  )}`}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create product in {activeSubcategory}</span>
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    );
  }

  // Main Category View (when activeSubcategory is null)
  return (
    <div className="space-y-6">
      {/* Category Details Panel */}
      <Panel
        title={category.name}
        description={`/category/${category.key} · ${productCount} ${
          productCount === 1 ? 'product' : 'products'
        }`}
        actions={
          isEditingCategory ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                disabled={isSaving}
                className="inline-flex items-center gap-1 rounded-[4px] border border-line bg-surface hover:bg-subtle text-ink-muted hover:text-ink px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveCategory(e);
                }}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-clay hover:bg-clay-dark text-white px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save changes'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge
                tone={
                  status === 'published'
                    ? 'success'
                    : status === 'draft'
                    ? 'neutral'
                    : 'warning'
                }
                dot
              >
                {status}
              </Badge>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditingCategory(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-clay/10 hover:bg-clay text-clay hover:text-white border border-clay/30 px-3.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer shadow-2xs"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Update category</span>
              </button>
            </div>
          )
        }
      >
        <div className="space-y-5">
          <div className="grid gap-6 sm:grid-cols-[160px_1fr] items-start">
            {/* Media column */}
            <div className="space-y-2">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[6px] border border-line bg-subtle shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
                {isEditingCategory && (
                  <button
                    type="button"
                    onClick={() => setShowImagePicker((prev) => !prev)}
                    className="absolute inset-x-0 bottom-0 bg-ink/80 hover:bg-ink text-white py-2 text-xs font-medium text-center cursor-pointer transition-colors backdrop-blur-xs flex items-center justify-center gap-1.5"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Change photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Input fields column */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!isEditingCategory}
                  placeholder="Category name"
                  required
                  autoFocus={isEditingCategory}
                  className={cn(
                    'h-10 w-full rounded-[4px] border border-line-strong bg-surface px-3 text-sm text-ink transition-all',
                    isEditingCategory
                      ? 'focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 cursor-text'
                      : 'cursor-default select-text'
                  )}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                  readOnly={!isEditingCategory}
                  placeholder="Category description"
                  className={cn(
                    'w-full rounded-[4px] border border-line-strong bg-surface px-3 py-2 text-sm text-ink transition-all',
                    isEditingCategory
                      ? 'focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 cursor-text'
                      : 'cursor-default select-text resize-none'
                  )}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Parent
                </label>
                {isEditingCategory ? (
                  <select
                    value={parentKey}
                    onChange={(e) => setParentKey(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-line-strong bg-surface px-3 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 cursor-pointer"
                  >
                    <option value="none">— None (top level)</option>
                    {allCategories
                      .filter((c) => c.key !== category.key)
                      .map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={
                      parentKey === 'none' || !parentKey
                        ? '— None (top level)'
                        : allCategories.find((c) => c.key === parentKey)?.name ||
                          parentKey
                    }
                    className="h-10 w-full rounded-[4px] border border-line-strong bg-surface px-3 text-sm text-ink cursor-default"
                  />
                )}
              </div>

              {isEditingCategory && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'published' | 'draft' | 'hidden')
                    }
                    className="h-10 w-full rounded-[4px] border border-line-strong bg-surface px-3 text-sm text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Image picker when editing */}
          {isEditingCategory && showImagePicker && (
            <div className="rounded-xl border border-line bg-canvas p-4 space-y-3 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink">
                  Select a theme photo or paste image URL:
                </p>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(false)}
                  className="text-xs text-ink-muted hover:text-ink cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-9 gap-2">
                {sampleImages.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setImageUrl(s.src);
                    }}
                    className={cn(
                      'relative aspect-[3/4] overflow-hidden rounded-lg border transition-all cursor-pointer',
                      imageUrl === s.src
                        ? 'border-clay ring-2 ring-clay'
                        : 'border-line hover:border-ink/60'
                    )}
                    title={s.label}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.src}
                      alt={s.label}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <Input
                label="Custom Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="text-xs"
              />
            </div>
          )}
        </div>
      </Panel>

      {/* Subcategories Management Panel */}
      <Panel
        title={`Subcategories (${category.subcategories.length})`}
        description={`Manage specific product lines under ${category.name}. Click any subcategory to view or filter its products.`}
      >
        <div className="space-y-5">
          {/* Quick Add Form */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={`Add a subcategory to ${category.name} (e.g. Sarees, Tunics)...`}
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubcategory();
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              loading={isAddingSub}
              onClick={handleAddSubcategory}
              className="cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add subcategory</span>
            </Button>
          </div>

          {/* Subcategories List */}
          {category.subcategories.length > 0 ? (
            <div className="divide-y divide-line rounded-md border border-line bg-surface">
              {category.subcategories.map((sub) => {
                const isEditing = editingSub === sub;
                const isDeleting = deleteSubTarget === sub;
                const count = getProductCount
                  ? getProductCount(category.key, sub)
                  : categoryProducts.filter((p) => p.subcategory === sub).length;

                return (
                  <div
                    key={sub}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-subtle/30 transition-colors"
                  >
                    {/* Left: icon & title / edit mode */}
                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Tag className="h-4 w-4 text-clay shrink-0" />
                        <Input
                          value={editingSubValue}
                          onChange={(e) => setEditingSubValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineRenameSubmit(sub);
                            } else if (e.key === 'Escape') {
                              setEditingSub(null);
                            }
                          }}
                          autoFocus
                          className="h-8 text-sm max-w-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleInlineRenameSubmit(sub)}
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          title="Save rename"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSub(null)}
                          className="rounded p-1 text-ink-muted hover:bg-subtle cursor-pointer"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <Tag className="h-4 w-4 text-ink-muted shrink-0" />
                        <button
                          type="button"
                          onClick={() => onSelectSubcategory?.(sub)}
                          className="font-medium text-ink hover:text-clay text-left cursor-pointer transition-colors"
                        >
                          {sub}
                        </button>
                        <span className="rounded-full bg-subtle px-2 py-0.5 text-xs text-ink-muted font-medium tabular-nums">
                          {count} {count === 1 ? 'product' : 'products'}
                        </span>
                      </div>
                    )}

                    {/* Right: Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectSubcategory?.(sub)}
                          className="text-xs cursor-pointer text-ink-soft hover:text-ink"
                        >
                          Filter products
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingSub(sub);
                            setEditingSubValue(sub);
                          }}
                          className="rounded p-1.5 text-ink-muted hover:bg-subtle hover:text-ink cursor-pointer transition-colors"
                          title={`Rename ${sub}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {isDeleting ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteSubcategory(sub)}
                              className="rounded bg-danger/10 px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/20 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteSubTarget(null)}
                              className="rounded p-1 text-ink-muted hover:bg-subtle cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteSubTarget(sub)}
                            className="rounded p-1.5 text-ink-muted hover:bg-danger/10 hover:text-danger cursor-pointer transition-colors"
                            title={`Delete ${sub}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-line p-6 text-center">
              <Tag className="mx-auto h-8 w-8 text-ink-muted/50" />
              <p className="mt-2 text-sm font-medium text-ink">
                No subcategories created yet
              </p>
              <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
                Add subcategories above so customers can easily filter between
                different styles in {category.name}.
              </p>
            </div>
          )}
        </div>
      </Panel>

      {/* Products under this Category Panel */}
      <Panel
        title={`Products in ${category.name}`}
        description={`${categoryProducts.length} total products`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            href={`/admin/products/new?category=${category.key}`}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add product</span>
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Subcategory Filter Pills and Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFilterSub('all')}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors',
                  activeFilterSub === 'all'
                    ? 'bg-ink text-canvas font-semibold'
                    : 'bg-subtle text-ink-muted hover:text-ink'
                )}
              >
                All ({categoryProducts.length})
              </button>
              {category.subcategories.map((sub) => {
                const subCount = categoryProducts.filter(
                  (p) => p.subcategory === sub
                ).length;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setActiveFilterSub(sub)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors',
                      activeFilterSub === sub
                        ? 'bg-ink text-canvas font-semibold'
                        : 'bg-subtle text-ink-muted hover:text-ink'
                    )}
                  >
                    {sub} ({subCount})
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-muted" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="h-8 w-full rounded-md border border-line bg-surface pl-8 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none"
              />
            </div>
          </div>

          {/* Product Table */}
          {displayedProducts.length > 0 ? (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/50 text-xs text-ink-muted font-medium">
                    <th className="py-2.5 px-5">Product</th>
                    <th className="py-2.5 px-3">Subcategory</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {displayedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-subtle/30 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || images.kurta}
                            alt=""
                            className="h-10 w-10 rounded object-cover border border-line bg-subtle shrink-0"
                          />
                          <div>
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="font-medium text-ink hover:text-clay transition-colors line-clamp-1"
                            >
                              {p.title}
                            </Link>
                            <span className="text-xs text-ink-muted">
                              {p.brand || 'Tanti Studio'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {p.subcategory ? (
                          <span className="inline-flex items-center rounded-full bg-subtle px-2 py-0.5 text-xs text-ink">
                            {p.subcategory}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 tabular-nums font-medium text-ink">
                        {formatBDT(p.salePrice ?? p.price)}
                      </td>
                      <td className="py-3 px-3 text-xs text-ink-muted tabular-nums">
                        {p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0} in stock
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          tone={
                            p.status === 'published'
                              ? 'success'
                              : p.status === 'draft'
                              ? 'neutral'
                              : 'warning'
                          }
                          dot
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-clay hover:underline cursor-pointer"
                        >
                          <span>Edit</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Package className="mx-auto h-8 w-8 text-ink-muted/50" />
              <p className="mt-2 text-sm font-medium text-ink">No products found</p>
              <p className="mt-1 text-xs text-ink-muted">
                {productSearch
                  ? 'Try a different search keyword.'
                  : `No products assigned to ${category.name} yet.`}
              </p>
            </div>
          )}
        </div>
      </Panel>

      {/* Danger Zone: Delete Category */}
      <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-danger font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Danger Zone</span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Deleting this category will remove it from the store catalog, navigation,
              and filters.
            </p>
          </div>
          {confirmDeleteCategory ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteCategory(false)}
                disabled={isDeletingCategory}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isDeletingCategory}
                onClick={handleDeleteCategory}
                className="cursor-pointer"
              >
                Yes, delete category
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDeleteCategory(true)}
              className="cursor-pointer self-start sm:self-center"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              <span>Delete this category</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
