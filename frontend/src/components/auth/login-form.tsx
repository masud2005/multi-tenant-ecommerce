'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '';

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};

    if (mode === 'email') {
      if (!/^\S+@\S+\.\S+$/.test(email)) er.email = 'Enter a valid email';
      if (password.length < 6) er.password = 'Password must be at least 6 characters';
    } else {
      er.phone = 'Mobile SMS login is coming soon. Please sign in with email and password.';
    }

    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    try {

      const res = await authService.login({ email, password });

      // Determine destination according to RBAC role
      const user = res.data?.user;
      const role = (user?.role || authService.getUserRole() || '').toUpperCase();
      const isOwnerOrAdmin = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role);

      let targetUrl = isOwnerOrAdmin ? '/admin' : '/account';

      if (next && !next.startsWith('/login') && !next.startsWith('/register')) {
        // Only allow redirection to admin routes if user has admin privileges
        if (next.startsWith('/admin')) {
          targetUrl = isOwnerOrAdmin ? next : '/account';
        } else {
          targetUrl = next;
        }
      }

      // Hard redirect to clear router cache and trigger server proxy with fresh cookies
      window.location.href = targetUrl;
    } catch (err: any) {
      const errMsg = err?.message || 'Invalid email or password';
      // If account is unverified, redirect user to OTP verification
      if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('not verified')) {
        router.push(`/verify?type=otp&to=${encodeURIComponent(email)}&next=${encodeURIComponent(next || '/')}`);
        return;
      }
      setErrors({ password: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Email / Phone Tab Selector */}
      <div className="grid grid-cols-2 rounded-md bg-subtle p-1 text-sm" role="tablist">
        {(['email', 'phone'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded py-1.5 font-medium transition-all cursor-pointer',
              mode === m ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            )}
          >
            {m === 'email' ? 'Email' : 'Phone (OTP)'}
          </button>
        ))}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {mode === 'email' ? (
          <>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
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
            <Checkbox
              checked={remember}
              onChange={setRemember}
              label="Keep me signed in on this device"
            />
          </>
        ) : (
          <Input
            label="Mobile number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            placeholder="01XXX-XXXXXX"
            hint="We’ll text you a 6-digit code"
          />
        )}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {mode === 'email' ? 'Sign in' : 'Send code'}
        </Button>
      </form>

      {/* Social / Alternative Actions */}
      <div className="my-6 flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        variant="secondary"
        size="lg"
        fullWidth
        type="button"
        onClick={() => setErrors({ email: 'Google Sign-in is not configured yet. Please sign in with email.' })}
      >
        <span className="font-bold text-[#4285F4] mr-2">G</span> Continue with Google
      </Button>

      <p className="mt-4 text-center text-xs text-ink-muted">
        <Link
          href={next || '/checkout'}
          className="hover:text-ink underline"
        >
          Continue as guest
        </Link>
      </p>
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
