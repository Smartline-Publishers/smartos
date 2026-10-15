import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/hooks/use-auth";
import { OrgProvider } from "@/hooks/use-org";
import { ThemeProvider } from "@/hooks/use-theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "SmartOS | Smartline Publishers",
  description: "SmartOS publishing operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-paper text-ink antialiased dark:bg-neutral-950 dark:text-neutral-200`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-lg dark:focus:bg-neutral-900 dark:focus:text-brand-200"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <OrgProvider>{children}</OrgProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
