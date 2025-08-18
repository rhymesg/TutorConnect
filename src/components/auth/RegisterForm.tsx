'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { NorwegianRegion } from '@prisma/client';
import AuthForm from './AuthForm';
import FormField from './FormField';
import FormError from './FormError';
import RegionSelector from './RegionSelector';
import { RegisterUserInput, registerUserSchema } from '@/schemas/auth';
import { navigation, forms, actions, messages } from '@/lib/translations';

interface FormErrors {
  [key: string]: string;
}

interface RegisterFormProps {
  onSuccess?: (data: any) => void;
  className?: string;
}

export default function RegisterForm({ onSuccess, className }: RegisterFormProps) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<Partial<RegisterUserInput>>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    region: undefined,
    postalCode: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form field
  const updateField = (name: keyof RegisterUserInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form using Zod schema
  const validateForm = (): boolean => {
    try {
      registerUserSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const formErrors: FormErrors = {};
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          formErrors[field] = err.message;
        });
      }
      
      setErrors(formErrors);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Handle field-specific errors
          const formErrors: FormErrors = {};
          data.errors.forEach((error: any) => {
            if (error.field) {
              formErrors[error.field] = error.message;
            }
          });
          setErrors(formErrors);
        } else {
          // Handle general error
          setGeneralError(data.message || 'Det oppstod en feil ved registrering.');
        }
        return;
      }

      // Registration successful
      if (onSuccess) {
        onSuccess(data);
      } else {
        // Redirect to email verification page or dashboard
        router.push('/auth/verify-email?message=registration-success');
      }

    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError('Det oppstod en nettverksfeil. Prøv igjen senere.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm
      title="Opprett konto"
      subtitle="Lag din TutorConnect-profil for å komme i gang"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText={actions.no.create}
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
      {generalError && (
        <FormError 
          error={generalError} 
          variant="banner" 
          onDismiss={() => setGeneralError('')} 
        />
      )}

      {/* Name field */}
      <FormField
        label={forms.no.name}
        name="name"
        type="text"
        value={formData.name}
        placeholder="Skriv inn ditt fulle navn"
        required
        autoComplete="name"
        autoFocus
        error={errors.name}
        onChange={(value) => updateField('name', value)}
      />

      {/* Email field */}
      <FormField
        label={forms.no.email}
        name="email"
        type="email"
        value={formData.email}
        placeholder={forms.no.enterEmail}
        required
        autoComplete="email"
        error={errors.email}
        onChange={(value) => updateField('email', value)}
      />

      {/* Region selector */}
      <RegionSelector
        label="Region"
        name="region"
        value={formData.region}
        required
        error={errors.region}
        placeholder="Velg din region..."
        onChange={(value) => updateField('region', value)}
      />

      {/* Postal code field */}
      <FormField
        label={`${forms.no.postalCode} ${forms.no.optional}`}
        name="postalCode"
        type="text"
        value={formData.postalCode}
        placeholder="0000"
        maxLength={4}
        pattern="[0-9]{4}"
        autoComplete="postal-code"
        error={errors.postalCode}
        helperText="4-sifret norsk postnummer"
        onChange={(value) => updateField('postalCode', value)}
      />

      {/* Password field */}
      <FormField
        label={forms.no.password}
        name="password"
        type="password"
        value={formData.password}
        placeholder={forms.no.enterPassword}
        required
        autoComplete="new-password"
        error={errors.password}
        helperText="Minimum 8 tegn med store og små bokstaver, tall og spesialtegn"
        onChange={(value) => updateField('password', value)}
      />

      {/* Confirm password field */}
      <FormField
        label={forms.no.confirmPassword}
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        placeholder="Gjenta passordet"
        required
        autoComplete="new-password"
        error={errors.confirmPassword}
        onChange={(value) => updateField('confirmPassword', value)}
      />

      {/* Terms and conditions checkbox */}
      <div className="space-y-3">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms || false}
            onChange={(e) => updateField('acceptTerms', e.target.checked)}
            className="mt-1 h-4 w-4 text-brand-600 border-neutral-300 rounded focus:ring-brand-500 focus:ring-offset-0"
            required
          />
          <span className="text-sm text-neutral-700">
            Jeg godtar{' '}
            <a
              href="/vilkar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-500 underline"
            >
              vilkårene for bruk
            </a>
            {' '}*
          </span>
        </label>
        {errors.acceptTerms && (
          <FormError error={errors.acceptTerms} />
        )}

        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            name="acceptPrivacy"
            checked={formData.acceptPrivacy || false}
            onChange={(e) => updateField('acceptPrivacy', e.target.checked)}
            className="mt-1 h-4 w-4 text-brand-600 border-neutral-300 rounded focus:ring-brand-500 focus:ring-offset-0"
            required
          />
          <span className="text-sm text-neutral-700">
            Jeg godtar{' '}
            <a
              href="/personvern"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-500 underline"
            >
              personvernerklæringen
            </a>
            {' '}*
          </span>
        </label>
        {errors.acceptPrivacy && (
          <FormError error={errors.acceptPrivacy} />
        )}
      </div>

      {/* Additional info */}
      <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
        <p className="mb-2">
          <strong>Hva skjer når du registrerer deg:</strong>
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Du mottar en e-post for å verifisere kontoen din</li>
          <li>Du kan opprette profil og legge ut annonser</li>
          <li>Du kan søke etter lærere eller studenter i din region</li>
          <li>All kommunikasjon skjer trygt gjennom vår plattform</li>
        </ul>
      </div>
    </AuthForm>
  );
}