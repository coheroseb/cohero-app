'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch, increment } from 'firebase/firestore';

export default function PageViewTracker() {
  const { user, userProfile } = useApp();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  
  const fbclid = searchParams?.get('fbclid');
  const lastTrackedTime = useRef<number>(0);
  const lastTrackedPath = useRef<string | null>(null);

  const trackView = useCallback(async (path: string, fbclidValue?: string | null) => {
    const now = Date.now();
    // Throttle: Don't track if the last track was less than a second ago
    if (now - lastTrackedTime.current < 1000) {
      return;
    }
    // Prevent logging the same path consecutively on simple navigation
    if (path === lastTrackedPath.current) {
        return;
    }
    
    if (firestore) {
      // Don't track admin pages to avoid noise
      if (path.startsWith('/admin')) {
        return;
      }
      
      try {
        lastTrackedTime.current = now;
        lastTrackedPath.current = path;

        const batch = writeBatch(firestore);

        // 1. Log the page view event (works for both auth and anonymous)
        const pageViewsCollection = collection(firestore, 'pageViews');
        const newViewRef = doc(pageViewsCollection);
        batch.set(newViewRef, {
          userId: user?.uid || 'anonymous',
          path: path,
          fbclid: fbclidValue || null,
          source: fbclidValue ? 'facebook' : 'direct',
          timestamp: serverTimestamp()
        });

        // 2. If it's a FB referral, update aggregate stats
        if (fbclidValue) {
            const statsRef = doc(firestore, 'stats', 'referrals');
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Increment total FB clicks and daily FB clicks
            batch.set(statsRef, {
                totalFbClicks: increment(1),
                lastUpdated: serverTimestamp()
            }, { merge: true });

            const dailyStatsRef = doc(firestore, `stats/referrals/daily/${today}`);
            batch.set(dailyStatsRef, {
                fbClicks: increment(1),
                date: today,
                lastUpdated: serverTimestamp()
            }, { merge: true });
        }

        // 3. If user is logged in, update their activity
        if (user && userProfile) {
            const userRef = doc(firestore, 'users', user.uid);
            batch.update(userRef, { 
                lastActivityAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // If first time from FB, store it on the user profile
                ...(fbclidValue && !userProfile.firstFbclid ? {
                    firstFbclid: fbclidValue,
                    conversionSource: 'facebook',
                    convertedAt: serverTimestamp()
                } : {})
            });
        }

        await batch.commit();
      } catch (error: any) {
        // Fail silently to not interrupt user experience, but emit for diagnostics
        console.error("Failed to track page view or update activity:", error);
      }
    }
  }, [user, userProfile, firestore]);

  // Track navigation changes
  useEffect(() => {
    if (pathname) {
      trackView(pathname, fbclid);
    }
  }, [trackView, pathname, fbclid]);
  
  // Track visibility changes (tab focus) to count as activity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname) {
        trackView(pathname, fbclid);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackView, pathname, fbclid]);

  return null;
}
