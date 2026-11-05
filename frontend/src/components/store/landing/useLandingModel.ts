'use client';

import { useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { images } from '@/data/images';
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

const FALLBACK_CATEGORIES: LandingCategoryLink[] = [
  { id: 'women', name: 'Women', href: '/shop?category=women', image: images.kurta },
  { id: 'men', name: 'Men', href: '/shop?category=men', image: images.panjabi },
  { id: 'footwear', name: 'Shoes', href: '/shop?category=footwear', image: images.sneakers },
  { id: 'bags', name: 'Bags', href: '/shop?category=accessories', image: images.bag },
  { id: 'accessories', name: 'Accessories', href: '/shop?category=accessories', image: images.jewelry },
];

const FALLBACK_LOOKS: LandingLook[] = [
  {
    id: 'women',
    title: "Women's Collection",
    subtitle: 'Shop now',
    href: '/shop?category=women',
    image: images.kurta,
  },
  {
    id: 'men',
    title: "Men's Collection",
    subtitle: 'Shop now',
    href: '/shop?category=men',
    image: images.shirt,
  },
  {
    id: 'accessories',
    title: 'Accessories',
    subtitle: 'Shop now',
    href: '/shop?category=accessories',
    image: images.bag,
  },
];

const FALLBACK_SLIDES: LandingSlide[] = [
  { id: 'hero', image: images.hero, alt: 'Featured look' },
  { id: 'kurta', image: images.kurta, alt: 'New arrival' },
  { id: 'saree', image: images.saree, alt: 'Heritage weave' },
];

function uniqueSlides(slides: LandingSlide[]) {
  const seen = new Set<string>();
  return slides.filter((slide) => {
    if (!slide.image || seen.has(slide.image)) return false;
    seen.add(slide.image);
    return true;
  });
}

export function useLandingModel() {
  const { products, categories, collections } = useStore();

  return useMemo(() => {
    const published = products.filter((product) => product.status === 'published');
    const catalog = published.length > 0 ? published : products;
    const picks = [...catalog]
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 4);

    const liveCategories = categories
      .filter((category) => category.name && category.key.toLowerCase() !== 'sale')
      .slice(0, 5)
      .map((category, index) => ({
        id: category.key,
        name: category.name,
        href: `/shop?category=${encodeURIComponent(category.key)}`,
        image: category.image || FALLBACK_CATEGORIES[index % FALLBACK_CATEGORIES.length].image,
      }));

    const categoryLinks = (liveCategories.length > 0 ? liveCategories : FALLBACK_CATEGORIES).slice(0, 5);

    const collectionLooks: LandingLook[] = collections
      .filter((collection) => collection.name && collection.slug)
      .slice(0, 3)
      .map((collection, index) => ({
        id: collection.slug,
        title: collection.name,
        subtitle: collection.description || 'Shop now',
        href: `/collections/${collection.slug}`,
        image: collection.image || FALLBACK_LOOKS[index % FALLBACK_LOOKS.length].image,
      }));

    const looks =
      collectionLooks.length >= 3
        ? collectionLooks
        : [
            ...collectionLooks,
            ...FALLBACK_LOOKS.filter(
              (look) => !collectionLooks.some((item) => item.title === look.title)
            ),
          ].slice(0, 3);

    const collectionSlides: LandingSlide[] = collections
      .filter((collection) => collection.image)
      .slice(0, 3)
      .map((collection) => ({
        id: collection.slug,
        image: collection.image,
        alt: collection.name,
      }));

    const slides = uniqueSlides([...collectionSlides, ...FALLBACK_SLIDES]).slice(0, 3);
    const promoImage =
      collections.find((collection) => collection.image)?.image || images.coord;

    return {
      picks,
      categoryLinks,
      looks,
      slides: slides.length > 0 ? slides : FALLBACK_SLIDES,
      promoImage,
      testimonials,
      trustPoints,
    };
  }, [products, categories, collections]);
}

export type LandingModel = ReturnType<typeof useLandingModel>;
export type { Product };
