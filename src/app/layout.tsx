import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/app-providers";
import { ServiceWorker } from "@/components/service-worker";
import "@fontsource-variable/onest/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mis Gastos — Finanzas en calma",
  description: "Control sencillo de tus ingresos, gastos y ahorros.",
  applicationName: "Mis Gastos",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f3f5f8" }, { media: "(prefers-color-scheme: dark)", color: "#0f1729" }],
  width: "device-width", initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" suppressHydrationWarning><body>
    <script dangerouslySetInnerHTML={{ __html: `(()=>{try{const t=localStorage.getItem('my-expenses-theme')||'system';const d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch{}})()` }} />
    <AppProviders><ServiceWorker />{children}</AppProviders>
  </body></html>;
}
