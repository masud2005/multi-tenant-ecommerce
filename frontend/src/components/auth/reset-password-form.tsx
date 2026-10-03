'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const next = searchParams.get('next') ?? '';

  const [pw, setPw] = useState({ a: '', b: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset code.');
      return;
    }
    if (pw.a.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (pw.a !== pw.b) {
      setError('Passwords don’t match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await authService.resetPassword({
        resetToken: token,
        newPassword: pw.a,
      });

      // Redirect to appropriate dashboard based on user role
      const role = (res.data?.user?.role || authService.getUserRole() || '').toUpperCase();
      const isOwnerOrAdmin = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role);

      let targetUrl = isOwnerOrAdmin ? '/admin' : '/account';
      if (next && !next.startsWith('/login') && !next.startsWith('/register')) {
        if (next.startsWith('/admin')) {
          targetUrl = isOwnerOrAdmin ? next : '/account';
        } else {
          targetUrl = next;
        }
      }

      window.location.href = targetUrl;
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please request a new code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="New password"
        type="password"
        value={pw.a}
        onChange={(e) => setPw({ ...pw, a: e.target.value })}
        autoComplete="new-password"
        placeholder="At least 6 characters"
      />
      <Input
        label="Confirm password"
        type="password"
        value={pw.b}
        onChange={(e) => setPw({ ...pw, b: e.target.value })}
        error={error}
        autoComplete="new-password"
        placeholder="Re-enter your password"
      />
      <Button type="submit" size="lg" fullWidth loading={loading}>
        Update password
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded bg-subtle" />}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
