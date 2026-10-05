import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopView } from '@/components/store/shop';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const capitalized = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    title: `${capitalized} Collection | Tanti`,
    description: `Explore the ${capitalized} collection.`,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-ink-muted">
          Loading collection...
        </div>
      }
    >
      <ShopView mode="collection" slug={slug} />
    </Suspense>
  );
}
