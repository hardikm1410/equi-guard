import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if the API key is present (avoids build-time errors)
const app =
  getApps().length === 0 && firebaseConfig.apiKey
    ? initializeApp(firebaseConfig)
    : getApps().length > 0
    ? getApps()[0]
    : null;

const auth = app ? getAuth(app) : (null as any);
const db = app ? getFirestore(app) : (null as any);

// Optional: You could enable offline persistence here if needed
// import { enableIndexedDbPersistence } from "firebase/firestore";
// if (db) {
//   enableIndexedDbPersistence(db).catch((err) => {
//     console.error("Persistence failed:", err.code);
//   });
// }

export { app, auth, db };

