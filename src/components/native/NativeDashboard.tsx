'use client';

import React from 'react';
import { useApp } from '@/app/provider';
import { 
  Search, 
  Bookmark, 
  Brain, 
  Scale, 
  ArrowRight,
  TrendingUp,
  Target,
  FlaskConical,
  Users,
  Briefcase,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';

const NativeDashboard: React.FC = () => {
  const { user, userProfile } = useApp();

  const tools = [
    { title: "Begrebsguide", icon: Brain, href: "/concept-explainer", color: "amber", desc: "Slå teoretiske begreber op" },
    { title: "Lovportal", icon: Scale, href: "/lov-portal", color: "indigo", desc: "Find paragraffer & domme" },
    { title: "Arkiv", icon: Bookmark, href: "/mine-gemte-begreber", color: "emerald", desc: "Dine gemte guldkorn" },
  ];

  const Tile = ({ tool }: { tool: any }) => (
    <Link 
      href={tool.href}
      onClick={() => triggerHapticFeedback(ImpactStyle.Medium)}
      className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm active:scale-95 transition-all flex flex-col justify-between h-44"
    >
      <div className={`w-12 h-12 rounded-2xl bg-${tool.color}-50 text-${tool.color}-600 flex items-center justify-center`}>
        <tool.icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{tool.title}</h3>
        <p className="text-[12px] text-slate-400 font-medium mt-1 leading-tight">{tool.desc}</p>
      </div>
    </Link>
  );

  return (
    <div className="px-5 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Area */}
      <div className="pt-2 pb-6">
        <h1 className="text-3xl font-black text-slate-950 tracking-tighter">
          Godmorgen, <span className="text-indigo-600">{user?.displayName?.split(' ')[0]}</span>
        </h1>
        <p className="text-[15px] font-medium text-slate-500 mt-2">Dagens faglige sparring er klar til dig.</p>
      </div>

      {/* Recommended Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Anbefalet til dig</h2>
          <Target className="w-4 h-4 text-slate-300" />
        </div>
        <Link 
          href="/case-analyser"
          onClick={() => triggerHapticFeedback(ImpactStyle.Heavy)}
          className="block bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden group active:scale-98 transition-all"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-amber-950 rounded-xl text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5" /> Populær nu
            </div>
            <h3 className="text-2xl font-black tracking-tight leading-tight">Gennemfør en sagsanalyse</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">Styrk dit faglige skøn i en simulering med din AI-kollega.</p>
            <div className="pt-2 flex items-center font-black text-amber-400 text-xs uppercase tracking-widest gap-2">
              Start nu <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* Tool Grid */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Værktøjer</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {tools.map((tool, i) => (
            <Tile key={i} tool={tool} />
          ))}
        </div>
      </section>

      {/* Feature Section */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Gå på opdagelse</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
           <Link 
            href="/institutions"
            className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm active:bg-slate-50 transition-all"
           >
              <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 tracking-tight">Institutionssøgning</h4>
                <p className="text-xs text-slate-400 font-medium">Find din næste praktikplads</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300" />
           </Link>
           
           <Link 
            href="/praktik-rating"
            className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm active:bg-slate-50 transition-all"
           >
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <Star className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 tracking-tight">Praktik-Rating</h4>
                <p className="text-xs text-slate-400 font-medium">Se kollegers erfaringer</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300" />
           </Link>
        </div>
      </section>
    </div>
  );
};

export default NativeDashboard;
