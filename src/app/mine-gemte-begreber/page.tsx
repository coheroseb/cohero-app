'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Bookmark, 
  Trash2, 
  Loader2, 
  Brain,
  History,
  ArrowUpRight,
  Info,
  Scale,
  Target,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Explanation {
    definition: string;
    etymology?: string;
    relevance: string;
}

interface SavedConcept {
  id: string;
  conceptName: string;
  explanation: Explanation;
  savedAt: { toDate: () => Date } | Timestamp;
}

export default function MineGemteBegreberPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const savedConceptsQuery = useMemoFirebase(() => (
        user && firestore ? query(collection(firestore, 'users', user.uid, 'savedConcepts'), orderBy('savedAt', 'desc')) : null
    ), [user, firestore]);
    const { data: concepts, isLoading } = useCollection<SavedConcept>(savedConceptsQuery);
    
    const handleUnsave = useCallback(async (e: React.MouseEvent, id: string, name: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !firestore) return;
        try {
            await deleteDoc(doc(firestore, 'users', user.uid, 'savedConcepts', id));
            toast({ title: "Begreb fjernet", description: `"${name}" er fjernet fra dine gemte begreber.` });
        } catch (error) {
            console.error("Error unsaving concept:", error);
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke fjerne begrebet." });
        }
    }, [user, firestore, toast]);

    if (isUserLoading || isLoading) {
        return <AuthLoadingScreen />;
    }

    return (
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-amber-100">
            {/* HERO HEADER */}
            <header className="bg-white border-b border-amber-100 pt-24 pb-20 px-6 sm:px-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60" />
                
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex items-center gap-8">
                        <Link href="/portal" className="w-16 h-16 bg-white border border-amber-100 rounded-3xl flex items-center justify-center hover:bg-amber-50 hover:border-amber-950/20 transition-all group shadow-sm active:scale-95 shrink-0">
                            <ArrowLeft className="w-6 h-6 text-amber-950 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-amber-950 rounded-lg text-amber-400">
                                    <Brain className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-950/40">Personligt Vidensarkiv</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-amber-950 serif tracking-tighter leading-none">Mine Gemte Begreber</h1>
                            <p className="text-lg text-slate-500 font-medium mt-4 max-w-lg leading-relaxed">
                                Her finder du din samling af faglige begreber, juridiske koblinger og pædagogiske teorier.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gemte Begreber</p>
                            <p className="text-3xl font-black text-amber-950 serif">{concepts?.length || 0}</p>
                        </div>
                        <div className="w-[1px] h-12 bg-amber-100 mx-4 hidden sm:block" />
                        <Link href="/concept-explainer">
                            <Button size="lg" className="h-16 px-10 rounded-[28px] bg-amber-950 text-amber-400 font-black uppercase tracking-[0.2em] text-[12px] hover:bg-amber-900 shadow-2xl active:scale-95">
                                <Sparkles className="w-4 h-4 mr-3" /> Find flere
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
                <AnimatePresence mode="wait">
                    {!concepts || concepts.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-amber-100/50 shadow-inner"
                        >
                            <div className="w-24 h-24 bg-amber-50 text-amber-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                                <Bookmark className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-amber-950 serif">Dit arkiv er tomt</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto mt-4 leading-relaxed">
                                Du har ikke gemt nogen begreber endnu. Brug begrebsguiden til at udforske teorier og socialfaglig viden.
                            </p>
                            <div className="mt-10">
                                <Link href="/concept-explainer">
                                    <Button variant="outline" className="rounded-2xl border-amber-200 text-amber-950 font-bold hover:bg-amber-50">
                                        Start din søgning nu
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {concepts.map((concept, index) => (
                                <motion.div 
                                    key={concept.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link 
                                        href={`/concept-explainer?term=${encodeURIComponent(concept.conceptName)}`}
                                        className="group bg-white p-10 rounded-[3.5rem] border border-amber-100 shadow-sm hover:shadow-2xl hover:border-amber-950/20 transition-all flex flex-col h-full relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
                                        
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-950/40 group-hover:text-amber-950 transition-colors">
                                                        <History className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        Gemt {concept.savedAt ? (concept.savedAt instanceof Timestamp ? concept.savedAt.toDate() : (concept.savedAt as any).toDate()).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : 'Nyligt'}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={(e) => handleUnsave(e, concept.id, concept.conceptName)}
                                                    className="p-3 bg-white text-slate-300 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all border border-slate-100 active:scale-90"
                                                    title="Fjern fra gemte"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <h3 className="text-2xl font-black text-amber-950 serif leading-snug group-hover:text-amber-600 transition-colors mb-6 line-clamp-2">
                                                {concept.conceptName}
                                            </h3>
                                            
                                            <div className="text-sm text-slate-500 leading-[1.8] mb-10 line-clamp-4 flex-grow font-medium">
                                                <div className="prose-sm" dangerouslySetInnerHTML={{ __html: concept.explanation.definition }} />
                                            </div>

                                            <div className="pt-8 border-t border-amber-50 flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-950/40">
                                                        <Info className="w-3.5 h-3.5" />
                                                        Begreb
                                                    </div>
                                                    {concept.explanation.relevance && (
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            <Target className="w-3.5 h-3.5" />
                                                            Praksis
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-950 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                                                    Gense Forklaring <ArrowUpRight className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
