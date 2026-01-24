export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mb-4"></div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
        <p className="text-gray-400">Please wait while we fetch the content</p>
      </div>
    </div>
  );
}
