"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
type Theme = "light" | "dark" | "system";
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_EVENT = "my-expenses:theme-change";
const getThemeSnapshot = (): Theme => {
  try {
    const stored = localStorage.getItem("my-expenses-theme");
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch { return "system"; }
};
const subscribeTheme = (callback: () => void) => {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(THEME_EVENT, callback); window.removeEventListener("storage", callback); };
};
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within AppProviders");
  return context;
}
export function AppProviders({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, (): Theme => "system");
  const updateTheme = (nextTheme: Theme) => {
    try { localStorage.setItem("my-expenses-theme", nextTheme); } catch { /* Storage may be unavailable in private browsing. */ }
    window.dispatchEvent(new Event(THEME_EVENT));
  };
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.theme = theme === "dark" || (theme === "system" && media.matches) ? "dark" : "light"; };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme: updateTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
