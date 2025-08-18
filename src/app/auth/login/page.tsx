import { Metadata } from 'next';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Logg inn',
  description: 'Logg inn på TutorConnect for å få tilgang til din konto og finne lærere eller studenter.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Logg inn på TutorConnect"
      description="Få tilgang til din konto og start å finne lærere eller studenter"
    >
      <LoginForm />
    </AuthLayout>
  );
}