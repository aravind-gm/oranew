/**
 * Sentry Error Boundary Component
 *
 * Wraps checkout pages to catch and report React errors.
 * Safe to use with Next.js App Router.
 */

'use client';

import React, { ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

/**
 * Error Boundary Component
 * Catches errors anywhere in the child component tree
 */
class ErrorBoundaryInner extends React.Component<
  ErrorBoundaryProps & { resetError: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: ErrorBoundaryProps & { resetError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
          context: this.props.context || 'unknown',
        },
      },
    });

    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              {this.props.context === 'checkout'
                ? 'We encountered an error during checkout. Please try again or contact support.'
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="bg-gray-100 p-3 rounded text-xs text-red-600 mb-6 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  this.props.resetError();
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition"
              >
                Home
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Error ID: {this.state.error?.message?.substring(0, 8) || 'unknown'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component using Sentry's withErrorBoundary
 */
export function SentryErrorBoundary({
  children,
  fallback,
  context = 'checkout',
}: ErrorBoundaryProps) {
  const [key, setKey] = React.useState(0);

  const handleResetError = () => {
    setKey(prev => prev + 1);
  };

  return (
    <ErrorBoundaryInner
      key={key}
      resetError={handleResetError}
      context={context}
    >
      {children}
    </ErrorBoundaryInner>
  );
}

export default SentryErrorBoundary;
