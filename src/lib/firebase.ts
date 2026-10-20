import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBxfovvF5ihrViHQLOqsJ8e4WM2TB0Z94M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tool-sathi001.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tool-sathi001",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tool-sathi001.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "156751820127",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:156751820127:web:06554a5f276ea2948832ea",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export default app;
