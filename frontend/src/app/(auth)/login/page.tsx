import { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account to track orders and save addresses.',
};

export default function LoginPage() {
  return (
    <AuthLayout
      mode="sign-in"
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
