export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Each auth page manages its own background.
  // This layout is a clean passthrough.
  return <>{children}</>;
}
