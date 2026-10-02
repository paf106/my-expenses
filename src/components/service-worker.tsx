"use client";

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    else navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.filter((registration) => new URL(registration.scope).origin === window.location.origin).map((registration) => registration.unregister()))).catch(() => undefined);
  }, []);
  return null;
}
