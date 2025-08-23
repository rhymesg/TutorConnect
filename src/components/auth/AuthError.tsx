'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, LogIn, RefreshCw } from 'lucide-react';

interface AuthErrorProps {
  title?: string;
  message?: string;
  type?: 'expired' | 'invalid' | 'error';
  onRetry?: () => void;
  showLogin?: boolean;
  className?: string;
}

export default function AuthError({
  title,
  message,
  type = 'error',
  onRetry,
  showLogin = true,
  className = ''
}: AuthErrorProps) {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
  };

  const getErrorContent = () => {
    switch (type) {
      case 'expired':
        return {
          title: title || 'Sesjonen din er utløpt',
          message: message || 'Du må logge inn på nytt for å fortsette.',
          icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800'
        };
      case 'invalid':
        return {
          title: title || 'Ugyldig autentisering',
          message: message || 'Noe gikk galt med autentiseringen. Vennligst logg inn på nytt.',
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      default:
        return {
          title: title || 'Autentiseringsfeil',
          message: message || 'Det oppstod en feil med autentiseringen. Prøv igjen.',
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
    }
  };

  const { title: errorTitle, message: errorMessage, icon, bgColor, borderColor, textColor } = getErrorContent();

  return (
    <div className={`flex items-center justify-center min-h-screen bg-neutral-50 px-4 ${className}`}>
      <div className={`max-w-md w-full ${bgColor} ${borderColor} border rounded-xl p-6 text-center`}>
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        
        <h2 className={`text-lg font-semibold ${textColor} mb-2`}>
          {errorTitle}
        </h2>
        
        <p className={`text-sm ${textColor.replace('800', '700')} mb-6`}>
          {errorMessage}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Prøv igjen
            </button>
          )}
          
          {showLogin && (
            <button
              onClick={handleLogin}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Logg inn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 토큰 만료 전용 컴포넌트
export function TokenExpiredError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <AuthError
      type="expired"
      onRetry={onRetry}
      className={className}
    />
  );
}

// 인증 실패 전용 컴포넌트  
export function AuthenticationError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <AuthError
      type="invalid"
      onRetry={onRetry}
      className={className}
    />
  );
}