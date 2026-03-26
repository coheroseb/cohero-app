import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
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

let cachedFirebase: any = null;

// Initialize Firebase
export function initializeFirebase() { 
  // Check if we already have it in window (browser only singleton for HMR)
  if (typeof window !== 'undefined' && (window as any)._firebaseServices) {
    return (window as any)._firebaseServices;
  }
  
  if (cachedFirebase) {
    return cachedFirebase;
  }

  const apps = getApps();
  let firebaseApp;
  
  if (apps.length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    // CRITICAL: initializeFirestore MUST be called before getFirestore
    // to apply options correctly. We must also disable fetch streams because
    // Next.js patches `fetch`, which breaks WebChannel streaming over HMR.
    initializeFirestore(firebaseApp, { 
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
      // @ts-ignore
      useFetchStreams: false
    });
  } else {
    firebaseApp = apps[0];
  }

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

  const services = { firebaseApp, auth, firestore, storage, analytics, messaging };
  
  if (typeof window !== 'undefined') {
    (window as any)._firebaseServices = services;
  }
  
  cachedFirebase = services;
  return services;
}
