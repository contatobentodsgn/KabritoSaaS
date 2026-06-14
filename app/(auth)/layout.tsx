import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link
        href="/"
        aria-label="Kabrito — página inicial"
        className="mb-10 inline-flex rounded-sm transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <img
          src="/brand/logo-kabrito.svg"
          alt="Kabrito"
          className="h-8 w-auto"
        />
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Um espaço para cuidar com presença.
      </p>
    </div>
  );
}
