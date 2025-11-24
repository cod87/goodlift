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

// Firebase Messaging removed - was causing initialization issues
// Firebase Auth and Firestore remain active for cross-device data sync

export { db, auth, storage };