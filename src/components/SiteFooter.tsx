import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line px-6 py-4 text-xs text-quiet">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2">
        <p>CalmPath is not medical advice and does not diagnose.</p>
        <nav className="flex items-center gap-3">
          <Link href="/privacy" className="font-semibold hover:text-foreground">
            Privacy
          </Link>
          <Link href="/dashboard" className="font-semibold hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/admin" className="font-semibold hover:text-foreground">
            Campus
          </Link>
        </nav>
      </div>
    </footer>
  );
}
