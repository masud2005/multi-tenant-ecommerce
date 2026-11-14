'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRightIcon } from 'lucide-react';
import { PaymentBrandIcon } from '@/components/ui/PaymentBrandIcon';
import { useTenant } from '@/contexts/TenantContext';
import { useStore } from '@/contexts/StoreContext';
import { useLandingConfig } from '@/components/store/landing';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-2.891 2.891 2.896 2.896 0 01-2.892-2.891 2.896 2.896 0 012.892-2.891c.31 0 .604.053.882.146v-3.51a6.34 6.34 0 00-.882-.061c-3.518 0-6.368 2.85-6.368 6.368s2.85 6.368 6.368 6.368c3.518 0 6.368-2.85 6.368-6.368V8.43a8.21 8.21 0 004.938 1.637V6.623a4.78 4.78 0 01-1.2-.008v.071z" />
    </svg>
  );
}

export function StoreFooter({ homepage = false }: { homepage?: boolean }) {
  const { tenant } = useTenant();
  const { categories } = useStore();
  const pathname = usePathname();
  const { config } = useLandingConfig();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const onHomepage = homepage || pathname === '/';
  const hideSubscribe = onHomepage && config.designs.newsletter?.visible === true;

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setEmail('');
    toast.success('Thank you for subscribing to our updates!');
  };

  // Dynamic Categories for Shop column
  const dynamicShopLinks = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories
        .filter((cat) => cat.status !== 'hidden' && cat.status !== 'draft')
        .slice(0, 6)
        .map((cat) => [`/shop?category=${encodeURIComponent(cat.key)}`, cat.name] as [string, string]);
    }
    return [
      ['/shop', 'All Products'],
      ['/collections', 'Collections'],
      ['/brands', 'Featured Brands'],
    ] as [string, string][];
  }, [categories]);

  const columns = [
    {
      title: 'Shop',
      links: dynamicShopLinks,
    },
    {
      title: 'Customer Care',
      links: [
        ['/track', 'Track order'],
        ['/policies/shipping', 'Shipping details'],
        ['/policies/returns', 'Returns & exchanges'],
        ['/faq', 'FAQ'],
        ['/contact', 'Contact customer care'],
      ] as [string, string][],
    },
    {
      title: 'About Store',
      links: [
        ['/about', 'Our story'],
        ['/account', 'My account'],
        ['/account/orders', 'Order history'],
        ['/wishlist', 'Saved wishlist'],
        ['/admin', 'Merchant login'],
      ] as [string, string][],
    },
  ];

  // Dynamic Payment Methods: only show enabled methods
  const paymentConfig = tenant.settings?.payment;
  const pmConfig = tenant.settings?.pm;

  const showBkash = paymentConfig?.bkashEnabled ?? pmConfig?.bkash ?? true;
  const showNagad = paymentConfig?.nagadEnabled ?? pmConfig?.nagad ?? true;
  const showCod = paymentConfig?.codEnabled ?? pmConfig?.cod ?? true;

  const socials = tenant.socials || {};
  const hasSocials = Boolean(
    socials.facebook || socials.instagram || socials.twitter || socials.youtube || socials.tiktok
  );

  return (
    <footer className="mt-16 bg-ink text-canvas lg:mt-20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand, Newsletter, & Social Column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              {tenant.logoUrl?.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name?.trim() || 'Store logo'}
                  className="h-10 w-auto max-w-[200px] object-contain"
                />
              ) : tenant.name?.trim() ? (
                <p className="font-display text-3xl">{tenant.name}</p>
              ) : null}
              {tenant.tagline?.trim() ? (
                <p className="mt-3 max-w-sm text-sm text-canvas/70">
                  {tenant.tagline}
                </p>
              ) : null}
            </div>

            {/* Dynamic Social Media Links */}
            {hasSocials && (
              <div className="pt-1">
                <p className="text-xs font-medium text-canvas/60 uppercase tracking-wider mb-2.5">
                  Follow Us
                </p>
                <div className="flex flex-wrap items-center gap-2 text-canvas/80">
                  {socials.facebook && (
                    <a
                      href={socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/10 hover:bg-[#1877F2] hover:text-white transition-colors cursor-pointer"
                      title="Follow on Facebook"
                      aria-label="Facebook"
                    >
                      <FacebookIcon className="h-4 w-4" />
                    </a>
                  )}
                  {socials.instagram && (
                    <a
                      href={socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/10 hover:bg-[#E4405F] hover:text-white transition-colors cursor-pointer"
                      title="Follow on Instagram"
                      aria-label="Instagram"
                    >
                      <InstagramIcon className="h-4 w-4" />
                    </a>
                  )}
                  {socials.twitter && (
                    <a
                      href={socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/10 hover:bg-black hover:text-white transition-colors cursor-pointer"
                      title="Follow on Twitter / X"
                      aria-label="Twitter"
                    >
                      <TwitterIcon className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {socials.youtube && (
                    <a
                      href={socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/10 hover:bg-[#FF0000] hover:text-white transition-colors cursor-pointer"
                      title="Subscribe on YouTube"
                      aria-label="YouTube"
                    >
                      <YouTubeIcon className="h-4 w-4" />
                    </a>
                  )}
                  {socials.tiktok && (
                    <a
                      href={socials.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas/10 hover:bg-black hover:text-white transition-colors cursor-pointer"
                      title="Follow on TikTok"
                      aria-label="TikTok"
                    >
                      <TikTokIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Newsletter Subscription */}
            {hideSubscribe ? null : (
              <form onSubmit={subscribe} className="pt-2 max-w-sm" noValidate>
                <label htmlFor="newsletter" className="text-sm font-medium text-canvas">
                  Subscribe to our newsletter
                </label>
                <div className="mt-2 flex">
                  <input
                    id="newsletter"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    aria-invalid={!!error}
                    className="h-11 flex-1 rounded-l-md border border-canvas/20 bg-transparent px-3 text-sm text-canvas placeholder:text-canvas/40 focus:border-canvas/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex h-11 w-11 items-center justify-center rounded-r-md bg-canvas text-ink hover:bg-canvas/90 cursor-pointer transition-colors"
                    aria-label="Subscribe"
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
                {error && <p className="mt-1.5 text-xs text-[#F4A38F]">{error}</p>}
                <p className="mt-2 text-xs text-canvas/50">
                  Stay updated with latest arrivals, exclusive offers, and promotions.
                </p>
              </form>
            )}
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold tracking-wide text-canvas">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([to, label]) => (
                    <li key={to}>
                      <Link
                        href={to}
                        className="text-sm text-canvas/70 hover:text-canvas hover:underline underline-offset-4 transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Payment Logos & Legal Links */}
            <div className="mt-14 flex flex-col gap-6 border-t border-canvas/15 pt-8 lg:flex-row lg:items-center lg:justify-between">
              {/* Official Brand Logos - Visualized clearly matching Checkout (single line on desktop/tablet) */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:flex-nowrap">
                <span className="text-xs text-canvas/60 mr-1 font-medium whitespace-nowrap">We Accept:</span>
                {showBkash && (
                  <div
                    className="flex h-11 items-center justify-center rounded-lg bg-white px-3 shadow-xs border border-white/20 shrink-0"
                    title="bKash"
                  >
                    <PaymentBrandIcon method="bkash" />
                  </div>
                )}
                {showNagad && (
                  <div
                    className="flex h-11 items-center justify-center rounded-lg bg-white px-3 shadow-xs border border-white/20 shrink-0"
                    title="Nagad"
                  >
                    <PaymentBrandIcon method="nagad" />
                  </div>
                )}
                {showCod && (
                  <div
                    className="flex h-11 items-center gap-2 rounded-lg bg-white px-3 shadow-xs border border-white/20 shrink-0"
                    title="Cash on Delivery"
                  >
                    <PaymentBrandIcon method="cod" className="h-7 w-7 rounded-md [&_svg]:h-4 [&_svg]:w-4" />
                    <span className="text-xs font-semibold text-[#1C1A17] whitespace-nowrap">
                      Cash on Delivery
                    </span>
                  </div>
                )}
              </div>

              {/* Dynamic Copyright and Policies */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-canvas/60 lg:justify-end">
                  <span>
                    © {new Date().getFullYear()}
                    {tenant.name?.trim() ? ` ${tenant.name}` : ''}. All rights reserved.
                    {tenant.contact?.address ? ` · ${tenant.contact.address}` : ''}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Link href="/policies/privacy" className="hover:text-canvas transition-colors">
                      Privacy Policy
                    </Link>
                    <Link href="/policies/terms" className="hover:text-canvas transition-colors">
                      Terms of Service
                    </Link>
                    <Link href="/policies/cookies" className="hover:text-canvas transition-colors">
                      Cookie Policy
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </footer>
          );
}
