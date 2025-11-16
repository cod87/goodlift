// Firebase Cloud Messaging Service Worker
// This service worker handles background notifications from Firebase Cloud Messaging
// 
// VAPID Key Configuration:
// The VAPID public key BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w
// is configured in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCxgAj6zUGeScwae1Slw-JqX-ZAEcEhAcI",
  authDomain: "goodlift-7760a.firebaseapp.com",
  projectId: "goodlift-7760a",
  storageBucket: "goodlift-7760a.firebasestorage.app",
  messagingSenderId: "444306542177",
  appId: "1:444306542177:web:ea09005a6d4cf46d6f6420",
  measurementId: "G-YR73MY2CH6"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages from Firebase Cloud Messaging
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM Service Worker] Received background message from Firebase:', payload);
  
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

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click for Firebase notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM Service Worker] Notification click received');
  
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes('/goodlift') && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/goodlift/');
        }
      })
  );
});
