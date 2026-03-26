'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { 
    ChevronRight, 
    Star, 
    MessageCircle, 
    TrendingUp, 
    Award, 
    ArrowLeft,
    Loader2,
    Search,
    MapPin,
    Zap,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTopRatedInstitutionsAction } from '@/app/praktik-rating/actions';

interface TopRatedInst {
    id: string;
    name: string;
    average: number;
    count: number;
}

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);

function InstitutionsContent() {
    const [institutions, setInstitutions] = useState<TopRatedInst[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        getTopRatedInstitutionsAction().then(setInstitutions).finally(() => setIsLoading(false));
    }, []);

    const filtered = institutions.filter(i => 
        i.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-rose-500/10 selection:text-rose-600">
            {/* NAVIGATION / HEADER */}
            <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 flex flex-col items-center">
                <div className="max-w-6xl w-full h-20 px-6 flex items-center justify-between">
                    <Link href="/praktik-rating" className="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Bedøm praktik</span>
                    </Link>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Bedst Ratede</span>
                    </div>

                    <div className="w-20 sm:w-32 flex justify-end">
                        <Zap className="w-5 h-5 text-amber-500 fill-current" />
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-40 px-6 max-w-5xl mx-auto w-full relative">
                
                {/* Decorative Elements */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-rose-50/50 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-50/50 blur-[120px] rounded-full -z-10" />

                <div className="text-center space-y-4 mb-16">
                    <Reveal>
                        <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">Elite Praktiksteder</p>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-950 tracking-[-0.03em] serif leading-tight">
                            Hvor er det <br /> <span className="text-rose-500 italic">bedst at lære?</span>
                        </h1>
                        <p className="max-w-xl mx-auto text-lg text-slate-500 font-medium leading-relaxed mt-6">
                            Se hvilke institutioner studerende har bedømt som de stærkeste inden for vejledning og arbejdsmiljø.
                        </p>
                    </Reveal>
                </div>

                {/* SEARCH BAR */}
                <Reveal delay={0.2}>
                    <div className="max-w-2xl mx-auto relative mb-20 group">
                        <div className="absolute inset-y-0 left-8 flex items-center text-slate-300 pointer-events-none transition-colors group-focus-within:text-rose-500">
                            <Search className="w-5 h-5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Søg i de bedst ratede..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-full py-6 pl-16 pr-8 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-300 transition-all shadow-xl shadow-slate-950/5"
                        />
                    </div>
                </Reveal>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Henter data...</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence>
                            {filtered.map((inst, idx) => (
                                <motion.div
                                    key={inst.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative"
                                >
                                    <Link href={`/praktik-rating?id=${inst.id}`}>
                                        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-rose-600/10 hover:border-rose-100 group-hover:-translate-y-1 group-active:scale-[0.98] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
                                            
                                            {/* Top Corner Badge */}
                                            {idx < 3 && (
                                                <div className="absolute top-0 right-10 bg-amber-400 text-white px-4 py-2 rounded-b-2xl shadow-lg flex items-center gap-2">
                                                    <Award className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest italic">Top {idx + 1}</span>
                                                </div>
                                            )}

                                            <div className="flex items-start md:items-center gap-6">
                                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] flex flex-col items-center justify-center transition-all ${idx === 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    <span className="text-2xl font-black">{idx + 1}</span>
                                                    <span className="text-[8px] font-black uppercase tracking-tighter -mt-1 opacity-50">Rang</span>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-xl font-bold text-slate-950 group-hover:text-rose-600 transition-colors uppercase tracking-tight">{inst.name}</h3>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 items-center">
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <span className="text-[10px] font-black">{inst.average} / 5</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <Users className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{inst.count} bedømmelser</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-6 md:pt-0 border-t border-slate-50 md:border-none">
                                                <button className="flex-1 md:flex-none px-6 py-3 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-950/20 group-hover:bg-rose-600 transition-all">
                                                    Giv en vurdering
                                                </button>
                                                <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-all">
                                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {filtered.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                <Search className="w-12 h-12 mx-auto text-slate-100 mb-4" />
                                <p className="text-slate-400 font-medium">Ingen institutioner fundet for denne søgning.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* FOOTER BADGE */}
            <footer className="fixed bottom-0 left-0 right-0 p-8 z-[90] pointer-events-none flex justify-center">
                <div className="px-6 py-2 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center gap-3">
                    <div className="flex -space-x-1 items-end h-3">
                        <div className="w-0.5 h-full bg-amber-400 rounded-full" />
                        <div className="w-0.5 h-4 bg-amber-500 rounded-full" />
                        <div className="w-0.5 h-full bg-amber-600 rounded-full" />
                    </div>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Top Praktiksteder</span>
                </div>
            </footer>
        </div>
    );
}

export default function InstitutionsBoardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-rose-500" /></div>}>
            <InstitutionsContent />
        </Suspense>
    );
}
