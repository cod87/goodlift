// GoodLift PWA Service Worker
// Cache name - increment version to force update of cached files
const CACHE_NAME = 'goodlift-pwa-v2';

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

// Push notification event handler
// This event is triggered when a push notification is received
self.addEventListener('push', (event) => {
  console.log('[Service Worker] ═══════════════════════════════════════');
  console.log('[Service Worker] Push notification received');
  console.log('[Service Worker] Event has data:', event.data !== null);
  
  if (event.data) {
    console.log('[Service Worker] Data type:', typeof event.data);
    try {
      const rawText = event.data.text();
      console.log('[Service Worker] Raw data:', rawText);
    } catch (e) {
      console.log('[Service Worker] Could not read raw data:', e.message);
    }
  }

  // Default notification options
  const defaultOptions = {
    icon: '/goodlift/icons/goodlift-icon-192.png',
    badge: '/goodlift/icons/goodlift-icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'goodlift-notification',
  };

  let notificationData = {
    title: 'GoodLift',
    body: 'You have a new notification',
    ...defaultOptions,
  };

  // Parse notification data if provided
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[Service Worker] Parsed JSON data:', data);
      
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || defaultOptions.icon,
        badge: data.badge || defaultOptions.badge,
        data: data.data || {},
        ...defaultOptions,
      };
      
      console.log('[Service Worker] Notification will show:');
      console.log('[Service Worker]   Title:', notificationData.title);
      console.log('[Service Worker]   Body:', notificationData.body);
      console.log('[Service Worker]   Icon:', notificationData.icon);
    } catch (error) {
      console.error('[Service Worker] ❌ Error parsing push notification data:', error);
      console.error('[Service Worker] Error name:', error.name);
      console.error('[Service Worker] Error message:', error.message);
      
      // Use text content as fallback
      try {
        notificationData.body = event.data.text();
        console.log('[Service Worker] Using text fallback:', notificationData.body);
      } catch (textError) {
        console.error('[Service Worker] ❌ Could not read text data:', textError);
      }
    }
  } else {
    console.warn('[Service Worker] ⚠️  No data in push event, using default notification');
  }

  // Show the notification
  console.log('[Service Worker] Showing notification...');
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  ).then(() => {
    console.log('[Service Worker] ✅ Notification shown successfully');
    console.log('[Service Worker] ═══════════════════════════════════════');
  }).catch((error) => {
    console.error('[Service Worker] ❌ Error showing notification:', error);
    console.error('[Service Worker] Error name:', error.name);
    console.error('[Service Worker] Error message:', error.message);
    console.error('[Service Worker] ═══════════════════════════════════════');
  });

  event.waitUntil(promiseChain);
});

// Notification click event handler
// This event is triggered when user clicks on a notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] ═══════════════════════════════════════');
  console.log('[Service Worker] Notification clicked');
  console.log('[Service Worker] Notification tag:', event.notification.tag);
  console.log('[Service Worker] Notification title:', event.notification.title);
  
  // Close the notification
  event.notification.close();
  console.log('[Service Worker] Notification closed');

  // Handle notification click action - open the app or focus existing window
  console.log('[Service Worker] Looking for open app windows...');
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[Service Worker] Found', clientList.length, 'window client(s)');
        
        // If a window is already open, focus it
        for (const client of clientList) {
          console.log('[Service Worker] Checking client URL:', client.url);
          
          if (client.url.includes('/goodlift') && 'focus' in client) {
            console.log('[Service Worker] ✅ Focusing existing window');
            return client.focus();
          }
        }
        
        // Otherwise, open a new window
        if (clients.openWindow) {
          console.log('[Service Worker] No open window found, opening new window');
          return clients.openWindow('/goodlift/').then((client) => {
            console.log('[Service Worker] ✅ New window opened');
            return client;
          });
        } else {
          console.warn('[Service Worker] ⚠️  Cannot open new window (openWindow not supported)');
        }
      })
      .then(() => {
        console.log('[Service Worker] ✅ Notification click handled');
        console.log('[Service Worker] ═══════════════════════════════════════');
      })
      .catch((error) => {
        console.error('[Service Worker] ❌ Error handling notification click:', error);
        console.error('[Service Worker] Error name:', error.name);
        console.error('[Service Worker] Error message:', error.message);
        console.error('[Service Worker] ═══════════════════════════════════════');
      })
  );
});
