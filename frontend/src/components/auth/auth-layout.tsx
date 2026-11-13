'use client';

import React from 'react';
import Link from 'next/link';
import { useTenant } from '@/contexts/TenantContext';
import { parseAuthPage } from '@/lib/auth-page';
import { Skeleton } from '@/components/ui/Skeleton';

interface AuthLayoutProps {
  title?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  mode?: 'sign-in' | 'sign-up';
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  mode,
}: AuthLayoutProps) {
  const { tenant, isLoading } = useTenant();
  const authPage = parseAuthPage(tenant.authPage);
  const fromApi = mode === 'sign-in' || mode === 'sign-up';
  const heading = fromApi
    ? mode === 'sign-in'
      ? authPage.signInTitle
      : authPage.signUpTitle
    : title || '';
  const subheading = fromApi
    ? mode === 'sign-in'
      ? authPage.signInSubtitle
      : authPage.signUpSubtitle
    : subtitle;
  const imageUrl = authPage.imageUrl;
  const caption = authPage.caption;

  return (
    <div className="grid min-h-screen w-full bg-canvas lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link
          href="/"
          className="flex min-h-9 min-w-[2.5rem] items-center"
          aria-label={tenant.name?.trim() || 'Store home'}
        >
          {!isLoading && tenant.logoUrl?.trim() ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name?.trim() || 'Store logo'}
              className="h-9 w-auto max-w-[160px] object-contain"
            />
          ) : !isLoading && tenant.name?.trim() ? (
            <span className="font-display text-2xl text-ink">{tenant.name}</span>
          ) : null}
        </Link>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {fromApi && isLoading ? (
            <div className="space-y-3" aria-hidden>
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : (
            <>
              {heading ? <h1 className="font-display text-3xl text-ink">{heading}</h1> : null}
              {subheading ? <p className="mt-2 text-sm text-ink-muted">{subheading}</p> : null}
            </>
          )}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-ink-muted">{footer}</div>}
        </main>
      </div>
      <div className="relative hidden bg-canvas lg:block">
        {isLoading ? (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-ink/20" aria-hidden />
            {caption ? (
              <p className="absolute bottom-10 left-10 max-w-sm font-display text-3xl leading-snug text-white">
                {caption}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
