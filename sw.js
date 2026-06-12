// Memo Browser スマホ版の Service Worker (PWA のオフライン対応)。
// アプリの「殻」 (HTML/CSS/JS/アイコン) をキャッシュして、 電波が無くても起動できるようにする。
// メモのデータは localStorage にあるので SW は関与しない。
// ⚠ ファイルを更新したら CACHE_VERSION を上げること — 古いキャッシュが配られ続けるのを防ぐ。
const CACHE_VERSION = 'memo-mobile-locked-202606122357';

const SHELL = [
  './mobile.html',
  './app.enc.json',
  './manifest.webmanifest',
  './vendor/mathjax-tex-svg.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ネット優先 + 失敗したらキャッシュ (オンラインなら常に最新、 オフラインでも動く)。
// キャッシュ優先にすると「更新したのに古いまま」 が起きやすいのでネット優先にしている。
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
