export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-10 sm:px-8">
      {children}
    </main>
  );
}
