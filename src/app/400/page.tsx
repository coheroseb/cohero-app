'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BadRequestPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 md:p-16 rounded-[3rem] border border-amber-100 shadow-2xl animate-ink">
        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
          <HelpCircle className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-bold text-amber-950 serif mb-4">Uforståelig anmodning</h1>
        <p className="text-slate-500 mb-10 leading-relaxed italic">
          Vi kunne ikke helt forstå hvad du bad om (400). Det kan skyldes en fejl i formularen eller et ugyldigt link. Prøv at starte forfra.
        </p>

        <Link href="/portal">
          <Button className="w-full h-14 bg-amber-950 text-white hover:bg-amber-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Gå tilbage
          </Button>
        </Link>
      </div>
    </div>
  );
}
