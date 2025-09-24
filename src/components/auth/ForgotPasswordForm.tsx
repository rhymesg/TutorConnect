'use client';

import { useState, FormEvent } from 'react';
import AuthForm from './AuthForm';
import FormField from './FormField';
import FormError from './FormError';
import { PasswordResetRequestInput, passwordResetRequestSchema } from '@/schemas/auth';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface FormErrors {
  [key: string]: string;
}

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void;
  className?: string;
}

export default function ForgotPasswordForm({ onSuccess, className }: ForgotPasswordFormProps) {
  const { language } = useLanguage();
  const t = useLanguageText();
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
          setGeneralError(
            language === 'no'
              ? 'For mange forespørsler. Prøv igjen senere.'
              : 'Too many requests. Please try again later.'
          );
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
          setGeneralError(
            data.message ||
              (language === 'no'
                ? 'Det oppstod en feil. Prøv igjen senere.'
                : 'Something went wrong. Please try again later.')
          );
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
      setGeneralError(
        language === 'no'
          ? 'Det oppstod en nettverksfeil. Prøv igjen senere.'
          : 'A network error occurred. Please try again later.'
      );
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
            {t('E-post sendt!', 'Email sent!')}
          </h1>
          <p className="text-sm text-neutral-600">
            {t('Vi har sendt en lenke for tilbakestilling av passord til', 'We have emailed a password reset link to')}
          </p>
          <p className="text-sm font-medium text-neutral-900 mt-1">
            {submittedEmail}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">{t('Hva du må gjøre nå:', 'What to do next:')}</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>{t('Sjekk e-postinnboksen din (og spam-mappen)', 'Check your inbox (and spam folder)')}</li>
              <li>{t('Klikk på lenken i e-posten vi sendte', 'Click the link in the email')}</li>
              <li>{t('Følg instruksjonene for å lage et nytt passord', 'Follow the instructions to create a new password')}</li>
              <li>{t('Lenken utløper om 1 time av sikkerhetshensyn', 'The link expires in 1 hour for security')}</li>
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
            {t('Send ny e-post', 'Send another email')}
          </button>

          <div className="text-center">
            <a
              href="/auth/login"
              className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              {t('Tilbake til innlogging', 'Back to login')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <AuthForm
      title={t('Tilbakestill passord', 'Reset password')}
      subtitle={t('Skriv inn e-postadressen din så sender vi deg en lenke for å tilbakestille passordet', 'Enter your email and we will send you a reset link')}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText={t('Send tilbakestillingslenke', 'Send reset link')}
      submitButtonLoadingText={t('Sender e-post...', 'Sending email...')}
      className={className}
      footer={
        <div className="text-center">
          <a
            href="/auth/login"
            className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
            {t('Tilbake til innlogging', 'Back to login')}
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
        label={t('E-post', 'Email')}
        name="email"
        type="email"
        value={formData.email}
        placeholder={t('Skriv inn e-postadressen din', 'Enter your email address')}
        required
        autoComplete="email"
        autoFocus
        error={errors.email}
        helperText={t('Skriv inn e-postadressen du brukte da du registrerte deg', 'Use the email address you signed up with')}
        onChange={(value) => updateField('email', value)}
      />

      {/* Info box */}
      <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
        <p className="mb-2">
          <strong>{t('Viktig å vite:', 'Good to know:')}</strong>
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>{t('Tilbakestillingslenken er gyldig i 1 time', 'The reset link is valid for 1 hour')}</li>
          <li>{t('Du kan bare be om ny lenke hver 5. minutt', 'You can request another link every 5 minutes')}</li>
          <li>{t('Sjekk spam-mappen hvis du ikke ser e-posten', 'Check your spam folder if you do not see the email')}</li>
          <li>{t('Kontakt oss hvis du fortsatt har problemer', 'Contact us if you still have trouble')}</li>
        </ul>
      </div>
    </AuthForm>
  );
}
