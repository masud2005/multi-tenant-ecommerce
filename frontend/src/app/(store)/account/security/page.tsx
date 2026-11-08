'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';

export default function AccountSecurityPage() {
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!pw.current) er.current = 'Enter your current password';
    if (pw.next.length < 6) er.next = 'Use at least 6 characters';
    if (pw.next !== pw.confirm) er.confirm = 'Passwords don’t match';
    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    try {
      await authService.changePassword({
        oldPassword: pw.current,
        newPassword: pw.next,
      });
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Password updated');
    } catch (err: any) {
      toast.error(
        err?.message ||
          'Could not change password. Check your current password and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <AccountHeader
        title="Login & security"
        description="Update the password you use to sign in."
      />

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Change password</h2>
        <form onSubmit={change} noValidate className="mt-4 grid gap-4">
          <Input
            label="Current password"
            type="password"
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
            error={errors.current}
            autoComplete="current-password"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              error={errors.next}
              autoComplete="new-password"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              error={errors.confirm}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Button type="submit" loading={loading}>
              Update password
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
