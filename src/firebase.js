import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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

// Lazy load Firebase Messaging to reduce initial bundle size
// Messaging will be initialized on-demand when needed
let messaging = null;
let messagingPromise = null;

/**
 * Get Firebase Messaging instance (lazy-loaded)
 * This function will only load the messaging module when called
 * @returns {Promise<Messaging|null>}
 */
export async function getMessagingInstance() {
  if (messaging) {
    return messaging;
  }
  
  if (messagingPromise) {
    return messagingPromise;
  }
  
  messagingPromise = (async () => {
    try {
      console.log('[Firebase] Lazy-loading Firebase Messaging...');
      const { getMessaging, isSupported } = await import('firebase/messaging');
      
      const supported = await isSupported();
      if (supported) {
        console.log('[Firebase] ✅ Firebase Messaging is supported in this browser');
        messaging = getMessaging(app);
        console.log('[Firebase] ✅ Firebase Messaging instance created successfully');
        return messaging;
      } else {
        console.warn('[Firebase] ⚠️  Firebase Messaging is not supported in this browser');
        console.warn('[Firebase] This is expected on Safari/iOS which does not support FCM');
        return null;
      }
    } catch (error) {
      console.error('[Firebase] ❌ Error loading/initializing Firebase Messaging:', error);
      return null;
    }
  })();
  
  return messagingPromise;
}

export { db, auth, storage };