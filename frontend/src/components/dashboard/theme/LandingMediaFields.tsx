'use client';


import { asApiError } from '@/lib/api-error';
import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import {
  MAX_HERO_SLIDES,
  type LandingConfig,
  type LandingHeroSlide,
} from '@/lib/landing-config';
import { readLandingImageFile } from '@/utils/landing-image';
import { cn } from '@/utils/cn';

function newSlideId() {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function DropZone({
  label,
  hint,
  multiple,
  disabled,
  onFiles,
}: {
  label: string;
  hint: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        multiple={multiple}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (disabled) return;
          const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
          if (files.length) onFiles(files);
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors',
          disabled
            ? 'cursor-not-allowed border-line bg-subtle/40 opacity-60'
            : dragging
              ? 'border-clay bg-clay/10'
              : 'cursor-pointer border-line-strong bg-canvas/20 hover:border-ink hover:bg-subtle/30'
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-clay shadow-xs">
          <UploadCloud className="h-5 w-5" />
        </span>
        <p className="mt-2 text-xs font-semibold text-ink">{label}</p>
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      </button>
    </div>
  );
}

export function HeroSlidesEditor({
  slides,
  onChange,
}: {
  slides: LandingHeroSlide[];
  onChange: (slides: LandingHeroSlide[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const remaining = MAX_HERO_SLIDES - slides.length;

  const commit = (next: LandingHeroSlide[]) => onChange(next.slice(0, MAX_HERO_SLIDES));

  const addFromFiles = async (files: File[]) => {
    if (remaining <= 0) {
      toast.error(`You can add up to ${MAX_HERO_SLIDES} hero images.`);
      return;
    }
    setBusy(true);
    try {
      const picked = files.slice(0, remaining);
      const created: LandingHeroSlide[] = [];
      for (const file of picked) {
        const image = await readLandingImageFile(file);
        created.push({
          id: newSlideId(),
          image,
          alt: file.name.replace(/\.[^.]+$/, '') || `Hero slide ${slides.length + created.length + 1}`,
        });
      }
      commit([...slides, ...created]);
      toast.success(created.length === 1 ? 'Hero image added.' : `${created.length} hero images added.`);
    } catch (err: unknown) {
      toast.error(asApiError(err).message || 'Could not add image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Hero images</p>
        <p className="mt-1 text-xs text-ink-muted">
          Upload up to {MAX_HERO_SLIDES} images for the carousel. Leave empty to use collection / product photos.
        </p>
      </div>

      {slides.length > 0 && (
        <ul className="space-y-2">
          {slides.map((slide, index) => (
            <li
              key={slide.id}
              className="flex items-start gap-3 rounded-lg border border-line bg-surface p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt=""
                className="h-16 w-12 shrink-0 rounded-md border border-line object-cover"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-xs font-medium text-ink-muted">Slide {index + 1}</p>
                <input
                  value={slide.alt}
                  onChange={(e) =>
                    commit(
                      slides.map((item) =>
                        item.id === slide.id ? { ...item, alt: e.target.value } : item
                      )
                    )
                  }
                  placeholder="Alt text"
                  className="w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-sm text-ink outline-none focus:border-ink"
                />
              </div>
              <button
                type="button"
                onClick={() => commit(slides.filter((item) => item.id !== slide.id))}
                className="rounded-md p-1.5 text-ink-muted hover:bg-subtle hover:text-ink"
                aria-label={`Remove slide ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <DropZone
        multiple
        disabled={busy || remaining <= 0}
        label={remaining <= 0 ? 'Limit reached' : 'Upload hero images'}
        hint={
          remaining <= 0
            ? `Maximum ${MAX_HERO_SLIDES} images`
            : `PNG, JPG, WebP · up to ${remaining} more`
        }
        onFiles={addFromFiles}
      />
    </div>
  );
}

export function PromoImageEditor({
  image,
  alt,
  onChange,
}: {
  image: string;
  alt: string;
  onChange: (patch: Pick<LandingConfig, 'promoImage' | 'promoImageAlt'>) => void;
}) {
  const [busy, setBusy] = useState(false);

  const setFromFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    try {
      const next = await readLandingImageFile(file);
      onChange({
        promoImage: next,
        promoImageAlt: alt || file.name.replace(/\.[^.]+$/, '') || 'Offer image',
      });
      toast.success('Offer image updated.');
    } catch (err: unknown) {
      toast.error(asApiError(err).message || 'Could not add image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Offer image</p>
        <p className="mt-1 text-xs text-ink-muted">
          One image for the offer section. Leave empty to use the first collection / product photo.
        </p>
      </div>

      {image ? (
        <div className="flex items-start gap-3 rounded-lg border border-line bg-surface p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="h-24 w-36 shrink-0 rounded-md border border-line object-cover"
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="inline-flex items-center gap-1 text-xs font-medium text-ink">
              <ImagePlus className="h-3.5 w-3.5" />
              Current image
            </p>
            <input
              value={alt}
              onChange={(e) => onChange({ promoImage: image, promoImageAlt: e.target.value })}
              placeholder="Alt text"
              className="w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-sm text-ink outline-none focus:border-ink"
            />
            <button
              type="button"
              onClick={() => onChange({ promoImage: '', promoImageAlt: '' })}
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : null}

      <DropZone
        disabled={busy}
        label={image ? 'Replace offer image' : 'Upload offer image'}
        hint="PNG, JPG, WebP · single image"
        onFiles={setFromFiles}
      />
    </div>
  );
}
