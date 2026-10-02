import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/app-providers";
import { PwaProvider } from "@/components/pwa-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: "Mis Gastos — Finanzas en calma",
  description: "Control sencillo de tus ingresos, gastos y ahorros.",
  applicationName: "Mis Gastos",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mis Gastos", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icons/icon-192", sizes: "192x192", type: "image/png" }, { url: "/icon.svg", type: "image/svg+xml" }], apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }] },
};
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f3f5f8" }, { media: "(prefers-color-scheme: dark)", color: "#0f1729" }],
  width: "device-width", initialScale: 1, viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning><body className={onest.variable}>
    <script dangerouslySetInnerHTML={{ __html: `(()=>{try{const t=localStorage.getItem('my-expenses-theme')||'system';const d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch{};window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.__misGastosInstallPrompt=e;window.dispatchEvent(new Event('my-expenses:install-prompt'))})})()` }} />
    <AppProviders><PwaProvider>{children}{process.env.NODE_ENV === "production" && <SpeedInsights />}</PwaProvider></AppProviders>
  </body></html>;
}
