const VER = "lt-v27";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=27",
  "./api.js?v=27",
  "./geo.js?v=27",
  "./venues.js?v=27",
  "./data.js?v=27",
  "./app.js?v=27",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // 페이지 이동은 네트워크 우선: 새 배포(index.html의 ?v=)가 캐시에 막혀 안 보이던 문제 방지
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VER).then(c => c.put("./index.html", copy)); }
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      if (res.ok && e.request.url.startsWith(self.location.origin)) {
        caches.open(VER).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
