'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  type User 
} from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const getFirebaseApp = () => {
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  const app = initializeApp(firebaseConfig);
  // Mitigate Firestore Web Socket issues in Next.js development (ID: ca9 error)
  initializeFirestore(app, { experimentalForceLongPolling: true });
  return app;
};

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: null,
  auth: null,
  firestore: null,
  storage: null,
});

interface FirebaseProviderProps {
  children: React.ReactNode;
  firebaseApp?: FirebaseApp | null;
  auth?: Auth | null;
  firestore?: Firestore | null;
  storage?: FirebaseStorage | null;
}

export const FirebaseProvider = ({ 
    children, 
    firebaseApp: providedApp, 
    auth: providedAuth, 
    firestore: providedFirestore, 
    storage: providedStorage 
}: FirebaseProviderProps) => {
  // Use provided services or initialize them if not present (fallback)
  const firebaseApp = providedApp || getFirebaseApp();
  const auth = providedAuth || getAuth(firebaseApp);
  const firestore = providedFirestore || getFirestore(firebaseApp);
  const storage = providedStorage || getStorage(firebaseApp);

  useEffect(() => {
    if (typeof window !== 'undefined' && firebaseApp) {
      getAnalytics(firebaseApp);
    }
  }, [firebaseApp]);

  return (
    <FirebaseContext.Provider value={{ firebaseApp, auth, firestore, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
export const useAuth = () => useContext(FirebaseContext).auth;
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useStorage = () => useContext(FirebaseContext).storage;

export const useUser = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        return;
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            createdAt: serverTimestamp(),
            role: 'user',
            membership: 'Kollega',
          });
        }
      }
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const handleLogin = (email: string, pass: string) => {
    if (!auth) throw new Error("Authentication service is not available.");
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const handleSignup = async (email: string, pass: string, displayName: string) => {
    if (!auth) throw new Error("Authentication service is not available.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential;
  };

  const handleGoogleLogin = async () => {
    if (!auth) throw new Error("Authentication service is not available.");
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  return { user, isUserLoading, handleLogin, handleSignup, handleGoogleLogin };
};
