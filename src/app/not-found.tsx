'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 md:p-16 rounded-[3rem] border border-amber-100 shadow-2xl animate-ink">
        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Compass className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold text-amber-950 serif mb-4">Siden findes ikke</h1>
        <p className="text-slate-500 mb-10 leading-relaxed italic">
          Vi har kigget i alle arkivskabe og under alle læseborde, men kunne ikke finde den side, du leder efter (404).
        </p>

        <Link href="/portal">
          <Button className="w-full h-14 bg-amber-950 text-white hover:bg-amber-900">
            <Home className="w-4 h-4 mr-2" />
            Tilbage til Portalen
          </Button>
        </Link>
      </div>
    </div>
  );
}
