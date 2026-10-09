'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { themeService } from '@/services/theme-service';
import type { ThemeSection } from '@/types/theme';
import {
  HeroBanner,
  CategorySection,
  Bestsellers,
  SummerLinenSpotlight,
  NewArrivals,
  TrustPoints,
  Testimonials,
  Recommended,
} from '@/components/store/home';

// Default section sequence fallback
const DEFAULT_SECTION_ORDER = [
  'HERO_BANNER',
  'CATEGORY_GRID',
  'BESTSELLERS',
  'SUMMER_SPOTLIGHT',
  'NEW_ARRIVALS',
  'TRUST_POINTS',
  'TESTIMONIALS',
  'RECOMMENDED',
];

export default function HomePage() {
  const { products, recentlyViewed, isStoreLoading } = useStore();
  const [sections, setSections] = useState<ThemeSection[] | null>(null);

  // Fetch tenant live theme sections
  useEffect(() => {
    let isMounted = true;
    themeService
      .getLiveTheme()
      .then((res) => {
        if (isMounted && res.success && res.data?.sections) {
          setSections(res.data.sections);
        }
      })
      .catch(() => {
        // Fallback gracefully to default layout
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isStoreLoading) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center py-24">
        <LoadingSpinner size="lg" label="Loading store experience..." />
      </div>
    );
  }

  // Component registry for dynamic rendering
  const renderSection = (type: string, key: string) => {
    switch (type) {
      case 'HERO_BANNER':
        return <HeroBanner key={key} />;
      case 'CATEGORY_GRID':
        return <CategorySection key={key} />;
      case 'BESTSELLERS':
        return <Bestsellers key={key} products={products} />;
      case 'SUMMER_SPOTLIGHT':
        return <SummerLinenSpotlight key={key} />;
      case 'NEW_ARRIVALS':
        return <NewArrivals key={key} products={products} />;
      case 'TRUST_POINTS':
        return <TrustPoints key={key} />;
      case 'TESTIMONIALS':
        return <Testimonials key={key} />;
      case 'RECOMMENDED':
        return (
          <Recommended
            key={key}
            products={products}
            recentlyViewed={recentlyViewed}
          />
        );
      default:
        return null;
    }
  };

  // If live theme sections are available, render in order and filter by visibility
  const activeSections = sections
    ? [...sections]
        .filter((s) => s.isVisible)
        .sort((a, b) => a.orderIndex - b.orderIndex)
    : null;

  return (
    <div className="pb-16 transition-opacity duration-300">
      {activeSections ? (
        activeSections.map((s) => renderSection(s.sectionType, s.id))
      ) : (
        // Standard fallback if theme hasn't loaded yet
        DEFAULT_SECTION_ORDER.map((type) => renderSection(type, type))
      )}
    </div>
  );
}
