'use client';

import React, { useState, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  Hand,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { images } from '@/data/images';
import { collectionService } from '@/services/collection-service';
import type { Product } from '@/types/product';
import type { CollectionItem, CollectionType, CollectionRule } from '@/types/collection';

type ImageMode = 'upload' | 'url' | 'products';

interface UploadedImageState {
  file?: File;
  url: string;
  name: string;
  size?: string;
}

const typeOptions: [CollectionType, string, string, React.ReactNode][] = [
  [
    'rule',
    'Automated',
    'Products matching rules are added automatically',
    <Sparkles key="rule-icon" className="h-4 w-4 text-clay" aria-hidden />,
  ],
  [
    'manual',
    'Manual',
    'Choose products one by one by hand',
    <Hand key="manual-icon" className="h-4 w-4 text-ink-muted" aria-hidden />,
  ],
];

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  initialCollection?: CollectionItem | null;
  onSaveCollection?: (collection: CollectionItem, isNew: boolean) => void;
  onCreateCollection?: (newCollection: CollectionItem) => void;
}

interface CollectionFormProps {
  products: Product[];
  initialCollection?: CollectionItem | null;
  onClose: () => void;
  onSaveCollection?: (collection: CollectionItem, isNew: boolean) => void;
  onCreateCollection?: (newCollection: CollectionItem) => void;
}

function parseInitialRule(initialCollection?: CollectionItem | null): CollectionRule {
  if (!initialCollection) {
    return { field: 'Tag', op: 'contains', value: 'eid' };
  }
  if (initialCollection.ruleDetails) {
    return initialCollection.ruleDetails;
  }
  if (initialCollection.rule) {
    const parts = initialCollection.rule.match(/(\w+)\s+(contains|equals|is less than)\s+"?([^"]+)"?/i);
    if (parts) {
      return { field: parts[1], op: parts[2], value: parts[3] };
    }
  }
  return { field: 'Tag', op: 'contains', value: 'eid' };
}

function parseInitialProductSlugs(
  initialCollection?: CollectionItem | null,
  products: Product[] = []
): string[] {
  if (!initialCollection) return [];
  if (initialCollection.productSlugs && initialCollection.productSlugs.length > 0) {
    return initialCollection.productSlugs;
  }
  return products
    .filter((p) => p.collections?.includes(initialCollection.slug))
    .map((p) => p.slug);
}

