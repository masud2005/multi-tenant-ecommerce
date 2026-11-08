'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const ORDER_PREFIX = /^\[Order #([A-Za-z0-9_-]+)\](?::\s*)?/;
const ORDER_INLINE = /Order #([A-Za-z0-9_-]+)/g;

function orderHref(role: 'customer' | 'admin', number: string) {
  return role === 'customer'
    ? `/account/orders/${encodeURIComponent(number)}`
    : `/admin/orders/${encodeURIComponent(number)}`;
}

export function ChatMessageText({
  text,
  role,
  tone = 'light',
}: {
  text: string;
  role: 'customer' | 'admin';
  tone?: 'light' | 'dark';
}) {
  const prefix = text.match(ORDER_PREFIX);
  const orderNumber = prefix?.[1];
  const body = prefix ? text.slice(prefix[0].length) : text;

  const linkClass = cn(
    'inline-flex items-center gap-1 font-semibold underline underline-offset-2 transition-opacity hover:opacity-90',
    tone === 'dark' ? 'text-canvas' : 'text-ink',
  );

  const renderWithLinks = (content: string) => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    let match: RegExpExecArray | null;
    const re = new RegExp(ORDER_INLINE.source, 'g');

    while ((match = re.exec(content)) !== null) {
      if (match.index > last) {
        parts.push(content.slice(last, match.index));
      }
      const num = match[1];
      parts.push(
        <Link
          key={`${num}-${match.index}`}
          href={orderHref(role, num)}
          className={linkClass}
        >
          Order #{num}
        </Link>,
      );
      last = match.index + match[0].length;
    }

    if (last < content.length) {
      parts.push(content.slice(last));
    }

    return parts.length ? parts : content;
  };

  return (
    <div className="leading-relaxed whitespace-pre-wrap break-words">
      {orderNumber ? (
        <Link
          href={orderHref(role, orderNumber)}
          className={cn(linkClass, 'mb-0.5')}
        >
          <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Order #{orderNumber}
        </Link>
      ) : null}
      {body ? (
        <p className={orderNumber ? 'mt-1' : undefined}>{renderWithLinks(body)}</p>
      ) : null}
    </div>
  );
}
