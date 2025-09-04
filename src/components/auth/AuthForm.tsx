'use client';

import { FormEvent, ReactNode } from 'react';
import { LoadingSpinner } from '@/components/ui';

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
              <LoadingSpinner size="sm" color="white" className="-ml-1 mr-3" />
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