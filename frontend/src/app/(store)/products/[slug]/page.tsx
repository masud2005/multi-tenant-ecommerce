import React from 'react';
import { ProductDetailView } from '@/components/store/product';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  return <ProductDetailView slug={slug} />;
}
