import { Metadata } from 'next';
import { VerifyForm } from '@/components/auth/verify-form';

export const metadata: Metadata = {
  title: 'Verify Account',
  description: 'Enter your verification code to complete sign in or registration.',
};

export default function VerifyPage() {
  return <VerifyForm />;
}
