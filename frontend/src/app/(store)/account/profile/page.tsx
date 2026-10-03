'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';

export default function AccountProfilePage() {
  const { user } = useStore();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    birthday: '',
    gender: '',
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const set = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setDirty(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setDirty(false);
    toast.success('Profile updated');
  };

  return (
    <div className="max-w-2xl">
      <AccountHeader title="Profile" description="Your personal details." />
      <form onSubmit={save} className="rounded-lg border border-line bg-surface p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            className="sm:col-span-2"
          />
          <div>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
            />
            <Badge tone="success" className="mt-2">
              Verified
            </Badge>
          </div>
          <div>
            <Input
              label="Mobile number"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
            <Badge tone="success" className="mt-2">
              Verified
            </Badge>
          </div>
          <Input
            label="Birthday"
            type="date"
            value={form.birthday}
            onChange={(e) => set({ birthday: e.target.value })}
            hint="Get a treat on your birthday"
          />
          <Select
            label="Gender (optional)"
            value={form.gender}
            onChange={(e) => set({ gender: e.target.value })}
            options={['Female', 'Male', 'Prefer not to say']}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
      <div className="mt-8 rounded-lg border border-danger/30 bg-surface p-6">
        <h2 className="text-sm font-semibold">Delete account</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Permanently delete your account and personal data. Order records are retained for 5
          years as required by law.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4 text-danger hover:text-danger"
          onClick={() => toast('We’ve emailed you a confirmation link.')}
        >
          Request deletion
        </Button>
      </div>
    </div>
  );
}
