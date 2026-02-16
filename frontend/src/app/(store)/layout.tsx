// Force dynamic rendering for protected account routes
// Static pre-rendering prevents cookies from being accessible
export const dynamic = 'force-dynamic';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
