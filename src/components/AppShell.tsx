"use client";

import { AuthProvider } from "@/components/AuthProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SkipLink } from "@/components/SkipLink";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SkipLink />
      <SiteHeader />
      <main id="main-content" className="flex flex-1 flex-col" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </AuthProvider>
  );
}
