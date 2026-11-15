'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';

export function updateFaviconInDOM(url?: string | null, forceCacheBust = false) {
  if (typeof document === 'undefined') return;

  const targetUrl =
    url && url.trim()
      ? url.trim().replace(/^http:\/\//i, 'https://')
      : '/api/favicon';
  const finalUrl = forceCacheBust
    ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
    : targetUrl;
  const isSvg = targetUrl.endsWith('.svg');
  const type = isSvg ? 'image/svg+xml' : 'image/png';

  const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];

  rels.forEach((rel) => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      if (rel === 'icon') {
        link.type = type;
      }
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== finalUrl) {
      link.href = finalUrl;
      if (rel === 'icon') {
        link.type = type;
      }
    }
  });
}

function resolveStorefrontPageTitle(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '') || '/';

  // 1. Static Storefront & Auth Routes
  const staticTitles: Record<string, string> = {
    '/': 'Home',
    '/shop': 'Shop All',
    '/search': 'Search Results',
    '/cart': 'Cart',
    '/checkout': 'Checkout',
    '/collections': 'Collections',
    '/about': 'About Us',
    '/contact': 'Contact Us',
    '/faq': 'FAQ',
    '/track': 'Track Order',
    '/wishlist': 'Wishlist',
    '/login': 'Sign In',
    '/register': 'Create Account',
    '/forgot-password': 'Reset Password',
    '/reset-password': 'Set New Password',
    '/verify': 'Verify Account',
    '/staff/accept-invite': 'Staff Invitation',
    // Customer account routes
    '/account': 'My Account',
    '/account/orders': 'My Orders',
    '/account/addresses': 'My Addresses',
    '/account/profile': 'My Profile',
    '/account/returns': 'Returns & Exchanges',
    '/account/reviews': 'My Reviews',
    '/account/security': 'Account Security',
    '/account/support': 'Help & Support',
  };

  if (staticTitles[clean]) {
    return staticTitles[clean];
  }

  // 2. Customer Account Order Dynamic Routes
  if (clean.startsWith('/account/orders/')) {
    if (clean.endsWith('/return')) {
      return 'Request Return';
    }
    const orderNo = clean.split('/')[3];
    return orderNo ? `Order #${orderNo}` : 'Order Details';
  }

  // 3. Products: /products/[slug]
  if (clean.startsWith('/products/')) {
    const slug = clean.replace(/^\/products\//, '');
    if (slug) {
      return slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return 'Product Details';
  }

  // 4. Collections: /collections/[slug]
  if (clean.startsWith('/collections/')) {
    const slug = clean.replace(/^\/collections\//, '');
    if (slug) {
      const name = slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return `${name} Collection`;
    }
    return 'Collections';
  }

  // 5. Brands: /brands/[slug]
  if (clean.startsWith('/brands/')) {
    const slug = clean.replace(/^\/brands\//, '');
    if (slug) {
      return slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return 'Brands';
  }

  // 6. Category: /category/[slug]
  if (clean.startsWith('/category/')) {
    const slug = clean.replace(/^\/category\//, '');
    if (slug) {
      return slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return 'Category';
  }

  // 7. Policies: /policies/[slug]
  if (clean.startsWith('/policies/')) {
    const slug = clean.replace(/^\/policies\//, '');
    const policyMap: Record<string, string> = {
      shipping: 'Shipping Policy',
      returns: 'Returns & Exchange Policy',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      cookies: 'Cookie Policy',
    };
    if (policyMap[slug.toLowerCase()]) {
      return policyMap[slug.toLowerCase()];
    }
    if (slug) {
      return `${slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')} Policy`;
    }
    return 'Policy';
  }

  // 8. Order confirmation & payment
  if (clean.startsWith('/order-confirmation')) {
    return 'Order Confirmation';
  }
  if (clean.startsWith('/pay')) {
    return 'Complete Payment';
  }

  // 9. Fallback from last URL segment
  const lastSegment = clean.split('/').filter(Boolean).pop();
  if (lastSegment) {
    return lastSegment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return 'Home';
}

function resolveAdminPageTitle(pathname: string): string {
  const subpath = pathname.replace(/^\/admin\/?/, '').replace(/\/+$/, '');
  if (!subpath) return 'Dashboard';

  const adminMap: Record<string, string> = {
    analytics: 'Analytics',
    audit: 'Audit Logs',
    brands: 'Brands',
    categories: 'Categories',
    'categories/new': 'New Category',
    collections: 'Collections',
    content: 'Content',
    customers: 'Customers',
    discounts: 'Discounts',
    inventory: 'Inventory',
    media: 'Media',
    messages: 'Messages',
    notifications: 'Notifications',
    orders: 'Orders',
    payments: 'Payments',
    products: 'Products',
    'products/new': 'New Product',
    'products/import': 'Import Products',
    reports: 'Reports',
    returns: 'Returns',
    reviews: 'Reviews',
    settings: 'Settings',
    shipping: 'Shipping',
    staff: 'Staff',
    theme: 'Theme Editor',
  };

  if (adminMap[subpath]) {
    return adminMap[subpath];
  }

  if (subpath.startsWith('orders/')) return 'Order Details';
  if (subpath.startsWith('products/')) return 'Product Details';

  const firstSeg = subpath.split('/')[0];
  return (
    adminMap[firstSeg] ||
    firstSeg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function StoreMetadataInjector() {
  const { tenant } = useTenant();
  const pathname = usePathname();

  // 1. Dynamic Favicon injection - ONLY when tenant favicon URL actually changes
  useEffect(() => {
    if (tenant.faviconUrl) {
      updateFaviconInDOM(tenant.faviconUrl);
    }
  }, [tenant.faviconUrl]);

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
      const pageLabel = resolveAdminPageTitle(pathname);
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

    // 2c. All other Storefront & Auth routes
    const pageLabel = resolveStorefrontPageTitle(pathname);
    const storefrontBrand = brand || 'Store';
    document.title = `${pageLabel} | ${storefrontBrand}`;
  }, [tenant.name, tenant.tagline, tenant.settings, pathname]);

  return null;
}
