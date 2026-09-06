import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://calm-path-student-wellbeing.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CalmPath — Student Stress First-Aid",
    template: "%s · CalmPath",
  },
  description:
    "A 2–3 minute student check-in with a clear score and a 7-day plan. Not medical advice.",
  applicationName: "CalmPath",
  keywords: [
    "student wellbeing",
    "stress",
    "mental health",
    "Gemini",
    "Next.js",
  ],
  authors: [{ name: "CalmPath" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "CalmPath",
    title: "CalmPath — Student Stress First-Aid",
    description:
      "Check in for 2–3 minutes. See why the score landed there. Get a 7-day plan, not a diagnosis.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CalmPath — Student Stress First-Aid",
    description:
      "Student stress first-aid with a safety path when needed and a 7-day follow-up loop.",
  },
};

const themeBootScript = `try {
  var t = localStorage.getItem("calmpath:theme") || "system";
  var dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
} catch (e) {}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
