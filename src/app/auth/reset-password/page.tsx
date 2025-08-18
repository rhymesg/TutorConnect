import { Metadata } from 'next';
import AuthLayout from '@/components/auth/AuthLayout';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Tilbakestill passord',
  description: 'Opprett et nytt passord for TutorConnect-kontoen din.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Opprett nytt passord"
      description="Fullfør tilbakestillingen av passordet ditt"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}