function CollectionForm({
  products,
  initialCollection,
  onClose,
  onSaveCollection,
  onCreateCollection,
}: CollectionFormProps) {
  const isEditing = Boolean(initialCollection);
  const initialImage = initialCollection?.image || '';

  const [title, setTitle] = useState(initialCollection?.name || '');
  const [description, setDescription] = useState(initialCollection?.description || '');
  const [type, setType] = useState<CollectionType>(initialCollection?.type || 'rule');
  const [rule, setRule] = useState<CollectionRule>(() => parseInitialRule(initialCollection));
  const [selectedProductSlugs, setSelectedProductSlugs] = useState<string[]>(() =>
    parseInitialProductSlugs(initialCollection, products)
  );
  const [productSearch, setProductSearch] = useState('');
  const [isFeatured, setIsFeatured] = useState(Boolean(initialCollection?.isFeatured));
  const [isActive, setIsActive] = useState(initialCollection?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(initialCollection?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialCollection?.seoDescription || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exclusive Image Mode & States
  const [imageMode, setImageMode] = useState<ImageMode>(() => {
    if (initialImage.startsWith('data:') || initialImage.startsWith('blob:')) return 'upload';
    if (initialImage.startsWith('http://') || initialImage.startsWith('https://')) return 'url';
    return 'upload';
  });

  const [uploadedImage, setUploadedImage] = useState<UploadedImageState | null>(() => {
    if (initialImage && (initialImage.startsWith('data:') || initialImage.startsWith('blob:'))) {
      return { url: initialImage, name: 'Current banner image' };
    }
    return null;
  });

  const [urlImage, setUrlImage] = useState(() => {
    if (initialImage && (initialImage.startsWith('http://') || initialImage.startsWith('https://'))) {
      return initialImage;
    }
    return '';
  });

  const [productSelectedImage, setProductSelectedImage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automated Rule Matches
  const ruleMatches = useMemo(() => {
    const v = rule.value.toLowerCase().trim();
    if (!v) return [];
    return products.filter((p) => {
      if (rule.field === 'Tag') {
        return p.tags?.some((t) => t.toLowerCase().includes(v));
      }
      if (rule.field === 'Price') {
        const num = Number(rule.value);
        if (isNaN(num)) return false;
        return (p.salePrice ?? p.price) < num;
      }
      return p.title.toLowerCase().includes(v);
    });
  }, [products, rule]);

  // Filtered products for manual picker
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  // Candidate images from products
  const suggestedImages = useMemo(() => {
    const pool = type === 'rule' ? ruleMatches : products.filter((p) => selectedProductSlugs.includes(p.slug));
    const imgs: string[] = [];
    pool.forEach((p) => {
      if (p.images?.[0] && !imgs.includes(p.images[0])) {
        imgs.push(p.images[0]);
      }
    });
    if (imgs.length === 0) {
      return [images.hero, images.saree, images.coord, images.bag];
    }
    return imgs.slice(0, 8);
  }, [type, ruleMatches, products, selectedProductSlugs]);

  // Handle local file upload
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WEBP, AVIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage({
        file,
        url: result,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
      setImageMode('upload');
      toast.success(`Image "${file.name}" loaded for collection`);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const toggleProductSelect = (slug: string) => {
    setSelectedProductSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSelectAllFiltered = () => {
    const slugsToAdd = filteredProducts.map((p) => p.slug);
    setSelectedProductSlugs((prev) => Array.from(new Set([...prev, ...slugsToAdd])));
  };

  const handleDeselectAll = () => {
    setSelectedProductSlugs([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a collection title');
      return;
    }

    const slug =
      initialCollection?.slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Single Authoritative Image Source based on active imageMode
    let finalImage = '';
    if (imageMode === 'upload' && uploadedImage?.url) {
      finalImage = uploadedImage.url;
    } else if (imageMode === 'url' && urlImage.trim()) {
      finalImage = urlImage.trim();
    } else if (imageMode === 'products' && productSelectedImage) {
      finalImage = productSelectedImage;
    } else {
      // Fallback only if the active mode was left completely empty
      finalImage =
        (type === 'rule'
          ? ruleMatches[0]?.images?.[0]
          : products.find((p) => selectedProductSlugs.includes(p.slug))?.images?.[0]) ||
        images.hero;
    }

    const finalDescription =
      description.trim() ||
      (type === 'rule'
        ? `Automated collection based on ${rule.field} ${rule.op} "${rule.value}".`
        : `Handpicked selection of ${selectedProductSlugs.length} items.`);

    const formattedRule =
      type === 'rule' ? `${rule.field} ${rule.op} "${rule.value}"` : undefined;

    const savedCol: CollectionItem = {
      slug,
      name: title.trim(),
      description: finalDescription,
      image: finalImage,
      type,
      rule: formattedRule,
      ruleDetails: type === 'rule' ? rule : undefined,
      productSlugs: type === 'manual' ? selectedProductSlugs : ruleMatches.map((p) => p.slug),
      isFeatured,
      isActive,
      seoTitle: seoTitle.trim() || title.trim(),
      seoDescription: seoDescription.trim() || finalDescription,
    };

    setIsSubmitting(true);
    try {
      if (!isEditing) {
        // 1. Call backend API to create collection in PostgreSQL DB
        await collectionService.createCollection({
          name: title.trim(),
          slug,
          description: finalDescription,
          image: finalImage || undefined,
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
          type: type.toUpperCase() as 'MANUAL' | 'RULE',
          rule: type === 'rule' ? rule : undefined,
          isActive,
          isFeatured,
          tenantId: 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2',
        });
      } else if (initialCollection) {
        // 2. Call backend API to update existing collection in PostgreSQL DB
        await collectionService.updateCollection(initialCollection.slug, {
          name: title.trim(),
          slug,
          description: finalDescription,
          image: finalImage || undefined,
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
          type: type.toUpperCase() as 'MANUAL' | 'RULE',
          rule: type === 'rule' ? rule : undefined,
          isActive,
          isFeatured,
          tenantId: 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2',
        });
      }

      if (onSaveCollection) {
        onSaveCollection(savedCol, !isEditing);
      } else if (onCreateCollection) {
        onCreateCollection(savedCol);
      }

      toast.success(
        isEditing
          ? `Collection "${savedCol.name}" updated successfully`
          : `Collection "${savedCol.name}" created successfully!`
      );
      onClose();
    } catch (error: any) {
      console.error('Failed to save collection:', error);
      toast.error(error?.message || 'Failed to save collection');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-2">
      {/* Basic Information */}
      <div className="space-y-4">
        <Input
          label="Collection Title"
          placeholder="e.g. Eid Festive Edit 2026, Summer Silks"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Textarea
          label="Description"
          placeholder="Give your collection a brief story, theme note, or promotional message..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Collection Type Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Collection Type</label>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Collection type">
          {typeOptions.map(([v, t, d, icon]) => {
            const isChecked = type === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={isChecked}
                onClick={() => setType(v)}
                className={cn(
                  'rounded-lg border p-3.5 text-left transition-all cursor-pointer flex items-start gap-3',
                  isChecked
                    ? 'border-ink ring-2 ring-ink/10 bg-canvas/60 shadow-xs'
                    : 'border-line-strong bg-surface hover:bg-subtle/50'
                )}
              >
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div>
                  <span className="block text-sm font-semibold text-ink">{t}</span>
                  <span className="block text-xs text-ink-muted mt-0.5 leading-relaxed">{d}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AUTOMATED RULE SECTION */}
      {type === 'rule' && (
        <div className="rounded-xl border border-line bg-canvas/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-clay" />
              <span>Condition Rules</span>
            </span>
            <span className="text-xs text-ink-muted">
              <span className="font-semibold text-ink">{ruleMatches.length}</span> products match
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <Select
              label="Field"
              aria-label="Field"
              value={rule.field}
              onChange={(e) => setRule({ ...rule, field: e.target.value })}
              options={['Tag', 'Title', 'Price']}
            />
            <Select
              label="Operator"
              aria-label="Operator"
              value={rule.op}
              onChange={(e) => setRule({ ...rule, op: e.target.value })}
              options={rule.field === 'Price' ? ['is less than'] : ['contains', 'equals']}
            />
            <Input
              label="Value"
              aria-label="Value"
              value={rule.value}
              onChange={(e) => setRule({ ...rule, value: e.target.value })}
              placeholder={rule.field === 'Price' ? 'e.g. 2000' : 'e.g. silk, handwoven, eid'}
            />
          </div>

          {ruleMatches.length > 0 ? (
            <div className="pt-2">
              <p className="text-xs text-ink-muted mb-2">Live matching preview:</p>
              <div className="flex flex-wrap gap-2">
                {ruleMatches.slice(0, 10).map((p) => (
                  <div
                    key={p.id}
                    className="group relative h-14 w-12 overflow-hidden rounded-md border border-line bg-subtle"
                    title={`${p.title} (৳${p.salePrice ?? p.price})`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images?.[0] || images.hero}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                ))}
                {ruleMatches.length > 10 && (
                  <div className="flex h-14 w-12 items-center justify-center rounded-md border border-dashed border-line bg-surface text-xs font-medium text-ink-muted">
                    +{ruleMatches.length - 10}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-warning pt-1">
              No products currently match this rule. You can still save it and products will be added automatically when tags/prices change.
            </p>
          )}
        </div>
      )}

      {/* MANUAL PRODUCT PICKER SECTION */}
      {type === 'manual' && (
        <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <Hand className="h-4 w-4 text-ink-muted" />
                <span>Select Products for Collection</span>
              </span>
              <p className="text-xs text-ink-muted mt-0.5">
                {selectedProductSlugs.length} of {products.length} products selected
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAllFiltered}
                className="text-xs h-7 px-2 cursor-pointer"
              >
                Select matching ({filteredProducts.length})
              </Button>
              {selectedProductSlugs.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs h-7 px-2 text-ink-muted hover:text-danger cursor-pointer"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Search filter for picker */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search products by title, category, or tag..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-line bg-canvas/50 pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
            />
          </div>

          {/* Scrollable list of selectable products */}
          <div className="max-h-56 overflow-y-auto rounded-lg border border-line divide-y divide-line/60 bg-surface">
            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-muted">
                No products found matching &quot;{productSearch}&quot;
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = selectedProductSlugs.includes(p.slug);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProductSelect(p.slug)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer select-none',
                      isSelected ? 'bg-canvas/80' : 'hover:bg-subtle/50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        isSelected
                          ? 'border-ink bg-ink text-canvas'
                          : 'border-line-strong bg-surface'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>

                    <div className="h-10 w-9 shrink-0 overflow-hidden rounded bg-subtle">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images?.[0] || images.hero}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-ink">{p.title}</p>
                      <p className="text-[11px] text-ink-muted capitalize">
                        {p.category} &bull; ৳{p.salePrice ?? p.price}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="shrink-0 text-[11px] font-medium text-clay">
                        Added
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* EXCLUSIVE BANNER IMAGE SELECTION SECTION */}
      <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
        {/* Header with Exclusive Mode Switcher */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="block text-sm font-semibold text-ink">
              Collection Banner Image
            </label>
            <p className="text-xs text-ink-muted mt-0.5">
              Choose only one active method for the banner.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex rounded-lg border border-line bg-canvas/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setImageMode('upload')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all cursor-pointer',
                imageMode === 'upload'
                  ? 'bg-ink text-canvas shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setImageMode('url')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all cursor-pointer',
                imageMode === 'url'
                  ? 'bg-ink text-canvas shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Image URL</span>
            </button>

            <button
              type="button"
              onClick={() => setImageMode('products')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all cursor-pointer',
                imageMode === 'products'
                  ? 'bg-ink text-canvas shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>From Products</span>
            </button>
          </div>
        </div>

        {/* 1. FILE UPLOAD MODE */}
        {imageMode === 'upload' && (
          <div className="space-y-3 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {uploadedImage?.url ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start rounded-xl border border-line bg-canvas/30 p-3.5">
                <div className="relative aspect-[16/9] w-full sm:w-44 shrink-0 overflow-hidden rounded-lg border border-line bg-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage.url}
                    alt={uploadedImage.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1.5 py-0.5 text-[9px] font-medium text-white">
                    Active Upload
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-2 py-0.5">
                  <div>
                    <p className="truncate text-xs font-semibold text-ink">
                      {uploadedImage.name}
                    </p>
                    {uploadedImage.size && (
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Size: {uploadedImage.size} &bull; Ready to save
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-7.5 px-2.5 cursor-pointer"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Replace file
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedImage(null)}
                      className="text-xs h-7.5 px-2 text-danger hover:bg-danger-soft/60 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none',
                  isDragging
                    ? 'border-clay bg-clay/10 scale-[0.99]'
                    : 'border-line-strong hover:border-ink hover:bg-subtle/30 bg-canvas/20'
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface shadow-xs border border-line text-ink">
                  <UploadCloud className="h-5 w-5 text-clay" />
                </div>
                <p className="mt-3 text-xs font-semibold text-ink">
                  Click to browse or drag and drop image here
                </p>
                <p className="mt-1 text-[11px] text-ink-muted">
                  Supports PNG, JPG, WebP, AVIF up to 5MB (Recommended: 16:9 banner)
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. DIRECT IMAGE URL MODE */}
        {imageMode === 'url' && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative aspect-[16/9] w-full sm:w-44 shrink-0 overflow-hidden rounded-lg border border-line bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urlImage.trim() || images.hero}
                  alt="URL Preview"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1.5 py-0.5 text-[9px] font-medium text-white">
                  {urlImage.trim() ? 'Active URL' : 'Default'}
                </span>
              </div>

              <div className="flex-1 w-full space-y-2">
                <Input
                  label="Direct Image URL"
                  placeholder="https://example.com/images/banner.jpg"
                  value={urlImage}
                  onChange={(e) => setUrlImage(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-ink-muted">
                  Paste any public image link. This URL will be used exclusively as the collection cover.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. PICK FROM PRODUCTS MODE */}
        {imageMode === 'products' && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative aspect-[16/9] w-full sm:w-44 shrink-0 overflow-hidden rounded-lg border border-line bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={productSelectedImage || suggestedImages[0] || images.hero}
                  alt="Product Selected"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 right-1 rounded bg-clay px-1.5 py-0.5 text-[9px] font-medium text-white">
                  From Product
                </span>
              </div>

              <div className="flex-1 space-y-2">
                <span className="block text-xs font-medium text-ink">
                  Click any product image below to set as collection cover:
                </span>
                <div className="flex flex-wrap gap-2">
                  {suggestedImages.map((imgUrl, idx) => {
                    const isSelected =
                      productSelectedImage === imgUrl ||
                      (!productSelectedImage && idx === 0);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProductSelectedImage(imgUrl)}
                        className={cn(
                          'relative h-11 w-14 overflow-hidden rounded-md border transition-all cursor-pointer',
                          isSelected
                            ? 'border-clay ring-2 ring-clay/50 scale-105 shadow-xs'
                            : 'border-line hover:border-ink-muted opacity-80 hover:opacity-100'
                        )}
                        title="Select this image"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt="Thumbnail"
                          className="h-full w-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-ink/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white drop-shadow-md" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Source Indicator Pill */}
        <div className="flex items-center justify-between border-t border-line/60 pt-2.5 text-[11px] text-ink-muted">
          <span>Active image source:</span>
          <span className="font-semibold text-ink capitalize flex items-center gap-1">
            {imageMode === 'upload' && <Upload className="h-3 w-3 text-clay" />}
            {imageMode === 'url' && <LinkIcon className="h-3 w-3 text-clay" />}
            {imageMode === 'products' && <ImageIcon className="h-3 w-3 text-clay" />}
            {imageMode === 'upload' ? 'Local File Upload' : imageMode === 'url' ? 'External URL' : 'Product Selection'}
          </span>
        </div>
      </div>

      {/* Collapsible Display & SEO settings */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between p-3.5 text-left text-sm font-medium text-ink hover:bg-subtle/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-ink-muted" />
            <span>Display &amp; SEO Options</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 text-ink-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-ink-muted" />
          )}
        </button>

        {showAdvanced && (
          <div className="space-y-4 border-t border-line p-4 bg-canvas/10 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-6">
              <Switch
                checked={isFeatured}
                onChange={setIsFeatured}
                label="Feature this collection on storefront homepage"
              />
              <Switch
                checked={isActive}
                onChange={setIsActive}
                label="Collection is active &amp; visible to buyers"
              />
            </div>

            <div className="space-y-3 pt-2">
              <Input
                label="SEO Meta Title"
                placeholder={title || 'e.g. Exclusive Eid Collection 2026 | Tanti'}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />

              <Textarea
                label="SEO Meta Description"
                placeholder="Summary for search engines (Google) and social share previews..."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {isEditing ? 'Save changes' : 'Create collection'}
        </Button>
      </div>
    </form>
  );
}

export function CreateCollectionModal({
  open,
  onClose,
  products,
  initialCollection,
  onSaveCollection,
  onCreateCollection,
}: CreateCollectionModalProps) {
  if (!open) return null;

  const isEditing = Boolean(initialCollection);
  const formKey = initialCollection ? `edit-${initialCollection.slug}` : 'create-new';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEditing ? 'Edit collection' : 'Create collection'}
      description={
        isEditing
          ? 'Update collection details, rules, or banner image.'
          : 'Group products into an automated or handpicked collection.'
      }
    >
      <CollectionForm
        key={formKey}
        products={products}
        initialCollection={initialCollection}
        onClose={onClose}
        onSaveCollection={onSaveCollection}
        onCreateCollection={onCreateCollection}
      />
    </Modal>
  );
}
