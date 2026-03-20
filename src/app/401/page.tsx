'use client';

import React from 'react';
import { Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/app/provider';

export default function UnauthorizedPage() {
  const { openAuthModal } = useApp();

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 md:p-16 rounded-[3rem] border border-amber-100 shadow-2xl animate-ink">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Lock className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold text-amber-950 serif mb-4">Adgang nægtet</h1>
        <p className="text-slate-500 mb-10 leading-relaxed italic">
          Du har ikke adgang til denne side (401). Det skyldes typisk at du ikke er logget ind, eller at din session er udløbet.
        </p>

        <Button 
          onClick={() => openAuthModal('login')}
          className="w-full h-14 bg-indigo-950 text-white hover:bg-indigo-900"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Log ind her
        </Button>
      </div>
    </div>
  );
}
