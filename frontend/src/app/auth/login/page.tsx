'use client';

import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-100">
      <div className="bg-white p-20 rounded-3xl shadow-2xl border-4 border-red-500 text-center">
        <h1 className="text-5xl font-black text-red-600 mb-4 animate-bounce">
          STOP! NEW VERSION
        </h1>
        <p className="text-2xl font-bold text-gray-800">
          This is a fresh build at Wed Feb  4 12:00:42 AM IST 2026.
        </p>
        <p className="mt-4 text-gray-500">
          If you STILL see OTP, your browser or CDN is caching the old page.
        </p>
        <div className="mt-8">
           <a href="/" className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition">
             Return to Store
           </a>
        </div>
      </div>
    </div>
  );
}
