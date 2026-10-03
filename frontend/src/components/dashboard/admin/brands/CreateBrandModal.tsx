'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/button';
import { brandService } from '@/services/brand-service';
import type { BrandItem } from '@/types/brand';

interface CreateBrandModalProps {
  open: boolean;
  onClose: () => void;
  initialBrand?: BrandItem | null;
  onSaveBrand?: (savedBrand: BrandItem, isNew: boolean) => void;
  onCreateBrand?: (newBrand: BrandItem) => void;
}

export function CreateBrandModal({
  open,
  onClose,
  initialBrand,
  onSaveBrand,
  onCreateBrand,
}: CreateBrandModalProps) {
  const isEditing = Boolean(initialBrand);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialBrand) {
        setName(initialBrand.name || '');
        setSlug(initialBrand.slug || '');
        setDescription(initialBrand.description || '');
        setLogo(initialBrand.logo || '');
        setIsActive(initialBrand.isActive !== false);
      } else {
        setName('');
        setSlug('');
        setDescription('');
        setLogo('');
        setIsActive(true);
      }
    }
  }, [open, initialBrand]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter a brand name');
      return;
    }

    const brandSlug = (slug.trim() || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setIsSubmitting(true);

    try {
      if (isEditing && initialBrand) {
        // Call backend API to update brand in PostgreSQL DB
        const res = await brandService.updateBrand(
          initialBrand.id || initialBrand.slug,
          {
            name: name.trim(),
            slug: brandSlug !== initialBrand.slug ? brandSlug : undefined,
            description: description.trim() || undefined,
            logo: logo.trim() || undefined,
            isActive,
          }
        );

        const updatedData = res?.data;
        const updatedItem: BrandItem = {
          ...initialBrand,
          id: updatedData?.id || initialBrand.id,
          name: updatedData?.name || name.trim(),
          slug: updatedData?.slug || brandSlug,
          description:
            updatedData?.description !== undefined
              ? updatedData.description
              : description.trim() || null,
          logo:
            updatedData?.logo !== undefined
              ? updatedData.logo
              : logo.trim() || null,
          isActive:
            updatedData?.isActive !== undefined ? updatedData.isActive : isActive,
        };

        if (onSaveBrand) {
          onSaveBrand(updatedItem, false);
        } else if (onCreateBrand) {
          onCreateBrand(updatedItem);
        }
        toast.success(`Brand "${name.trim()}" updated successfully!`);
      } else {
        // Call backend API to create brand in PostgreSQL DB
        const res = await brandService.createBrand({
          name: name.trim(),
          slug: brandSlug || undefined,
          description: description.trim() || undefined,
          logo: logo.trim() || undefined,
          isActive,
        });

        const newBrandItem: BrandItem = {
          id: res?.data?.id,
          name: name.trim(),
          slug: brandSlug,
          description: description.trim() || 'Curated partner brand on Tanti.',
          logo: logo.trim() || null,
          isActive,
          _count: { products: 0 },
        };

        if (onSaveBrand) {
          onSaveBrand(newBrandItem, true);
        } else if (onCreateBrand) {
          onCreateBrand(newBrandItem);
        }
        toast.success(`Brand "${name.trim()}" created successfully!`);
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to save brand:', error);
      toast.error(error?.message || 'Failed to save brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit brand' : 'Add new brand'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create brand'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Brand name"
          placeholder="e.g. Jamdani Heritage"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Input
          label="Custom slug (optional)"
          placeholder="e.g. jamdani-heritage"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <Input
          label="Logo URL (optional)"
          placeholder="https://example.com/logo.png"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
        />

        <Textarea
          label="Description"
          placeholder="Brief description for storefront and SEO..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center justify-between rounded-lg border border-line bg-canvas/40 p-3">
          <div>
            <p className="text-xs font-semibold text-ink">Brand Status</p>
            <p className="text-[11px] text-ink-muted">
              Showcase this brand on your storefront and product filters
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-clay"></div>
          </label>
        </div>
      </div>
    </Modal>
  );
}

