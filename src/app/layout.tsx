import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { OrgProvider } from "@/hooks/use-org";
import { ClerkTokenSync } from "@/components/ClerkTokenSync";
import { ThemeProvider } from "@/hooks/use-theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "SmartOS | Smartline Publishers",
  description: "SmartOS publishing operations",
  icons: [
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", url: "/icons/icon-192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", url: "/icons/icon-512.png" },
    { rel: "apple-touch-icon", type: "image/png", sizes: "180x180", url: "/apple-touch-icon.png" },
    { rel: "mask-icon", type: "image/png", sizes: "512x512", url: "/icons/maskable-icon.png" },
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    title: "SmartOS",
    statusBarStyle: "default",
  },
};

/**
 * `viewport-fit=cover` is required for `env(safe-area-inset-*)` to report real
 * values on notched iOS devices. Without it the mobile app bar and tab bar sit
 * under the notch/home indicator when installed as a PWA.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f7fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-paper text-ink antialiased dark:bg-neutral-950 dark:text-neutral-200`}>
        <ClerkProvider>
          <ClerkTokenSync />
          <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-lg dark:focus:bg-neutral-900 dark:focus:text-brand-200"
          >
          Skip to content
          </a>
          <ThemeProvider>
          <OrgProvider>{children}</OrgProvider>
          </ThemeProvider>
          <script
          dangerouslySetInnerHTML={{
          __html: `
          if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then((registration) => {
          console.log('SW registered: ', registration);
          }).catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
          });
          });
          }
          `,
          }}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}