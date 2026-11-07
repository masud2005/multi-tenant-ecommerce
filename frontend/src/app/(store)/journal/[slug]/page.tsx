'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useTenant } from '@/contexts/TenantContext';

interface JournalPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function JournalPostPage({ params }: JournalPostPageProps) {
  const { slug } = use(params);
  const { tenant } = useTenant();

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-lg font-medium text-ink">Story not found</p>
      <p className="mt-1 text-sm text-ink-muted">
        This journal article does not exist or has been removed.
      </p>
      <Link href="/shop" className="mt-4 inline-block text-sm text-clay underline">
        Back to {tenant.name} Shop
      </Link>
    </div>
  );
}
