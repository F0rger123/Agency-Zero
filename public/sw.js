/* Agency Zero service worker: makes the CRM usable offline.
 *
 *  - Static assets (/_next/static, icons, images): cache first (they are content-hashed).
 *  - Pages and page data: network first, falling back to the last copy seen on this device.
 *  - Never touches: non-GET requests (saves, server actions), /api, /auth, /login.
 *  - "clear" message (sent on sign-out) deletes everything cached, so nothing lingers on a shared device.
 */
const VERSION = "v2";
const STATIC = `az-static-${VERSION}`;
const PAGES = `az-pages-${VERSION}`;
const OFFLINE = "/offline.html";
const NETWORK_TIMEOUT_MS = 8000;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((cache) => cache.addAll([OFFLINE, "/icons/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== STATIC && key !== PAGES).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "clear") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  }
});

const isStatic = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/images/") || /\.(?:woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname);
const skip = (url) => url.pathname.startsWith("/preview/") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth") || url.pathname.startsWith("/login") || url.pathname === "/sw.js";

/** One cache entry per page and per kind (full HTML vs the router's RSC data), ignoring Next's cache-busting query. */
function pageKey(request) {
  const url = new URL(request.url);
  url.searchParams.delete("_rsc");
  if (request.headers.get("RSC")) url.searchParams.set("__rsc", "1");
  return new Request(url.toString());
}

const isPrefetch = (request) => request.headers.get("Next-Router-Prefetch") || request.headers.get("Purpose") === "prefetch";

async function networkFirst(request) {
  const key = pageKey(request);
  const cache = await caches.open(PAGES);
  const saved = await cache.match(key);
  const network = fetch(request).then((response) => {
    // Keep only real pages: a redirect (for example to /login) must never replace a saved copy.
    if (response.ok && !response.redirected && response.type === "basic") cache.put(key, response.clone());
    return response;
  });
  network.catch(() => {}); // a late failure after we already answered from the saved copy is not an error
  try {
    // With nothing saved there is nothing to fall back on, so wait as long as the network needs: a slow server is not an
    // offline device. With a saved copy, a very slow network gets the saved page after a while.
    if (!saved) return await network;
    return await Promise.race([network, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT_MS))]);
  } catch {
    if (saved) return saved;
    if (request.mode === "navigate") {
      const offline = await caches.match(OFFLINE);
      if (offline) return offline;
    }
    // A genuine network failure: let the browser see it as one (never invent a fake page response).
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || skip(url)) return;

  if (isStatic(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (isPrefetch(request)) return;
  const wantsPage = request.mode === "navigate" || request.headers.get("RSC") || (request.headers.get("Accept") || "").includes("text/html");
  if (wantsPage) event.respondWith(networkFirst(request));
});
