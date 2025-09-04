'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon, EnvelopeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui';

interface EmailVerificationFormProps {
  token?: string;
  email?: string;
  className?: string;
}

type VerificationState = 'loading' | 'success' | 'error' | 'resend';

function EmailVerificationFormInner({ 
  token: propToken, 
  email: propEmail,
  className 
}: EmailVerificationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = propToken || searchParams.get('token') || '';
  const email = propEmail || searchParams.get('email') || '';
  const message = searchParams.get('message') || '';

  const [state, setState] = useState<VerificationState>('loading');
  const [error, setError] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Auto-verify if token is present
  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else if (message === 'registration-success') {
      setState('resend');
    } else if (message === 'login-verification-required') {
      setState('resend');
    } else {
      setState('resend');
    }
  }, [token, message]);

  // Redirect countdown for success state
  useEffect(() => {
    if (state === 'success' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (state === 'success' && redirectCountdown === 0) {
      router.push('/auth/login?message=email-verified');
    }
  }, [state, redirectCountdown, router]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      setState('loading');
      
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setError('Ugyldig eller utløpt verifikasjonslenke. Be om en ny lenke nedenfor.');
        } else if (response.status === 409) {
          setError('E-postadressen er allerede verifisert. Du kan logge inn normalt.');
        } else {
          setError(data.message || 'Det oppstod en feil under verifikasjon.');
        }
        setState('error');
        return;
      }

      // Verification successful
      setState('success');

    } catch (error) {
      console.error('Email verification error:', error);
      setError('Det oppstod en nettverksfeil. Prøv igjen senere.');
      setState('error');
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setError('E-postadresse mangler. Vennligst logg inn på nytt.');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError('For mange forespørsler. Prøv igjen om noen minutter.');
        } else if (response.status === 409) {
          setError('E-postadressen er allerede verifisert.');
        } else {
          setError(data.message || 'Kunne ikke sende ny verifikasjons-e-post.');
        }
        return;
      }

      setResendSuccess(true);
      setError('');

    } catch (error) {
      console.error('Resend verification error:', error);
      setError('Det oppstod en nettverksfeil. Prøv igjen senere.');
    } finally {
      setIsResending(false);
    }
  };

  const containerClasses = `w-full max-w-md mx-auto ${className}`;

  // Loading state
  if (state === 'loading') {
    return (
      <div className={containerClasses}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <LoadingSpinner size="md" color="blue" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Verifiserer e-postadresse...
          </h1>
          <p className="text-sm text-neutral-600">
            Vennligst vent mens vi bekrefter kontoen din.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className={containerClasses}>
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            E-post verifisert!
          </h1>
          <p className="text-sm text-neutral-600">
            Kontoen din er nå aktivert og klar til bruk.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800 text-center">
            Du blir automatisk videresendt til innloggingssiden om{' '}
            <span className="font-bold">{redirectCountdown}</span> sekund{redirectCountdown !== 1 ? 'er' : ''}.
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

  // Error state
  if (state === 'error') {
    return (
      <div className={containerClasses}>
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Verifisering feilet
          </h1>
          <p className="text-sm text-neutral-600 mb-6">
            {error}
          </p>
        </div>

        <div className="space-y-4">
          {email && (
            <button
              onClick={resendVerificationEmail}
              disabled={isResending}
              className="w-full flex justify-center items-center px-4 py-3 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isResending ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="-ml-1 mr-3" />
                  Sender ny e-post...
                </>
              ) : (
                'Send ny verifikasjons-e-post'
              )}
            </button>
          )}

          <div className="text-center space-y-2">
            <a
              href="/auth/login"
              className="block text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
            >
              Tilbake til innlogging
            </a>
            <a
              href="/auth/register"
              className="block text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
            >
              Opprett ny konto
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Resend state (initial state for verification needed)
  return (
    <div className={containerClasses}>
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <EnvelopeIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Verifiser e-postadressen din
        </h1>
        <p className="text-sm text-neutral-600">
          {message === 'registration-success' 
            ? 'Takk for at du registrerte deg! Vi har sendt en verifikasjons-e-post til deg.'
            : message === 'login-verification-required'
            ? 'Du må verifisere e-postadressen din før du kan få tilgang til alle funksjonene.'
            : 'For å aktivere kontoen din må du bekrefte e-postadressen din.'
          }
        </p>
        {email && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-neutral-600 mb-1">E-post sendt til:</p>
            <p className="text-sm font-medium text-neutral-900 break-all">
              {email}
            </p>
          </div>
        )}
      </div>

      {resendSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800 text-center">
            En ny verifikasjons-e-post har blitt sendt!
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 text-center">
            {error}
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-2">Hva du må gjøre:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Sjekk e-postinnboksen din (og spam-mappen)</li>
            <li>Klikk på verifikasjonslenken i e-posten</li>
            <li>Du blir automatisk videresendt til innloggingssiden</li>
            <li>Lenken utløper om 24 timer</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        {email && (
          <button
            onClick={resendVerificationEmail}
            disabled={isResending}
            className="w-full flex justify-center items-center px-4 py-3 text-sm font-medium text-brand-600 bg-white border border-brand-600 rounded-lg hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:border-neutral-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isResending ? (
              <>
                <LoadingSpinner size="sm" className="-ml-1 mr-3" />
                Sender ny e-post...
              </>
            ) : (
              'Send ny verifikasjons-e-post'
            )}
          </button>
        )}

        <div className="text-center space-y-2">
          <a
            href="/auth/login"
            className="block text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
          >
            Tilbake til innlogging
          </a>
          <p className="text-xs text-neutral-500">
            Har du problemer? <a href="/om-oss#kontakt" className="text-brand-600 hover:text-brand-500 underline">Kontakt oss for hjelp</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmailVerificationForm(props: EmailVerificationFormProps) {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <LoadingSpinner size="md" color="blue" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Laster...</h1>
          <p className="text-sm text-neutral-600">Vennligst vent</p>
        </div>
      </div>
    }>
      <EmailVerificationFormInner {...props} />
    </Suspense>
  );
}