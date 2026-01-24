import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <p className="text-6xl font-bold text-orange-500 mb-4">404</p>
          <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-xl text-gray-400 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition"
          >
            Go Home
          </Link>
          <Link
            href="/products"
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
          >
            Browse Products
          </Link>
        </div>

        <p className="text-gray-500 mt-12">
          If you believe this is a mistake, please{' '}
          <Link href="/contact" className="text-orange-500 hover:underline">
            contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
