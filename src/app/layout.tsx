import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { AppProviders } from "@/components/app-providers";
import { PwaProvider } from "@/components/pwa-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { themeBootstrap } from "@/lib/theme-bootstrap";
import "./globals.css";

const onest = localFont({
  src: [
    { path: "../fonts/onest-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-onest",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "Mis Gastos", template: "%s · Mis Gastos" },
  description: "Control sencillo de tus ingresos, gastos y ahorros.",
  applicationName: "Mis Gastos",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mis Gastos", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icons/icon-192", sizes: "192x192", type: "image/png" }, { url: "/icon.svg", type: "image/svg+xml" }] },
};
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f3f5f8" }, { media: "(prefers-color-scheme: dark)", color: "#0f1729" }],
  width: "device-width", initialScale: 1, viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning><body className={onest.variable}>
    <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
    <AppProviders><PwaProvider>{children}{process.env.NODE_ENV === "production" && <SpeedInsights />}</PwaProvider></AppProviders>
  </body></html>;
}
