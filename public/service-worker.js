// GoodLift PWA Service Worker
// Cache name - automatically versioned on each build
// Version is injected during build via sw-version.js
importScripts('/goodlift/sw-version.js');
const CACHE_NAME = `goodlift-pwa-${self.SW_VERSION || 'v2'}`;

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
  console.log('[Service Worker] Installing service worker...');
  console.log('[Service Worker] Version:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        console.log('[Service Worker] Caching', urlsToCache.length, 'files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] ✅ All files cached successfully');
        console.log('[Service Worker] Install complete - skipping waiting to activate immediately');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] ❌ Install failed');
        console.error('[Service Worker] Error name:', error.name);
        console.error('[Service Worker] Error message:', error.message);
        console.error('[Service Worker] Failed files may be missing or inaccessible');
        console.error('[Service Worker] Check that all URLs in urlsToCache are correct');
        throw error;
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating service worker...');
  console.log('[Service Worker] Current cache version:', CACHE_NAME);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        console.log('[Service Worker] Found', cacheNames.length, 'cache(s):', cacheNames);
        
        const cachesToDelete = cacheNames.filter(cacheName => cacheName !== CACHE_NAME);
        if (cachesToDelete.length > 0) {
          console.log('[Service Worker] Deleting', cachesToDelete.length, 'old cache(s):', cachesToDelete);
        } else {
          console.log('[Service Worker] No old caches to delete');
        }
        
        return Promise.all(
          cachesToDelete.map((cacheName) => {
            console.log('[Service Worker] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] ✅ Cache cleanup complete');
        console.log('[Service Worker] Taking control of all pages immediately');
        return self.clients.claim(); // Take control immediately
      })
      .then(() => {
        console.log('[Service Worker] ✅ Activation complete');
      })
      .catch((error) => {
        console.error('[Service Worker] ❌ Activation failed');
        console.error('[Service Worker] Error:', error);
      })
  );
});

// Fetch event - Network-first for critical files, cache-first for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-first strategy for index.html and JS/CSS assets (always get latest)
  // This ensures users always get the most recent version after a deployment
  const isNavigationRequest = event.request.mode === 'navigate';
  const isCriticalAsset = 
    url.pathname.endsWith('.html') || 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.css') ||
    url.pathname === '/goodlift/' ||
    url.pathname === '/goodlift';
  
  if (isNavigationRequest || isCriticalAsset) {
    // Network-first: Try network, fall back to cache
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache the new version
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[Service Worker] Serving from cache (offline):', event.request.url);
              return cachedResponse;
            }
            throw new Error('Network request failed and no cache available');
          });
        })
    );
  } else {
    // Cache-first strategy for static assets (images, icons, etc.)
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
  }
});

// Note on cache versioning:
// Cache version is automatically generated during build based on timestamp.
// The sw-version.js file is created by scripts/generate-sw-version.js
// This ensures the service worker cache is updated on every deployment.
// Network-first strategy for critical files ensures users always get the latest version.

// Note on Push Notifications:
// Push notifications are handled by firebase-messaging-sw.js, not this service worker.
// This service worker focuses solely on PWA functionality (caching, offline support).
// Firebase Cloud Messaging (FCM) uses its own dedicated service worker for push notifications.
