'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword({ email });
      // Redirect to verification OTP page with reset type
      router.push(`/verify?type=reset&to=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err?.message || 'Unable to send password reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        autoComplete="email"
        placeholder="your.email@example.com"
      />
      <Button type="submit" size="lg" fullWidth loading={loading}>
        Send verification code
      </Button>
    </form>
  );
}
