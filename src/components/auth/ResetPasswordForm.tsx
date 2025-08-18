'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from './AuthForm';
import FormField from './FormField';
import FormError from './FormError';
import { PasswordResetConfirmInput, passwordResetConfirmSchema } from '@/schemas/auth';
import { forms, actions } from '@/lib/translations';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface FormErrors {
  [key: string]: string;
}

interface ResetPasswordFormProps {
  token?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function ResetPasswordForm({ 
  token: propToken, 
  onSuccess, 
  className 
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = propToken || searchParams.get('token') || '';

  // Form state
  const [formData, setFormData] = useState<Partial<PasswordResetConfirmInput>>({
    token,
    password: '',
    confirmPassword: '',
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string>('');

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('Ugyldig eller manglende tilbakestillingstoken.');
    } else {
      // Update form data with token
      setFormData(prev => ({ ...prev, token }));
    }
  }, [token]);

  // Update form field
  const updateField = (name: keyof PasswordResetConfirmInput, value: any) => {
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

    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError('');
    }
  };

  // Validate form using Zod schema
  const validateForm = (): boolean => {
    try {
      passwordResetConfirmSchema.parse(formData);
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.message?.includes('token')) {
          setTokenError('Ugyldig eller utløpt tilbakestillingstoken. Be om en ny lenke.');
        } else if (response.status === 429) {
          setGeneralError('For mange forsøk. Prøv igjen senere.');
        } else if (data.errors) {
          // Handle field-specific errors
          const formErrors: FormErrors = {};
          data.errors.forEach((error: any) => {
            if (error.field) {
              formErrors[error.field] = error.message;
            }
          });
          setErrors(formErrors);
        } else {
          setGeneralError(data.message || 'Det oppstod en feil. Prøv igjen.');
        }
        return;
      }

      // Reset successful
      setIsSuccess(true);

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?message=password-reset-success');
        }, 3000);
      }

    } catch (error) {
      console.error('Password reset error:', error);
      setGeneralError('Det oppstod en nettverksfeil. Prøv igjen senere.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Token error state
  if (tokenError) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Ugyldig lenke
          </h1>
          <p className="text-sm text-neutral-600 mb-6">
            {tokenError}
          </p>
        </div>

        <div className="space-y-4">
          <a
            href="/auth/forgot-password"
            className="w-full flex justify-center items-center px-4 py-3 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200"
          >
            Be om ny tilbakestillingslenke
          </a>

          <div className="text-center">
            <a
              href="/auth/login"
              className="text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
            >
              Tilbake til innlogging
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Passord tilbakestilt!
          </h1>
          <p className="text-sm text-neutral-600">
            Passordet ditt har blitt oppdatert. Du blir automatisk videresendt til innloggingssiden.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            Du kan nå logge inn med ditt nye passord. Siden oppdateres automatisk om noen sekunder.
          </p>
        </div>

        <div className="text-center">
          <a
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-500 focus:outline-none focus:underline"
          >
            Gå til innlogging nå
          </a>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <AuthForm
      title="Lag nytt passord"
      subtitle="Skriv inn ditt nye passord nedenfor"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Oppdater passord"
      submitButtonLoadingText="Oppdaterer passord..."
      className={className}
      footer={
        <div className="text-center">
          <a
            href="/auth/login"
            className="text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
          >
            Tilbake til innlogging
          </a>
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

      {/* Password field */}
      <FormField
        label="Nytt passord"
        name="password"
        type="password"
        value={formData.password}
        placeholder="Skriv inn nytt passord"
        required
        autoComplete="new-password"
        autoFocus
        error={errors.password}
        helperText="Minimum 8 tegn med store og små bokstaver, tall og spesialtegn"
        onChange={(value) => updateField('password', value)}
      />

      {/* Confirm password field */}
      <FormField
        label="Bekreft nytt passord"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        placeholder="Gjenta det nye passordet"
        required
        autoComplete="new-password"
        error={errors.confirmPassword}
        onChange={(value) => updateField('confirmPassword', value)}
      />

      {/* Security info */}
      <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
        <p className="mb-2">
          <strong>Tips for et sikkert passord:</strong>
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Bruk minst 8 tegn</li>
          <li>Kombiner store og små bokstaver</li>
          <li>Inkluder tall og spesialtegn</li>
          <li>Unngå lett gjenkjennelig informasjon</li>
          <li>Bruk ikke samme passord på andre nettsteder</li>
        </ul>
      </div>
    </AuthForm>
  );
}