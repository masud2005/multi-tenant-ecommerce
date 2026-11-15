import { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your account for faster checkout and order tracking.',
};

export default function RegisterPage() {
  return (
    <AuthLayout
      mode="sign-up"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-ink underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
