'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { NorwegianRegion } from '@prisma/client';

interface RegionOption {
  value: NorwegianRegion;
  label: string;
  shortName: string;
}

interface RegionSelectorProps {
  label: string;
  name: string;
  value?: NorwegianRegion;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  onChange?: (value: NorwegianRegion) => void;
  onBlur?: () => void;
  className?: string;
}

// Norwegian region options with proper Norwegian names
const regionOptions: RegionOption[] = [
  { value: 'OSLO', label: 'Oslo', shortName: 'Oslo' },
  { value: 'BERGEN', label: 'Bergen', shortName: 'Bergen' },
  { value: 'TRONDHEIM', label: 'Trondheim', shortName: 'Trondheim' },
  { value: 'STAVANGER', label: 'Stavanger', shortName: 'Stavanger' },
  { value: 'KRISTIANSAND', label: 'Kristiansand', shortName: 'Kristiansand' },
  { value: 'FREDRIKSTAD', label: 'Fredrikstad', shortName: 'Fredrikstad' },
  { value: 'SANDNES', label: 'Sandnes', shortName: 'Sandnes' },
  { value: 'TROMSOE', label: 'Tromsø', shortName: 'Tromsø' },
  { value: 'DRAMMEN', label: 'Drammen', shortName: 'Drammen' },
  { value: 'ASKER', label: 'Asker', shortName: 'Asker' },
  { value: 'BAERUM', label: 'Bærum', shortName: 'Bærum' },
  { value: 'AKERSHUS', label: 'Akershus', shortName: 'Akershus' },
  { value: 'OESTFOLD', label: 'Østfold', shortName: 'Østfold' },
  { value: 'BUSKERUD', label: 'Buskerud', shortName: 'Buskerud' },
  { value: 'VESTFOLD', label: 'Vestfold', shortName: 'Vestfold' },
  { value: 'TELEMARK', label: 'Telemark', shortName: 'Telemark' },
  { value: 'AUST_AGDER', label: 'Aust-Agder', shortName: 'Aust-Agder' },
  { value: 'VEST_AGDER', label: 'Vest-Agder', shortName: 'Vest-Agder' },
  { value: 'ROGALAND', label: 'Rogaland', shortName: 'Rogaland' },
  { value: 'HORDALAND', label: 'Hordaland', shortName: 'Hordaland' },
  { value: 'SOGN_OG_FJORDANE', label: 'Sogn og Fjordane', shortName: 'Sogn og Fjordane' },
  { value: 'MOERE_OG_ROMSDAL', label: 'Møre og Romsdal', shortName: 'Møre og Romsdal' },
  { value: 'SOER_TROENDELAG', label: 'Sør-Trøndelag', shortName: 'Sør-Trøndelag' },
  { value: 'NORD_TROENDELAG', label: 'Nord-Trøndelag', shortName: 'Nord-Trøndelag' },
  { value: 'NORDLAND', label: 'Nordland', shortName: 'Nordland' },
  { value: 'TROMS', label: 'Troms', shortName: 'Troms' },
  { value: 'FINNMARK', label: 'Finnmark', shortName: 'Finnmark' },
] as const;

export function RegionSelector({
  label,
  name,
  value,
  required = false,
  disabled = false,
  error,
  placeholder = 'Velg region...',
  onChange,
  onBlur,
  className = '',
}: RegionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = regionOptions.find(option => option.value === value);

  // Filter options based on search term
  const filteredOptions = regionOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        onBlur?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onBlur]);

  const handleSelect = (option: RegionOption) => {
    onChange?.(option.value);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleSelect(filteredOptions[focusedIndex]);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const hasError = !!error;

  // Label styles
  const labelClasses = `
    block text-sm font-medium mb-2
    ${hasError ? 'text-red-700' : 'text-neutral-700'}
    ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}
  `.trim();

  // Input container styles
  const containerClasses = `
    relative w-full
    ${className}
  `.trim();

  // Input styles
  const inputClasses = `
    w-full px-4 py-3 pr-10 text-sm
    border rounded-lg
    bg-white
    transition-all duration-200
    placeholder:text-neutral-400
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed
    cursor-pointer
    ${hasError
      ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
      : isOpen
      ? 'border-brand-300 focus:border-brand-500 focus:ring-brand-500'
      : 'border-neutral-300 hover:border-neutral-400'
    }
  `.trim();

  return (
    <div className="space-y-1">
      {/* Label */}
      <label htmlFor={name} className={labelClasses}>
        {label}
      </label>

      {/* Input container */}
      <div ref={containerRef} className={containerClasses}>
        <div className="relative">
          <input
            ref={inputRef}
            id={name}
            name={name}
            type="text"
            value={isOpen ? searchTerm : selectedOption?.label || ''}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClasses}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
              setFocusedIndex(-1);
            }}
            onFocus={() => {
              if (!disabled) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={hasError}
            aria-describedby={error ? `${name}-error` : undefined}
            autoComplete="off"
            role="combobox"
          />

          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDownIcon
              className={`h-5 w-5 text-neutral-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Dropdown list */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            <ul
              ref={listRef}
              role="listbox"
              aria-labelledby={name}
              className="py-1"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={value === option.value}
                    className={`
                      px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                      transition-colors duration-150
                      ${
                        index === focusedIndex
                          ? 'bg-brand-50 text-brand-900'
                          : 'text-neutral-900 hover:bg-neutral-50'
                      }
                      ${value === option.value ? 'bg-brand-100' : ''}
                    `}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <CheckIcon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    )}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-sm text-neutral-500 text-center">
                  Ingen regioner funnet
                </li>
              )}
            </ul>
          </div>
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
    </div>
  );
}

export default RegionSelector;
