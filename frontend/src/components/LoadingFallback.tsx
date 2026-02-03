/**
 * LoadingFallback Component
 * Shows graceful UI when backend is waking up
 * Never shows error screen, just loading state
 */

import React from 'react';

interface LoadingFallbackProps {
  message?: string;
  isWakingUp?: boolean;
  showSkeletons?: boolean;
  count?: number; // Number of skeleton items
}

export function LoadingFallback({
  message = 'Loading...',
  isWakingUp = false,
  showSkeletons = true,
  count = 4,
}: LoadingFallbackProps) {
  return (
    <div className="w-full">
      {/* Waking up message */}
      {isWakingUp && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            🌅 Waking up server... Please wait a moment
          </p>
        </div>
      )}

      {/* Skeleton loaders */}
      {showSkeletons && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-3">
              {/* Image skeleton */}
              <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>

              {/* Text skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
