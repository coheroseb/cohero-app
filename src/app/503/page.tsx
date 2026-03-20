'use client';

import React from 'react';
import { Coffee, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServiceUnavailablePage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 md:p-16 rounded-[3rem] border border-amber-100 shadow-2xl animate-ink">
        <div className="w-20 h-20 bg-amber-50 text-amber-700 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Coffee className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold text-amber-950 serif mb-4">Vi holder pause</h1>
        <p className="text-slate-500 mb-10 leading-relaxed italic">
          Tjenesten er midlertidigt utilgængelig (503). Vi foretager sandsynligvis vedligeholdelse for at gøre platformen endnu bedre. Prøv igen om et par minutter.
        </p>

        <Button 
          onClick={() => window.location.reload()}
          className="w-full h-14 bg-amber-950 text-white hover:bg-amber-900"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Prøv igen nu
        </Button>
      </div>
    </div>
  );
}
