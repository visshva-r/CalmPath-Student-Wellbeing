"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";

const nav = [
  { href: "/checkin", label: "Check-in" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { enabled, ready, user, signInGoogle, signOut } = useAuth();
  const status = !enabled
    ? "On this device"
    : !ready
      ? "Connecting…"
      : user?.isAnonymous
        ? "Anonymous"
        : user?.email
          ? user.email
          : "Signed in";

  return (
    <header className="border-b border-line bg-surface/80 px-6 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="shrink-0" aria-label="CalmPath">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-quiet hover:bg-soft hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/admin"
            className={`hidden rounded-lg px-3 py-1.5 text-xs font-semibold sm:inline ${
              pathname === "/admin"
                ? "bg-soft text-foreground"
                : "text-quiet hover:bg-soft hover:text-foreground"
            }`}
          >
            Campus
          </Link>
          <span className="hidden max-w-[10rem] truncate text-xs text-quiet lg:inline">
            {status}
          </span>
          {enabled && ready && user?.isAnonymous ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void signInGoogle()}
            >
              Google
            </Button>
          ) : null}
          {enabled && ready && user && !user.isAnonymous ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
