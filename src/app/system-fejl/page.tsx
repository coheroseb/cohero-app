'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InternalServerErrorPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 md:p-16 rounded-[3rem] border border-amber-100 shadow-2xl animate-ink">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold text-amber-950 serif mb-4">Systemfejl</h1>
        <p className="text-slate-500 mb-10 leading-relaxed italic">
          Der opstod en kritisk fejl på serveren. Vi er blevet underrettet og arbejder på at få din digitale kollega op at køre igen.
        </p>

        <div className="space-y-4">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full h-14 bg-amber-950 text-white hover:bg-amber-900"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Prøv at genindlæse
          </Button>
          <Link href="/portal" className="block">
            <Button variant="ghost" className="w-full h-14 text-slate-400 hover:text-amber-950">
              <Home className="w-4 h-4 mr-2" />
              Gå til Forsiden
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
