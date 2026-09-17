import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Rolodex",
  description: "A modern rolodex for the people who matter to you.",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/people", label: "People" },
  { href: "/events", label: "Events" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-display text-xl tracking-tight">
              Rolodex
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/people/new"
                className="rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Add person
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
