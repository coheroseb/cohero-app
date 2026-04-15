'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
    ChevronLeft, 
    Search, 
    BookOpen, 
    Sparkles, 
    Loader2, 
    Share2, 
    Bookmark, 
    BookmarkCheck,
    Scale,
    Brain,
    HelpCircle,
    Copy,
    Check,
    ChevronDown,
    List,
    Trophy,
    Activity,
    Clock,
    Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLawContentAction, analyzeParagraphAction } from '@/app/actions';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
    collection, 
    doc, 
    getDoc,
    setDoc, 
    deleteDoc, 
    serverTimestamp, 
    increment,
    updateDoc
} from 'firebase/firestore';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import type { LawContentType, ParagraphAnalysisData, LawConfig } from '@/ai/flows/types';

// --- HELPER COMPONENTS (Native-Optimized) ---

function InteractiveParagraphBody({ text, highlight = '' }: { text: string; highlight?: string }) {
    const regex = /(Stk\.\s\d+\.\s?|Nr\.\s\d+\.\s?|\d+\)\s?|[a-z]\)\s?)/g;
    const rawParts = text.split(regex);
    
    if (rawParts.length === 1 && !highlight.trim()) {
        return <div className="leading-relaxed text-[15px] font-medium text-slate-700 whitespace-pre-wrap">{text}</div>;
    }

    const lines: { identifier: string | null; content: string }[] = [];
    let currentLineIdentifier: string | null = null;
    let currentLineContent = "";

    rawParts.forEach((part) => {
        if (regex.test(part)) {
            if (currentLineIdentifier || currentLineContent.trim()) {
                lines.push({ identifier: currentLineIdentifier, content: currentLineContent });
            }
            currentLineIdentifier = part.trim();
            currentLineContent = "";
        } else {
            currentLineContent += part;
        }
    });
    if (currentLineIdentifier || currentLineContent.trim()) {
        lines.push({ identifier: currentLineIdentifier, content: currentLineContent });
    }

    return (
        <div className="space-y-4">
            {lines.map((line, i) => {
                let indentClass = "";
                if (line.identifier) {
                    if (/^\d+\)/.test(line.identifier) || /^Nr\./.test(line.identifier)) {
                        indentClass = "pl-6";
                    } else if (/^[a-z]\)/.test(line.identifier)) {
                        indentClass = "pl-12";
                    }
                }

                return (
                    <div key={i} className={`flex gap-3 ${indentClass}`}>
                        {line.identifier && (
                            <span className="mt-0.5 shrink-0 h-fit px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-100 font-black serif text-[11px] tracking-tighter">
                                {line.identifier}
                            </span>
                        )}
                        <div className="flex-1 leading-relaxed text-[15px] font-medium text-slate-700 whitespace-pre-wrap">
                            {line.content}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// --- MAIN COMPONENT ---

export default function NativeLawViewer() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userProfile } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // Robust lawId extraction (handles both [lawId] and potential [id] variations)
    const lawIdFromParams = params?.lawId || params?.id;
    const lawId = lawIdFromParams as string;
    const initialPara = searchParams.get('para');

    const [lawData, setLawData] = useState<LawContentType | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChapter, setActiveChapter] = useState(0);
    const [analysisLoading, setAnalysisLoading] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{ id: string; data: ParagraphAnalysisData } | null>(null);
    const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);
    
    const [isTOCDrawerOpen, setIsTOCDrawerOpen] = useState(false);
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const paragraphRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Fetch Law Data
    useEffect(() => {
        async function fetchLaw() {
            if (!lawId || !firestore) return;
            setLoading(true);
            try {
                // We use params from URL as primary source to avoid database lookups if possible
                const nameFallback = searchParams.get('name') || 'Henter...';
                const abbrFallback = searchParams.get('abbr') || 'LOV';
                const xmlFallback = searchParams.get('xml') || '';

                const result = await getLawContentAction({
                    documentId: lawId.trim(),
                    name: nameFallback,
                    abbreviation: abbrFallback,
                    xmlUrl: xmlFallback // Pass the URL directly from the click
                });

                if (result.success && result.data) {
                    setLawData(result.data);
                } else {
                    console.error("Server-side fetch failed for ID:", lawId, result.message);
                }
            } catch (err) {
                console.error("Fatal error fetching law:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLaw();
    }, [lawId, firestore]);

    // Filtered Paragraphs based on search
    const filteredChapters = useMemo(() => {
        if (!lawData) return [];
        if (!searchQuery.trim()) return lawData.kapitler;
        
        const q = searchQuery.toLowerCase();
        return lawData.kapitler.map(chapter => ({
            ...chapter,
            paragraffer: chapter.paragraffer.filter(p => 
                p.id.toLowerCase().includes(q) || 
                p.text.toLowerCase().includes(q)
            )
        })).filter(chapter => chapter.paragraffer.length > 0);
    }, [lawData, searchQuery]);

    // Scroll to initial paragraph
    useEffect(() => {
        if (!loading && initialPara && paragraphRefs.current[initialPara]) {
            setTimeout(() => {
                paragraphRefs.current[initialPara]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [loading, initialPara]);

    const savedParasRef = useMemoFirebase(
        () => user && firestore ? collection(firestore, 'users', user.uid, 'savedParagraphs') : null,
        [user, firestore]
    );

    const { data: savedParasRaw } = useCollection(savedParasRef);
    const savedParagraphs = useMemo(() => (savedParasRaw || []).map(d => d.id), [savedParasRaw]);

    const handleToggleSave = async (paragraph: any) => {
        if (!user || !firestore) return;
        triggerHapticFeedback(ImpactStyle.Light);
        
        const saveId = `${lawId}-${paragraph.id.replace(/[§\s\.]/g, '-')}`;
        const isSaved = savedParagraphs.includes(saveId);

        try {
            if (isSaved) {
                await deleteDoc(doc(firestore, 'users', user.uid, 'savedParagraphs', saveId));
                toast({ title: "Fjernet fra gemte", description: "Paragraffen er ikke længere i din samling." });
            } else {
                await setDoc(doc(firestore, 'users', user.uid, 'savedParagraphs', saveId), {
                    lawId,
                    lawTitle: lawData?.titel,
                    paragraphNumber: paragraph.id,
                    text: paragraph.text,
                    savedAt: serverTimestamp()
                });
                toast({ title: "Gemt!", description: "Paragraffen er tilføjet til din samling." });
            }
        } catch (err) {
            console.error("Error toggling save:", err);
        }
    };

    const handleAnalyze = async (paragraph: any) => {
        if (!paragraph) return;
        triggerHapticFeedback(ImpactStyle.Heavy);
        setAnalysisLoading(paragraph.id);
        
        try {
            const result = await analyzeParagraphAction({
                lovTitel: lawData?.name || '',
                paragrafNummer: paragraph.id,
                paragrafTekst: paragraph.text,
                fuldLovtekst: "",
                uniqueDocumentId: lawId
            });
            if (result.success && result.analysis) {
                setAnalysisResult({ id: paragraph.id, data: result.analysis });
                setIsAnalysisDrawerOpen(true);
            }
        } catch (err) {
            console.error("Analysis failed:", err);
        } finally {
            setAnalysisLoading(null);
        }
    };

    const scrollToPara = (paraId: string) => {
        triggerHapticFeedback(ImpactStyle.Light);
        paragraphRefs.current[paraId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setIsTOCDrawerOpen(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-200 blur-2xl opacity-20 animate-pulse" />
                    <Loader2 className="w-12 h-12 animate-spin text-amber-950 relative z-10" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-950/40">Retsinformation</p>
                    <p className="text-sm font-bold text-slate-400 italic">Henter lovteksten til dig...</p>
                </div>
            </div>
        );
    }

    if (!lawData) {
        return (
            <div className="p-10 text-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Scale className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-amber-950 serif">Lov ikke fundet</h3>
                <p className="text-sm text-slate-500">
                    Vi kunne ikke finde loven med ID: <code className="bg-slate-100 px-1 rounded">{lawId || 'mangler'}</code>
                </p>
                <Button onClick={() => router.push('/lov-portal')} className="mt-4">Gå tilbage</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFCF8] pb-32">
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap');
                .serif-premium { font-family: 'Playfair Display', serif; }
            ` }} />

            {/* Premium Native Header */}
            <div className="sticky top-0 z-[60] bg-white/80 backdrop-blur-2xl border-b border-black/[0.03]">
                <div className="px-6 py-4 flex items-center gap-4">
                    <button 
                        onClick={() => { triggerHapticFeedback(ImpactStyle.Light); router.back(); }}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-900 rounded-2xl active:scale-90 transition-transform"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-amber-950 text-amber-400 rounded-md text-[8px] font-black uppercase tracking-widest shrink-0">
                                {lawData.forkortelse || 'LOV'}
                            </span>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest truncate">
                                {lawData.titel}
                            </span>
                        </div>
                        <h1 className="text-base font-black text-amber-950 serif-premium leading-tight truncate mt-0.5">
                            {lawData.titel}
                        </h1>
                    </div>
                </div>

                {/* Search / Filter Bar */}
                <div className="px-4 pb-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-950 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Søg i paragraffer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-2xl text-[14px] font-bold focus:ring-2 focus:ring-amber-950/20 transition-all font-sans"
                        />
                    </div>
                </div>
            </div>

            {/* Paragraph Content */}
            <div className="flex-1 px-4 py-8 space-y-12">
                {filteredChapters.map((chapter, cIdx) => (
                    <div key={cIdx} className="space-y-8">
                        <div className="flex items-center gap-4 px-2">
                           <div className="h-px w-8 bg-amber-200"></div>
                           <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-900/40 italic">
                              {chapter.nummer} — {chapter.titel}
                           </h3>
                           <div className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent"></div>
                        </div>

                        <div className="grid gap-6">
                            {chapter.paragraffer.map((para) => {
                                const isSaved = savedParagraphs.includes(`${lawId}-${para.id.replace(/[§\s\.]/g, '-')}`);
                                const isAnalyzing = analysisLoading === para.id;
                                const isTarget = initialPara === para.id;

                                return (
                                    <motion.div
                                        key={para.id}
                                        ref={el => paragraphRefs.current[para.id] = el as any}
                                        initial={isTarget ? { scale: 1.02 } : {}}
                                        className={`bg-white rounded-[2.5rem] border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-500 ${isTarget ? 'ring-2 ring-amber-500 shadow-2xl' : ''}`}
                                    >
                                        <div className="p-6 md:p-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-[#1a1a1a] rounded-[1.25rem] flex items-center justify-center text-amber-400 font-black serif text-2xl shadow-xl shadow-black/10">
                                                        {para.id.replace('§ ', '')}
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Lov-Paragraf</div>
                                                        <div className="text-xs font-bold text-amber-900">Digital Arkitekt v. 4.0</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => handleToggleSave(para)}
                                                        className={`w-11 h-11 rounded-[1rem] flex items-center justify-center transition-all active:scale-90 ${isSaved ? 'bg-amber-100 text-amber-900' : 'bg-slate-50 text-slate-300 hover:text-slate-900 border border-slate-100'}`}
                                                    >
                                                        {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            triggerHapticFeedback(ImpactStyle.Light);
                                                            navigator.clipboard.writeText(`${lawData.titel}, § ${para.id}:\n${para.text}`);
                                                            toast({ title: "Kopieret", description: "Paragaften er kopieret til udklipsholder." });
                                                        }}
                                                        className="w-11 h-11 bg-slate-50 text-slate-300 rounded-[1rem] flex items-center justify-center hover:text-slate-900 border border-slate-100"
                                                    >
                                                        <Copy className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <div className="absolute -left-10 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-200/50 to-transparent hidden md:block"></div>
                                                <InteractiveParagraphBody text={para.text} />
                                            </div>

                                            <button
                                                onClick={() => handleAnalyze(para)}
                                                disabled={!!analysisLoading}
                                                className={`w-full py-5 rounded-[1.5rem] flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.97] shadow-2xl shadow-amber-950/10 ${isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-amber-950 text-amber-400 border border-amber-800/50'}`}
                                            >
                                                {isAnalyzing ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Brain className="w-4 h-4" />
                                                )}
                                                {isAnalyzing ? 'Tænker...' : 'Analysér med AI Arkitekten'}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Table of Contents Floating Menu */}
            <div className="fixed bottom-28 right-6 z-[70] flex flex-col gap-4">
                <AnimatePresence>
                    {isTOCDrawerOpen && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="absolute bottom-20 right-0 w-72 bg-white rounded-[2.5rem] shadow-2xl border border-black/[0.05] p-6 max-h-[60vh] overflow-y-auto custom-scrollbar"
                        >
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-50 pb-3">Lovens Kapitler</h4>
                            <div className="space-y-4">
                                {lawData.kapitler.map((chapter, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => {
                                            const firstPara = chapter.paragraffer[0]?.id;
                                            if (firstPara) scrollToPara(firstPara);
                                            setActiveChapter(i);
                                        }}
                                        className="w-full text-left group"
                                    >
                                        <div className="text-[11px] font-black text-amber-950 serif-premium leading-snug group-active:translate-x-1 transition-transform">
                                            {chapter.nummer} {chapter.titel}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                                            {chapter.paragraffer.length} paragraffer
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button 
                    onClick={() => {
                        triggerHapticFeedback(ImpactStyle.Medium);
                        setIsTOCDrawerOpen(!isTOCDrawerOpen);
                    }}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border border-white/20 ${isTOCDrawerOpen ? 'bg-white text-amber-950' : 'bg-amber-950 text-amber-400'}`}
                >
                    <List className="w-6 h-6" />
                </button>
            </div>

            {/* Analysis Drawer */}
            <AnimatePresence>
                {isAnalysisDrawerOpen && analysisResult && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAnalysisDrawerOpen(false)}
                            className="fixed inset-0 bg-amber-950/20 backdrop-blur-md z-[110]"
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-[#FDFCF8] rounded-t-[3.5rem] z-[120] flex flex-col shadow-2xl border-t border-white/20"
                        >
                            <div className="sticky top-0 bg-inherit pt-4 pb-2 px-8 z-20">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="w-14 h-1.5 bg-slate-200 rounded-full" />
                                </div>

                                <div className="flex items-center gap-6 mb-4">
                                    <div className="w-16 h-16 bg-amber-950 rounded-[2rem] flex items-center justify-center text-amber-400 shadow-2xl">
                                        <Brain className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl font-black text-amber-950 serif-premium tracking-tight leading-tight">
                                            § {analysisResult.id} Forklaret
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[8px] font-black uppercase tracking-widest border border-emerald-100">AI Arkitekt</span>
                                            <span className="text-[9px] font-bold text-slate-400 italic">Senest opdateret 2024</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsAnalysisDrawerOpen(false)} className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                        <ChevronDown className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-8 space-y-12 pb-20 custom-scrollbar">
                                {/* Summary Card */}
                                <div className="bg-white p-8 rounded-[3rem] border border-amber-100/50 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-4 h-4 text-emerald-500" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hvad betyder paragraffen?</h4>
                                    </div>
                                    <p className="text-[17px] font-black text-amber-950 serif-premium leading-relaxed italic">
                                        "{analysisResult.data.summary}"
                                    </p>
                                </div>

                                {/* Key Conditions */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Vigtige Betingelser</h4>
                                        <div className="h-px flex-1 ml-6 bg-slate-100" />
                                    </div>
                                    <div className="grid gap-3">
                                        {analysisResult.data.keyPoints.map((point, i) => (
                                            <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-slate-50 shadow-sm group active:bg-amber-50 transition-colors">
                                                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 group-active:bg-amber-950 group-active:text-white transition-all">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                <p className="text-[14px] font-medium text-slate-700 leading-relaxed">{point}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Practitioner Tips */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Sagsbehandler-tip</h4>
                                        <div className="h-px flex-1 ml-6 bg-slate-100" />
                                    </div>
                                    <div className="p-10 bg-[#121212] text-white rounded-[4rem] relative overflow-hidden group shadow-2xl">
                                        <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                            <HelpCircle className="w-64 h-64" />
                                        </div>
                                        <div className="relative z-10 space-y-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400 mb-6">
                                                <Trophy className="w-6 h-6" />
                                            </div>
                                            <p className="text-[18px] font-black serif-premium leading-relaxed italic text-amber-200">
                                                {analysisResult.data.practitionerTip}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
