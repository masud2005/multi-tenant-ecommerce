import { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In | Tanti',
  description: 'Sign in to your Tanti account to track orders and save addresses.',
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back to Tanti."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-medium text-ink underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
