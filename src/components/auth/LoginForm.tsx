'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from './AuthForm';
import FormField from './FormField';
import FormError from './FormError';
import { LoginUserInput, loginUserSchema } from '@/schemas/auth';
import { navigation, forms, actions, messages } from '@/lib/translations';

interface FormErrors {
  [key: string]: string;
}

interface LoginFormProps {
  onSuccess?: (data: any) => void;
  redirectTo?: string;
  className?: string;
}

export default function LoginForm({ 
  onSuccess, 
  redirectTo = '/dashboard',
  className 
}: LoginFormProps) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<Partial<LoginUserInput>>({
    email: '',
    password: '',
    remember: false,
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Update form field
  const updateField = (name: keyof LoginUserInput, value: any) => {
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
      loginUserSchema.parse(formData);
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error scenarios
        if (response.status === 429) {
          setGeneralError('For mange innloggingsforsøk. Prøv igjen senere.');
        } else if (response.status === 401) {
          setGeneralError('Ugyldig e-postadresse eller passord.');
        } else if (response.status === 423) {
          setGeneralError('Kontoen din er midlertidig låst. Kontakt support for hjelp.');
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
          setGeneralError(data.message || 'Det oppstod en feil ved innlogging.');
        }
        return;
      }

      // Login successful
      const userData = data.data;

      // Store tokens (you might want to use a more secure method)
      if (userData.accessToken) {
        localStorage.setItem('accessToken', userData.accessToken);
      }
      if (userData.refreshToken) {
        localStorage.setItem('refreshToken', userData.refreshToken);
      }

      // Handle email verification requirement
      if (userData.requiresEmailVerification) {
        router.push('/auth/verify-email?message=login-verification-required');
        return;
      }

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess(data);
      } else {
        router.push(redirectTo);
      }

    } catch (error) {
      console.error('Login error:', error);
      setGeneralError('Det oppstod en nettverksfeil. Prøv igjen senere.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm
      title="Logg inn"
      subtitle="Velkommen tilbake til TutorConnect"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText={navigation.no.login}
      submitButtonLoadingText="Logger inn..."
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
            Har du ikke en konto enda?{' '}
            <a
              href="/auth/register"
              className="font-medium text-brand-600 hover:text-brand-500 focus:outline-none focus:underline"
            >
              Registrer deg her
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
        onChange={(value) => updateField('email', value)}
      />

      {/* Password field */}
      <FormField
        label={forms.no.password}
        name="password"
        type="password"
        value={formData.password}
        placeholder={forms.no.enterPassword}
        required
        autoComplete="current-password"
        error={errors.password}
        onChange={(value) => updateField('password', value)}
      />

      {/* Remember me and forgot password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="remember"
            checked={formData.remember || false}
            onChange={(e) => updateField('remember', e.target.checked)}
            className="h-4 w-4 text-brand-600 border-neutral-300 rounded focus:ring-brand-500 focus:ring-offset-0"
          />
          <span className="text-sm text-neutral-700">
            Husk meg
          </span>
        </label>

        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-sm text-brand-600 hover:text-brand-500 focus:outline-none focus:underline"
        >
          Glemt passord?
        </button>
      </div>

      {/* Forgot password section */}
      {showForgotPassword && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-700">
                <strong>Glemt passordet ditt?</strong>
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Ikke bekymre deg! Du kan tilbakestille passordet ditt ved å klikke på lenken under.
              </p>
              <div className="mt-3">
                <a
                  href="/auth/forgot-password"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tilbakestill passord
                </a>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                aria-label="Lukk"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional security info */}
      <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
        <p className="flex items-center">
          <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Din pålogging er beskyttet med sikker kryptering
        </p>
      </div>
    </AuthForm>
  );
}