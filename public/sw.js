const VERSION = "v3";
const STATIC_CACHE = `mis-gastos-static-${VERSION}`;
const PAGE_CACHE = `mis-gastos-pages-${VERSION}`;
const OFFLINE_PAGE = "/offline.html";
const CORE_ASSETS = [
  OFFLINE_PAGE,
  "/icon.svg",
  "/icons/icon-192",
  "/icons/icon-512",
  "/icons/icon-maskable-512",
  "/apple-icon",
  "/manifest.webmanifest",
];
const NEVER_CACHE = /^\/(?:login|forgot-password|reset-password|auth(?:\/|$)|transactions\/export(?:\/|$))/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => (key.startsWith("mis-gastos-static-") || key.startsWith("mis-gastos-pages-")) && key !== STATIC_CACHE && key !== PAGE_CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_PRIVATE_CACHE") event.waitUntil(caches.delete(PAGE_CACHE));
});

function isAppNavigation(url) {
  return ["/dashboard", "/transactions", "/stats", "/settings"].some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
}

function isRscRequest(request, url) {
  return request.headers.has("RSC") || request.headers.has("Next-Router-State-Tree") || url.searchParams.has("_rsc");
}

async function networkFirstNavigation(request, url) {
  const cache = await caches.open(PAGE_CACHE);
  const cacheKey = new Request(`${url.origin}${url.pathname}${url.search}`, { method: "GET" });
  let timeout;
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Navigation timed out")), 4500); }),
    ]);
    clearTimeout(timeout);
    if (response.ok && !response.redirected && new URL(response.url).origin === self.location.origin) {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timeout);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    return (await caches.match(OFFLINE_PAGE)) || Response.error();
  }
}

async function networkFirstRsc(request, url) {
  const cache = await caches.open(PAGE_CACHE);
  const cacheUrl = new URL(url);
  cacheUrl.searchParams.delete("_rsc");
  const cacheKey = new Request(cacheUrl.toString(), { method: "GET", headers: request.headers });
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected && new URL(response.url).origin === self.location.origin) await cache.put(cacheKey, response.clone());
    return response;
  } catch {
    return (await cache.match(cacheKey)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || NEVER_CACHE.test(url.pathname)) return;

  if (request.mode === "navigate") {
    if (isRscRequest(request, url)) {
      event.respondWith(networkFirstRsc(request, url));
      return;
    }
    if (isAppNavigation(url)) event.respondWith(networkFirstNavigation(request, url));
    else if (url.pathname === OFFLINE_PAGE) event.respondWith(caches.match(OFFLINE_PAGE).then((response) => response || fetch(request)));
    return;
  }

  if (isRscRequest(request, url) && isAppNavigation(url)) {
    event.respondWith(networkFirstRsc(request, url));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || ["image", "font", "style", "script"].includes(request.destination) || url.pathname === "/manifest.webmanifest") {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && !response.redirected) await cache.put(request, response.clone());
      return response;
    })().catch(async () => (await caches.match(request)) || Response.error()));
  }
});
