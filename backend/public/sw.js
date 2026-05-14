// AI-Intern PWA Service Worker
const CACHE_NAME = 'ai-intern-v2';
const OFFLINE_PAGE = '/';

// Core static files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/students.html',
  '/employers.html',
  '/institutions.html',
  '/students-profile.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/style.css'
];

// Install: Cache all static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing AI-Intern Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating AI-Intern Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first strategy for API calls, Cache-first for static files
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls: Always try network first
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'You are offline. Please check your connection.' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Static files: Cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache any new pages we visit
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If everything fails, show main page
        return caches.match(OFFLINE_PAGE);
      });
    })
  );
});
