'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRightIcon } from 'lucide-react';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { useTenant } from '@/contexts/TenantContext';

const columns = [
  {
    title: 'Shop',
    links: [
      ['/shop?category=women', 'Women'],
      ['/shop?category=men', 'Men'],
      ['/shop?category=kids', 'Kids'],
      ['/shop?category=footwear', 'Footwear'],
      ['/shop?category=accessories', 'Accessories'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['/track', 'Track order'],
      ['/policies/shipping', 'Shipping'],
      ['/policies/returns', 'Returns & refunds'],
      ['/faq', 'FAQ'],
      ['/contact', 'Contact us'],
    ],
  },
  {
    title: 'About',
    links: [
      ['/about', 'Our story'],
      ['/journal', 'Journal'],
      ['/brands/tanti-loom', 'Featured Brands'],
      ['/admin', 'Merchant login'],
    ],
  },
];

export function StoreFooter() {
  const { tenant } = useTenant();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setEmail('');
    toast.success('You’re on the list — check your inbox for 10% off.');
  };

  return (
    <footer className="mt-24 bg-ink text-canvas">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-display text-3xl">{tenant.name}</p>
            <p className="mt-3 max-w-sm text-sm text-canvas/70">
              {tenant.tagline}
            </p>
            <form onSubmit={subscribe} className="mt-8 max-w-sm" noValidate>
              <label htmlFor="newsletter" className="text-sm font-medium">
                Get 10% off your first order
              </label>
              <div className="mt-2 flex">
                <input
                  id="newsletter"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                By subscribing you agree to receive marketing emails. Unsubscribe anytime.
              </p>
            </form>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-medium">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([to, label]) => (
                    <li key={to}>
                      <Link
                        href={to}
                        className="text-sm text-canvas/70 hover:text-canvas transition-colors"
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
        <div className="mt-14 flex flex-col gap-6 border-t border-canvas/15 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(['bkash', 'nagad', 'sslcommerz', 'stripe', 'cod'] as const).map((m) => (
              <PaymentMark key={m} method={m} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-canvas/60">
            <span>© 2026 {tenant.name} · {tenant.contact?.address}</span>
            <Link href="/policies/privacy" className="hover:text-canvas">
              Privacy
            </Link>
            <Link href="/policies/terms" className="hover:text-canvas">
              Terms
            </Link>
            <Link href="/policies/cookies" className="hover:text-canvas">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
