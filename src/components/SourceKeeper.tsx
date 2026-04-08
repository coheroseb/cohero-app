'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export const ATTRIBUTION_KEY = 'cohero_attribution';

export interface AttributionData {
  source: 'facebook' | 'tiktok' | 'google' | 'direct' | string;
  fbclid?: string;
  utm_source?: string;
  uf?: string;
  timestamp: number;
}

/**
 * SourceKeeper
 * A zero-cost attribution component that stores the user's entry source 
 * in localStorage without making any database writes.
 * The source is then picked up during sign-up to provide high-fidelity analytics.
 */
export default function SourceKeeper() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fbclid = searchParams?.get('fbclid');
    const uf = searchParams?.get('uf');
    const utmSource = searchParams?.get('utm_source');

    let source: string | null = null;
    let data: Partial<AttributionData> = {};

    if (fbclid) {
      source = 'facebook';
      data.fbclid = fbclid;
    } else if (uf === 'tiktok') {
      source = 'tiktok';
      data.uf = 'tiktok';
    } else if (utmSource) {
      source = utmSource;
      data.utm_source = utmSource;
    }

    if (source) {
      const attribution: AttributionData = {
        source,
        ...data,
        timestamp: Date.now()
      };

      // We only store it if there isn't one already (First-touch attribution)
      // or if the new one is explicit (like a new ad click)
      const existing = localStorage.getItem(ATTRIBUTION_KEY);
      if (!existing) {
        localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
        console.log(`[SourceKeeper] Entry source attributed: ${source}`);
      }
    }
  }, [searchParams]);

  return null;
}
