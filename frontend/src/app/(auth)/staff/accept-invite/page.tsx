'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { staffService, ValidatedInviteData } from '@/services/staff-service';
import { setAuthSession, clearAuthSession } from '@/services/auth/auth.storage';

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<ValidatedInviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided. Please check the link in your invitation email.');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await staffService.validateStaffInvite(token);
        if (res?.success && res.data) {
          setInviteData(res.data);
          setName(res.data.name || res.data.email.split('@')[0] || '');
        } else {
          setError(res?.message || 'Invalid or expired invitation token.');
        }
      } catch (err: any) {
        setError(err?.message || 'This invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Please enter your full name';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters long';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setSubmitting(true);
      const res = await staffService.acceptStaffInvite({
        token,
        password,
        name: name.trim(),
      });

      if (res?.success && res.data) {
        const { accessToken, refreshToken, user, store, redirectUrl } = res.data;

        // Persist session tokens
        setAuthSession({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: (user.role as any) || 'MANAGER',
            tenantId: user.tenantId,
          },
        });

        toast.success(`Welcome to ${store.name}! Your account is now active.`);

        // Direct routing to authorized module (e.g., /admin/orders or /admin)
        const destination = redirectUrl || '/admin';
        window.location.href = destination;
      } else {
        toast.error(res?.message || 'Failed to activate staff account');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToSignIn = () => {
    clearAuthSession();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-ink-muted" />
        <p className="text-sm text-ink-muted">Validating staff invitation link...</p>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-ink">Invitation Link Expired</h2>
        <p className="text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
          {error || 'This staff invitation link is no longer valid. Please ask your store owner to send a new invite.'}
        </p>
        <div className="pt-2">
          <Button variant="secondary" size="md" onClick={handleGoToSignIn}>
            Go to Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role & Store Badge Summary */}
      <div className="rounded-xl border border-line bg-surface/60 p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Role Assignment
          </span>
          <Badge tone="success" dot>
            {inviteData.roleName}
          </Badge>
        </div>
        <p className="text-sm font-medium text-ink">
          You are joining <span className="font-semibold">{inviteData.storeName}</span>
        </p>
        {inviteData.roleDescription && (
          <p className="text-xs text-ink-muted leading-relaxed">
            {inviteData.roleDescription}
          </p>
        )}
      </div>

      {/* Account Setup Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={inviteData.email}
          disabled
          hint="This email is linked to your staff account."
        />

        <Input
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Farzana Yasmin"
          error={formErrors.name}
          required
        />

        <div className="relative">
          <Input
            label="Create Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            error={formErrors.password}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-ink-muted hover:text-ink cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          error={formErrors.confirmPassword}
          required
        />

        <div className="pt-2">
          <Button type="submit" size="lg" fullWidth loading={submitting}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Set Password & Join Dashboard
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AcceptStaffInvitePage() {
  return (
    <div className="min-h-screen w-full bg-canvas flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Accept Staff Invite
          </h1>
          <p className="text-sm text-ink-muted">
            Set up your password to activate your staff management account.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-6 sm:p-8 shadow-xs">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-ink-muted" />
                <p className="text-sm text-ink-muted">Loading invitation details...</p>
              </div>
            }
          >
            <AcceptInviteForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-ink-muted">
          Already have an active account?{' '}
          <a
            href="/login"
            onClick={() => clearAuthSession()}
            className="font-medium text-ink underline underline-offset-4 cursor-pointer"
          >
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
