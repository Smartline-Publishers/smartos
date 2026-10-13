import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/hooks/use-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartOs",
  description: "SmartOs publishing operations",
};

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/books", label: "Books" },
  { href: "/contributors", label: "Contributors" },
  { href: "/users", label: "Users" },
  { href: "/login", label: "Login" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/dashboard" className="text-lg font-bold text-brand-700">
                SmartOs
              </Link>
              <nav aria-label="Main">
                <ul className="flex gap-4 text-sm">
                  {NAV.map((n) => (
                    <li key={n.href + n.label}>
                      <Link href={n.href} className="text-slate-700 hover:text-brand-700 hover:underline">
                        {n.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-slate-500">
              SmartOs © {new Date().getFullYear()}
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
