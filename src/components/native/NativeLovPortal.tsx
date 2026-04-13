'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  Gavel, 
  Zap,
  ArrowRight,
  Loader2,
  Lock,
  Scale,
  Brain,
  MessageSquare,
  AlertTriangle,
  Users,
  Eye,
  Stethoscope,
  Coins,
  Briefcase,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Layout
} from 'lucide-react';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';

const SITUATIONS = [
  {
    id: 'barn-mistrives',
    title: 'Barn mistrives',
    description: 'Underretningspligt og akutte indsatser.',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'bg-rose-50 text-rose-600',
    borderColor: 'border-rose-100'
  },
  {
    id: 'sagsbehandling',
    title: 'Sagsbehandling',
    description: 'Vejledning, partshøring og afgørelser.',
    icon: <Scale className="w-5 h-5" />,
    color: 'bg-blue-50 text-blue-600',
    borderColor: 'border-blue-100'
  },
  {
    id: 'okonomi-stotte',
    title: 'Økonomisk støtte',
    description: 'Ydelser ved ledighed eller merudgifter.',
    icon: <Coins className="w-5 h-5" />,
    color: 'bg-amber-50 text-amber-600',
    borderColor: 'border-amber-100'
  },
  {
    id: 'voksen-stotte',
    title: 'Voksen-støtte',
    description: 'Socialpædagogisk bistand og ledsagelse.',
    icon: <Stethoscope className="w-5 h-5" />,
    color: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-emerald-100'
  }
];

interface NativeLovPortalProps {
  laws: any[];
  isLoading: boolean;
  onLawClick: (lawId: string) => void;
  isPremium: boolean;
  onAnalyzeReform: (query: string) => void;
  analysisState: {
    isAnalyzing: boolean;
    step: string;
    progress: number;
    result: any;
  };
}

