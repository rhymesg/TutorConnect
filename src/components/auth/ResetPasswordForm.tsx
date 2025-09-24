'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from './AuthForm';
import FormField from './FormField';
import FormError from './FormError';
import { PasswordResetConfirmInput, passwordResetConfirmSchema } from '@/schemas/auth';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface FormErrors {
  [key: string]: string;
}

interface ResetPasswordFormProps {
  token?: string;
  onSuccess?: () => void;
  className?: string;
}

function ResetPasswordFormInner({ 
  token: propToken, 
  onSuccess, 
  className 
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = propToken || searchParams.get('token') || '';
  const { language } = useLanguage();
  const t = useLanguageText();

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
  const [tokenError, setTokenError] = useState<{ no: string; en: string } | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError({
        no: 'Ugyldig eller manglende tilbakestillingstoken.',
        en: 'Invalid or missing reset token.',
      });
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
          setTokenError({
            no: 'Ugyldig eller utløpt tilbakestillingstoken. Be om en ny lenke.',
            en: 'Invalid or expired reset token. Please request a new link.',
          });
        } else if (response.status === 429) {
          setGeneralError(
            language === 'no'
              ? 'For mange forsøk. Prøv igjen senere.'
              : 'Too many attempts. Please try again later.'
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
                ? 'Det oppstod en feil. Prøv igjen.'
                : 'Something went wrong. Please try again.')
          );
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
      setGeneralError(
        language === 'no'
          ? 'Det oppstod en nettverksfeil. Prøv igjen senere.'
          : 'A network error occurred. Please try again later.'
      );
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
            {t('Ugyldig lenke', 'Invalid link')}
          </h1>
          <p className="text-sm text-neutral-600 mb-6">
            {language === 'no' ? tokenError.no : tokenError.en}
          </p>
        </div>

        <div className="space-y-4">
          <a
            href="/auth/forgot-password"
            className="w-full flex justify-center items-center px-4 py-3 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200"
          >
            {t('Be om ny tilbakestillingslenke', 'Request a new reset link')}
          </a>

          <div className="text-center">
            <a
              href="/auth/login"
              className="text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
            >
              {t('Tilbake til innlogging', 'Back to login')}
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
            {t('Passord tilbakestilt!', 'Password reset!')}
          </h1>
          <p className="text-sm text-neutral-600">
            {t('Passordet ditt har blitt oppdatert. Du blir automatisk videresendt til innloggingssiden.',
               'Your password has been updated. You will be redirected to the login page automatically.')}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            {t('Du kan nå logge inn med ditt nye passord. Siden oppdateres automatisk om noen sekunder.',
               'You can now log in with your new password. The page will refresh automatically in a few seconds.')}
          </p>
        </div>

        <div className="text-center">
          <a
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-500 focus:outline-none focus:underline"
          >
            {t('Gå til innlogging nå', 'Go to login now')}
          </a>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <AuthForm
      title={t('Lag nytt passord', 'Create a new password')}
      subtitle={t('Skriv inn ditt nye passord nedenfor', 'Enter your new password below')}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText={t('Oppdater passord', 'Update password')}
      submitButtonLoadingText={t('Oppdaterer passord...', 'Updating password...')}
      className={className}
      footer={
        <div className="text-center">
          <a
            href="/auth/login"
            className="text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
          >
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

      {/* Password field */}
      <FormField
        label={t('Nytt passord', 'New password')}
        name="password"
        type="password"
        value={formData.password}
        placeholder={t('Skriv inn nytt passord', 'Enter a new password')}
        required
        autoComplete="new-password"
        autoFocus
        error={errors.password}
        helperText={t(
          'Minimum 8 tegn med store og små bokstaver, tall og spesialtegn',
          'At least 8 characters with uppercase, lowercase, numbers, and symbols'
        )}
        onChange={(value) => updateField('password', value)}
      />

      {/* Confirm password field */}
      <FormField
        label={t('Bekreft nytt passord', 'Confirm new password')}
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        placeholder={t('Gjenta det nye passordet', 'Repeat the new password')}
        required
        autoComplete="new-password"
        error={errors.confirmPassword}
        onChange={(value) => updateField('confirmPassword', value)}
      />

      {/* Security info */}
      <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
        <p className="mb-2">
          <strong>{t('Tips for et sikkert passord:', 'Tips for a secure password:')}</strong>
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>{t('Bruk minst 8 tegn', 'Use at least 8 characters')}</li>
          <li>{t('Kombiner store og små bokstaver', 'Mix uppercase and lowercase letters')}</li>
          <li>{t('Inkluder tall og spesialtegn', 'Include numbers and symbols')}</li>
          <li>{t('Unngå lett gjenkjennelig informasjon', 'Avoid easy-to-guess information')}</li>
          <li>{t('Bruk ikke samme passord på andre nettsteder', 'Use different passwords on other sites')}</li>
        </ul>
      </div>
    </AuthForm>
  );
}

export default function ResetPasswordForm(props: ResetPasswordFormProps) {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordFormInner {...props} />
    </Suspense>
  );
}
