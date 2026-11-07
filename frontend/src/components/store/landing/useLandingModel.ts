'use client';

import { useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { testimonials, trustPoints } from '@/data/content';
import type { Product } from '@/types';

export interface LandingSlide {
  id: string;
  image: string;
  alt: string;
}

export interface LandingLook {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
}

export interface LandingCategoryLink {
  id: string;
  name: string;
  href: string;
  image: string;
}

function uniqueSlides(slides: LandingSlide[]) {
  const seen = new Set<string>();
  return slides.filter((slide) => {
    if (!slide.image || seen.has(slide.image)) return false;
    seen.add(slide.image);
    return true;
  });
}

export function useLandingModel() {
  const {
    products,
    categories,
    collections,
    isStoreLoading,
    isProductsLoading,
    isCategoriesLoading,
    isCollectionsLoading,
  } = useStore();

  return useMemo(() => {
    // 1. Dynamic Published Products (Server-only)
    const published = products.filter((product) => product.status === 'published');
    const catalog = published.length > 0 ? published : products;
    const picks = [...catalog]
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 4);

    // 2. Dynamic Categories from Server (No fake mock items)
    const categoryLinks: LandingCategoryLink[] = categories
      .filter((category) => category.name && category.key.toLowerCase() !== 'sale')
      .slice(0, 5)
      .map((category) => ({
        id: category.key,
        name: category.name,
        href: `/shop?category=${encodeURIComponent(category.key)}`,
        image: category.image || '',
      }));

    // 3. Dynamic Looks/Collections from Server (No fake mock items)
    const looks: LandingLook[] = collections
      .filter((collection) => collection.name && collection.slug)
      .slice(0, 3)
      .map((collection) => ({
        id: collection.slug,
        title: collection.name,
        subtitle: collection.description || 'Shop now',
        href: `/collections/${collection.slug}`,
        image: collection.image || '',
      }));

    // 4. Dynamic Hero Slides from Collections with real images, or fallback to real Products
    const collectionSlides: LandingSlide[] = collections
      .filter((collection) => collection.image)
      .slice(0, 3)
      .map((collection) => ({
        id: collection.slug,
        image: collection.image,
        alt: collection.name,
      }));

    const productSlides: LandingSlide[] = products
      .filter((product) => product.images && product.images[0])
      .slice(0, 3)
      .map((product) => ({
        id: product.id,
        image: product.images[0],
        alt: product.title,
      }));

    const rawSlides = collectionSlides.length > 0 ? collectionSlides : productSlides;
    const slides = uniqueSlides(rawSlides).slice(0, 3);

    // 5. Dynamic Promo Image
    const promoImage =
      collections.find((collection) => collection.image)?.image ||
      products.find((product) => product.images && product.images[0])?.images[0] ||
      '';

    return {
      picks,
      categoryLinks,
      looks,
      slides,
      promoImage,
      testimonials,
      trustPoints,
      isStoreLoading: !!isStoreLoading,
      isProductsLoading: !!isProductsLoading,
      isCategoriesLoading: !!isCategoriesLoading,
      isCollectionsLoading: !!isCollectionsLoading,
    };
  }, [
    products,
    categories,
    collections,
    isStoreLoading,
    isProductsLoading,
    isCategoriesLoading,
    isCollectionsLoading,
  ]);
}

export type LandingModel = ReturnType<typeof useLandingModel>;
export type { Product };
