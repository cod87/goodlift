import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCxgAj6zUGeScwae1Slw-JqX-ZAEcEhAcI",
  authDomain: "goodlift-7760a.firebaseapp.com",
  projectId: "goodlift-7760a",
  storageBucket: "goodlift-7760a.firebasestorage.app",
  messagingSenderId: "444306542177",
  appId: "1:444306542177:web:ea09005a6d4cf46d6f6420",
  measurementId: "G-YR73MY2CH6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize messaging only if supported (not in all browsers)
let messaging = null;

console.log('[Firebase] Checking Firebase Messaging support...');

isSupported().then((supported) => {
  if (supported) {
    console.log('[Firebase] ✅ Firebase Messaging is supported in this browser');
    try {
      messaging = getMessaging(app);
      console.log('[Firebase] ✅ Firebase Messaging instance created successfully');
    } catch (error) {
      console.error('[Firebase] ❌ Error creating Firebase Messaging instance:', error);
      console.error('[Firebase] Error name:', error.name);
      console.error('[Firebase] Error message:', error.message);
    }
  } else {
    console.warn('[Firebase] ⚠️  Firebase Messaging is not supported in this browser');
    console.warn('[Firebase] This is expected on Safari/iOS which does not support FCM');
    console.warn('[Firebase] Use native Web Push API instead');
  }
}).catch((err) => {
  console.error('[Firebase] ❌ Error checking Firebase Messaging support:', err);
  console.error('[Firebase] Error name:', err.name);
  console.error('[Firebase] Error message:', err.message);
  console.warn('[Firebase] Firebase Messaging will not be available');
});

export { db, auth, storage, messaging };