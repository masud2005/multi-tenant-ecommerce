import { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Set New Password',
  description: 'Set a new secure password for your account.',
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
