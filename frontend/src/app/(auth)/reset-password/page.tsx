import { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Set a new password | Tanti',
  description: 'Set a new secure password for your Tanti account.',
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose something you haven’t used before."
      footer={
        <Link href="/login" className="underline hover:text-ink">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
