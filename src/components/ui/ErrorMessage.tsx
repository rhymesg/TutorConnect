'use client';

import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  title: string;
  message: string;
  type?: 'error' | 'warning';
  action?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorMessage({ 
  title, 
  message, 
  type = 'error', 
  action, 
  className = '' 
}: Props) {
  const isError = type === 'error';
  
  return (
    <div className={`rounded-lg p-6 max-w-md w-full ${
      isError ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    } ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isError ? (
            <XCircleIcon className="h-6 w-6 text-red-600" />
          ) : (
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-base font-medium ${
            isError ? 'text-red-900' : 'text-yellow-900'
          }`}>
            {title}
          </h3>
          <p className={`mt-1 text-sm ${
            isError ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {message}
          </p>
          {action && (
            <div className="mt-4">
              <button
                onClick={action.onClick}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isError 
                    ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                    : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'
                }`}
              >
                {action.text}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}