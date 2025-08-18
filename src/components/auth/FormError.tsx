'use client';

import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface FormErrorProps {
  error: string | string[] | null;
  className?: string;
  variant?: 'inline' | 'banner';
  onDismiss?: () => void;
}

export default function FormError({ 
  error, 
  className = '', 
  variant = 'inline',
  onDismiss 
}: FormErrorProps) {
  if (!error) return null;

  const errors = Array.isArray(error) ? error : [error];
  const hasMultipleErrors = errors.length > 1;

  if (variant === 'banner') {
    return (
      <div
        className={`
          rounded-lg border border-red-200 bg-red-50 p-4
          ${className}
        `}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon 
              className="h-5 w-5 text-red-400" 
              aria-hidden="true" 
            />
          </div>
          <div className="ml-3 flex-1">
            <div className="text-sm text-red-800">
              {hasMultipleErrors ? (
                <div>
                  <p className="font-medium mb-2">Det oppstod følgende feil:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>{errors[0]}</p>
              )}
            </div>
          </div>
          {onDismiss && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  onClick={onDismiss}
                  aria-label="Lukk feilmelding"
                >
                  <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div
      className={`
        text-sm text-red-600 space-y-1
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {hasMultipleErrors ? (
        <ul className="space-y-1">
          {errors.map((err, index) => (
            <li key={index} className="flex items-start">
              <XCircleIcon 
                className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" 
                aria-hidden="true" 
              />
              <span>{err}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center">
          <XCircleIcon 
            className="h-4 w-4 mr-2 flex-shrink-0" 
            aria-hidden="true" 
          />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
}