'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface FormCheckboxGroupProps {
  label: string;
  name: string;
  options: CheckboxOption[];
  value?: string[];
  defaultValue?: string[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  maxSelections?: number;
  minSelections?: number;
  className?: string;
  layout?: 'grid' | 'list';
  gridCols?: number;
  onChange?: (value: string[]) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export default function FormCheckboxGroup({
  label,
  name,
  options,
  value = [],
  defaultValue = [],
  required = false,
  disabled = false,
  error,
  helperText,
  maxSelections,
  minSelections = 1,
  className = '',
  layout = 'grid',
  gridCols = 2,
  onChange,
  onBlur,
  onFocus,
}: FormCheckboxGroupProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(value.length > 0 ? value : defaultValue);
  const hasError = !!error;

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    let newValues: string[];
    
    if (checked) {
      // Add to selection if under max limit
      if (maxSelections && selectedValues.length >= maxSelections) {
        return; // Don't add if at max limit
      }
      newValues = [...selectedValues, optionValue];
    } else {
      // Remove from selection
      newValues = selectedValues.filter(v => v !== optionValue);
    }

    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  // Label styles
  const labelClasses = `
    block text-sm font-medium mb-3
    ${hasError ? 'text-red-700' : 'text-neutral-700'}
    ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}
  `.trim();

  // Container styles
  const containerClasses = layout === 'grid' 
    ? `grid gap-3 ${gridCols === 2 ? 'grid-cols-1 sm:grid-cols-2' : gridCols === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`
    : 'space-y-3';

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      <label className={labelClasses}>
        {label}
        {maxSelections && (
          <span className="text-xs text-neutral-500 ml-2">
            (maks {maxSelections} valg)
          </span>
        )}
        {selectedValues.length > 0 && (
          <span className="text-xs text-neutral-500 ml-2">
            ({selectedValues.length} valgt)
          </span>
        )}
      </label>

      {/* Checkbox options */}
      <div className={containerClasses}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          const isDisabled = disabled || option.disabled || 
            (maxSelections && !isSelected && selectedValues.length >= maxSelections);

          return (
            <label
              key={option.value}
              className={`
                relative flex items-start p-3 rounded-lg border cursor-pointer transition-all duration-200
                ${isDisabled
                  ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed opacity-50'
                  : isSelected
                    ? hasError
                      ? 'bg-red-50 border-red-200 ring-1 ring-red-200'
                      : 'bg-brand-50 border-brand-200 ring-1 ring-brand-200'
                    : hasError
                      ? 'bg-white border-red-300 hover:border-red-400'
                      : 'bg-white border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
                }
              `}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  className="sr-only"
                  aria-describedby={
                    error ? `${name}-error` : helperText ? `${name}-helper` : undefined
                  }
                />
                
                {/* Custom checkbox */}
                <div className={`
                  relative w-5 h-5 rounded border-2 transition-all duration-200
                  ${isSelected
                    ? hasError
                      ? 'bg-red-600 border-red-600'
                      : 'bg-brand-600 border-brand-600'
                    : hasError
                      ? 'border-red-300'
                      : 'border-neutral-300'
                  }
                  ${!isDisabled && 'group-hover:border-brand-400'}
                `}>
                  {isSelected && (
                    <Check className="absolute inset-0 w-3 h-3 m-auto text-white" strokeWidth={3} />
                  )}
                </div>
              </div>

              <div className="ml-3 min-w-0 flex-1">
                <span className={`
                  block text-sm font-medium
                  ${isDisabled
                    ? 'text-neutral-400'
                    : hasError
                      ? 'text-red-700'
                      : 'text-neutral-700'
                  }
                `}>
                  {option.label}
                </span>
                {option.description && (
                  <span className={`
                    block text-xs mt-1
                    ${isDisabled
                      ? 'text-neutral-400'
                      : 'text-neutral-500'
                    }
                  `}>
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Validation info */}
      {minSelections > 1 && selectedValues.length < minSelections && (
        <p className="text-sm text-orange-600 mt-2">
          Velg minst {minSelections} alternativer
        </p>
      )}

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