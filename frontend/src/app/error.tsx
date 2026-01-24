'use client';

import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <p className="text-6xl font-bold text-red-500 mb-4">⚠️</p>
          <h1 className="text-4xl font-bold text-white mb-4">Something Went Wrong</h1>
          <p className="text-xl text-gray-400 mb-4">
            An unexpected error occurred. Please try again.
          </p>
          {error?.message && (
            <p className="text-sm text-gray-500 bg-gray-800 rounded p-4 mt-4 max-w-md mx-auto break-words">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={reset}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition inline-block"
          >
            Go Home
          </Link>
        </div>

        <p className="text-gray-500 mt-12">
          If the problem persists, please{' '}
          <Link href="/contact" className="text-orange-500 hover:underline">
            contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