const NativeLovPortal: React.FC<NativeLovPortalProps> = ({ 
  laws, 
  isLoading, 
  onLawClick,
  isPremium,
  onAnalyzeReform,
  analysisState
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'reform' | 'guide'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [reformQuery, setReformQuery] = useState('');

  const filteredLaws = useMemo(() => {
    if (!searchQuery.trim()) return laws;
    const q = searchQuery.toLowerCase();
    return laws.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.abbreviation.toLowerCase().includes(q)
    );
  }, [laws, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback(ImpactStyle.Medium);
  };

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPremium || !reformQuery.trim()) return;
    triggerHapticFeedback(ImpactStyle.Heavy);
    onAnalyzeReform(reformQuery);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Tabs / Segmented Control */}
      <div className="px-5 pt-1 pb-4 sticky top-[calc(44px+env(safe-area-inset-top))] bg-slate-50/80 backdrop-blur-xl z-20">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl">
          {[
            { id: 'browse', label: 'Lovbøger', icon: BookOpen },
            { id: 'reform', label: 'Reform', icon: Gavel },
            { id: 'guide', label: 'Guide', icon: Layout }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => { triggerHapticFeedback(ImpactStyle.Light); setActiveTab(t.id as any); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'browse' && (
          <motion.div 
            key="browse" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="px-5 pt-4 space-y-6"
          >
            {/* Search Input */}
            <div className="relative group">
              <input 
                type="text"
                placeholder="Find lovtekst (f.eks. '§ 81 Barnets Lov')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-3xl text-[16px] font-bold shadow-xl focus:outline-none focus:border-indigo-500 transition-all font-sans"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            {/* Law List */}
            <div className="grid gap-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 bg-white/50 animate-pulse rounded-3xl border border-slate-100" />
                ))
              ) : filteredLaws.length > 0 ? (
                filteredLaws.map((law, i) => (
                  <button
                    key={law.id}
                    onClick={() => { triggerHapticFeedback(ImpactStyle.Medium); onLawClick(law.id); }}
                    className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm active:scale-[0.98] transition-all text-left group"
                  >
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 group-active:bg-indigo-600 group-active:text-white transition-colors">
                      {law.abbreviation || 'LAW'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black text-slate-900 leading-tight truncate">{law.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{law.id === 'vum-plus' ? 'Støtte & Indsatser' : 'Social Lovgivning'}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </button>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <Search className="w-12 h-12 text-slate-200 mx-auto" />
                  <p className="text-slate-400 font-bold">Ingen love fundet...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'reform' && (
          <motion.div 
            key="reform" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="px-5 pt-4 space-y-8"
          >
            <div className="bg-indigo-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] rotate-12"><Gavel className="w-32 h-32" /></div>
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Reform-Oraklet
                </div>
                <h2 className="text-3xl font-black serif tracking-tight leading-none italic text-amber-400">Forstå de nye reformer</h2>
                <p className="text-indigo-200/60 text-sm font-medium leading-relaxed italic">Sammenlign lovforslag med gældende lov og få forklaret ændringernes praktiske betydning.</p>
              </div>
            </div>

            <form onSubmit={handleAnalyzeSubmit} className="relative group">
              <input 
                type="text"
                disabled={!isPremium}
                placeholder={isPremium ? "Hvilken reform vil du undersøge?" : "Opgrader for adgang..."}
                value={reformQuery}
                onChange={(e) => setReformQuery(e.target.value)}
                className={`w-full h-16 pl-6 pr-14 bg-white border border-slate-200 rounded-3xl text-[16px] font-bold shadow-xl focus:outline-none focus:border-indigo-500 transition-all ${!isPremium ? 'opacity-50' : ''}`}
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50"
                disabled={!isPremium || analysisState.isAnalyzing || !reformQuery.trim()}
              >
                {analysisState.isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              </button>
            </form>

            {!isPremium && (
              <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 text-center space-y-6">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto"><Lock className="w-6 h-6" /></div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-amber-950">Eksklusiv adgang</h3>
                   <p className="text-amber-800/60 text-[13px] font-medium leading-relaxed">Opgrader til Kollega+ for at bruge Reform-Oraklet og få AI-forklaringer på lovændringer.</p>
                </div>
                <button className="w-full py-4 bg-amber-950 text-amber-400 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-amber-950/20 active:scale-95 transition-transform">Bliv Kollega+</button>
              </div>
            )}

            {analysisState.isAnalyzing && (
              <div className="py-10 space-y-6 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
                  <Loader2 className="w-16 h-16 animate-spin text-indigo-600 relative z-10" />
                </div>
                <div className="space-y-4 max-w-[280px] mx-auto">
                   <h3 className="text-xl font-black text-slate-900 italic">
                     {analysisState.step === 'identifying' ? 'Finder love...' : 'Analyserer paragraffer...'}
                   </h3>
                   <div className="space-y-2">
                     <Progress value={analysisState.progress} className="h-2 bg-slate-100" />
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{analysisState.progress}% Færdig</p>
                   </div>
                </div>
              </div>
            )}

            {analysisState.result && !analysisState.isAnalyzing && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white space-y-6 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 scale-150"><TrendingUp className="w-24 h-24" /></div>
                   <div className="space-y-2 relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Resultat fundet</p>
                      <h3 className="text-2xl font-black serif italic tracking-tight leading-tight">{analysisState.result.reformTitle}</h3>
                   </div>
                   <div className="h-px bg-white/20" />
                   <p className="text-[15px] font-medium text-indigo-50 leading-relaxed italic">"{analysisState.result.overallImpact.split('\n')[0]}"</p>
                </div>

                <div className="grid gap-4">
                  {analysisState.result.diffs.slice(0, 3).map((diff: any, i: number) => (
                    <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
                       <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl flex items-center justify-center font-black serif text-base shrink-0">{diff.paragraph}</div>
                          <div className="flex-1">
                             <h4 className="text-base font-black text-slate-900 leading-tight">{diff.headline || 'Andring'}</h4>
                             <p className="text-[11px] font-bold text-rose-500 uppercase tracking-widest mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Lovændring</p>
                          </div>
                       </div>
                       <p className="text-[14px] font-medium text-slate-700 leading-relaxed italic bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">"{diff.changeDescription}"</p>
                    </div>
                  ))}
                  {analysisState.result.diffs.length > 3 && (
                    <p className="text-center text-[11px] font-black uppercase text-slate-400 py-4 underline">Se alle {analysisState.result.diffs.length} ændringer på web-versionen</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'guide' && (
          <motion.div 
            key="guide" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="px-5 pt-4 space-y-6"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none px-1">Situations-Guide</h2>
              <p className="text-slate-400 font-medium text-sm px-1">Vælg en situation og få lyn-vejledning i relevante paragraffer.</p>
            </div>

            <div className="grid gap-3">
              {SITUATIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => triggerHapticFeedback(ImpactStyle.Medium)}
                  className={`flex flex-col gap-4 p-6 bg-white border ${s.borderColor} rounded-[2.5rem] shadow-sm active:scale-[0.98] transition-all text-left group`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                      {s.icon}
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-active:translate-x-1 transition-transform" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{s.title}</h3>
                    <p className="text-[13px] font-medium text-slate-500 mt-1 leading-snug">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="py-10 text-center space-y-4 bg-slate-100/50 rounded-[3rem] border border-slate-100">
               <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 max-w-[200px] mx-auto leading-relaxed">Flere scenarier er tilgængelige i den fulde web-version</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NativeLovPortal;
