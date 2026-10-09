'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Copy,
  ExternalLink,
  ImagePlus,
  X,
  Plus,
  Loader2,
  Upload,
  Link as LinkIcon,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useAdmin } from '@/contexts/AdminContext';
import { brands as seedBrands, categories as seedCategories, collections as seedCollections } from '@/data/products';
import { images } from '@/data/images';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { available } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';
import type { Product, Variant, CategoryKey, CreateProductPayload } from '@/types';
import {
  productService,
  mapBackendProductToFrontend,
  categoryService,
  brandService,
  collectionService,
  CategoryResponseData,
  BrandResponseData,
  CollectionResponseData,
} from '@/services';

const blankProduct: Product = {
  id: '',
  slug: '',
  title: '',
  brand: 'Tanti Studio',
  category: 'women',
  subcategory: 'Kurtas',
  collections: [],
  tags: [],
  images: [images.kurta],
  price: 0,
  cost: 0,
  rating: 0,
  reviewCount: 0,
  sold: 0,
  createdAt: new Date().toISOString(),
  status: 'draft',
  shortDescription: '',
  description: '',
  colors: [{ name: 'Indigo', hex: '#2E3A67' }],
  sizes: ['S', 'M', 'L'],
  variants: [],
  specs: [{ label: 'Fabric', value: '' }],
  weightGrams: 400,
  barcode: '',
};

const palette = [
  { name: 'Indigo', hex: '#2E3A67' },
  { name: 'Clay', hex: '#B5562F' },
  { name: 'Sage', hex: '#8A9A7B' },
  { name: 'Ivory', hex: '#EFE8DA' },
  { name: 'Black', hex: '#1C1A17' },
  { name: 'Mustard', hex: '#C9962E' },
];

