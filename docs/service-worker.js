// GoodLift PWA Service Worker
// Cache name - increment version to force update of cached files
const CACHE_NAME = 'goodlift-pwa-v1';

// Files to cache for offline functionality
// Note: These are the core app shell files. Update this list when adding new critical assets.
// Vite generates unique hashed filenames for JS/CSS, so this caches the entry point and static assets.
const urlsToCache = [
  '/goodlift/',
  '/goodlift/index.html',
  '/goodlift/icons/goodlift-icon-192.png',
  '/goodlift/icons/goodlift-icon-512.png',
  '/goodlift/goodlift-favicon.svg',
  '/goodlift/goodlift-appletouchicon.png',
  '/goodlift/goodlift-logo.svg',
  '/goodlift/manifest.json',
  // Note: Vite-generated JS and CSS files have content hashes in their names.
  // The index.html will reference the current versions, so caching index.html
  // ensures we load the right hashed files. For a production PWA, consider
  // using a plugin like vite-plugin-pwa for automatic asset caching.
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Install complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activate complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache when offline, network when online
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          // Still fetch from network to update cache in background
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
            })
            .catch(() => {
              // Network failed, but we have cache, so it's OK
            });
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses for future offline use
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }

            // Only cache same-origin requests
            if (event.request.url.startsWith(self.location.origin)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }

            return networkResponse;
          })
          .catch(() => {
            // Network failed and no cache - return offline page if available
            // For now, just let the error propagate
            throw new Error('Network request failed and no cache available');
          });
      })
  );
});

// Note on cache versioning:
// When you update the app, increment CACHE_NAME (e.g., 'goodlift-pwa-v2').
// This ensures old cached files are cleared and new versions are loaded.
// Consider using a build step to auto-update cache names based on asset hashes.
