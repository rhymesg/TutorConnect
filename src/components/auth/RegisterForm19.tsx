'use client';

import { useActionState, useState } from 'react';
import { registerAction, type RegisterFormState } from '@/lib/actions/auth';
import AuthForm from './AuthForm19';
import FormField from './FormField';
import FormError from './FormError';
import { RegionSelector } from './RegionSelector';
import { navigation, forms } from '@/lib/translations';
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

  return (
    <AuthForm
      title="Opprett konto"
      subtitle="Bli med i TutorConnect i dag"
      action={submitAction}
      isSubmitting={isPending}
      submitButtonText="Opprett konto"
      submitButtonLoadingText="Oppretter konto..."
      className={className}
      footer={
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">eller</span>
            </div>
          </div>
          
          <p className="text-sm text-neutral-600">
            Har du allerede en konto?{' '}
            <a
              href="/auth/login"
              className="font-medium text-brand-600 hover:text-brand-500 focus:outline-none focus:underline"
            >
              Logg inn her
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
        label="Brukernavn"
        name="name"
        type="text"
        placeholder="Velg et unikt brukernavn"
        required
        autoComplete="username"
        autoFocus
        error={state?.fieldErrors?.name}
      />

      {/* Email field */}
      <FormField
        label={forms.no.email}
        name="email"
        type="email"
        placeholder={forms.no.enterEmail}
        required
        autoComplete="email"
        error={state?.fieldErrors?.email}
      />

      {/* Region selector */}
      <div>
        <RegionSelector
          label="Region"
          name="region"
          value={selectedRegion}
          onChange={setSelectedRegion}
          required
          error={state?.fieldErrors?.region}
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
        label={forms.no.password}
        name="password"
        type="password"
        placeholder="Opprett et sterkt passord"
        required
        autoComplete="new-password"
        error={state?.fieldErrors?.password}
        helpText="Passordet må være minst 8 tegn langt"
      />

      {/* Confirm Password field */}
      <FormField
        label="Bekreft passord"
        name="confirmPassword"
        type="password"
        placeholder="Skriv inn passordet på nytt"
        required
        autoComplete="new-password"
        error={state?.fieldErrors?.confirmPassword}
      />

      {/* Terms and Privacy */}
      <div className="text-xs text-neutral-600">
        <p>
          Ved å opprette en konto godtar du våre{' '}
          <a
            href="/terms"
            className="text-brand-600 hover:text-brand-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            vilkår for bruk
          </a>
          {' '}og{' '}
          <a
            href="/privacy"
            className="text-brand-600 hover:text-brand-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            personvernpolicy
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
          Din informasjon er beskyttet med sikker kryptering
        </p>
      </div>
    </AuthForm>
  );
}