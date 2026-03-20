'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/app/provider';
import { useRouter } from 'next/navigation';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

export default function MundtligEksamenstraenerPage() {
  const { user, isUserLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Mic className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Mundtlig Eksamens-Træner
          </h1>
          <p className="text-base text-slate-500 max-w-3xl">
            Træn dit mundtlige eksamensoplæg og få AI-drevet feedback på din faglige terminologi, struktur og argumentation.
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-blue-50/70 p-8 rounded-[2rem] border-2 border-dashed border-blue-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-white text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-amber-950 serif mb-4">Under Udvikling</h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-8">
            Den mundtlige eksamenstræner er ved at blive finpudset. Snart kan du optage dit oplæg, få det transskriberet og modtage dybdegående feedback fra vores AI.
          </p>
          <Link href="/portal">
            <Button variant="outline">Tilbage til portalen</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
