'use client';


import { asApiError } from '@/lib/api-error';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Shield,
  LogOut,
  Loader2,
  MapPin,
} from 'lucide-react';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { authService, type AuthDeviceSession } from '@/services/auth';
import { formatDateTime } from '@/utils/format';
import { useStore } from '@/contexts/StoreContext';
import { useRouter } from 'next/navigation';

function DeviceIcon({ type }: { type?: string }) {
  const cls = 'h-5 w-5 shrink-0 text-ink';
  switch (type) {
    case 'mobile':
      return <Smartphone className={cls} aria-hidden />;
    case 'tablet':
      return <Tablet className={cls} aria-hidden />;
    case 'desktop':
      return <Laptop className={cls} aria-hidden />;
    default:
      return <Monitor className={cls} aria-hidden />;
  }
}

export default function AccountSecurityPage() {
  const router = useRouter();
  const { logout } = useStore();

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [sessions, setSessions] = useState<AuthDeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [confirmOthers, setConfirmOthers] = useState(false);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const list = await authService.getSessions();
      setSessions(list);
    } catch {
      toast.error('Could not load signed-in devices');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
    } catch (err: unknown) {
      toast.error(
        asApiError(err).message ||
          'Could not change password. Check your current password and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (session: AuthDeviceSession) => {
    setRevokingId(session.id);
    try {
      const res = await authService.revokeSession(session.id);
      if (res?.signedOutCurrent || session.isCurrent) {
        toast.success('Signed out of this device');
        await authService.logout();
        logout();
        router.push('/login');
        return;
      }
      toast.success('Device signed out');
      await loadSessions();
    } catch (err: unknown) {
      toast.error(asApiError(err).message || 'Could not sign out that device');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      const res = await authService.revokeOtherSessions();
      toast.success(
        res?.revokedCount
          ? `Signed out of ${res.revokedCount} other device${res.revokedCount === 1 ? '' : 's'}`
          : 'No other devices were signed in',
      );
      setConfirmOthers(false);
      await loadSessions();
    } catch (err: unknown) {
      toast.error(asApiError(err).message || 'Could not sign out other devices');
    } finally {
      setRevokingOthers(false);
    }
  };

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="max-w-xl space-y-6">
      <AccountHeader
        title="Login & security"
        description="Manage your password and the devices signed into your account."
      />

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Change password</h2>
        <form onSubmit={change} noValidate className="mt-4 grid gap-4">
          <Input
            label="Current password"
            type="password"
            placeholder="Enter your current password"
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
            error={errors.current}
            autoComplete="current-password"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              placeholder="At least 6 characters"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              error={errors.next}
              autoComplete="new-password"
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="Re-enter new password"
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

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Shield className="h-4 w-4" aria-hidden />
              Signed-in devices
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Devices currently using your account. Sign out any you don’t
              recognize.
            </p>
          </div>
          {otherCount > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOthers(true)}
            >
              Sign out others
            </Button>
          ) : null}
        </div>

        <div className="mt-4 divide-y divide-line border-t border-line">
          {sessionsLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading devices…
            </div>
          ) : sessions.length === 0 ? (
            <p className="py-8 text-sm text-ink-soft">
              No active sessions found. Sign in again to see this device here.
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-3 py-4 first:pt-4"
              >
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-subtle">
                  <DeviceIcon type={session.deviceType} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">
                      {session.deviceLabel}
                    </p>
                    {session.isCurrent ? (
                      <Badge tone="success">This device</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Last active {formatDateTime(session.lastActiveAt)}
                    {session.createdAt
                      ? ` · Signed in ${formatDateTime(session.createdAt)}`
                      : ''}
                  </p>
                  {session.ipAddress ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {session.ipAddress}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-ink-soft hover:text-danger"
                  loading={revokingId === session.id}
                  onClick={() => handleRevoke(session)}
                >
                  <LogOut className="mr-1 h-3.5 w-3.5" />
                  {session.isCurrent ? 'Sign out' : 'Remove'}
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      <Modal
        open={confirmOthers}
        onClose={() => setConfirmOthers(false)}
        title="Sign out other devices?"
        description="You’ll stay signed in here. All other devices will need to sign in again."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOthers(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={revokingOthers}
              onClick={handleRevokeOthers}
            >
              Sign out others
            </Button>
          </>
        }
      />
    </div>
  );
}
