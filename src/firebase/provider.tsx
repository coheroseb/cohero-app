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
import { getFirestore, initializeFirestore, doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { processReferralAction } from '@/app/actions';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';

import { initializeFirebase } from './config';

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
  const services = providedApp ? { firebaseApp: providedApp, auth: providedAuth, firestore: providedFirestore, storage: providedStorage } : initializeFirebase();
  const { firebaseApp, auth, firestore, storage } = services;

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
      let sourceData: any = {};
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
                referredBy: parsed.referredBy || null,
                convertedAt: serverTimestamp()
            };
            // Clear to prevent multi-logging
            localStorage.removeItem('cohero_attribution');
          }
        } catch (e) {
          console.error("Attribution parsing failed", e);
        }
      }

      // 3. Referral Logic: If this user was referred, notify the server
      if (sourceData.referredBy) {
          processReferralAction({ 
              referralCode: sourceData.referredBy, 
              newUserId: userCredential.user.uid 
          }).catch(err => console.error("Referral processing failed:", err));
      }

      // 4. Persist User Doc
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        displayName,
        role: 'user', 
        referralCode: generateReferralCode(),
        referralCount: 0,
        referredBy: sourceData.referredBy || null,
        createdAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
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
      // 1. Check if user already exists to avoid re-running referral logic/overwriting referral code
      const existingDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
      const alreadyExists = existingDoc.exists();

      // 2. Collect attribution
      let sourceData: any = {};
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
              referredBy: parsed.referredBy || null,
              convertedAt: serverTimestamp()
            };
          } catch (e) {}
        }
      }

      // 3. If new user, handle referral logic
      if (!alreadyExists && sourceData.referredBy) {
          processReferralAction({ 
              referralCode: sourceData.referredBy, 
              newUserId: userCredential.user.uid 
          }).catch(err => console.error("Referral processing failed:", err));
      }

      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        lastLogin: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
        ...(alreadyExists ? {} : { 
            referralCode: generateReferralCode(), 
            referralCount: 0, 
            referredBy: sourceData.referredBy || null,
            role: 'user' 
        }),
        ...sourceData
      }, { merge: true });

      if (typeof window !== 'undefined') localStorage.removeItem('cohero_attribution');
    }

    return userCredential;
  };

  return { user, isUserLoading, handleLogin, handleSignup, handleGoogleLogin };
};

/**
 * generateReferralCode:
 * Creates a unique, easy-to-read referral code for marketing tracking.
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar looking chars (0/O, 1/I/L)
  let code = 'COHERO-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
