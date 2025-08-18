'use client';

import { forwardRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  pattern?: string;
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      name,
      type = 'text',
      placeholder,
      value,
      defaultValue,
      required = false,
      disabled = false,
      error,
      helperText,
      autoComplete,
      autoFocus = false,
      maxLength,
      pattern,
      className = '',
      onChange,
      onBlur,
      onFocus,
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;
    const hasError = !!error;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    // Base input styles
    const inputClasses = `
      w-full px-4 py-3 text-sm
      border rounded-lg
      bg-white
      transition-all duration-200
      placeholder:text-neutral-400
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed
      ${hasError
        ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
        : isFocused
        ? 'border-brand-300 focus:border-brand-500 focus:ring-brand-500'
        : 'border-neutral-300 hover:border-neutral-400'
      }
      ${isPasswordField ? 'pr-12' : ''}
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

        {/* Input container */}
        <div className="relative">
          <input
            ref={ref}
            id={name}
            name={name}
            type={inputType}
            placeholder={placeholder}
            value={value}
            defaultValue={defaultValue}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            maxLength={maxLength}
            pattern={pattern}
            className={inputClasses}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${name}-error` : helperText ? `${name}-helper` : undefined
            }
          />

          {/* Password visibility toggle */}
          {isPasswordField && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 focus:outline-none focus:text-neutral-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Skjul passord' : 'Vis passord'}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          )}
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

FormField.displayName = 'FormField';

export { FormField };
export default FormField;