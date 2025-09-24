'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import FormField from './FormField';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';

export default function SimpleLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { language } = useLanguage();
  const t = useLanguageText();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Check if there's a redirect URL stored
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectUrl);
        } else {
          // Default redirect to profile
          router.push('/profile');
        }
      } else {
        setError(
          result.error ||
            (language === 'no' ? 'Innlogging mislyktes' : 'Login failed')
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(
        language === 'no'
          ? 'Det oppstod en uventet feil'
          : 'An unexpected error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {t('Logg inn', 'Log in')}
        </h2>
        <p className="text-neutral-600">
          {t('Velkommen tilbake til TutorConnect', 'Welcome back to TutorConnect')}
        </p>
      </div>

      <form onSubmit={handleSubmit} method="POST" action="#" className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700 flex items-center">
              <svg
                className="h-4 w-4 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        <FormField
          label={t('E-postadresse', 'Email address')}
          name="email"
          type="email"
          placeholder={t('din@epost.no', 'you@example.com')}
          autoComplete="email"
          autoFocus
          value={email}
          onChange={setEmail}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              {t('Passord', 'Password')}
            </label>
            <a
              href="/auth/forgot-password"
              className="text-sm font-medium text-brand-600 hover:text-brand-500 focus:outline-none focus:underline"
            >
              {t('Glemt passord?', 'Forgot password?')}
            </a>
          </div>
          <FormField
            label=""
            name="password"
            type="password"
            placeholder={t('Skriv inn passordet ditt', 'Enter your password')}
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            className="mb-0"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? t('Logger inn...', 'Signing you in...') : t('Logg inn', 'Log in')}
        </button>
      </form>

      <div className="space-y-4 mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-neutral-500">{t('eller', 'or')}</span>
          </div>
        </div>
        
        <p className="text-sm text-neutral-600">
          {t('Har du ikke en konto enda?', "Don't have an account yet?")}{' '}
          <a
            href="/auth/register"
            className="font-medium text-brand-600 hover:text-brand-500 focus:outline-none focus:underline"
          >
            {t('Registrer deg her', 'Sign up here')}
          </a>
        </p>
      </div>

      {/* Security info */}
      <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg mt-6">
        <p className="flex items-center">
          <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          {t('Din pålogging er beskyttet med sikker kryptering', 'Your sign-in is protected with secure encryption')}
        </p>
      </div>
    </>
  );
}
