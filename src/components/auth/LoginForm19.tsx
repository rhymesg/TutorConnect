'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, type LoginFormState } from '@/lib/actions/auth';
import AuthForm from './AuthForm19';
import FormField from './FormField';
import FormError from './FormError';
import { navigation, forms } from '@/lib/translations';

interface LoginFormProps {
  onSuccess?: (data: any) => void;
  redirectTo?: string;
  className?: string;
}

export default function LoginForm19({ 
  onSuccess, 
  redirectTo = '/dashboard',
  className 
}: LoginFormProps) {
  const router = useRouter();
  
  // React 19 useActionState hook
  const [state, submitAction, isPending] = useActionState<LoginFormState, FormData>(
    loginAction,
    null
  );

  // Handle successful login data from cookies
  useEffect(() => {
    const loginSuccess = document.cookie
      .split('; ')
      .find(row => row.startsWith('userLoginSuccess='))
      ?.split('=')[1];
    
    if (loginSuccess) {
      try {
        const userData = JSON.parse(decodeURIComponent(loginSuccess));
        
        // Store in localStorage for client access
        if (userData.accessToken) {
          localStorage.setItem('accessToken', userData.accessToken);
        }
        if (userData.refreshToken) {
          localStorage.setItem('refreshToken', userData.refreshToken);
        }
        
        // Store user data
        localStorage.setItem('userData', JSON.stringify(userData.user));
        
        // Clear the temporary cookie
        document.cookie = 'userLoginSuccess=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        if (onSuccess) {
          onSuccess(userData);
        }
      } catch (error) {
        console.error('Failed to parse login success data:', error);
      }
    }
  }, [onSuccess]);

  return (
    <AuthForm
      title="Logg inn"
      subtitle="Velkommen tilbake til TutorConnect"
      action={submitAction}
      isSubmitting={isPending}
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
      {state?.error && (
        <FormError 
          error={state.error} 
          variant="banner" 
        />
      )}

      {/* Email field */}
      <FormField
        label={forms.no.email}
        name="email"
        type="email"
        placeholder={forms.no.enterEmail}
        required
        autoComplete="email"
        autoFocus
        error={state?.fieldErrors?.email}
      />

      {/* Password field */}
      <FormField
        label={forms.no.password}
        name="password"
        type="password"
        placeholder={forms.no.enterPassword}
        required
        autoComplete="current-password"
        error={state?.fieldErrors?.password}
      />

      {/* Remember me and forgot password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="remember"
            value="true"
            className="h-4 w-4 text-brand-600 border-neutral-300 rounded focus:ring-brand-500 focus:ring-offset-0"
          />
          <span className="text-sm text-neutral-700">
            Husk meg
          </span>
        </label>

        <a
          href="/auth/forgot-password"
          className="text-sm text-brand-600 hover:text-brand-500 focus:outline-none focus:underline"
        >
          Glemt passord?
        </a>
      </div>

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