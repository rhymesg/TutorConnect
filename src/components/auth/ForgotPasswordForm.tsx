'use client';

import { useState, FormEvent } from 'react';
import AuthForm from './AuthForm';
import FormField from './FormField';
import FormError from './FormError';
import { PasswordResetRequestInput, passwordResetRequestSchema } from '@/schemas/auth';
import { forms, actions } from '@/lib/translations';
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface FormErrors {
  [key: string]: string;
}

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void;
  className?: string;
}

export default function ForgotPasswordForm({ onSuccess, className }: ForgotPasswordFormProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<PasswordResetRequestInput>>({
    email: '',
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  // Update form field
  const updateField = (name: keyof PasswordResetRequestInput, value: any) => {
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
      passwordResetRequestSchema.parse(formData);
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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setGeneralError('For mange forespørsler. Prøv igjen senere.');
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
          setGeneralError(data.message || 'Det oppstod en feil. Prøv igjen senere.');
        }
        return;
      }

      // Request successful
      setSubmittedEmail(formData.email || '');
      setIsSuccess(true);

      if (onSuccess) {
        onSuccess(formData.email || '');
      }

    } catch (error) {
      console.error('Password reset request error:', error);
      setGeneralError('Det oppstod en nettverksfeil. Prøv igjen senere.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            E-post sendt!
          </h1>
          <p className="text-sm text-neutral-600">
            Vi har sendt en lenke for tilbakestilling av passord til
          </p>
          <p className="text-sm font-medium text-neutral-900 mt-1">
            {submittedEmail}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Hva du må gjøre nå:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Sjekk e-postinnboksen din (og spam-mappen)</li>
              <li>Klikk på lenken i e-posten vi sendte</li>
              <li>Følg instruksjonene for å lage et nytt passord</li>
              <li>Lenken utløper om 1 time av sikkerhetshensyn</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setIsSuccess(false);
              setSubmittedEmail('');
              setFormData({ email: '' });
            }}
            className="w-full flex justify-center items-center px-4 py-3 text-sm font-medium text-brand-600 bg-white border border-brand-600 rounded-lg hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200"
          >
            Send ny e-post
          </button>

          <div className="text-center">
            <a
              href="/auth/login"
              className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              Tilbake til innlogging
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <AuthForm
      title="Tilbakestill passord"
      subtitle="Skriv inn e-postadressen din så sender vi deg en lenke for å tilbakestille passordet"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Send tilbakestillingslenke"
      submitButtonLoadingText="Sender e-post..."
      className={className}
      footer={
        <div className="text-center">
          <a
            href="/auth/login"
            className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
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

      {/* Email field */}
      <FormField
        label={forms.no.email}
        name="email"
        type="email"
        value={formData.email}
        placeholder={forms.no.enterEmail}
        required
        autoComplete="email"
        autoFocus
        error={errors.email}
        helperText="Skriv inn e-postadressen du brukte da du registrerte deg"
        onChange={(value) => updateField('email', value)}
      />

      {/* Info box */}
      <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
        <p className="mb-2">
          <strong>Viktig å vite:</strong>
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Tilbakestillingslenken er gyldig i 1 time</li>
          <li>Du kan bare be om ny lenke hver 5. minutt</li>
          <li>Sjekk spam-mappen hvis du ikke ser e-posten</li>
          <li>Kontakt oss hvis du fortsatt har problemer</li>
        </ul>
      </div>
    </AuthForm>
  );
}