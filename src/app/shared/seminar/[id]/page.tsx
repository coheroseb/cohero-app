'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore } from '@/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Presentation, 
  Tags, 
  Scale, 
  Wrench, 
  BrainCircuit, 
  CheckCircle,
  Calendar,
  X,
  BookOpen,
  ArrowRight,
  ArrowRight as ArrowRightIcon,
  Sparkles,
  Lock,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Simple types shared with the main page
interface SavedSeminar extends DocumentData {
  id: string;
  overallTitle: string;
  isShared?: boolean;
  slides: any[];
  createdAt: any;
}

// ---------------------------------------------------------------------------
// Shared Components (Simplified copies from mine-seminarer)
// ---------------------------------------------------------------------------

const SlideCard: React.FC<{
  slide: any;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}> = ({ slide, isOpen, onToggle, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group bg-white rounded-3xl border transition-all duration-500 overflow-hidden ${isOpen ? 'border-indigo-200 shadow-2xl shadow-indigo-500/5' : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'}`}
    >
      <button onClick={onToggle} className="w-full h-20 flex items-center gap-6 px-6 text-left transition-colors relative">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all duration-500 ${isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
          {slide.slideNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 truncate leading-tight italic serif">{slide.slideTitle}</p>
          {!isOpen && <p className="text-[11px] text-slate-400 font-medium truncate mt-1 italic">{slide.summary}</p>}
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isOpen ? 'rotate-180 bg-slate-50 text-slate-400' : 'text-slate-300'}`}>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><BrainCircuit className="w-5 h-5" /></motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 pt-2 space-y-8">
              <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Opsummering</p>
                <p className="text-[15px] text-slate-600 font-medium leading-[1.6]">{slide.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Concepts */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1"><Tags className="w-3.5 h-3.5 text-indigo-400" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nøglebegreber</span></div>
                  <div className="flex flex-wrap gap-2">
                    {(slide.keyConcepts || []).map((c: any, i: number) => (
                      <Link key={i} href={`/concept-explainer?term=${encodeURIComponent(c.term)}`} className="px-4 py-2 bg-white border border-slate-100 hover:border-indigo-300 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm">
                        {c.term}
                      </Link>
                    ))}
                  </div>
                </div>
                {/* Law */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1"><Scale className="w-3.5 h-3.5 text-rose-400" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Juridisk Grundlag</span></div>
                  <div className="space-y-2">
                    {(slide.legalFrameworks || []).map((f: any, i: number) => (
                      <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl">
                        <p className="text-[13px] font-black text-slate-900 leading-tight mb-1">{f.law}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{f.paragraphs.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Main Shared Seminar Page
// ---------------------------------------------------------------------------

export default function SharedSeminarPage({ params }: { params: { id: string } }) {
  const { user, userProfile, isUserLoading } = useApp();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [seminar, setSeminar] = useState<SavedSeminar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSlides, setOpenSlides] = useState<Set<number>>(new Set([0]));

  const ownerId = searchParams?.get('o');

  const isPremium = useMemo(() => {
    if (!userProfile) return false;
    if (userProfile.isQualified) return true;
    return ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership || '');
  }, [userProfile]);

  useEffect(() => {
    const fetchSeminar = async () => {
      if (!params.id || !ownerId || !firestore) {
         setLoading(false);
         setError('Ugyldigt delingslink.');
         return;
      }

      try {
        const ref = doc(firestore, 'users', ownerId, 'seminars', params.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as SavedSeminar;
          const hasAccess = data.isShared || (data.sharedWith || []).includes(user?.uid);
          
          if (!hasAccess) {
            setError('Du har ikke adgang til dette seminar eller delingen er deaktiveret.');
          } else {
            setSeminar({ ...data, id: snap.id });
          }
        } else {
          setError('Seminaret blev ikke fundet.');
        }
      } catch (err) {
        console.error(err);
        setError('Kunne ikke hente seminaret.');
      } finally {
        setLoading(false);
      }
    };

    if (!isUserLoading) {
      if (!user) {
        setLoading(false);
        return;
      }
      fetchSeminar();
    }
  }, [params.id, ownerId, firestore, isUserLoading, user]);

  const toggleSlide = (index: number) => setOpenSlides(prev => { 
    const next = new Set(prev); 
    if (next.has(index)) next.delete(index); 
    else next.add(index); 
    return next; 
  });

  if (isUserLoading || loading) return <AuthLoadingScreen />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white shadow-2xl">
              <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">Log ind for at se delte seminarer</h1>
          <p className="text-slate-500 font-medium">Du skal være medlem af Cohéro for at tilgå delte slidesamlinger.</p>
          <Link href="/auth?mode=login" className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Log ind nu</Link>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-lg relative z-10 bg-white/80 backdrop-blur-2xl p-12 md:p-16 rounded-[4rem] border border-white shadow-2xl space-y-10">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner ring-4 ring-white">
              <Crown className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">Kollega+ Adgang Påkrævet</h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">Deling af slidesamlinger er en eksklusiv funktion for Kollega+ medlemmer.</p>
          </div>
          <div className="pt-4 space-y-4">
            <Link href="/upgrade" className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl shadow-slate-900/20">
              Opgrader nu <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lås op for deling, relationskort og meget mere</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !seminar) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <X className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{error || 'Noget gik galt.'}</h1>
          <p className="text-slate-400 font-medium">Sørg for at linket er korrekt, eller kontakt ejeren af seminaret.</p>
          <Link href="/portal" className="inline-block px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px]">Tilbage til portalen</Link>
        </div>
      </div>
    );
  }

  const totals = { 
    concepts: seminar.slides?.reduce((a, s: any) => a + (s.keyConcepts?.length || 0), 0) || 0,
    law: seminar.slides?.reduce((a, s: any) => a + (s.legalFrameworks?.length || 0), 0) || 0,
    tools: seminar.slides?.reduce((a, s: any) => a + (s.practicalTools?.length || 0), 0) || 0
  };

  return (
    <main className="min-h-screen bg-[#FDFCF8] flex flex-col pt-0">
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20 lg:py-24">
        
        {/* Header */}
        <header className="mb-16 space-y-8">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-6 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-200/40">
                    <Presentation className="w-3 h-3" /> Delt Seminar
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight serif italic">{seminar.overallTitle}</h1>
                <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-bold">{seminar.createdAt?.toDate().toLocaleDateString('da-DK')}</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden md:block"></div>
                    <div className="flex items-center gap-2 text-slate-900">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                            <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">Delt af kollega</span>
                    </div>
                </div>
              </div>
           </div>
        </header>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
                { label: 'Indhold', val: seminar.slides?.length || 0, icon: <Presentation className="w-4 h-4"/>, color: 'bg-slate-950 text-white' },
                { label: 'Begreber', val: totals.concepts, icon: <Tags className="w-4 h-4"/>, color: 'bg-white border border-slate-100 text-indigo-600' },
                { label: 'Love', val: totals.law, icon: <Scale className="w-4 h-4"/>, color: 'bg-white border border-slate-100 text-rose-600' },
                { label: 'Metoder', val: totals.tools, icon: <Wrench className="w-4 h-4"/>, color: 'bg-white border border-slate-100 text-emerald-600' }
            ].map(s => (
                <div key={s.label} className={`${s.color} rounded-[2.5rem] p-6 text-center shadow-sm`}>
                    <div className="flex items-center justify-center gap-2 mb-2 opacity-60">
                        {s.icon}
                        <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                    </div>
                    <p className="text-4xl font-black serif tracking-tight">{s.val}</p>
                </div>
            ))}
        </div>

        {/* Seminar Feed */}
        <section className="space-y-6">
            <div className="flex items-center justify-between px-2 mb-8 border-b border-slate-100 pb-4">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Gennemgang af materialet</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[11px] font-bold text-slate-600">Verificeret af AI</span>
                </div>
            </div>
            
            <div className="space-y-4">
                {(seminar.slides || []).map((s: any, i: number) => (
                    <SlideCard 
                        key={i} 
                        slide={s} 
                        isOpen={openSlides.has(i)} 
                        onToggle={() => toggleSlide(i)} 
                        index={i} 
                    />
                ))}
            </div>
        </section>

        {/* Action / Footer */}
        <footer className="mt-20 pt-16 border-t border-slate-100 text-center space-y-8">
            <div className="max-w-md mx-auto p-10 bg-indigo-50/50 rounded-[3rem] border border-indigo-100/50">
                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight leading-tight italic serif">Kunne du lide dette seminar?</h3>
                <p className="text-sm text-indigo-900/60 font-medium leading-relaxed mb-8">Opgrader til Kollega+ for selv at kunne bygge seminar-planer fra dine egne filer og dele dem med dine kolleger.</p>
                <Link href="/upgrade" className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all">
                    Se Kollega+ Fordele <ArrowRightIcon className="w-4 h-4" />
                </Link>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200">Cohéro Vidensdeling &bull; Professional Edition</p>
        </footer>
      </div>
    </main>
  );
}
