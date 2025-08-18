'use client';

import { forwardRef, useState } from 'react';

export interface FormTextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
  showCharCount?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      name,
      placeholder,
      value,
      defaultValue,
      required = false,
      disabled = false,
      error,
      helperText,
      rows = 4,
      maxLength,
      className = '',
      showCharCount = false,
      onChange,
      onBlur,
      onFocus,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = !!error;
    const currentLength = value?.length || 0;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    // Base textarea styles
    const textareaClasses = `
      w-full px-4 py-3 text-sm
      border rounded-lg
      bg-white
      transition-all duration-200
      placeholder:text-neutral-400
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed
      resize-vertical
      ${hasError
        ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
        : isFocused
        ? 'border-brand-300 focus:border-brand-500 focus:ring-brand-500'
        : 'border-neutral-300 hover:border-neutral-400'
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

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={ref}
            id={name}
            name={name}
            placeholder={placeholder}
            value={value}
            defaultValue={defaultValue}
            required={required}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            className={textareaClasses}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${name}-error` : helperText ? `${name}-helper` : undefined
            }
          />
        </div>

        {/* Character count */}
        {(showCharCount || maxLength) && (
          <div className="flex justify-between items-center mt-1">
            <div>
              {/* Error message or helper text */}
              {error ? (
                <p
                  id={`${name}-error`}
                  className="text-sm text-red-600 flex items-center"
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
              ) : helperText ? (
                <p
                  id={`${name}-helper`}
                  className="text-sm text-neutral-500"
                >
                  {helperText}
                </p>
              ) : null}
            </div>
            
            {/* Character count */}
            {maxLength && (
              <span className={`text-sm ${
                currentLength > maxLength * 0.9 
                  ? 'text-orange-600' 
                  : currentLength === maxLength 
                    ? 'text-red-600' 
                    : 'text-neutral-500'
              }`}>
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        {/* Error message without char count */}
        {error && !showCharCount && !maxLength && (
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

        {/* Helper text without char count */}
        {helperText && !error && !showCharCount && !maxLength && (
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

FormTextarea.displayName = 'FormTextarea';

export { FormTextarea };
export default FormTextarea;