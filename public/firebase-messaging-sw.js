// Firebase Cloud Messaging Service Worker
// This service worker handles background notifications from Firebase Cloud Messaging
// 
// VAPID Key Configuration:
// The VAPID public key BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w
// is configured in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates

console.log('[FCM Service Worker] Loading Firebase Cloud Messaging service worker...');

try {
  importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
  console.log('[FCM Service Worker] ✅ Firebase scripts loaded successfully');
} catch (error) {
  console.error('[FCM Service Worker] ❌ Error loading Firebase scripts:', error);
  console.error('[FCM Service Worker] Check internet connectivity and script URLs');
}

// Initialize Firebase in the service worker
try {
  console.log('[FCM Service Worker] Initializing Firebase...');
  
  firebase.initializeApp({
    apiKey: "AIzaSyCxgAj6zUGeScwae1Slw-JqX-ZAEcEhAcI",
    authDomain: "goodlift-7760a.firebaseapp.com",
    projectId: "goodlift-7760a",
    storageBucket: "goodlift-7760a.firebasestorage.app",
    messagingSenderId: "444306542177",
    appId: "1:444306542177:web:ea09005a6d4cf46d6f6420",
    measurementId: "G-YR73MY2CH6"
  });
  
  console.log('[FCM Service Worker] ✅ Firebase initialized successfully');
} catch (error) {
  console.error('[FCM Service Worker] ❌ Error initializing Firebase:', error);
  console.error('[FCM Service Worker] Error name:', error.name);
  console.error('[FCM Service Worker] Error message:', error.message);
}

// Retrieve an instance of Firebase Messaging so that it can handle background messages
let messaging;
try {
  messaging = firebase.messaging();
  console.log('[FCM Service Worker] ✅ Firebase Messaging instance created');
} catch (error) {
  console.error('[FCM Service Worker] ❌ Error creating Firebase Messaging instance:', error);
  console.error('[FCM Service Worker] This may indicate Firebase initialization failed');
}

// Handle background messages from Firebase Cloud Messaging
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM Service Worker] ═══════════════════════════════════════');
    console.log('[FCM Service Worker] Received background message from Firebase');
    console.log('[FCM Service Worker] Message ID:', payload.messageId || 'N/A');
    console.log('[FCM Service Worker] From:', payload.from || 'N/A');
    console.log('[FCM Service Worker] Collapse Key:', payload.collapseKey || 'N/A');
    
    if (payload.notification) {
      console.log('[FCM Service Worker] Notification payload:');
      console.log('[FCM Service Worker]   Title:', payload.notification.title);
      console.log('[FCM Service Worker]   Body:', payload.notification.body);
      console.log('[FCM Service Worker]   Icon:', payload.notification.icon);
    }
    
    if (payload.data) {
      console.log('[FCM Service Worker] Data payload:', payload.data);
    }
    
    const notificationTitle = payload.notification?.title || 'GoodLift';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/goodlift/icons/goodlift-icon-192.png',
      badge: '/goodlift/icons/goodlift-icon-192.png',
      tag: 'goodlift-fcm-notification',
      requireInteraction: false,
      data: payload.data,
      vibrate: [200, 100, 200],
    };
    
    console.log('[FCM Service Worker] Showing notification...');
    console.log('[FCM Service Worker] Title:', notificationTitle);
    console.log('[FCM Service Worker] Options:', notificationOptions);

    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('[FCM Service Worker] ✅ Notification shown successfully');
        console.log('[FCM Service Worker] ═══════════════════════════════════════');
      })
      .catch((error) => {
        console.error('[FCM Service Worker] ❌ Error showing notification:', error);
        console.error('[FCM Service Worker] Error name:', error.name);
        console.error('[FCM Service Worker] Error message:', error.message);
        console.error('[FCM Service Worker] ═══════════════════════════════════════');
      });
  });
  
  console.log('[FCM Service Worker] ✅ Background message handler registered');
} else {
  console.error('[FCM Service Worker] ❌ Cannot register message handler - messaging instance not available');
}

// Handle notification click for Firebase notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM Service Worker] ═══════════════════════════════════════');
  console.log('[FCM Service Worker] Notification click received');
  console.log('[FCM Service Worker] Notification tag:', event.notification.tag);
  
  event.notification.close();
  console.log('[FCM Service Worker] Notification closed');
  
  // Open the app when notification is clicked
  console.log('[FCM Service Worker] Looking for open app windows...');
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[FCM Service Worker] Found', clientList.length, 'window client(s)');
        
        // If a window is already open, focus it
        for (const client of clientList) {
          console.log('[FCM Service Worker] Checking client URL:', client.url);
          
          if (client.url.includes('/goodlift') && 'focus' in client) {
            console.log('[FCM Service Worker] ✅ Focusing existing window');
            return client.focus();
          }
        }
        
        // Otherwise, open a new window
        if (clients.openWindow) {
          console.log('[FCM Service Worker] No open window found, opening new window');
          return clients.openWindow('/goodlift/').then((client) => {
            console.log('[FCM Service Worker] ✅ New window opened');
            return client;
          });
        } else {
          console.warn('[FCM Service Worker] ⚠️  Cannot open new window (openWindow not supported)');
        }
      })
      .then(() => {
        console.log('[FCM Service Worker] ✅ Notification click handled');
        console.log('[FCM Service Worker] ═══════════════════════════════════════');
      })
      .catch((error) => {
        console.error('[FCM Service Worker] ❌ Error handling notification click:', error);
        console.error('[FCM Service Worker] Error name:', error.name);
        console.error('[FCM Service Worker] Error message:', error.message);
        console.error('[FCM Service Worker] ═══════════════════════════════════════');
      })
  );
});
