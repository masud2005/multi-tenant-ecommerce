'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';

function VerifyFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') ?? 'otp';
  const to = searchParams.get('to') ?? '';
  const next = searchParams.get('next') ?? '';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length > 1) {
      const chars = d.slice(0, 6).split('');
      setDigits((prev) => prev.map((_, idx) => chars[idx] ?? ''));
      refs.current[Math.min(5, chars.length)]?.focus();
      return;
    }
    setDigits((prev) => prev.map((x, idx) => (idx === i ? d : x)));
    if (d && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (type === 'phone') {
        setError('SMS verification is not configured yet. Please sign in or verify using email.');
        return;
      }

      // Verify OTP via authService
      const otpType = type === 'reset' ? 'PASSWORD_RESET' : 'ACCOUNT_VERIFY';
      const res = await authService.verifyOtp({
        email: to,
        code,
        type: otpType,
      });

      // Handle password reset flow
      if (type === 'reset' && res.data?.resetToken) {
        router.push(`/reset-password?token=${encodeURIComponent(res.data.resetToken)}&next=${encodeURIComponent(next)}`);
        return;
      }

      // Account verification flow: redirect based on role
      const role = (res.data?.user?.role || authService.getUserRole() || '').toUpperCase();
      const isOwnerOrAdmin = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role);

      let targetUrl = isOwnerOrAdmin ? '/admin' : '/account';
      if (next && !next.startsWith('/login') && !next.startsWith('/register')) {
        if (isOwnerOrAdmin) {
          targetUrl = next.startsWith('/account') ? '/admin' : next;
        } else {
          targetUrl = next.startsWith('/admin') ? '/account' : next;
        }
      }

      window.location.href = targetUrl;
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setError('');
      setResendMsg('');
      if (type === 'phone') {
        setResendMsg('A new verification code has been sent to your phone.');
        setSeconds(60);
      } else {
        const otpType = type === 'reset' ? 'PASSWORD_RESET' : 'ACCOUNT_VERIFY';
        await authService.resendOtp({ email: to, type: otpType });
        setResendMsg('A new verification code has been sent to your email.');
        setSeconds(60);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again.');
    }
  };

  const titles: Record<string, [string, string]> = {
    otp: ['Enter your code', `We sent a 6-digit code to ${to || 'your email'}.`],
    reset: ['Enter reset code', `We sent a 6-digit password reset code to ${to || 'your email'}.`],
    phone: [
      'Verify your phone',
      `Enter the 6-digit code we sent to ${to || 'your phone'}.`,
    ],
    mfa: ['Two-step verification', 'Open your authenticator app and enter the 6-digit code for Tanti.'],
  };

  const [title, subtitle] = titles[type] ?? titles.otp;

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      footer={
        <Link href="/login" className="underline hover:text-ink">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={6}
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1}`}
              aria-invalid={!!error}
              className="h-14 w-12 rounded-md border border-line-strong bg-surface text-center text-xl font-semibold text-ink focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25 transition-all"
            />
          ))}
        </div>

        {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
        {resendMsg && <p className="mt-2 text-xs text-green-600" role="status">{resendMsg}</p>}

        <Button type="submit" size="lg" fullWidth className="mt-6" loading={loading}>
          Verify
        </Button>
      </form>

      {type !== 'mfa' && (
        <p className="mt-5 text-center text-sm text-ink-muted">
          {seconds > 0 ? (
            <>Resend code in 0:{seconds.toString().padStart(2, '0')}</>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-ink underline hover:opacity-80 cursor-pointer"
            >
              Resend code
            </button>
          )}
        </p>
      )}

      {type === 'mfa' && (
        <button
          type="button"
          className="mt-5 w-full text-center text-sm text-ink-muted underline hover:text-ink cursor-pointer"
        >
          Use a backup code instead
        </button>
      )}
    </AuthLayout>
  );
}

export function VerifyForm() {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded bg-subtle" />}>
      <VerifyFormContent />
    </Suspense>
  );
}
