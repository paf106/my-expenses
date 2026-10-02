const CACHE_NAME = "mis-gastos-static-v2";
const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_PAGE, "/icon.svg", "/manifest.webmanifest"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE_PAGE)) || Response.error()));
    return;
  }
  if (["image", "font", "style"].includes(request.destination)) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const cachedResponse = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cachedResponse)).catch(() => undefined);
      }
      return response;
    }).catch(async () => (await caches.match(request)) || Response.error()));
  }
});
