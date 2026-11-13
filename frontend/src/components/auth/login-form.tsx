'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? searchParams.get('redirect') ?? '';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};

    const value = identifier.trim();
    const isEmail = value.includes('@');
    if (isEmail) {
      if (!/^\S+@\S+\.\S+$/.test(value)) er.identifier = 'Enter a valid email or mobile number';
    } else if (value.replace(/\D/g, '').length < 6) {
      er.identifier = 'Enter a valid email or mobile number';
    }
    if (password.length < 6) er.password = 'Password must be at least 6 characters';

    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    try {

      const res = await authService.login(
        isEmail ? { email: value, password } : { phone: value, password },
      );

      // Determine destination according to RBAC role and dynamic redirect
      const user = res.data?.user;
      const redirectUrl = (res.data as any)?.redirectUrl;
      const role = (user?.role || authService.getUserRole() || '').toUpperCase();
      const isOwnerOrAdmin = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role);

      let targetUrl = redirectUrl || (isOwnerOrAdmin ? '/admin' : '/account');

      if (next && !next.startsWith('/login') && !next.startsWith('/register')) {
        if (isOwnerOrAdmin) {
          targetUrl = next.startsWith('/account') ? (redirectUrl || '/admin') : next;
        } else {
          targetUrl = next.startsWith('/admin') ? '/account' : next;
        }
      }

      // Hard redirect to clear router cache and trigger server proxy with fresh cookies
      window.location.href = targetUrl;
    } catch (err: any) {
      const errMsg = err?.message || 'Invalid email, mobile number, or password';
      const verifyEmail = err?.body?.errors?.find(
        (item: { field?: string; value?: string }) => item.field === 'email' && item.value,
      )?.value;
      if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('not verified')) {
        const to = verifyEmail || (isEmail ? value : '');
        if (to) {
          router.push(`/verify?type=otp&to=${encodeURIComponent(to)}&next=${encodeURIComponent(next || '/')}`);
          return;
        }
      }
      setErrors({ password: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Email or mobile number"
          type="text"
          autoComplete="username"
          placeholder="Email or 01XXXXXXXXX"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
        />
        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Link
            href="/forgot-password"
            className="mt-2 inline-block text-xs text-ink-soft hover:text-ink underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Sign in
        </Button>
      </form>

      {/* Demo Credentials Helper */}
      <div className="mt-6 rounded-lg border border-line bg-surface p-3.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">Demo Accounts:</span>
          <span className="text-[11px] text-ink-muted">Click to auto-fill</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <button
            type="button"
            onClick={() => {
              setIdentifier('owner@gmail.com');
              setPassword('123456');
              setErrors({});
            }}
            className="flex flex-col items-start rounded-md border border-line bg-canvas p-2 text-left transition-colors hover:border-ink/40 cursor-pointer"
          >
            <span className="font-semibold text-ink">Owner (Admin)</span>
            <span className="text-[11px] text-ink-muted truncate w-full">owner@gmail.com</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIdentifier('customer@gmail.com');
              setPassword('123456');
              setErrors({});
            }}
            className="flex flex-col items-start rounded-md border border-line bg-canvas p-2 text-left transition-colors hover:border-ink/40 cursor-pointer"
          >
            <span className="font-semibold text-ink">Customer (Store)</span>
            <span className="text-[11px] text-ink-muted truncate w-full">customer@gmail.com</span>
          </button>
        </div>
      </div>
    </>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded bg-subtle" />}>
      <LoginFormContent />
    </Suspense>
  );
}
