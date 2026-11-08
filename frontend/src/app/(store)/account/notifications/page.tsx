'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/contexts/StoreContext';
import { AccountHeader } from '@/components/account/AccountHeader';

export default function AccountNotificationsPage() {
  const { user } = useStore();
  const email = (user?.email || '').trim();

  return (
    <div className="max-w-xl space-y-6">
      <AccountHeader
        title="Notifications"
        description="How you hear about orders from this store."
      />

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Order emails</h2>
          <p className="mt-1 text-sm text-ink-soft leading-relaxed">
            Order confirmation and invoice emails are sent to your account email when an
            order is placed. These transactional messages can’t be turned off from here.
          </p>
        </div>

        {email ? (
          <p className="rounded-lg bg-subtle px-3 py-2.5 text-sm text-ink">
            Delivery address:{' '}
            <span className="font-medium">{email}</span>
          </p>
        ) : (
          <p className="text-sm text-ink-soft">
            No email on your profile yet.
          </p>
        )}

        <Link
          href="/account/profile"
          className="inline-flex text-sm font-medium text-ink underline"
        >
          Update profile email details
        </Link>
      </section>
    </div>
  );
}
