'use client';

import React from 'react';
import Link from 'next/link';
import { images } from '@/data/images';
import { useTenant } from '@/contexts/TenantContext';

interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  const { tenant } = useTenant();

  return (
    <div className="grid min-h-screen w-full bg-canvas lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="font-display text-2xl text-ink">
          {tenant.name}
        </Link>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-3xl text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-ink-muted">{footer}</div>}
        </main>
        <p className="text-xs text-ink-muted">
          © 2026 {tenant.name} ·{' '}
          <Link href="/policies/privacy" className="hover:text-ink underline">
            Privacy
          </Link>
        </p>
      </div>
      <div className="relative hidden lg:block">
        <img
          src={images.saree}
          alt="Fashion collection"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/20" aria-hidden />
        <p className="absolute bottom-10 left-10 max-w-sm font-display text-3xl leading-snug text-white">
          Track orders, save addresses and return in one tap.
        </p>
      </div>
    </div>
  );
}
