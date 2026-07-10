/* Service worker — News Informatique
   IMPORTANT : incrémenter VERSION à chaque mise à jour du contenu
   (l'agent quotidien s'en charge). */
const VERSION = '2026-S28-auto20260710T1607';
const CACHE = 'news-info-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/js/app.js',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/apple-touch-icon.png',
  './assets/img/gpu_rtx50_computex.jpg',
  './assets/img/cpu_5800x3d.jpg',
  './assets/img/ram_ddr5_prix.jpg',
  './assets/img/ecran_rog_pg32ucwm.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // Contenu "frais" : réseau d'abord, cache en secours (hors-ligne)
  const isFresh = url.pathname.endsWith('/') ||
                  url.pathname.endsWith('index.html') ||
                  url.pathname.includes('/data/');
  if (isFresh) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }

  // Assets : cache d'abord, réseau en secours
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return r;
    }))
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

/* Clic sur une notification → ouvre/replace l'application */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return clients.openWindow('./');
    })
  );
});

/* Prêt pour du vrai push si un serveur de push est ajouté un jour */
self.addEventListener('push', (e) => {
  let data = { title: 'News Informatique', body: 'De nouvelles news sont disponibles !' };
  try { if (e.data) data = Object.assign(data, e.data.json()); } catch (_) {}
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './assets/img/icon-192.png',
    badge: './assets/img/icon-192.png'
  }));
});
