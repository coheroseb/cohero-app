import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';

export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyAc9loZEcoQ4u0umlkioccfzp1kD0YURtI",
  authDomain: "studio-7870211338-fe921.firebaseapp.com",
  projectId: "studio-7870211338-fe921",
  storageBucket: "studio-7870211338-fe921.firebasestorage.app",
  messagingSenderId: "815145067598",
  appId: "1:815145067598:web:84e929ee06f58e67858f1f",
  measurementId: "G-EXS2X5PXQ2"
};

let cachedFirebase: any = null;

// Initialize Firebase
export function initializeFirebase() { 
  // Check if we already have it in window (browser only singleton for HMR)
  // if (typeof window !== 'undefined' && (window as any)._firebaseServices) {
  //   return (window as any)._firebaseServices;
  // }
  
  if (cachedFirebase) {
    return cachedFirebase;
  }

  const apps = getApps();
  const firebaseApp = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  const databaseId = 'cohero-database';
  
  console.log("[Firebase] Initializing Firestore. Database ID:", databaseId);

  // Initialize Firestore
  let firestore;
  try {
    // Try to initialize with settings.
    firestore = initializeFirestore(firebaseApp, { 
      ignoreUndefinedProperties: true
    }, databaseId);
  } catch (e) {
    // If already initialized, just get the existing instance
    firestore = getFirestore(firebaseApp, databaseId);
  }
  
  const auth = getAuth(firebaseApp);
  const storage = getStorage(firebaseApp);
  const functions = getFunctions(firebaseApp, 'us-central1');
  

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

  const services = { firebaseApp, auth, firestore, storage, analytics, messaging, functions };
  
  if (typeof window !== 'undefined') {
    (window as any)._firebaseServices = services;
  }
  
  cachedFirebase = services;
  return services;
}
