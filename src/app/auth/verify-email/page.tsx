import { Metadata } from 'next';
import AuthLayout from '@/components/auth/AuthLayout';
import EmailVerificationForm from '@/components/auth/EmailVerificationForm';

export const metadata: Metadata = {
  title: 'Verifiser e-postadresse',
  description: 'Bekreft e-postadressen din for å aktivere TutorConnect-kontoen din.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="E-postverifikasjon"
      description="Aktiver kontoen din ved å bekrefte e-postadressen"
    >
      <EmailVerificationForm />
    </AuthLayout>
  );
}