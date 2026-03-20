'use client';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Scale, Zap, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/app/provider';
import { useRouter } from 'next/navigation';

export default function LegalLogicBoardPage() {
  const { user, isUserLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FDFCF8]">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-semibold">Indlæser...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-[#FDFCF8] min-h-screen">
       <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
           <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Interventions-Tavlen
          </h1>
          <p className="text-base text-slate-500 max-w-3xl">
            Udforsk konsekvenserne af dine faglige valg. Vælg en indsats og se, hvordan den påvirker borgerens rettigheder, økonomi og relationer.
          </p>
        </div>
      </header>
       <main className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="bg-rose-50/70 p-8 rounded-[2rem] border-2 border-dashed border-rose-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-white text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
                    <Info className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-amber-950 serif mb-4">Under Udvikling</h2>
                <p className="text-slate-600 max-w-lg mx-auto mb-8">
                    Interventions-Tavlen er en kommende funktion, der lader dig træffe et valg i en sag og se de juridiske, økonomiske og sociale "ringe i vandet", det skaber.
                </p>
                <Link href="/portal">
                    <Button variant="outline">Tilbage til portalen</Button>
                </Link>
            </div>
        </main>
    </div>
  );
}