const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const imagePool = Object.values(images);

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function ProductEditor({ id }: { id?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, saveProduct, categories: storeCategories, addSubcategory } = useStore();
  const { can } = useAdmin();
  const existing = products.find((p) => p.id === id);

  const paramCategory = searchParams?.get('category');
  const paramSubcategory = searchParams?.get('subcategory');

  // Live Database States
  const [dbCategories, setDbCategories] = useState<CategoryResponseData[]>([]);
  const [dbBrands, setDbBrands] = useState<BrandResponseData[]>([]);
  const [dbCollections, setDbCollections] = useState<CollectionResponseData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Categories, Brands, and Collections from backend
  useEffect(() => {
    let mounted = true;
    const fetchDropdownData = async () => {
      try {
        const [catRes, brandRes, colRes] = await Promise.allSettled([
          categoryService.getCategories(),
          brandService.getBrands(),
          collectionService.getCollections(),
        ]);

        if (!mounted) return;

        if (catRes.status === 'fulfilled' && catRes.value?.data) {
          setDbCategories(catRes.value.data);
        }
        if (brandRes.status === 'fulfilled' && brandRes.value?.data) {
          setDbBrands(brandRes.value.data);
        }
        if (colRes.status === 'fulfilled' && colRes.value?.data) {
          setDbCollections(colRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load product relational data', err);
      }
    };

    fetchDropdownData();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch product by ID from backend
  useEffect(() => {
    if (id) {
      productService.getProductById(id).then((found) => {
        if (found) {
          setP(found);
        }
      });
    }
  }, [id]);

  const [p, setP] = useState<Product>(() => {
    if (existing) return existing;
    return {
      ...blankProduct,
      category: (paramCategory || blankProduct.category) as CategoryKey,
      subcategory: paramSubcategory || blankProduct.subcategory,
    };
  });

  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const readOnly = !can('products', existing ? 'update' : 'create');

  // Media Manager States & Handlers
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [inputImageUrl, setInputImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const set = (patch: Partial<Product>) => {
    setP((x) => ({ ...x, ...patch }));
    setDirty(true);
  };

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
      if (result) {
        set({ images: [...p.images, result] });
        toast.success(`Image "${file.name}" added to gallery`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddUrlImage = () => {
    const trimmed = inputImageUrl.trim();
    if (!trimmed) {
      toast.error('Please enter a valid image URL');
      return;
    }
    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('/')
    ) {
      toast.error('Image URL must start with http:// or https://');
      return;
    }
    set({ images: [...p.images, trimmed] });
    setInputImageUrl('');
    toast.success('Image URL added to gallery');
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const newImages = [...p.images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    set({ images: newImages });
    toast.success('Main cover image updated');
  };

  const handleRemoveImage = (index: number) => {
    set({ images: p.images.filter((_, i) => i !== index) });
    toast.success('Image removed from gallery');
  };

  const margin = p.price
    ? Math.round((((p.salePrice ?? p.price) - p.cost) / (p.salePrice ?? p.price)) * 100)
    : 0;

  // Process Category List (Merge DB categories or fallback to storeCategories)
  const categoryOptions = useMemo(() => {
    if (dbCategories.length > 0) {
      const parents = dbCategories.filter((c) => !c.parentId);
      return parents.map((parent) => {
        const subcategories = dbCategories
          .filter((c) => c.parentId === parent.id)
          .map((sub) => ({ id: sub.id, name: sub.name, slug: sub.slug }));

        return {
          id: parent.id,
          key: parent.slug,
          name: parent.name,
          subcategories,
        };
      });
    }

    const fallback = storeCategories && storeCategories.length > 0 ? storeCategories : seedCategories;
    return fallback.map((c) => ({
      id: c.key,
      key: c.key,
      name: c.name,
      subcategories: (c.subcategories || []).map((name) => ({ id: name, name, slug: slugify(name) })),
    }));
  }, [dbCategories, storeCategories]);

  // Current active category object
  const activeCategory = useMemo(() => {
    return (
      categoryOptions.find((c) => c.key === p.category || c.id === p.category) ??
      categoryOptions[0]
    );
  }, [categoryOptions, p.category]);

  // Brand Options
  const brandOptions = useMemo(() => {
    if (dbBrands.length > 0) {
      return dbBrands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }));
    }
    return seedBrands.map((b) => ({ id: b.name, name: b.name, slug: slugify(b.name) }));
  }, [dbBrands]);

  // Collection Options
  const collectionOptions = useMemo(() => {
    if (dbCollections.length > 0) {
      return dbCollections.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
    }
    return seedCollections.map((c) => ({ id: c.slug, name: c.name, slug: c.slug }));
  }, [dbCollections]);

  const generateVariants = () => {
    const vs: Variant[] = [];
    p.colors.forEach((c) =>
      p.sizes.forEach((s) => {
        const prev = p.variants.find((v) => v.color === c.name && v.size === s);
        vs.push(
          prev ?? {
            id: `v-${c.name}-${s}-${Date.now()}`,
            sku: `TN-${slugify(p.title).slice(0, 4).toUpperCase() || 'NEW'}-${c.name.slice(0, 3).toUpperCase()}-${s}`,
            color: c.name,
            size: s,
            price: p.price,
            salePrice: p.salePrice,
            stock: 10,
            reserved: 0,
            enabled: true,
          }
        );
      })
    );
    set({ variants: vs });
    toast.success(`${vs.length} variants generated`);
  };

  const setVariant = (vid: string, patch: Partial<Variant>) =>
    set({ variants: p.variants.map((v) => (v.id === vid ? { ...v, ...patch } : v)) });

  // Save / Publish Handler
  const save = async (status?: Product['status']) => {
    const er: Record<string, string> = {};
    if (p.title.trim().length < 3) er.title = 'Enter a product title';
    if (!p.price || p.price <= 0) er.price = 'Enter a valid price';
    if (p.salePrice && p.salePrice >= p.price) er.salePrice = 'Sale price must be lower than the price';
    if (!p.category) er.category = 'Select a category';

    setErrors(er);
    if (Object.keys(er).length) {
      return toast.error('Please fix the highlighted errors');
    }

    setIsSubmitting(true);
    try {
      const finalStatus = status ?? p.status;
      const backendStatus = finalStatus === 'published' ? 'PUBLISHED' : finalStatus === 'archived' ? 'ARCHIVED' : 'DRAFT';

      // Find Category ID / Slug
      const categoryId = activeCategory ? activeCategory.id || activeCategory.key : p.category;

      // Find Subcategory ID / Slug
      let subcategoryId: string | undefined = undefined;
      if (p.subcategory) {
        const matchedSub = activeCategory?.subcategories.find(
          (s) => s.name === p.subcategory || s.slug === p.subcategory || s.id === p.subcategory
        );
        subcategoryId = matchedSub ? matchedSub.id : p.subcategory;
      }

      // Find Brand ID
      const matchedBrand = brandOptions.find(
        (b) => b.name === p.brand || b.slug === p.brand || b.id === p.brand
      );
      const brandId = matchedBrand ? matchedBrand.id : undefined;

      // Format specs as key-value object
      const specsObj = p.specs?.reduce((acc, curr) => {
        if (curr.label?.trim() && curr.value?.trim()) {
          acc[curr.label.trim()] = curr.value.trim();
        }
        return acc;
      }, {} as Record<string, any>);

      // Map Variants
      const variantsData =
        p.variants.length > 0
          ? p.variants.map((v) => ({
              sku: v.sku?.trim() || undefined,
              color: v.color.trim(),
              colorHex: p.colors.find((c) => c.name === v.color)?.hex,
              size: v.size.trim(),
              price: Number(v.price || p.price),
              salePrice: v.salePrice !== undefined ? Number(v.salePrice) : undefined,
              stock: Number(v.stock || 0),
              enabled: v.enabled ?? true,
            }))
          : undefined;

      // Map Images
      const imagesData =
        p.images.length > 0
          ? p.images.map((url, idx) => ({
              url: url.trim(),
              alt: p.title.trim(),
              isCover: idx === 0,
              order: idx,
            }))
          : undefined;

      // Prepare API Payload
      const payload: CreateProductPayload = {
        title: p.title.trim(),
        slug: p.slug?.trim() || slugify(p.title),
        shortDescription: p.shortDescription?.trim() || undefined,
        description: p.description?.trim() || undefined,
        status: backendStatus as any,
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : undefined,
        cost: Number(p.cost || 0),
        weightGrams: Number(p.weightGrams || 0),
        preorder: Boolean(p.preorder),
        isNew: Boolean(p.isNew),
        isBestseller: Boolean(p.isBestseller),
        tags: p.tags,
        specs: Object.keys(specsObj || {}).length > 0 ? specsObj : undefined,
        categoryId,
        subcategoryId,
        brandId,
        collectionIds: p.collections,
        images: imagesData,
        variants: variantsData,
      };

      if (id || existing || (p.id && !p.id.startsWith('p1') && !p.id.startsWith('blank'))) {
        // Backend Update Product API (PATCH /owner/products/:idOrSlug)
        const targetId = id || existing?.id || p.id;
        const res = await productService.updateProduct(targetId, payload);
        const updatedData = res?.data;

        const updatedProduct: Product = updatedData
          ? mapBackendProductToFrontend(updatedData)
          : {
              ...p,
              status: finalStatus,
              slug: p.slug || slugify(p.title),
            };

        saveProduct(updatedProduct);
        setP(updatedProduct);
        setDirty(false);
        toast.success(
          finalStatus === 'published'
            ? 'Product updated and published successfully!'
            : 'Product updated successfully!'
        );
      } else {
        // Backend Create Product API (POST /owner/products)
        const response = await productService.createProduct(payload);
        const createdData = response?.data;

        const newSavedProduct: Product = createdData
          ? mapBackendProductToFrontend(createdData)
          : {
              ...p,
              id: `p${Date.now()}`,
              slug: p.slug || slugify(p.title),
              status: finalStatus,
            };

        saveProduct(newSavedProduct);
        setP(newSavedProduct);
        setDirty(false);
        toast.success(
          finalStatus === 'published'
            ? 'Product published successfully!'
            : 'Product created and saved as draft!'
        );
        router.push('/admin/products');
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      toast.error(err?.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    const targetId = id || existing?.id || p.id;
    if (!targetId) return;

    if (!window.confirm(`Are you sure you want to delete "${p.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await productService.deleteProduct(targetId);
      toast.success('Product deleted successfully');
      router.push('/admin/products');
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      toast.error(err?.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalStock = useMemo(
    () => p.variants.reduce((s, v) => s + available(v), 0),
    [p.variants]
  );

  return (
    <div className="w-full space-y-6 pb-24">
      <PageHeader
        back={{ href: '/admin/products', label: 'Products' }}
        title={existing ? p.title : 'Add product'}
        meta={
          existing && (
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
          )
        }
        actions={
          (existing || id) && (
            <>
              <GuardedButton
                module="products"
                action="delete"
                variant="danger"
                size="sm"
                disabled={isDeleting || isSubmitting}
                onClick={handleDelete}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </GuardedButton>
              <GuardedButton
                module="products"
                action="create"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const copy = {
                    ...p,
                    id: `p${Date.now()}`,
                    title: `${p.title} (copy)`,
                    slug: `${p.slug}-copy`,
                    status: 'draft' as const,
                  };
                  saveProduct(copy);
                  router.push(`/admin/products/${copy.id}`);
                  toast.success('Duplicated as draft');
                }}
              >
                <Copy className="h-4 w-4" aria-hidden /> Duplicate
              </GuardedButton>
              <GuardedButton
                module="products"
                action="view"
                variant="secondary"
                size="sm"
                to={`/products/${p.slug}`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden /> Preview
              </GuardedButton>
            </>
          )
        }
      />
      <fieldset disabled={readOnly || isSubmitting || isDeleting} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Panel>
            <div className="space-y-4">
              <Input
                label="Title"
                value={p.title}
                onChange={(e) => set({ title: e.target.value })}
                error={errors.title}
                placeholder="e.g. Indigo Block-Print Kurta Set"
              />
              <Textarea
                label="Short description"
                rows={2}
                value={p.shortDescription}
                onChange={(e) => set({ shortDescription: e.target.value })}
              />
              <Textarea
                label="Description"
                rows={5}
                value={p.description}
                onChange={(e) => set({ description: e.target.value })}
              />
            </div>
          </Panel>

          {/* PROFESSIONAL MEDIA & GALLERY PANEL */}
          <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-xs">
            {/* Header with Mode Switcher */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Product Media & Gallery</h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Add multiple product photos. The first photo will be used as the main cover.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="inline-flex rounded-lg border border-line bg-canvas/60 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all cursor-pointer ${
                    imageMode === 'upload'
                      ? 'bg-ink text-canvas shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-all cursor-pointer ${
                    imageMode === 'url'
                      ? 'bg-ink text-canvas shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Image URL</span>
                </button>
              </div>
            </div>

            {/* 1. UPLOAD TAB */}
            {imageMode === 'upload' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      Array.from(e.target.files).forEach((file) => handleFileUpload(file));
                      e.target.value = '';
                    }
                  }}
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      Array.from(e.dataTransfer.files).forEach((file) => handleFileUpload(file));
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none ${
                    isDragging
                      ? 'border-clay bg-clay/10 scale-[0.99]'
                      : 'border-line-strong hover:border-ink hover:bg-subtle/30 bg-canvas/20'
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface shadow-xs border border-line text-ink">
                    <UploadCloud className="h-5 w-5 text-clay" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-ink">
                    Click to browse or drag and drop product images here
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    Supports PNG, JPG, WebP, AVIF up to 5MB (Multiple photos supported)
                  </p>
                </div>
              </div>
            )}

            {/* 2. DIRECT IMAGE URL TAB */}
            {imageMode === 'url' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-4 items-start rounded-xl border border-line bg-canvas/20 p-4">
                  {/* URL Preview */}
                  <div className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-subtle">
                    <img
                      src={inputImageUrl.trim() || images.kurta}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1.5 py-0.5 text-[9px] font-medium text-white">
                      {inputImageUrl.trim() ? 'Live Preview' : 'Sample'}
                    </span>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="block text-xs font-semibold text-ink">
                      Direct Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/... or public image link"
                        value={inputImageUrl}
                        onChange={(e) => setInputImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddUrlImage();
                          }
                        }}
                        className="h-9 flex-1 rounded-md border border-line bg-surface px-3 text-xs text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
                      />
                      <button
                        type="button"
                        onClick={handleAddUrlImage}
                        className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-canvas hover:bg-ink/90 cursor-pointer shadow-xs shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Image</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-ink-muted">
                      Paste any public image link and click &quot;Add Image&quot; to include it in the gallery.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GALLERY IMAGES GRID */}
            {p.images.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-line/60">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span className="font-medium text-ink">Gallery Photos ({p.images.length})</span>
                  <span className="text-[11px]">Hover over an image to set as main cover or remove</span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {p.images.map((src, i) => (
                    <div
                      key={src + i}
                      className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-line bg-surface shadow-xs transition-all hover:border-ink"
                    >
                      <img
                        src={src}
                        alt={`Product photo ${i + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {/* Main Cover Badge */}
                      {i === 0 ? (
                        <span className="absolute left-2 top-2 rounded bg-ink px-2 py-0.5 text-[10px] font-semibold text-canvas shadow-xs">
                          Main Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCover(i)}
                          className="absolute left-2 top-2 rounded bg-surface/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-ink opacity-0 transition-opacity group-hover:opacity-100 hover:bg-clay hover:text-white cursor-pointer shadow-xs"
                        >
                          Set as cover
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute right-2 top-2 rounded-full bg-surface/90 backdrop-blur-xs p-1 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger hover:text-white cursor-pointer shadow-xs"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Panel title="Pricing">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Price"
                prefix="৳"
                inputMode="numeric"
                value={p.price || ''}
                onChange={(e) => set({ price: Number(e.target.value.replace(/\D/g, '')) })}
                error={errors.price}
              />
              <Input
                label="Sale price"
                prefix="৳"
                inputMode="numeric"
                value={p.salePrice ?? ''}
                onChange={(e) =>
                  set({
                    salePrice: e.target.value
                      ? Number(e.target.value.replace(/\D/g, ''))
                      : undefined,
                  })
                }
                error={errors.salePrice}
              />
              <Input
                label="Cost per item"
                prefix="৳"
                inputMode="numeric"
                value={p.cost || ''}
                onChange={(e) => set({ cost: Number(e.target.value.replace(/\D/g, '')) })}
                hint={
                  p.price
                    ? `Margin ${margin}% · Profit ${formatBDT(
                        (p.salePrice ?? p.price) - p.cost
                      )}`
                    : 'Customers won’t see this'
                }
              />
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              VAT (7.5%) is included in the price per store tax settings.
            </p>
          </Panel>

          <Panel
            title="Options & variants"
            description={`${p.variants.length} variants · ${totalStock} available`}
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-ink">Colour</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {palette.map((c) => {
                    const on = p.colors.some((x) => x.name === c.name);
                    return (
                      <button
                        type="button"
                        key={c.name}
                        aria-pressed={on}
                        onClick={() =>
                          set({
                            colors: on
                              ? p.colors.filter((x) => x.name !== c.name)
                              : [...p.colors, c],
                          })
                        }
                        className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors ${
                          on
                            ? 'border-ink bg-ink text-canvas font-medium'
                            : 'border-line-strong hover:border-ink'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-ink/10"
                          style={{ backgroundColor: c.hex }}
                        />{' '}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {allSizes.map((s) => {
                    const on = p.sizes.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        aria-pressed={on}
                        onClick={() =>
                          set({
                            sizes: on
                              ? p.sizes.filter((x) => x !== s)
                              : allSizes.filter((x) => x === s || p.sizes.includes(x)),
                          })
                        }
                        className={`h-8 min-w-[40px] rounded border px-2 text-xs cursor-pointer transition-colors ${
                          on
                            ? 'border-ink bg-ink text-canvas font-medium'
                            : 'border-line-strong hover:border-ink'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <GuardedButton
                module="products"
                action="update"
                type="button"
                variant="secondary"
                size="sm"
                onClick={generateVariants}
              >
                <Plus className="h-4 w-4" aria-hidden /> Generate variants (
                {p.colors.length * p.sizes.length})
              </GuardedButton>
            </div>
            {p.variants.length > 0 && (
              <div className="-mx-5 mt-5 overflow-x-auto border-t border-line">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-ink-muted">
                      <th className="px-5 py-2 font-medium">Variant</th>
                      <th className="px-2 py-2 font-medium">SKU</th>
                      <th className="px-2 py-2 font-medium">Price</th>
                      <th className="px-2 py-2 font-medium">Sale</th>
                      <th className="px-2 py-2 font-medium">Stock</th>
                      <th className="px-2 py-2 font-medium">Reserved</th>
                      <th className="px-5 py-2 font-medium">Enabled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {p.variants.map((v) => (
                      <tr key={v.id} className={v.enabled ? '' : 'opacity-50'}>
                        <td className="px-5 py-2 font-medium text-ink">
                          {v.color} / {v.size}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            aria-label="SKU"
                            value={v.sku}
                            onChange={(e) => setVariant(v.id, { sku: e.target.value })}
                            className="h-8 w-36 rounded border border-line bg-surface px-2 font-mono text-xs text-ink focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            aria-label="Price"
                            value={v.price}
                            onChange={(e) =>
                              setVariant(v.id, {
                                price: Number(e.target.value.replace(/\D/g, '')),
                              })
                            }
                            className="h-8 w-20 rounded border border-line bg-surface px-2 text-ink focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            aria-label="Sale price"
                            value={v.salePrice ?? ''}
                            onChange={(e) =>
                              setVariant(v.id, {
                                salePrice: e.target.value
                                  ? Number(e.target.value.replace(/\D/g, ''))
                                  : undefined,
                              })
                            }
                            className="h-8 w-20 rounded border border-line bg-surface px-2 text-ink focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            aria-label="Stock"
                            value={v.stock}
                            onChange={(e) =>
                              setVariant(v.id, {
                                stock: Number(e.target.value.replace(/\D/g, '')),
                              })
                            }
                            className="h-8 w-16 rounded border border-line bg-surface px-2 text-ink focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 text-ink-muted tabular-nums">
                          {v.reserved}
                        </td>
                        <td className="px-5 py-2">
                          <Switch
                            checked={v.enabled}
                            onChange={(x) => setVariant(v.id, { enabled: x })}
                            label={`Enable ${v.color} ${v.size}`}
                            hideLabel
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Specifications">
            <div className="space-y-2">
              {p.specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    aria-label="Attribute"
                    value={s.label}
                    onChange={(e) =>
                      set({
                        specs: p.specs.map((x, j) =>
                          j === i ? { ...x, label: e.target.value } : x
                        ),
                      })
                    }
                    className="h-9 w-40 rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none"
                    placeholder="Attribute name"
                  />
                  <input
                    aria-label="Value"
                    value={s.value}
                    onChange={(e) =>
                      set({
                        specs: p.specs.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x
                        ),
                      })
                    }
                    className="h-9 flex-1 rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none"
                    placeholder="Attribute value"
                  />
                  <button
                    type="button"
                    onClick={() => set({ specs: p.specs.filter((_, j) => j !== i) })}
                    className="rounded p-2 text-ink-muted hover:text-danger cursor-pointer"
                    aria-label="Remove attribute"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ specs: [...p.specs, { label: '', value: '' }] })}
                className="text-sm font-medium text-clay hover:underline cursor-pointer"
              >
                + Add attribute
              </button>
            </div>
          </Panel>

          <Panel title="Shipping & identifiers">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Weight (g)"
                inputMode="numeric"
                value={p.weightGrams}
                onChange={(e) =>
                  set({ weightGrams: Number(e.target.value.replace(/\D/g, '')) })
                }
              />
              <Input
                label="Barcode / GTIN"
                value={p.barcode}
                onChange={(e) => set({ barcode: e.target.value })}
              />
              <Input label="HS code" defaultValue="6211.42" />
            </div>
            <div className="mt-4 space-y-2">
              <Checkbox
                checked={!!p.preorder}
                onChange={(v) => set({ preorder: v })}
                label="Allow pre-orders when out of stock"
              />
            </div>
          </Panel>

          <Panel title="Search engine listing">
            <div className="rounded-md bg-canvas p-3">
              <p className="text-sm text-info">
                tanti.com.bd › products ›{' '}
                {p.slug || slugify(p.title) || 'new-product'}
              </p>
              <p className="text-base text-[#1a0dab] font-medium">
                {p.title || 'Product title'} | Tanti
              </p>
              <p className="line-clamp-2 text-sm text-ink-soft">
                {p.shortDescription ||
                  'Add a short description to control how this product appears in search results.'}
              </p>
            </div>
            <div className="mt-4 grid gap-4">
              <Input
                label="URL handle"
                value={p.slug}
                onChange={(e) => set({ slug: slugify(e.target.value) })}
                placeholder={slugify(p.title)}
                hint="Changing this creates a 301 redirect from the old URL"
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Status">
            <Select
              value={p.status}
              onChange={(e) => set({ status: e.target.value as Product['status'] })}
              options={[
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
              aria-label="Status"
            />
            <p className="mt-2 text-xs text-ink-muted">
              Sales channels: Online store, Facebook shop
            </p>
          </Panel>

          <Panel title="Organization">
            <div className="space-y-4">
              <Select
                label="Category"
                value={p.category}
                onChange={(e) => {
                  const selectedCat = categoryOptions.find(
                    (x) => x.key === e.target.value || x.id === e.target.value
                  );
                  set({
                    category: (selectedCat?.key || e.target.value) as CategoryKey,
                    subcategory: selectedCat?.subcategories?.[0]?.name || '',
                  });
                }}
                options={categoryOptions.map((c) => ({
                  value: c.key,
                  label: c.name,
                }))}
              />

              {activeCategory?.subcategories && activeCategory.subcategories.length > 0 ? (
                <div className="space-y-1.5">
                  <Select
                    label="Subcategory"
                    value={p.subcategory}
                    onChange={(e) => set({ subcategory: e.target.value })}
                    options={activeCategory.subcategories.map((sub) => ({
                      value: sub.name,
                      label: sub.name,
                    }))}
                  />
                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span>
                      {activeCategory.subcategories.length} subcategories available
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newName = window.prompt(
                          `Enter new subcategory for ${activeCategory.name}:`
                        );
                        if (newName && newName.trim()) {
                          addSubcategory(activeCategory.key, newName.trim());
                          set({ subcategory: newName.trim() });
                          toast.success(
                            `Added "${newName.trim()}" to ${activeCategory.name}`
                          );
                        }
                      }}
                      className="text-clay hover:underline cursor-pointer font-medium"
                    >
                      + Add subcategory
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    label="Subcategory"
                    value={p.subcategory}
                    onChange={(e) => set({ subcategory: e.target.value })}
                    placeholder="e.g. Kurtas, Sarees"
                    hint="No subcategories in this category yet. Type one to assign."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (p.subcategory.trim()) {
                        addSubcategory(activeCategory?.key || p.category, p.subcategory.trim());
                        toast.success(
                          `"${p.subcategory.trim()}" saved to ${activeCategory?.name || 'category'}`
                        );
                      }
                    }}
                    className="text-xs text-clay hover:underline cursor-pointer font-medium"
                  >
                    + Save &quot;{p.subcategory || 'name'}&quot; to category
                  </button>
                </div>
              )}

              <Select
                label="Brand"
                value={p.brand}
                onChange={(e) => set({ brand: e.target.value })}
                options={brandOptions.map((b) => ({
                  value: b.name,
                  label: b.name,
                }))}
              />

              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Collections</p>
                <div className="space-y-2">
                  {collectionOptions.map((c) => (
                    <Checkbox
                      key={c.slug || c.id}
                      checked={p.collections.includes(c.slug) || p.collections.includes(c.id)}
                      onChange={(v) =>
                        set({
                          collections: v
                            ? [...p.collections, c.slug]
                            : p.collections.filter((x) => x !== c.slug && x !== c.id),
                        })
                      }
                      label={c.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="tags"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Tags
                </label>
                <input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      set({ tags: [...p.tags, tagInput.trim().toLowerCase()] });
                      setTagInput('');
                    }
                  }}
                  placeholder="Type and press Enter"
                  className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-xs text-ink"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => set({ tags: p.tags.filter((x) => x !== t) })}
                        aria-label={`Remove ${t}`}
                        className="cursor-pointer hover:text-danger"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {existing && (
            <Panel title="Performance · 30 days">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-ink-muted">Units sold</dt>
                  <dd className="font-semibold text-ink tabular-nums">{p.sold}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Revenue</dt>
                  <dd className="font-semibold text-ink tabular-nums">
                    {formatBDT(p.sold * (p.salePrice ?? p.price))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Rating</dt>
                  <dd className="font-semibold text-ink tabular-nums">
                    {p.rating} ({p.reviewCount})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Return rate</dt>
                  <dd className="font-semibold text-ink tabular-nums">3.1%</dd>
                </div>
              </dl>
            </Panel>
          )}
        </div>
      </fieldset>

      {(dirty || !existing) && !readOnly && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-md lg:left-60">
          <div className="flex w-full items-center justify-between gap-3 px-6 py-3 lg:px-8">
            <p className="text-sm text-ink-muted">
              {existing ? 'Unsaved changes' : 'New product'}
            </p>
            <div className="flex gap-2">
              <GuardedButton
                module="products"
                action="update"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={() => {
                  setP(existing ?? blankProduct);
                  setDirty(false);
                }}
              >
                Discard
              </GuardedButton>
              <GuardedButton
                module="products"
                action="update"
                variant="secondary"
                size="sm"
                disabled={isSubmitting}
                onClick={() => save()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save'
                )}
              </GuardedButton>
              {p.status !== 'published' && (
                <GuardedButton
                  module="products"
                  action="publish"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => save('published')}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    'Save & publish'
                  )}
                </GuardedButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
