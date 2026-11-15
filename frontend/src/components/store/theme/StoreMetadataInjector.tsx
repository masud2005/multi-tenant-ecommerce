'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';

export function updateFaviconInDOM(url?: string | null) {
  if (typeof document === 'undefined') return;
  if (!url || !url.trim()) return;

  const secureUrl = url.trim().replace(/^http:\/\//i, 'https://');
  const cacheBustedUrl = `${secureUrl}${secureUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;

  // Find or create primary icon link
  let iconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    document.head.appendChild(iconLink);
  }
  iconLink.type = 'image/png';
  iconLink.href = cacheBustedUrl;

  // Shortcut icon
  let shortcutLink = document.querySelector<HTMLLinkElement>(
    "link[rel='shortcut icon']"
  );
  if (!shortcutLink) {
    shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    document.head.appendChild(shortcutLink);
  }
  shortcutLink.href = cacheBustedUrl;

  // Apple touch icon
  let appleLink = document.querySelector<HTMLLinkElement>(
    "link[rel='apple-touch-icon']"
  );
  if (!appleLink) {
    appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleLink);
  }
  appleLink.href = cacheBustedUrl;
}

export function StoreMetadataInjector() {
  const { tenant } = useTenant();
  const pathname = usePathname();

  // 1. Dynamic Favicon injection on tenant change AND route change
  useEffect(() => {
    if (tenant.faviconUrl) {
      updateFaviconInDOM(tenant.faviconUrl);
    }
  }, [tenant.faviconUrl, pathname]);

  // 2. Dynamic Title & Description injection
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const storeName = tenant.name?.trim() || '';
    const seoSettings =
      (tenant.settings?.seo as Record<string, unknown> | undefined) || {};
    const customMetaTitle =
      typeof seoSettings.metaTitle === 'string' && seoSettings.metaTitle.trim()
        ? seoSettings.metaTitle.trim()
        : null;
    const customMetaDesc =
      typeof seoSettings.metaDescription === 'string' &&
      seoSettings.metaDescription.trim()
        ? seoSettings.metaDescription.trim()
        : null;

    const brand = customMetaTitle || storeName || '';

    // 2a. Admin dashboard routes (e.g. /admin/settings -> Settings · Big Deshi Admin)
    if (pathname.startsWith('/admin')) {
      const subpath = pathname.replace(/^\/admin\/?/, '');
      const pageLabel = subpath
        ? subpath
            .split('/')[0]
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Dashboard';
      const adminBrand = storeName || brand;
      document.title = adminBrand
        ? `${pageLabel} · ${adminBrand} Admin`
        : `${pageLabel} · Admin`;
      return;
    }

    // 2b. Storefront homepage ('/')
    if (pathname === '/') {
      if (customMetaTitle) {
        document.title = customMetaTitle.includes('|')
          ? customMetaTitle
          : `Home | ${customMetaTitle}`;
      } else if (storeName) {
        document.title = `Home | ${storeName}`;
      } else {
        document.title = 'Home';
      }

      const descContent = customMetaDesc || tenant.tagline?.trim();
      if (descContent) {
        let metaDesc = document.querySelector<HTMLMetaElement>(
          'meta[name="description"]'
        );
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = descContent;
      }
      return;
    }

    // 2c. Other storefront & auth routes (Shop, Collections, Cart, Product, Login, etc.)
    if (brand) {
      let current = document.title || '';
      // Strip any legacy static brand suffixes
      current = current
        .replace(/\s*\|\s*Tanti(?:\s+Lifestyle|\s+Brand\s+Showcase)?/gi, '')
        .replace(/\s*\|\s*Multi-Tenant\s+E-Commerce/gi, '')
        .replace(/\s*·\s*Multi-Tenant\s+E-Commerce/gi, '')
        .trim();

      if (current.includes('|')) {
        const parts = current.split('|');
        const pagePart = parts[0].trim();
        document.title = pagePart ? `${pagePart} | ${brand}` : brand;
      } else if (current) {
        document.title = `${current} | ${brand}`;
      }
    }
  }, [tenant.name, tenant.tagline, tenant.settings, pathname]);

  return null;
}
