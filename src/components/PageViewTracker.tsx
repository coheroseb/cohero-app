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
  const uf = searchParams?.get('uf');
  const lastTrackedTime = useRef<number>(0);
  const lastTrackedPath = useRef<string | null>(null);

  const trackView = useCallback(async (path: string, fbclidValue?: string | null, ufValue?: string | null) => {
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
        
        const source = fbclidValue ? 'facebook' : (ufValue === 'tiktok' ? 'tiktok' : 'direct');
        
        batch.set(newViewRef, {
          userId: user?.uid || 'anonymous',
          path: path,
          fbclid: fbclidValue || null,
          uf: ufValue || null,
          source: source,
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

        // 2b. If it's a TikTok referral, update aggregate stats
        if (ufValue === 'tiktok') {
            const statsRef = doc(firestore, 'stats', 'referrals');
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Increment total TikTok clicks and daily TikTok clicks
            batch.set(statsRef, {
                totalTikTokClicks: increment(1),
                lastUpdated: serverTimestamp()
            }, { merge: true });

            const dailyStatsRef = doc(firestore, `stats/referrals/daily/${today}`);
            batch.set(dailyStatsRef, {
                tiktokClicks: increment(1),
                date: today,
                lastUpdated: serverTimestamp()
            }, { merge: true });
        }

        // 3. If user is logged in, update their activity
        if (user && userProfile) {
            const userRef = doc(firestore, 'users', user.uid);
            
            const updates: any = {
                lastActivityAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // If first time from FB, store it on the user profile
            if (fbclidValue && !userProfile.conversionSource) {
                updates.firstFbclid = fbclidValue;
                updates.conversionSource = 'facebook';
                updates.convertedAt = serverTimestamp();
            } else if (ufValue === 'tiktok' && !userProfile.conversionSource) {
                updates.conversionSource = 'tiktok';
                updates.convertedAt = serverTimestamp();
            }

            batch.update(userRef, updates);
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
      trackView(pathname, fbclid, uf);
    }
  }, [trackView, pathname, fbclid, uf]);
  
  // Track visibility changes (tab focus) to count as activity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname) {
        trackView(pathname, fbclid, uf);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackView, pathname, fbclid, uf]);

  return null;
}
