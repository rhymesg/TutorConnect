'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorInfo = {
        message: this.state.error?.message || 'Unknown error',
        stack: this.state.error?.stack || '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
      };

      // Create mailto link with error details
      const emailSubject = encodeURIComponent('TutorConnect - Error Report');
      const emailBody = encodeURIComponent(
        `Hi,\n\nI encountered an error on TutorConnect:\n\n` +
        `Timestamp: ${errorInfo.timestamp}\n` +
        `Page: ${errorInfo.url}\n` +
        `Browser: ${errorInfo.userAgent}\n\n` +
        `Error message: ${errorInfo.message}\n\n` +
        `Technical details:\n${errorInfo.stack}\n\n` +
        `What were you doing when the error occurred:\n[Please describe]\n\n` +
        `Best regards,\n[Your name]`
      );
      const mailtoLink = `mailto:contact@tutorconnect.no?subject=${emailSubject}&body=${emailBody}`;

      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-red-50 p-6 rounded-lg mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                🚧 Technical Error Occurred
              </h1>
              <p className="text-gray-700 mb-4">
                Sorry! As we're in the early stages of our launch, occasional errors may occur. 
                Your feedback helps us improve TutorConnect.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Try Again
              </button>

              <a
                href={mailtoLink}
                className="w-full inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                📧 Report Error via Email
              </a>

              <details className="text-left bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                  📋 Show Technical Details (for copying)
                </summary>
                <div className="mt-4 space-y-3">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Error Message:</p>
                    <p className="text-sm font-mono text-red-600 break-all">
                      {errorInfo.message}
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Timestamp:</p>
                    <p className="text-sm font-mono">{errorInfo.timestamp}</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Page:</p>
                    <p className="text-sm font-mono break-all">{errorInfo.url}</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Browser:</p>
                    <p className="text-sm font-mono text-xs break-all">{errorInfo.userAgent}</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Stack trace:</p>
                    <pre className="text-xs font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all">
                      {errorInfo.stack}
                    </pre>
                  </div>
                </div>
              </details>

              <p className="text-sm text-gray-500 mt-6">
                💡 Tip: Please take a screenshot before reloading the page
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}