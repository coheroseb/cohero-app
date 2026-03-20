'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log fejlen til konsollen eller en tracking service
    console.error('Systemfejl fanget af error.tsx:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 md:p-16 rounded-[3rem] border border-amber-100 shadow-2xl animate-ink relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
        
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold text-amber-950 serif mb-4">Hov, der skete en fejl</h1>
        <p className="text-slate-500 mb-10 leading-relaxed italic">
          Systemet stødte på en uventet hindring. Vi har logget hændelsen og kigger på det. Prøv at genindlæse siden, eller gå tilbage til portalen.
        </p>

        <div className="space-y-4">
          <Button 
            onClick={() => reset()}
            className="w-full h-14 bg-amber-950 text-white hover:bg-amber-900"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Prøv igen
          </Button>
          <Link href="/portal" className="block">
            <Button variant="ghost" className="w-full h-14 text-slate-400 hover:text-amber-950">
              <Home className="w-4 h-4 mr-2" />
              Tilbage til Portalen
            </Button>
          </Link>
        </div>
        
        <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-300">
          Fejlkode: {error.digest || 'Internal Server Error'}
        </p>
      </div>
    </div>
  );
}
