'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { MonitorIcon, SmartphoneIcon } from 'lucide-react';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { authService } from '@/services/auth';
import { useStore } from '@/contexts/StoreContext';

const initialSessions = [
  {
    id: 's1',
    device: 'Chrome on macOS',
    location: 'Dhaka, BD',
    last: 'Active now',
    current: true,
    mobile: false,
  },
  {
    id: 's2',
    device: 'Tanti app on iPhone 15',
    location: 'Dhaka, BD',
    last: '2 hours ago',
    current: false,
    mobile: true,
  },
  {
    id: 's3',
    device: 'Safari on iPad',
    location: 'Sylhet, BD',
    last: '12 Sep 2026',
    current: false,
    mobile: true,
  },
];

export default function AccountSecurityPage() {
  const { user } = useStore();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [mfa, setMfa] = useState(false);
  const [sessions, setSessions] = useState(initialSessions);
  const [google, setGoogle] = useState(false);

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
      toast.success('Password changed successfully');
      setSessions((s) => s.filter((x) => x.current));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <AccountHeader title="Login & security" />
      <section className="rounded-lg border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold">Change password</h2>
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

      <section className="rounded-lg border border-line bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Two-step verification</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Require a code from an authenticator app or SMS when signing in on a new device.
            </p>
          </div>
          <Switch
            checked={mfa}
            onChange={(v) => {
              setMfa(v);
              toast.success(
                v ? 'Two-step verification enabled' : 'Two-step verification disabled'
              );
            }}
            label="Two-step verification"
            hideLabel
          />
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
          <div>
            <p className="text-sm font-medium">Google</p>
            <p className="text-xs text-ink-muted">
              {user?.email ? `Linked with ${user.email}` : 'Not connected'}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setGoogle(!google)}>
            {google ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Active sessions</h2>
          {sessions.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSessions((s) => s.filter((x) => x.current));
                toast.success('Signed out of all other devices');
              }}
            >
              Sign out all others
            </Button>
          )}
        </div>
        <ul className="mt-3 divide-y divide-line">
          {sessions.map((s) => {
            const Icon = s.mobile ? SmartphoneIcon : MonitorIcon;
            return (
              <li key={s.id} className="flex items-center gap-4 py-3">
                <Icon className="h-5 w-5 text-ink-muted" aria-hidden />
                <div className="flex-1 text-sm">
                  <p className="font-medium">
                    {s.device}{' '}
                    {s.current && (
                      <Badge tone="success" className="ml-1">
                        This device
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {s.location} · {s.last}
                  </p>
                </div>
                {!s.current && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSessions((x) => x.filter((y) => y.id !== s.id))}
                  >
                    Sign out
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
