import React from 'react';
import { AccountLayout } from '@/components/account/AccountLayout';

export const metadata = {
  title: 'My Account',
  description: 'Manage your orders, addresses, and account details.',
};

export default function AccountRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountLayout>{children}</AccountLayout>;
}
