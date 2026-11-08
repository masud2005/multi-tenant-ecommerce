'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';
import { authService } from '@/services/auth';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';

export default function AccountProfilePage() {
  const { user, setUser } = useStore();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    district: '',
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then((res) => {
        if (res?.data) {
          setForm({
            name: res.data.name || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            district: (res.data as any).district || '',
          });
          setUser((prev: any) => ({
            ...prev,
            name: res.data.name,
            email: res.data.email,
            phone: res.data.phone,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setUser]);

  const set = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        district: form.district.trim() || undefined,
      });
      if (res?.data) {
        setUser((prev: any) => ({
          ...prev,
          name: res.data.name,
          phone: res.data.phone,
        }));
        setForm((prev) => ({
          ...prev,
          name: res.data.name || prev.name,
          phone: res.data.phone || prev.phone,
          district: (res.data as any).district ?? prev.district,
        }));
      }
      setDirty(false);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <AccountHeader
        title="Profile"
        description="Your name and contact details used on orders."
      />

      <form
        onSubmit={save}
        className="rounded-xl border border-line bg-surface p-5 sm:p-6"
      >
        {loading ? (
          <p className="text-sm text-ink-muted">Loading profile…</p>
        ) : (
          <>
            <div className="grid gap-5">
              <Input
                label="Full name"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                disabled
                hint="Email is used to sign in and receive order confirmations."
                autoComplete="email"
              />
              <Input
                label="Mobile number"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
                autoComplete="tel"
              />
              <Input
                label="District / City"
                value={form.district}
                onChange={(e) => set({ district: e.target.value })}
                placeholder="e.g. Dhaka"
              />
            </div>
            <div className="mt-6 flex justify-end border-t border-line pt-5">
              <Button type="submit" loading={saving} disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
