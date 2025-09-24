'use client';

import { useActionState, useState } from 'react';
import { registerAction, type RegisterFormState } from '@/lib/actions/auth';
import AuthForm from './AuthForm19';
import FormField from './FormField';
import FormError from './FormError';
import { RegionSelector } from './RegionSelector';
import { useLanguageText } from '@/contexts/LanguageContext';
import { NorwegianRegion } from '@prisma/client';

interface RegisterFormProps {
  onSuccess?: (data: any) => void;
  className?: string;
}

export default function RegisterForm19({ 
  onSuccess,
  className 
}: RegisterFormProps) {
  // React 19 useActionState hook
  const [state, submitAction, isPending] = useActionState<RegisterFormState, FormData>(
    registerAction,
    null
  );
  
  // Local state for region selection
  const [selectedRegion, setSelectedRegion] = useState<NorwegianRegion | undefined>();
  const t = useLanguageText();

  return (
    <AuthForm
      title={t('Opprett konto', 'Create your account')}
      subtitle={t('Bli med i TutorConnect i dag', 'Join TutorConnect today')}
      action={submitAction}
      isSubmitting={isPending}
      submitButtonText={t('Opprett konto', 'Create account')}
      submitButtonLoadingText={t('Oppretter konto...', 'Creating account...')}
      className={className}
      footer={
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">{t('eller', 'or')}</span>
            </div>
          </div>
          
          <p className="text-sm text-neutral-600">
            {t('Har du allerede en konto?', 'Already have an account?')}{' '}
            <a
              href="/auth/login"
              className="font-medium text-brand-600 hover:text-brand-500 focus:outline-none focus:underline"
            >
              {t('Logg inn her', 'Log in here')}
            </a>
          </p>
        </div>
      }
    >
      {/* General error message */}
      {state?.error && (
        <FormError 
          error={state.error} 
          variant="banner" 
        />
      )}

      {/* Username field */}
      <FormField
        label={t('Brukernavn', 'Username')}
        name="name"
        type="text"
        placeholder={t('Velg et unikt brukernavn', 'Choose a unique username')}
        required
        autoComplete="username"
        autoFocus
        error={state?.fieldErrors?.name}
      />

      {/* Email field */}
      <FormField
        label={t('E-post', 'Email')}
        name="email"
        type="email"
        placeholder={t('Skriv inn e-postadressen din', 'Enter your email address')}
        required
        autoComplete="email"
        error={state?.fieldErrors?.email}
      />

      {/* Region selector */}
      <div>
        <RegionSelector
          label={t('Region', 'Region')}
          value={selectedRegion}
          onChange={setSelectedRegion}
          required
          error={state?.fieldErrors?.region}
          placeholder={t('Velg region...', 'Choose a region...')}
        />
        {/* Hidden input for form submission */}
        <input
          type="hidden"
          name="region"
          value={selectedRegion || ''}
        />
      </div>

      {/* Password field */}
      <FormField
        label={t('Passord', 'Password')}
        name="password"
        type="password"
        placeholder={t('Opprett et sterkt passord', 'Create a strong password')}
        required
        autoComplete="new-password"
        error={state?.fieldErrors?.password}
        helpText={t('Passordet må være minst 8 tegn langt', 'Password must be at least 8 characters long')}
      />

      {/* Confirm Password field */}
      <FormField
        label={t('Bekreft passord', 'Confirm password')}
        name="confirmPassword"
        type="password"
        placeholder={t('Skriv inn passordet på nytt', 'Re-enter your password')}
        required
        autoComplete="new-password"
        error={state?.fieldErrors?.confirmPassword}
      />

      {/* Terms and Privacy */}
      <div className="text-xs text-neutral-600">
        <p>
          {t('Ved å opprette en konto godtar du våre', 'By creating an account, you agree to our')}{' '}
          <a
            href="/terms"
            className="text-brand-600 hover:text-brand-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('vilkår for bruk', 'Terms of Use')}
          </a>
          {' '}og{' '}
          <a
            href="/privacy"
            className="text-brand-600 hover:text-brand-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('personvernpolicy', 'Privacy Policy')}
          </a>
          .
        </p>
      </div>

      {/* Security info */}
      <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
        <p className="flex items-center">
          <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          {t('Din informasjon er beskyttet med sikker kryptering', 'Your information is protected with secure encryption')}
        </p>
      </div>
    </AuthForm>
  );
}
