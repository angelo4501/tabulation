import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "KALOOK! Simple Pageant Tabulation App",
  description: "A secure serverless MVP for Kalook-Alike and pageant tabulation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="no-print border-b border-purple-950/10 bg-white/70 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="elegant-heading text-2xl font-bold text-[#34124d]">
              KALOOK!
            </Link>
            <div className="flex flex-wrap gap-2 text-sm font-semibold text-[#34124d]">
              <Link className="btn btn-secondary py-2" href="/admin/dashboard">Admin</Link>
              <Link className="btn btn-secondary py-2" href="/judge/events">Judge</Link>
              <Link className="btn btn-primary py-2" href="/auth/sign-in">Sign in</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
