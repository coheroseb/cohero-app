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
import { type Functions } from 'firebase/functions';

import { initializeFirebase } from './config';

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
  functions: Functions | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: null,
  auth: null,
  firestore: null,
  storage: null,
  functions: null,
});

interface FirebaseProviderProps {
  children: React.ReactNode;
  firebaseApp?: FirebaseApp | null;
  auth?: Auth | null;
  firestore?: Firestore | null;
  storage?: FirebaseStorage | null;
  functions?: Functions | null;
}

export const FirebaseProvider = ({ 
    children, 
    firebaseApp: providedApp, 
    auth: providedAuth, 
    firestore: providedFirestore, 
    storage: providedStorage,
    functions: providedFunctions
}: FirebaseProviderProps) => {
  // Use provided services or initialize them if not present (fallback)
  const services = providedApp ? { firebaseApp: providedApp, auth: providedAuth, firestore: providedFirestore, storage: providedStorage, functions: providedFunctions } : initializeFirebase();
  const { firebaseApp, auth, firestore, storage, functions } = services;

  useEffect(() => {
    if (typeof window !== 'undefined' && firebaseApp) {
      getAnalytics(firebaseApp);
    }
  }, [firebaseApp]);

  return (
    <FirebaseContext.Provider value={{ firebaseApp, auth, firestore, storage, functions }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
export const useAuth = () => useContext(FirebaseContext).auth;
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useStorage = () => useContext(FirebaseContext).storage;
export const useFunctions = () => useContext(FirebaseContext).functions;

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
    if (!auth || !firestore) throw new Error("Authentication service is not available.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      // 1. Initial Profile Update
      await updateProfile(userCredential.user, { displayName });

      // 2. Metadata Collection (Source Attribution)
      let sourceData = {};
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cohero_attribution');
          if (stored) {
            const parsed = JSON.parse(stored);
            sourceData = {
                conversionSource: parsed.source,
                fbclid: parsed.fbclid || null,
                uf: parsed.uf || null,
                utm_source: parsed.utm_source || null,
                convertedAt: serverTimestamp()
            };
            // Clear to prevent multi-logging
            localStorage.removeItem('cohero_attribution');
          }
        } catch (e) {
          console.error("Attribution parsing failed", e);
        }
      }

      // 3. Compliance: Automatically accept the latest terms version during creation
      let latestTermsVersion = '1.0.0';
      try {
        const termsSnap = await getDoc(doc(firestore, 'globalConfigs', 'terms'));
        if (termsSnap.exists()) {
          latestTermsVersion = termsSnap.data().version || '1.0.0';
        }
      } catch (e) {
        console.error("Failed to fetch terms version during signup:", e);
      }

      // 4. Persist User Doc
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        displayName,
        role: 'user', // Ensure default role is set
        createdAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        acceptedTermsVersion: latestTermsVersion,
        acceptedTermsAt: serverTimestamp(),
        ...sourceData
      }, { merge: true });
    }
    return userCredential;
  };

  const handleGoogleLogin = async () => {
    if (!auth || !firestore) throw new Error("Authentication service is not available.");
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    if (userCredential.user) {
      // Collect attribution (same logic as signup)
      let sourceData = {};
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cohero_attribution');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            sourceData = {
              conversionSource: parsed.source,
              fbclid: parsed.fbclid || null,
              uf: parsed.uf || null,
              utm_source: parsed.utm_source || null,
              convertedAt: serverTimestamp()
            };
          } catch (e) {}
        }
      }

      // Compliance: Fetch latest terms version for new users
      let latestTermsVersion = '1.0.0';
      try {
        const termsSnap = await getDoc(doc(firestore, 'globalConfigs', 'terms'));
        if (termsSnap.exists()) {
          latestTermsVersion = termsSnap.data().version || '1.0.0';
        }
      } catch (e) {
        console.error("Failed to fetch terms version during Google login:", e);
      }
      
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const isNewUser = !userDocSnap.exists();

      const updateData: any = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        lastLogin: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        ...sourceData
      };

      // Only set terms acceptance for new users to avoid unintended updates for existing users
      if (isNewUser) {
        updateData.acceptedTermsVersion = latestTermsVersion;
        updateData.acceptedTermsAt = serverTimestamp();
        updateData.role = 'user';
        updateData.createdAt = serverTimestamp();
      }

      await setDoc(userDocRef, updateData, { merge: true });

      if (typeof window !== 'undefined') localStorage.removeItem('cohero_attribution');
    }

    return userCredential;
  };

  return { user, isUserLoading, handleLogin, handleSignup, handleGoogleLogin };
};
