const CACHE = "glouglou-v3-net-first";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "manifest.json",
  "icons/icon.svg",
  "data/cases.js",
  "data/characters.js",
  "components/ui.jsx",
  "components/net.jsx",
  "components/screens.jsx",
  "components/extra_screens.jsx",
  "components/board.jsx",
  "components/app.jsx",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first · always try fresh, fall back to cache only when offline.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
