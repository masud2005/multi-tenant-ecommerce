'use client';

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { isChatImageUrl } from '@/services/chat-service';
import { MediaLightbox } from '@/components/ui/MediaLightbox';
import { cn } from '@/utils/cn';

export function ChatMessageAttachments({
  attachments,
  tone = 'light',
}: {
  attachments?: string[] | null;
  tone?: 'light' | 'dark';
}) {
  const [preview, setPreview] = useState<{
    src: string;
    kind: 'image' | 'pdf';
  } | null>(null);

  if (!attachments?.length) return null;

  return (
    <>
      <div className={cn('mt-2 flex flex-wrap gap-2')}>
        {attachments.map((url) => {
          const image = isChatImageUrl(url);
          if (image) {
            return (
              <button
                key={url}
                type="button"
                onClick={() => setPreview({ src: url, kind: 'image' })}
                className="block overflow-hidden rounded-lg border border-white/20 cursor-pointer text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Attachment"
                  className="max-h-48 max-w-[220px] object-cover"
                />
              </button>
            );
          }
          return (
            <button
              key={url}
              type="button"
              onClick={() => setPreview({ src: url, kind: 'pdf' })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer',
                tone === 'dark'
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'border border-line bg-subtle text-ink hover:bg-canvas',
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              View file
            </button>
          );
        })}
      </div>

      <MediaLightbox
        src={preview?.src ?? null}
        kind={preview?.kind ?? 'auto'}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
