'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';

// Major Norwegian cities and regions
const NORWEGIAN_LOCATIONS = [
  // Major cities
  'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand', 'Fredrikstad',
  'Sandnes', 'Tromsø', 'Drammen', 'Asker', 'Bærum', 'Lillehammer',
  'Haugesund', 'Tønsberg', 'Ålesund', 'Moss', 'Skien', 'Arendal',
  'Bodø', 'Hamar', 'Larvik', 'Halden', 'Sarpsborg', 'Sandefjord',
  
  // Counties/Regions
  'Akershus', 'Østfold', 'Buskerud', 'Vestfold', 'Telemark', 'Aust-Agder',
  'Vest-Agder', 'Rogaland', 'Hordaland', 'Sogn og Fjordane', 'Møre og Romsdal',
  'Sør-Trøndelag', 'Nord-Trøndelag', 'Nordland', 'Troms', 'Finnmark',
  'Vestland', 'Innlandet', 'Viken', 'Agder', 'Trøndelag', 'Troms og Finnmark',
  
  // Popular locations
  'Oslo sentrum', 'Bergen sentrum', 'Trondheim sentrum', 'Stavanger sentrum',
  'Online/Nettundervisning', 'Hjemme hos student', 'Hjemme hos lærer',
  'Biblioteket', 'Kafé', 'Universitet', 'Skole'
];

interface LocationAutocompleteProps {
  label: string;
  name: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function LocationAutocomplete({
  label,
  name,
  value = '',
  onChange,
  onBlur,
  placeholder = 'Skriv inn sted...',
  error,
  helperText,
  required = false,
  disabled = false,
  className = ''
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredOptions(NORWEGIAN_LOCATIONS.slice(0, 8)); // Show top 8 by default
    } else {
      const filtered = NORWEGIAN_LOCATIONS
        .filter(location => 
          location.toLowerCase().includes(inputValue.toLowerCase()) ||
          location.toLowerCase().startsWith(inputValue.toLowerCase())
        )
        .sort((a, b) => {
          // Prioritize exact matches and those that start with the input
          const aStarts = a.toLowerCase().startsWith(inputValue.toLowerCase());
          const bStarts = b.toLowerCase().startsWith(inputValue.toLowerCase());
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.localeCompare(b, 'nb-NO');
        })
        .slice(0, 10);
      
      setFilteredOptions(filtered);
    }
  }, [inputValue]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay closing to allow for option clicks
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      onBlur?.();
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const hasError = !!error;

  return (
    <div className={`space-y-1 ${className}`} ref={containerRef}>
      {/* Label */}
      <label htmlFor={name} className={`
        block text-sm font-medium mb-2
        ${hasError ? 'text-red-700' : 'text-neutral-700'}
        ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}
      `}>
        {label}
      </label>

      {/* Input container */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            id={name}
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full pl-10 pr-10 py-3 text-sm
              border rounded-lg
              bg-white
              transition-all duration-200
              placeholder:text-neutral-400
              focus:outline-none focus:ring-2 focus:ring-offset-1
              disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed
              ${hasError
                ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
                : 'border-neutral-300 focus:border-brand-500 focus:ring-brand-500 hover:border-neutral-400'
              }
            `}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
          />

          {/* Map icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <MapPin className="w-4 h-4 text-neutral-400" />
          </div>

          {/* Clear button and dropdown arrow */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {inputValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
                tabIndex={-1}
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && filteredOptions.length > 0 && (
          <div
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {filteredOptions.map((option, index) => (
              <button
                key={option}
                type="button"
                className={`
                  w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none
                  flex items-center space-x-3
                  ${index === highlightedIndex ? 'bg-brand-50 text-brand-900' : 'text-neutral-900'}
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === filteredOptions.length - 1 ? 'rounded-b-lg' : ''}
                `}
                onClick={() => handleOptionSelect(option)}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="flex-1">{option}</span>
                {option === inputValue && (
                  <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper text or error */}
      {error ? (
        <p className="text-sm text-red-600 flex items-center mt-1" role="alert">
          <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      ) : helperText ? (
        <p className="text-sm text-neutral-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}