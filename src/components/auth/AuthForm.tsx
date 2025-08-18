'use client';

import { FormEvent, ReactNode } from 'react';

interface AuthFormProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  submitButtonText: string;
  submitButtonLoadingText?: string;
  footer?: ReactNode;
  className?: string;
}

export default function AuthForm({
  title,
  subtitle,
  children,
  onSubmit,
  isSubmitting = false,
  submitButtonText,
  submitButtonLoadingText = 'Laster...',
  footer,
  className = '',
}: AuthFormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSubmitting) {
      onSubmit(e);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-neutral-600">
            {subtitle}
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Form fields */}
        <div className="space-y-4">
          {children}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full flex justify-center items-center px-4 py-3 
            text-sm font-medium text-white 
            border border-transparent rounded-lg
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
              isSubmitting
                ? 'bg-neutral-400 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500'
            }
          `}
          aria-disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {submitButtonLoadingText}
            </>
          ) : (
            submitButtonText
          )}
        </button>
      </form>

      {/* Footer */}
      {footer && (
        <div className="mt-6 text-center">
          {footer}
        </div>
      )}
    </div>
  );
}