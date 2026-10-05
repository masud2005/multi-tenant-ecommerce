import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopView } from '@/components/store/shop';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const capitalized = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `${capitalized} | Tanti Lifestyle`,
    description: `Shop the latest ${slug} collection handcrafted in Bangladesh.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-ink-muted">
          Loading category...
        </div>
      }
    >
      <ShopView mode="category" slug={slug} />
    </Suspense>
  );
}
