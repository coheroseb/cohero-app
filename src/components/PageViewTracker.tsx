
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch } from 'firebase/firestore';

export default function PageViewTracker() {
  const { user, userProfile } = useApp();
  const pathname = usePathname();
  const firestore = useFirestore();
  
  const lastTrackedTime = useRef<number>(0);
  const lastTrackedPath = useRef<string | null>(null);

  const trackView = useCallback(async (path: string) => {
    const now = Date.now();
    // Throttle: Don't track if the last track was less than a second ago
    if (now - lastTrackedTime.current < 1000) {
      return;
    }
    // Prevent logging the same path consecutively
    if (path === lastTrackedPath.current) {
        return;
    }
    
    if (user && userProfile && firestore) {
      // Don't track admin pages to avoid noise
      if (path.startsWith('/admin')) {
        return;
      }
      
      try {
        lastTrackedTime.current = now;
        lastTrackedPath.current = path;

        const batch = writeBatch(firestore);

        // 1. Log the page view event
        const pageViewsCollection = collection(firestore, 'pageViews');
        const newViewRef = doc(pageViewsCollection);
        batch.set(newViewRef, {
          userId: user.uid,
          path: path,
          timestamp: serverTimestamp()
        });

        // 2. Update user activity timestamp
        const userRef = doc(firestore, 'users', user.uid);
        batch.update(userRef, { 
          lastActivityAt: serverTimestamp(),
          updatedAt: serverTimestamp() 
        });

        await batch.commit();
      } catch (error: any) {
        // Fail silently to not interrupt user experience, but emit for diagnostics
        const { errorEmitter } = await import('@/firebase/error-emitter');
        const { FirestorePermissionError } = await import('@/firebase/errors');
        
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: `users/${user.uid}`,
            operation: 'update',
          })
        );
        console.error("Failed to track page view or update activity:", error);
      }
    }
  }, [user, userProfile, firestore]);

  // Track navigation changes
  useEffect(() => {
    if (pathname) {
      trackView(pathname);
    }
  }, [trackView, pathname]);
  
  // Track visibility changes (tab focus) to count as activity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname) {
        trackView(pathname);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackView, pathname]);

  return null;
}
