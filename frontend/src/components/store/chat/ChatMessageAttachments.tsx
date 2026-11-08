'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { isChatImageUrl } from '@/services/chat-service';
import { cn } from '@/utils/cn';

export function ChatMessageAttachments({
  attachments,
  tone = 'light',
}: {
  attachments?: string[] | null;
  tone?: 'light' | 'dark';
}) {
  if (!attachments?.length) return null;

  return (
    <div className={cn('mt-2 flex flex-wrap gap-2', !attachments.length && 'hidden')}>
      {attachments.map((url) => {
        const image = isChatImageUrl(url);
        if (image) {
          return (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-white/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Attachment"
                className="max-h-48 max-w-[220px] object-cover"
              />
            </a>
          );
        }
        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium underline-offset-2 hover:underline',
              tone === 'dark'
                ? 'bg-white/15 text-white'
                : 'border border-line bg-subtle text-ink'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            View file
          </a>
        );
      })}
    </div>
  );
}
