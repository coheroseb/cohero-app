'use client';

import React from 'react';
import { 
  Megaphone, 
  Users, 
  Sparkles, 
  Target, 
  ArrowRight, 
  Mail, 
  ShieldCheck, 
  Zap, 
  Trophy,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  Quote,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AmbassadorPage() {
  return (
    <div className="bg-[#FDFCF8] min-h-screen selection:bg-amber-100">
      <header className="bg-white border-b border-amber-100 pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-50 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none opacity-50"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-6 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">
                        <Sparkles className="w-3.5 h-3.5" /> Vi søger nye ansigter
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-amber-950 serif tracking-tighter leading-none">
                        Bliv <span className="text-amber-700 italic">Ambassadør</span> <br/>for Cohéro
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed italic max-w-2xl">
                        Brænder du for at styrke den faglige dannelse på din uddannelse? Bliv en del af vores landsdækkende korps af dedikerede studerende.
                    </p>
                </div>
                <div className="hidden lg:block shrink-0">
                    <div className="w-32 h-32 bg-amber-950 rounded-[2.5rem] flex items-center justify-center text-amber-400 shadow-2xl rotate-3">
                        <Megaphone className="w-16 h-16 -rotate-12" />
                    </div>
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-24 space-y-32">
        
        {/* WHY BECOME AN AMBASSADOR */}
        <section className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
                <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-amber-950 serif">Hvorfor blive ambassadør?</h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Som ambassadør er du brobyggeren mellem os og din uddannelsesinstitution. Du er med til at sikre, at Cohéro altid er relevant og værdifuld for dig og dine medstuderende.
                    </p>
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm bg-amber-50 p-3 rounded-xl border border-amber-100 w-fit">
                        <Info className="w-4 h-4" /> Rollen er ulønnet, men de faglige og personlige fordele er mange.
                    </div>
                </div>

                <div className="grid gap-6">
                    {[
                        { title: "Præg udviklingen", desc: "Få direkte indflydelse på, hvilke nye værktøjer og funktioner vi skal bygge.", icon: Target, color: "text-amber-700 bg-amber-50" },
                        { title: "Tæt kontakt med teamet", desc: "Du får en direkte linje til stifterne og bliver en del af maskinrummet.", icon: Users, color: "text-indigo-700 bg-indigo-50" },
                        { title: "Gratis medlemskab", desc: "Som tak for din hjælp får du fuld adgang til Kollega+ uden beregning.", icon: Trophy, color: "text-rose-700 bg-rose-50" },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-6 items-start p-6 bg-white rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${item.color}`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-950 text-lg mb-1">{item.title}</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative">
                <div className="bg-white p-4 rounded-[4rem] shadow-2xl border border-amber-100 relative z-10">
                    <img 
                        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
                        alt="Socialrådgiverstuderende i dialog" 
                        className="rounded-[3.5rem] w-full h-[500px] object-cover"
                        data-ai-hint="students laughing"
                    />
                    <div className="absolute -bottom-10 -left-10 bg-amber-950 text-white p-10 rounded-[3rem] shadow-2xl max-w-xs animate-float-spine">
                        <Quote className="w-8 h-8 text-amber-400 mb-4 opacity-50" />
                        <p className="text-sm italic leading-relaxed">
                            "Det er fedt at kunne give direkte feedback til teamet og se ens idéer blive til virkelighed på platformen."
                        </p>
                        <p className="mt-6 text-xs font-black uppercase tracking-widest text-amber-400">Ambassadør</p>
                    </div>
                </div>
                <div className="absolute top-20 -right-10 w-64 h-64 bg-rose-100/30 rounded-full blur-3xl -z-10 animate-pulse"></div>
            </div>
        </section>

        {/* THE ROLE */}
        <section className="bg-amber-950 p-12 md:p-24 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold serif leading-tight">Hvad indebærer <br/><span className="text-amber-400">rollen</span>?</h2>
                    <p className="text-amber-100/60 text-lg leading-relaxed">
                        Rollen som ambassadør er fleksibel og tilpasses din hverdag som studerende. Du behøver ikke at bruge mange timer, men blot have lyst til at engagere dig.
                    </p>
                    <ul className="space-y-4">
                        {[
                            "Deling af viden om Cohéro med dine medstuderende",
                            "Deltagelse i månedlige online 'kaffemøder' med teamet",
                            "Feedback på nye værktøjer før de lanceres",
                            "Hjælp til at identificere behov på din årgang"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-4 text-sm font-bold">
                                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-sm">
                    <h3 className="text-xl font-bold serif mb-6 flex items-center gap-3 text-amber-400">
                        <Zap className="w-5 h-5 fill-current" />
                        Lyder det som dig?
                    </h3>
                    <p className="text-sm text-amber-50/70 mb-10 leading-relaxed italic">
                        Vi leder efter både den nysgerrige 1. semester studerende og den erfarne på 7. semester. Det vigtigste er din lyst til at gøre en forskel for faget.
                    </p>
                    <a href="mailto:kontakt@cohero.dk?subject=Jeg vil gerne høre mere om ambassadørrollen" className="block">
                        <button className="w-full py-6 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/20">
                            Send os en mail <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </a>
                </div>
            </div>
        </section>

        {/* CAMPUS LIST */}
        <section className="text-center space-y-12">
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-[0.3em]">Vi søger på tværs af landet</h3>
                <h2 className="text-3xl font-bold text-amber-950 serif">Hvor læser du?</h2>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
                {["KP", "VIA", "UCL", "UC SYD", "Absalon", "UCN", "AAU"].map(uni => (
                    <div key={uni} className="px-8 py-4 bg-white border border-amber-100 rounded-2xl text-sm font-black text-amber-900 uppercase tracking-widest shadow-sm hover:border-amber-950 transition-all cursor-default">
                        {uni}
                    </div>
                ))}
            </div>
        </section>

      </main>

      <footer className="max-w-4xl mx-auto px-6 py-20 text-center">
         <div className="p-12 bg-white rounded-[3rem] border border-amber-100 shadow-sm inline-block">
            <h4 className="text-xl font-bold text-amber-950 serif mb-4">Har du spørgsmål?</h4>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Tøv ikke med at række ud. Vi svarer lynhurtigt på alle henvendelser.</p>
            <a href="mailto:kontakt@cohero.dk" className="text-amber-900 font-bold hover:underline underline-offset-4 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> kontakt@cohero.dk
            </a>
         </div>
      </footer>
    </div>
  );
}
