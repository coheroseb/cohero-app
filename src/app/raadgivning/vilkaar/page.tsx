'use client';

import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, AlertTriangle, Scale, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RaadgivningTermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFCF8] selection:bg-rose-100 pb-24">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-amber-50 fixed top-0 left-0 right-0 z-50 px-6 py-4">
         <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button 
               onClick={() => router.back()}
               className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-950 transition-colors"
            >
               <ArrowLeft className="w-4 h-4" />
               Tilbage
            </button>
            <Link href="/" className="flex items-center gap-3 active:scale-95 transition-all outline-none group">
               <div className="w-8 h-8 bg-amber-950 text-amber-500 rounded-lg flex items-center justify-center overflow-hidden border border-amber-900/20 group-hover:scale-105 transition-transform">
                  <img src="/main_logo.png" alt="Cohéro logo" className="w-full h-full object-cover" />
               </div>
               <h1 className="text-sm font-bold text-amber-950 serif">Vilkår & Betingelser</h1>
            </Link>
            <div className="w-20"></div> {/* Spacer for symmetry */}
         </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 sm:pt-48 space-y-12">
         {/* Hero Intro */}
         <div className="text-center space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">Cohéro Rådgivning</p>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 serif leading-tight">Vilkår for brug af platformen</h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto italic sm:text-lg">
               Læs venligst disse betingelser grundigt igennem, før du sender din anmodning om hjælp.
            </p>
         </div>

         <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] border border-amber-100 shadow-2xl p-8 sm:p-20 space-y-16">
            
            {/* Section 1: Non-professional aid */}
            <section className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                     <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 serif">1. Ikke-professionel hjælp</h3>
               </div>
               <div className="space-y-4 text-slate-600 leading-relaxed font-medium text-sm sm:text-base pl-16">
                  <p>
                     Hjælpen på Cohéro Rådgivningsportal ydes eksklusivt af <strong>socialrådgiverstuderende</strong>. De er <strong>ikke</strong> færdiguddannede socialrådgivere, jurister eller autoriserede rådgivere.
                  </p>
                  <p>
                    For at sikre kvaliteten på platformen verificerer Cohéro manuelt alle hjælperes <strong>studiekort</strong>, før de får lov til at tage opgaver på markedspladsen.
                  </p>
                  <p className="bg-rose-50 p-6 rounded-2xl border border-rose-100 text-rose-900 font-bold italic">
                     Hjælpen er vejledende og kan ikke sidestilles med juridisk bindende rådgivning. Cohéro påtager sig intet ansvar for udfaldet af din sag eller konsekvenserne af den vejledning, du modtager.
                  </p>
               </div>
            </section>

            {/* Section 2: Privacy */}
            <section className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                     <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 serif">2. Fortrolighed & Persondata</h3>
               </div>
               <div className="space-y-4 text-slate-600 leading-relaxed font-medium text-sm sm:text-base pl-16">
                  <p>
                     Når du opretter en anmodning, deles dine kontaktoplysninger (navn, e-mail og tlf.) kun med den studerende, der vælger din opgave på markedspladsen.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                     <li>Du er selv ansvarlig for ikke at dele følsomme personoplysninger (som f.eks. fulde CPR-numre) direkte i opgavebeskrivelsen.</li>
                     <li>Cohéro opbevarer dine data sikkert og benytter dem udelukkende til at facilitere kontakten mellem dig og den studerende.</li>
                  </ul>
               </div>
            </section>

            {/* Section 3: Payment */}
            <section className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 serif">3. Betaling & Gebyrer</h3>
               </div>
               <div className="space-y-4 text-slate-600 leading-relaxed font-medium text-sm sm:text-base pl-16">
                  <p>
                     Betaling foregår sikkert via Stripe. Cohéro opkræver et platformgebyr på 15% af det samlede beløb for at dække drift, administration og sikkerhed.
                  </p>
                  <p>
                     Betalingen reserveres når du starter opgaven og frigives til den studerende, når hjælpen er leveret. Som udgangspunkt ydes der ikke fortrydelsesret efter at den studerende har påbegyndt arbejdet.
                  </p>
               </div>
            </section>

            {/* Section 4: Responsibility */}
            <section className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                     <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 serif">4. Ansvarsfraskrivelse</h3>
               </div>
               <div className="space-y-4 text-slate-600 leading-relaxed font-medium text-sm sm:text-base pl-16">
                  <p>
                     Cohéro fungerer udelukkende som en formidlingsplatform. Vi garanterer ikke for rigtigheden eller kvaliteten af de studerendes arbejde. Enhver tvist mellem borger og studerende skal løses indbyrdes, omend vi altid står til rådighed for mægling i det omfang, det er muligt.
                  </p>
               </div>
            </section>

         </div>

         <div className="text-center pt-8">
            <button 
               onClick={() => router.back()}
               className="h-16 px-12 bg-amber-950 text-white rounded-[1.5rem] font-bold uppercase tracking-widest text-[10px] shadow-2xl hover:bg-rose-900 transition-all active:scale-95"
            >
               Jeg forstår og vil gå videre
            </button>
         </div>
         
         <div className="text-center">
            <p className="text-[10px] text-slate-400 font-medium">Sidst opdateret: 26. marts 2026</p>
         </div>
      </main>
    </div>
  );
}
