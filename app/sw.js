/* ================================================================
   «Садовка Лайф» — офлайн-режим приложения.
   Хранит в телефоне всё, что нужно, чтобы открыть карту без сигнала:
   само приложение, библиотеку карты, подложку полигона, привязку GPS.
   Запросы к базе Supabase не трогает — их обрабатывает очередь лайф-карты.
   При обновлении сайта поменяйте VERSION — телефоны подтянут новые файлы.
   ================================================================ */
const VERSION = '20261026b';
const SHELL = 'sadovka-app-' + VERSION;
const TILES = 'sadovka-tiles-v1';            // подложка: качается один раз, сохраняется между версиями
const FONTS = 'sadovka-fonts-v1';
const ROOT = new URL('../', self.location).href;

const PRECACHE = [
  'app/', 'app/manifest.webmanifest',
  'js/config.js', 'js/store.js', 'js/app.js', 'css/style.css',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css', 'vendor/qrcode/qrcode.js',
  'tiles/index.json', 'data/relief.json', 'data/games.json',
  'img/app-192.png', 'img/app-512.png', 'img/apple-touch-icon.png'
].map(p => new URL(p, ROOT).href);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    // по одному: если какого-то файла нет, остальное всё равно сохранится
    await Promise.all(PRECACHE.map(u => fetch(u, { cache: 'reload' }).then(r => r.ok && c.put(u, r)).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('sadovka-app-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});

/** Сначала сеть (свежая версия), но не дольше ms; нет ответа — из памяти телефона. */
async function netFirst(req, ms) {
  const c = await caches.open(SHELL);
  const net = fetch(req).then(r => { if (r.ok && r.type !== 'opaque') c.put(stripQuery(req), r.clone()); return r; });
  const cached = () => c.match(stripQuery(req)).then(r => r || c.match(req, { ignoreSearch: true }));
  try {
    return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), ms))]);
  } catch (e) {
    const r = await cached();
    if (r) { net.catch(() => {}); return r; }
    return net;   // в памяти нет — ждём сеть до конца
  }
}
/** Ключ без ?v=… — чтобы новая версия файла заменяла старую, а не копилась рядом. */
function stripQuery(req) { const u = new URL(req.url); u.search = ''; return u.href; }

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);

  if (u.href.startsWith(ROOT)) {
    // подложка: из телефона, а чего нет — скачать и запомнить
    if (u.pathname.includes('/tiles/') && u.pathname.endsWith('.webp')) {
      e.respondWith(caches.open(TILES).then(async c => {
        const hit = await c.match(u.href); if (hit) return hit;
        const r = await fetch(req); if (r.ok) c.put(u.href, r.clone()); return r;
      }));
      return;
    }
    // страница приложения: открывается и без сети (в том числе со ссылкой ?live=…)
    if (req.mode === 'navigate') {
      if (!u.pathname.startsWith(new URL('app/', ROOT).pathname)) return;   // сайт — как обычно
      e.respondWith(netFirst(new Request(new URL('app/', ROOT).href), 3500).catch(() => caches.match(new URL('app/', ROOT).href)));
      return;
    }
    // скрипты, стили, данные, картинки сайта
    e.respondWith(netFirst(req, 3500));
    return;
  }

  // шрифты Google: из телефона, обновляются в фоне
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
  // всё остальное (база Supabase, погода, Google Drive) — без вмешательства
});
