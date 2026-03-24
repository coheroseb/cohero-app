'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookCopy, 
  ChevronDown, 
  Trash2, 
  Loader2, 
  Target, 
  List, 
  BookOpen, 
  Layers, 
  Calendar, 
  Sparkles,
  FileText,
  Search,
  ExternalLink,
  Info,
  ChevronRight,
  Plus,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import type { ExamBlueprint } from '@/ai/flows/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedBlueprint extends ExamBlueprint {
  id: string;
  createdAt: { toDate: () => Date };
  topic: string;
  problemStatement: string; // This is the original draft
}

const PremiumGlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] ${className}`}>
        {children}
    </div>
);

const BlueprintDetailView = ({ blueprint }: { blueprint: SavedBlueprint }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
        >
            <div className="p-8 space-y-8 bg-slate-50/30 rounded-b-[2.5rem] border-t border-amber-950/5">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Oprindeligt Oplæg */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-amber-900/60">Oprindeligt Oplæg</h4>
                        </div>
                        <PremiumGlassCard className="p-6 border-amber-950/5 bg-white shadow-sm">
                            <p className="text-sm text-amber-950 italic leading-relaxed">"{blueprint.problemStatement || 'Ikke angivet'}"</p>
                            {blueprint.problemStatementTip && (
                                <div className="mt-6 pt-4 border-t border-dashed border-amber-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Arkitektens Råd</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed italic">{blueprint.problemStatementTip}</p>
                                </div>
                            )}
                        </PremiumGlassCard>
                    </div>

                    {/* Den Røde Tråd */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                                <Layers className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900/60">Den Røde Tråd</h4>
                        </div>
                        <PremiumGlassCard className="p-6 border-indigo-950/5 bg-white shadow-sm">
                            <p className="text-sm text-slate-700 leading-relaxed">{blueprint.redThreadAdvice}</p>
                        </PremiumGlassCard>
                    </div>
                </div>

                {/* Strukturforslag */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                            <List className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-900/60">Anbefalet Struktur</h4>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {blueprint.sections?.map((section, i) => (
                            <PremiumGlassCard key={i} className="p-5 border-emerald-950/5 bg-white/80 hover:bg-white transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-500">{section.weight}</span>
                                        {section.wordCountEstimate && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{section.wordCountEstimate}</span>}
                                    </div>
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-700">
                                        {i + 1}
                                    </div>
                                </div>
                                <h5 className="font-bold text-sm text-slate-900 mb-2">{section.title}</h5>
                                <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-3 mb-3">{section.focus}</p>
                                <div className="flex flex-wrap gap-1">
                                    {section.theoryLink && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase tracking-widest">{section.theoryLink}</span>}
                                    {section.legalFocus && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest">⚖️ {section.legalFocus}</span>}
                                </div>
                            </PremiumGlassCard>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-12 gap-8">
                    {/* Litteraturforslag */}
                    <div className="md:col-span-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-rose-900/60">Litteratur & Teori</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {blueprint.suggestedTheories?.map((theory, i) => (
                                <div key={i} className="relative group">
                                    <PremiumGlassCard className="p-6 h-full flex flex-col bg-white border-transparent hover:border-rose-100 transition-all duration-300">
                                        <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                            {theory.name}
                                        </h5>
                                        <p className="text-xs text-slate-500 mb-4 flex-grow italic line-clamp-3">"{theory.why}"</p>
                                        {theory.bookReference && (
                                            <div className="mt-auto pt-3 border-t border-slate-50 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Search className="w-3 h-3 text-rose-400" />
                                                <span className="text-[10px] font-bold text-slate-400 truncate">{theory.bookReference}</span>
                                            </div>
                                        )}
                                    </PremiumGlassCard>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Checklist */}
                    {blueprint.checklist && (
                        <div className="md:col-span-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-950 flex items-center justify-center text-amber-400">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-amber-950/60">Tjekliste</h4>
                            </div>
                            <div className="bg-amber-950 rounded-[2rem] p-6 text-white shadow-xl space-y-4">
                                {blueprint.checklist.map((item, k) => (
                                    <div key={k} className="flex gap-3 items-start">
                                        <div className="mt-1 w-4 h-4 rounded-full border border-amber-600 flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-2.5 h-2.5 text-amber-600" />
                                        </div>
                                        <p className="text-[10px] font-medium text-amber-50 leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const MineByggeplanerPageContent = () => {
    const { user, userProfile } = useApp();
    const firestore = useFirestore();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const blueprintsQuery = useMemoFirebase(
        () => (user && firestore ? query(collection(firestore, 'users', user.uid, 'blueprints'), orderBy('createdAt', 'desc')) : null),
        [user, firestore]
    );

    const { data: blueprints, isLoading } = useCollection<SavedBlueprint>(blueprintsQuery);
    
    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || !firestore || !window.confirm('Er du sikker på, du vil slette denne byggeplan?')) return;
        
        const docRef = doc(firestore, 'users', user.uid, 'blueprints', id);
        try {
            await deleteDoc(docRef);
            if (expandedId === id) setExpandedId(null);
        } catch (error) {
            console.error("Error deleting blueprint: ", error);
        }
    };
    
    return (
        <div className="bg-[#FAF9F6] min-h-screen selection:bg-amber-100 overflow-x-hidden relative">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-amber-100/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-indigo-100/20 rounded-full blur-[100px]" />
            </div>

            <header className="relative z-10 px-6 py-12 md:py-20 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-6">
                        <Link 
                            href="/portal" 
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full border border-amber-950/5 text-amber-900 text-xs font-black uppercase tracking-widest hover:bg-amber-50 hover:scale-105 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> Til Portal
                        </Link>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-amber-950 rounded-[1.5rem] shadow-2xl text-amber-400">
                                    <Layers className="w-8 h-8" />
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-amber-950 serif tracking-tight">
                                    Mine <span className="text-amber-600/30">Byggeplaner</span>
                                </h1>
                            </div>
                            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-xl italic">
                                "Et godt fundament er halvvejen til en topkarakter."
                            </p>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Planer</p>
                            <p className="text-4xl font-black text-amber-950 serif">{blueprints?.length || 0}</p>
                        </div>
                        <div className="w-px h-12 bg-amber-950/5" />
                        <Link href="/exam-architect">
                            <Button className="h-16 px-8 rounded-[2rem] bg-amber-950 text-white font-black uppercase text-xs tracking-[0.2em] gap-3 shadow-2xl hover:scale-105 transition-all">
                                <Plus className="w-5 h-5 text-amber-400" /> Ny Byggeplan
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-6 pb-40">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-amber-950/5 border-t-amber-950 rounded-full animate-spin" />
                            <Layers className="absolute inset-0 m-auto w-8 h-8 text-amber-950 animate-pulse" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Henter dit arkiv...</p>
                    </div>
                ) : !blueprints || blueprints.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-32"
                    >
                        <PremiumGlassCard className="p-20 text-center space-y-8 border-dashed border-amber-950/10">
                            <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                                <BookCopy className="w-10 h-10 text-amber-300" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-amber-950 serif">Tomt Arkiv</h2>
                                <p className="text-slate-500 max-w-xs mx-auto text-lg italic">Du har endnu ikke tegnet nogen byggeplaner for dine opgaver.</p>
                            </div>
                            <Link href="/exam-architect" className="inline-block">
                                <Button size="lg" className="h-16 px-10 rounded-[2rem] bg-amber-950 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-xl hover:scale-105 transition-all">
                                    Besøg Eksamens-Arkitekten <ChevronRight className="w-5 h-5" />
                                </Button>
                            </Link>
                        </PremiumGlassCard>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence>
                            {blueprints.map((bp, i) => (
                                <motion.div 
                                    key={bp.id}
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`group relative ${expandedId === bp.id ? 'z-20' : 'z-10'}`}
                                >
                                    <div 
                                        onClick={() => setExpandedId(prev => prev === bp.id ? null : bp.id)}
                                        className={`
                                            relative cursor-pointer transition-all duration-500
                                            ${expandedId === bp.id 
                                                ? 'bg-white rounded-t-[2.5rem] shadow-2xl ring-1 ring-amber-950/5' 
                                                : 'bg-white/80 hover:bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1'
                                            }
                                        `}
                                    >
                                        <div className="p-8 flex items-center justify-between gap-8">
                                            <div className="flex items-center gap-6">
                                                <div className={`
                                                    w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500
                                                    ${expandedId === bp.id ? 'bg-amber-950 text-amber-400 scale-110' : 'bg-slate-50 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500'}
                                                `}>
                                                    <Target className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">{bp.topic}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                            <Calendar className="w-3 h-3" />
                                                            {bp.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-amber-950 serif leading-tight">{bp.title}</h3>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={(e) => handleDelete(bp.id, e)}
                                                    className="w-12 h-12 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-5 h-5"/>
                                                </Button>
                                                <div className={`
                                                    w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center transition-all duration-500
                                                    ${expandedId === bp.id ? 'bg-amber-50 text-amber-950 rotate-180' : 'bg-white text-slate-300 group-hover:bg-amber-50 group-hover:text-amber-950'}
                                                `}>
                                                    <ChevronDown className="w-6 h-6" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {expandedId === bp.id && (
                                            <div className="relative shadow-2xl rounded-b-[2.5rem]">
                                                <BlueprintDetailView blueprint={bp} />
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Premium Footer */}
            <footer className="relative z-10 border-t border-amber-950/5 bg-white/40 backdrop-blur-3xl px-10 py-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-amber-600" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-950">Draft Blueprint Archive</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        "Your structured path to academic excellence"
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default function MineByggeplaner() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <MineByggeplanerPageContent />;
}
