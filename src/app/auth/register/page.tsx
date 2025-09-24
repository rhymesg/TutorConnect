import { Metadata } from 'next';
import AuthLayout from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Registrer deg',
  description: 'Opprett en gratis konto på TutorConnect og start å finne lærere eller studenter i Norge.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Bli med i TutorConnect"
      description="Opprett din gratis konto og start å finne kvalifiserte lærere eller studenter"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
