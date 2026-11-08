'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { mediaService } from '@/services/media-service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/gif';
const MAX_BYTES = 5 * 1024 * 1024;

export interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  alt?: string;
  onAltChange?: (alt: string) => void;
  label?: string;
  hint?: string;
  aspectClassName?: string;
  disabled?: boolean;
  showAlt?: boolean;
  className?: string;
}

export function ImageUploadField({
  value,
  onChange,
  alt = '',
  onAltChange,
  label = 'Image',
  hint = 'PNG, JPG, WebP or AVIF · max 5MB',
  aspectClassName = 'aspect-[16/7]',
  disabled = false,
  showAlt = true,
  className,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be under 5MB');
      return;
    }

    try {
      setUploading(true);
      const res = await mediaService.uploadFile(file, {
        alt: alt.trim() || undefined,
      });
      const url = res?.data?.url;
      if (!url) {
        throw new Error('Upload did not return an image URL');
      }
      onChange(url);
      if (onAltChange && !alt.trim()) {
        const fromName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        if (fromName) onAltChange(fromName);
      }
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to upload image',
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-xs font-medium text-ink">{label}</label>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled || uploading}
            onClick={() => onChange('')}
            className="h-7 text-xs text-danger hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Remove
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
        }}
      />

      {value ? (
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-line bg-subtle',
            aspectClassName,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={alt || 'Uploaded image preview'}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-ink/70 to-transparent px-3 py-2.5">
            <p className="truncate text-[11px] text-canvas/90">Ready for storefront</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled || uploading}
              loading={uploading}
              onClick={() => inputRef.current?.click()}
              className="h-7 shrink-0 cursor-pointer text-xs"
            >
              {uploading ? 'Uploading…' : 'Replace'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (disabled || uploading) return;
            const file = e.dataTransfer.files?.[0];
            if (file) void uploadFile(file);
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
            disabled || uploading
              ? 'cursor-not-allowed border-line bg-subtle/40 opacity-70'
              : dragging
                ? 'border-clay bg-clay/10'
                : 'cursor-pointer border-line-strong bg-canvas/20 hover:border-ink hover:bg-subtle/30',
            aspectClassName,
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-clay shadow-xs">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <UploadCloud className="h-5 w-5" aria-hidden />
            )}
          </span>
          <p className="mt-3 text-xs font-semibold text-ink">
            {uploading ? 'Uploading image…' : 'Click to upload or drag and drop'}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{hint}</p>
          {!uploading ? (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft">
              <ImagePlus className="h-3.5 w-3.5" aria-hidden />
              Choose image
            </span>
          ) : null}
        </button>
      )}

      {showAlt && onAltChange ? (
        <Input
          label="Alt text (accessibility)"
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="Short description of the image"
          disabled={disabled || uploading}
        />
      ) : null}
    </div>
  );
}
