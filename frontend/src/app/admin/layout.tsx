import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Admin Layout - Dark navy theme with contrast colors */}
      {children}
    </div>
  );
}
