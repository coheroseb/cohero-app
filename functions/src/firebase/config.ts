import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from 'firebase/messaging';

export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyAc9loZEcoQ4u0umlkioccfzp1kD0YURtI",
  authDomain: "studio-7870211338-fe921.firebaseapp.com",
  projectId: "studio-7870211338-fe921",
  storageBucket: "studio-7870211338-fe921.firebasestorage.app",
  messagingSenderId: "815145067598",
  appId: "1:815145067598:web:84e929ee06f58e67858f1f",
  measurementId: "G-EXS2X5PXQ2"
};

// Initialize Firebase
export function initializeFirebase() { 
  // Check if Firebase has already been initialized
  const apps = getApps();
  const firebaseApp = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);
  
  // Initialize Analytics and Messaging only in the browser
  let analytics;
  let messaging;
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(firebaseApp);
    // Messaging only supported in some browsers
    try {
        messaging = getMessaging(firebaseApp);
    } catch (e) {
        console.warn('Firebase Messaging not supported in this browser.');
    }
  }

  return { firebaseApp, auth, firestore, storage, analytics, messaging };
}
