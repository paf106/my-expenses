"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };
type PwaContextValue = { online: boolean; installAvailable: boolean; installed: boolean; install: () => Promise<boolean> };
const PwaContext = createContext<PwaContextValue | null>(null);
const INSTALL_EVENT = "my-expenses:install-prompt";
type InstallWindow = Window & { __misGastosInstallPrompt?: BeforeInstallPromptEvent };

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getInstalledSnapshot() {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used within PwaProvider");
  return context;
}

export async function clearOfflineCache() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("/").catch(() => undefined);
    registration?.active?.postMessage({ type: "CLEAR_PRIVATE_CACHE" });
  }
  if (!("caches" in window)) return;
  const keys = await caches.keys().catch(() => []);
  await Promise.all(keys.filter((key) => key.startsWith("mis-gastos-pages-")).map((key) => caches.delete(key)));
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const online = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => true);
  const installed = useSyncExternalStore((callback) => {
    const query = window.matchMedia("(display-mode: standalone)");
    query.addEventListener("change", callback);
    window.addEventListener("appinstalled", callback);
    return () => {
      query.removeEventListener("change", callback);
      window.removeEventListener("appinstalled", callback);
    };
  }, getInstalledSnapshot, () => false);
  const [installAvailable, setInstallAvailable] = useState(false);

  useEffect(() => {
    if (pathname === "/login") void clearOfflineCache();
  }, [pathname]);

  useEffect(() => {
    const installWindow = window as InstallWindow;
    const announceInstall = () => setInstallAvailable(Boolean(installWindow.__misGastosInstallPrompt));
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      installWindow.__misGastosInstallPrompt = event as BeforeInstallPromptEvent;
      announceInstall();
    };
    const onInstalled = () => {
      installWindow.__misGastosInstallPrompt = undefined;
      announceInstall();
    };
    window.addEventListener(INSTALL_EVENT, announceInstall);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    announceInstall();
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      else navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.filter((registration) => new URL(registration.scope).origin === window.location.origin).map((registration) => registration.unregister()))).catch(() => undefined);
    }
    return () => {
      window.removeEventListener(INSTALL_EVENT, announceInstall);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    const installWindow = window as InstallWindow;
    if (!installWindow.__misGastosInstallPrompt) return false;
    const prompt = installWindow.__misGastosInstallPrompt;
    installWindow.__misGastosInstallPrompt = undefined;
    setInstallAvailable(false);
    await prompt.prompt();
    const result = await prompt.userChoice;
    window.dispatchEvent(new Event(INSTALL_EVENT));
    return result.outcome === "accepted";
  };

  return <PwaContext.Provider value={{ online, installAvailable, installed, install }}>{children}</PwaContext.Provider>;
}
