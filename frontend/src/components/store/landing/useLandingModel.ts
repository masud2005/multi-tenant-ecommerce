'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useTenant } from '@/contexts/TenantContext';
import { reviewService } from '@/services/review-service';
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

export interface LandingTestimonial {
  id?: string;
  name: string;
  location: string;
  quote: string;
  rating: number;
  productTitle?: string;
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
  const { tenant } = useTenant();
  const {
    products,
    categories,
    collections,
    isStoreLoading,
    isProductsLoading,
    isCategoriesLoading,
    isCollectionsLoading,
  } = useStore();

  const [dbReviews, setDbReviews] = useState<LandingTestimonial[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    reviewService
      .getStoreReviews({ page: 1, limit: 15 })
      .then((res) => {
        if (!mounted) return;
        if (res?.data?.reviews && res.data.reviews.length > 0) {
          const mapped = res.data.reviews.map((r) => ({
            id: r.id,
            name: r.author || 'Verified Customer',
            location:
              r.size ||
              (r.product?.title ? `Purchased ${r.product.title}` : 'Verified Buyer'),
            quote: r.body,
            rating: Number(r.rating) || 5,
            productTitle: r.product?.title,
          }));
          setDbReviews(mapped);
        } else {
          setDbReviews([]);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch store testimonials:', err);
        if (mounted) setDbReviews([]);
      })
      .finally(() => {
        if (mounted) setIsReviewsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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

    // Strictly real DB reviews (zero mock fallback)
    const testimonials: LandingTestimonial[] = dbReviews;

    // Real trust points from tenant settings in DB (zero mock fallback)
    const trustPoints: { title: string; body: string }[] =
      Array.isArray((tenant as any)?.settings?.trustPoints)
        ? (tenant as any).settings.trustPoints
        : [];

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
      isReviewsLoading,
    };
  }, [
    products,
    categories,
    collections,
    dbReviews,
    tenant,
    isStoreLoading,
    isProductsLoading,
    isCategoriesLoading,
    isCollectionsLoading,
    isReviewsLoading,
  ]);
}

export type LandingModel = ReturnType<typeof useLandingModel>;
export type { Product };
