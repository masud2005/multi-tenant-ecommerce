'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type MediaLightboxKind = 'image' | 'pdf' | 'auto';

function resolveKind(src: string, kind: MediaLightboxKind): 'image' | 'pdf' {
  if (kind === 'image' || kind === 'pdf') return kind;
  if (/\.pdf(\?|$)/i.test(src) || src.includes('/raw/upload/')) return 'pdf';
  return 'image';
}

export function MediaLightbox({
  src,
  onClose,
  kind = 'auto',
  alt = 'Preview',
}: {
  src: string | null;
  onClose: () => void;
  kind?: MediaLightboxKind;
  alt?: string;
}) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [src, onClose]);

  if (!src) return null;

  const resolved = resolveKind(src, kind);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Media preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-canvas/15 text-canvas backdrop-blur-sm transition-colors hover:bg-canvas/25 cursor-pointer"
        aria-label="Close preview"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative flex h-full w-full max-h-full max-w-full items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {resolved === 'pdf' ? (
          <iframe
            src={src}
            title={alt}
            className="h-full w-full rounded-lg bg-canvas shadow-2xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain select-none"
          />
        )}
      </div>
    </div>
  );
}
