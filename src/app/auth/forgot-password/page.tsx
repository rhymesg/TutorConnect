import { Metadata } from 'next';
import AuthLayout from '@/components/auth/AuthLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Glemt passord',
  description: 'Tilbakestill passordet ditt på TutorConnect ved å følge instruksjonene.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Tilbakestill passord"
      description="Få hjelp til å komme tilbake til kontoen din"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}