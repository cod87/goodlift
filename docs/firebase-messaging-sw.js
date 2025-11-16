// Firebase Cloud Messaging Service Worker
// This service worker handles background notifications

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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'GoodLift';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/goodlift-logo.svg',
    badge: '/goodlift-logo.svg',
    tag: 'goodlift-notification',
    requireInteraction: false,
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.openWindow('/')
  );
});
