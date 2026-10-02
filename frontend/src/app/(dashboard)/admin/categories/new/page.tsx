'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  Plus,
  X,
  Globe,
  Layers,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { productService } from '@/services/product-service';
import { categoryService } from '@/services/category-service';
import { images } from '@/data/images';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import type { CategoryItemData } from '@/types/commerce';

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

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminNewCategoryPage() {
  const router = useRouter();
  const { categories, addCategory } = useStore();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(images.kurta);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [parentKey, setParentKey] = useState('none');
  const [status, setStatus] = useState<'published' | 'draft' | 'hidden'>('published');
  const [showInNav, setShowInNav] = useState(true);

  // Subcategories tags
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [subInput, setSubInput] = useState('');

  // SEO fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleAddSubcategory = () => {
    const trimmed = subInput.trim();
    if (!trimmed) return;
    if (subcategories.includes(trimmed)) {
      toast.error('Subcategory already added');
      return;
    }
    setSubcategories((prev) => [...prev, trimmed]);
    setSubInput('');
  };

  const handleRemoveSubcategory = (sub: string) => {
    setSubcategories((prev) => prev.filter((s) => s !== sub));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const finalSlug = slug.trim() || slugify(name);
    const existing = categories.find((c) => c.key === finalSlug);
    if (existing) {
      toast.error(`A category with slug "${finalSlug}" already exists`);
      return;
    }

    setIsSubmitting(true);

    const newCategory: CategoryItemData = {
      key: finalSlug,
      name: name.trim(),
      blurb: description.trim() || `${name.trim()} collection`,
      image: customImageUrl.trim() || image,
      subcategories: subcategories,
      parentKey: parentKey === 'none' ? undefined : parentKey,
      seoTitle: seoTitle.trim() || `${name.trim()} | Tanti`,
      seoDescription:
        seoDescription.trim() ||
        `Shop ${name.toLowerCase()} — handcrafted apparel & lifestyle essentials.`,
      status,
    };

    try {
      // 1. Add to store context for instant UI update
      addCategory(newCategory);

      // 2. Call backend API to create category in database
      await categoryService.createCategory({
        name: name.trim(),
        slug: finalSlug || undefined,
        description: description.trim() || undefined,
        image: customImageUrl.trim() || image || undefined,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        status: status,
        isActive: true,
        showInNav: showInNav,
        parentId: parentKey !== 'none' ? parentKey : undefined,
        tenantId: 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2',
      });

      toast.success(`Category "${newCategory.name}" created successfully`);
      router.push('/admin/categories');
    } catch (error: any) {
      console.error('Failed to create category:', error);
      toast.error(error?.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parentOptions = [
    { label: '— None (Top level category)', value: 'none' },
    ...categories.map((c) => ({ label: c.name, value: c.key })),
  ];

  return (
    <ModuleGate module="products" action="create">
      <div className="w-full space-y-6">
        <PageHeader
          back={{ href: '/admin/categories', label: 'Categories' }}
          title="Add category"
          description="Create a new product category for navigation, filtering and storefront organization."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                href="/admin/categories"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <GuardedButton
                module="products"
                action="create"
                size="sm"
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Save category
              </GuardedButton>
            </div>
          }
        />

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
          {/* Main Column */}
          <div className="space-y-6 lg:col-span-8">
            {/* General Info */}
            <Panel title="Category details">
              <div className="space-y-4">
                <Input
                  label="Category name"
                  placeholder="e.g. Traditional Wear, Kurtas, Shawls"
                  value={name}
                  onChange={handleNameChange}
                  autoFocus
                  required
                />
                <div>
                  <Input
                    label="URL handle (Slug)"
                    prefix="/category/"
                    placeholder="traditional-wear"
                    value={slug}
                    onChange={(e) => {
                      setSlug(slugify(e.target.value));
                      setSlugManuallyEdited(true);
                    }}
                    hint="The unique web URL for this category on the storefront"
                  />
                </div>
                <Textarea
                  label="Description"
                  placeholder="Brief description displayed on category pages and filters..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </Panel>

            {/* Media / Image */}
            <Panel
              title="Category media"
              description="Featured image shown on storefront category grid and menu headers."
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-line bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={customImageUrl.trim() || image}
                      alt="Category Preview"
                      className="h-full w-full object-cover transition-all"
                    />
                  </div>
                  <div className="flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-xs font-medium text-ink mb-2">
                        Select a curated theme photo:
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {sampleImages.map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => {
                              setImage(s.src);
                              setCustomImageUrl('');
                            }}
                            className={cn(
                              'relative aspect-[3/4] overflow-hidden rounded border transition-all cursor-pointer group',
                              image === s.src && !customImageUrl
                                ? 'border-ink ring-2 ring-ink'
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
                            {image === s.src && !customImageUrl && (
                              <div className="absolute inset-0 bg-ink/20 flex items-center justify-center">
                                <Check className="h-4 w-4 text-white drop-shadow" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Input
                        label="Or paste an image URL"
                        placeholder="https://images.unsplash.com/..."
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Subcategories */}
            <Panel
              title="Subcategories"
              description="Organize specific product groups within this category."
            >
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Cotton Kurtas, Silk Kurtas"
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
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
                    onClick={handleAddSubcategory}
                    className="cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4" aria-hidden /> Add
                  </Button>
                </div>

                {subcategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {subcategories.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1.5 rounded-full bg-subtle border border-line px-3 py-1 text-xs font-medium text-ink"
                      >
                        {sub}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(sub)}
                          className="rounded p-0.5 hover:bg-surface text-ink-muted hover:text-ink cursor-pointer transition-colors"
                          aria-label={`Remove ${sub}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted">
                    No subcategories added yet. Type a name above and click Add.
                  </p>
                )}
              </div>
            </Panel>

            {/* SEO Panel */}
            <Panel
              title="Search engine optimization"
              description="Preview how this category will appear in Google and social media."
            >
              <div className="space-y-4">
                {/* SERP Preview Box */}
                <div className="rounded-md border border-line bg-canvas p-4 space-y-1">
                  <p className="text-xs text-ink-muted flex items-center gap-1 font-mono">
                    <Globe className="h-3.5 w-3.5" />
                    https://tanti.com.bd/category/{slug || 'new-category'}
                  </p>
                  <p className="text-base font-semibold text-clay line-clamp-1">
                    {seoTitle || `${name || 'Category Name'} | Tanti`}
                  </p>
                  <p className="text-xs text-ink-soft line-clamp-2">
                    {seoDescription ||
                      description ||
                      `Shop ${name || 'items'} — discover fine artisanal craftsmanship and sustainable handloom fashion.`}
                  </p>
                </div>

                <Input
                  label="Page title"
                  placeholder={`${name || 'Category'} | Tanti`}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  hint="Keep title under 60 characters for best Google results"
                />

                <Textarea
                  label="Meta description"
                  placeholder="Summary displayed below the title in search engine results..."
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  hint="Keep description between 120–160 characters"
                />
              </div>
            </Panel>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6 lg:col-span-4">
            {/* Hierarchy */}
            <Panel title="Organization">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Parent category
                  </label>
                  <select
                    value={parentKey}
                    onChange={(e) => setParentKey(e.target.value)}
                    className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink focus:border-clay focus:outline-none"
                  >
                    {parentOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    Leave as None to create a main top-level department.
                  </p>
                </div>
              </div>
            </Panel>

            {/* Visibility & Status */}
            <Panel title="Storefront visibility">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Publishing status
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'published' | 'draft' | 'hidden')
                    }
                    className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink focus:border-clay focus:outline-none"
                  >
                    <option value="published">Published (Active on store)</option>
                    <option value="draft">Draft (Staff review only)</option>
                    <option value="hidden">Hidden from catalog</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-line">
                  <Switch
                    checked={showInNav}
                    onChange={setShowInNav}
                    label="Show in navigation menu"
                  />
                  <p className="mt-1 text-xs text-ink-muted">
                    Automatically adds a link to this category in the storefront header.
                  </p>
                </div>
              </div>
            </Panel>

            {/* Summary Preview */}
            <Panel title="Live preview">
              <div className="overflow-hidden rounded-md border border-line bg-surface">
                <div className="relative aspect-[16/9] w-full bg-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customImageUrl.trim() || image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge
                      tone={
                        status === 'published'
                          ? 'success'
                          : status === 'draft'
                          ? 'info'
                          : 'neutral'
                      }
                    >
                      {status}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-ink text-sm">
                    {name || 'Category Name'}
                  </p>
                  <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                    {description || 'No description yet'}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-muted border-t border-line pt-2">
                    <span>
                      {subcategories.length}{' '}
                      {subcategories.length === 1
                        ? 'subcategory'
                        : 'subcategories'}
                    </span>
                    <span className="font-mono text-xs">
                      /{slug || 'slug'}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Bottom Actions */}
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isSubmitting}
                className="cursor-pointer"
              >
                Create category
              </Button>
            </div>
          </div>
        </form>
      </div>
    </ModuleGate>
  );
}
