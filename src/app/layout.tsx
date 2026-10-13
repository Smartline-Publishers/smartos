import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/hooks/use-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartOS — Publishing operations",
  description: "SmartOS publishing management for Smartline Publishers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-lg"
        >
          Skip to content
        </a>
        <AuthProvider>
          <header className="border-b border-slate-200/90 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5"
                aria-label="SmartOS home"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-press-900 text-lg font-bold text-cream"
                >
                  S
                </span>
                <span className="leading-tight">
                  <span className="block text-[15px] font-bold tracking-tight text-slate-900">
                    SmartOS
                  </span>
                  <span className="block text-xs text-slate-500">Publishing operations</span>
                </span>
              </Link>
              <p className="hidden text-[13px] text-slate-500 sm:block">
                Smartline Publishers Ltd
              </p>
            </div>
          </header>
          <div className="mx-auto w-full max-w-7xl">{children}</div>
          <footer className="border-t border-slate-200/90 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-slate-500 md:px-6">
              SmartOS · Publishing management for Smartline Publishers Ltd
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
