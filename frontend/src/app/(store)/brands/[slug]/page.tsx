import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopView } from '@/components/store/shop';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brandName = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    title: `${brandName} | Tanti Brand Showcase`,
    description: `Browse pieces by ${brandName}.`,
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-ink-muted">
          Loading brand...
        </div>
      }
    >
      <ShopView mode="brand" slug={slug} />
    </Suspense>
  );
}
