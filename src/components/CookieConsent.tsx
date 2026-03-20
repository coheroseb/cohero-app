
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import { useApp } from '@/app/provider';

const CookieConsent = () => {
  const { cookieConsent, grantCookieConsent, denyCookieConsent } = useApp();

  if (cookieConsent !== 'pending') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-950/90 backdrop-blur-lg text-white p-4 z-[200] animate-fade-in-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center md:text-left">
          <Cookie className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-100/80">
            Vi bruger cookies til analyse for at forbedre din oplevelse. Ved at acceptere hjælper du os med at gøre Cohéro bedre. Læs vores{' '}
            <Link href="/cookie-policy" className="underline font-bold hover:text-white">
              cookiepolitik
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={denyCookieConsent}
            variant="ghost"
            className="text-amber-100/70 hover:text-white hover:bg-white/10"
            size="sm"
          >
            Afvis
          </Button>
          <Button
            onClick={grantCookieConsent}
            className="bg-white text-amber-950 hover:bg-amber-100"
            size="sm"
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
