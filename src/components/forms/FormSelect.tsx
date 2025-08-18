'use client';

import { forwardRef, ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export interface FormSelectProps {
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  children: ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      name,
      placeholder = 'Velg...',
      value,
      defaultValue,
      required = false,
      disabled = false,
      error,
      helperText,
      className = '',
      children,
      onChange,
      onBlur,
      onFocus,
    },
    ref
  ) => {
    const hasError = !!error;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    // Base select styles
    const selectClasses = `
      w-full px-4 py-3 text-sm
      border rounded-lg
      bg-white
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed
      appearance-none
      ${hasError
        ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
        : 'border-neutral-300 hover:border-neutral-400 focus:border-brand-500 focus:ring-brand-500'
      }
      ${className}
    `.trim();

    // Label styles
    const labelClasses = `
      block text-sm font-medium mb-2
      ${hasError ? 'text-red-700' : 'text-neutral-700'}
      ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}
    `.trim();

    return (
      <div className="space-y-1">
        {/* Label */}
        <label htmlFor={name} className={labelClasses}>
          {label}
        </label>

        {/* Select container */}
        <div className="relative">
          <select
            ref={ref}
            id={name}
            name={name}
            value={value}
            defaultValue={defaultValue}
            required={required}
            disabled={disabled}
            className={selectClasses}
            onChange={handleChange}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${name}-error` : helperText ? `${name}-helper` : undefined
            }
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>

          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDownIcon className="h-5 w-5 text-neutral-400" />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${name}-error`}
            className="text-sm text-red-600 mt-1 flex items-center"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="h-4 w-4 mr-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p
            id={`${name}-helper`}
            className="text-sm text-neutral-500 mt-1"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export { FormSelect };
export default FormSelect;