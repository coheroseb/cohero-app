'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Presentation,
  ArrowLeft, 
  Sparkles, 
  UploadCloud,
  File,
  X,
  Loader2,
  Tags,
  Scale,
  Wrench,
  Save,
  FileText,
  CheckCircle,
  Info,
  BrainCircuit,
  HelpCircle,
  MoreVertical,
  Plus,
  ChevronRight,
  ChevronLeft,
  Flame,
  History,
  TrendingUp,
  Target,
  Zap,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { seminarArchitect as seminarArchitectAction } from '@/ai/flows/seminar-architect-flow';
import type { SeminarAnalysis, SeminarArchitectInput, QuizData } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, writeBatch, increment, getDoc, query, updateDoc } from 'firebase/firestore';
import { DocumentData } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { motion, AnimatePresence } from 'framer-motion';

async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
  const pdfjsVersion = '4.10.38'; 
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({data: new Uint8Array(buffer)});
  const pdf = await loadingTask.promise;
  const slideTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => ('str' in item ? item.str : '')).join(' ');
    slideTexts.push(`--- SLIDE ${i} ---\n${strings}`);
  }
  return slideTexts.join('\n\n');
}

function SeminarArchitectPageContent() {
    const { user, userProfile, refetchUserProfile } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<SeminarAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [limitError, setLimitError] = useState<string | null>(null);
    const [slideNotes, setSlideNotes] = useState<Record<number, string>>({});
    const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
    const [debouncedNotes] = useDebounce(slideNotes, 1500);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const isInitialMount = useRef(true);

    const handleAnalyze = async () => {
        if (!pdfFile || !user || !firestore || !userProfile || isAnalyzing) return;

        setIsAnalyzing(true);
        setAnalysisResult(null);
        setError(null);
        setLimitError(null);
        setSlideNotes({});
        setSavedAnalysisId(null);

        // Limit Check
        if (userProfile.membership === 'Kollega') {
            const getWeek = (d: Date) => {
                const date = new Date(d.getTime());
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                const week1 = new Date(date.getFullYear(), 0, 4);
                return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
            };

            const lastUsage = userProfile.lastSeminarArchitectUsage?.toDate();
            const now = new Date();
            let weeklyCount = userProfile.weeklySeminarArchitectCount || 0;

            if (lastUsage && (getWeek(lastUsage) !== getWeek(now) || lastUsage.getFullYear() !== now.getFullYear())) {
                weeklyCount = 0;
            }

            if (weeklyCount >= 1) {
                setLimitError('Du har brugt dit ugentlige forsøg. Opgrader til Kollega+ for ubegrænset brug.');
                setIsAnalyzing(false);
                return;
            }
        }

        try {
            const slideText = await extractTextFromPdf(pdfFile);

            const input: SeminarArchitectInput = {
                slideText: slideText,
                semester: userProfile.semester || '1. semester',
            };
            
            const response = await seminarArchitectAction(input);
            
            if (!response || !response.data) {
                throw new Error("Ingen data returneret fra analysen.");
            }

            const analysisData = response.data;
            setAnalysisResult(analysisData);

            const batch = writeBatch(firestore);
            const userRef = doc(firestore, 'users', user.uid);
            
            const seminarsColRef = collection(firestore, 'users', user.uid, 'seminars');
            const newSeminarRef = doc(seminarsColRef);
            batch.set(newSeminarRef, { 
                ...analysisData, 
                createdAt: serverTimestamp() 
            });
            setSavedAnalysisId(newSeminarRef.id);
            
            const activityRef = doc(collection(firestore, 'userActivities'));
            batch.set(activityRef, {
                userId: user.uid,
                userName: userProfile.username || user.displayName || 'Anonym bruger',
                actionText: 'analyserede et seminar med Seminar-Arkitekten.',
                createdAt: serverTimestamp(),
            });
            
            const userUpdates: {[key: string]: any} = {
                lastSeminarArchitectUsage: serverTimestamp(),
            };
            if(userProfile.membership === 'Kollega') {
                userUpdates.weeklySeminarArchitectCount = increment(1);
            }

            if (response.usage) {
                const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
                const pointsToAdd = Math.round(totalTokens * 0.05);
                if (pointsToAdd > 0) userUpdates.cohéroPoints = increment(pointsToAdd);
            }
            
            if (Object.keys(userUpdates).length > 0) {
              batch.update(userRef, userUpdates);
            }
            
            await batch.commit();
            await refetchUserProfile();
            
            toast({
              title: "Videnskort Gemt!",
              description: "Din analyse er blevet gemt i 'Mine Seminarer'.",
            });

        } catch (err: any) {
            console.error("Seminar analysis error:", err);
            setError(err.message || "Der opstod en fejl under analysen. Prøv venligst igen.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleAutoSaveNotes = useCallback(async () => {
        if (!user || !firestore || !savedAnalysisId || Object.keys(debouncedNotes).length === 0) return;
        setSaveStatus('saving');
        try {
            const seminarRef = doc(firestore, 'users', user.uid, 'seminars', savedAnalysisId);
            const seminarSnap = await getDoc(seminarRef);
            if (!seminarSnap.exists()) {
                setSaveStatus('idle'); 
                return;
            }
            const existingSlides = seminarSnap.data().slides || [];
            const updatedSlides = existingSlides.map((slide: any) => ({
                ...slide,
                notes: debouncedNotes[slide.slideNumber] ?? slide.notes ?? ''
            }));
            await updateDoc(seminarRef, { slides: updatedSlides });
            setSaveStatus('saved');
        } catch (error) {
            console.error("Error auto-saving notes:", error);
            setSaveStatus('idle');
        }
    }, [user, firestore, savedAnalysisId, debouncedNotes]);
    
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (savedAnalysisId) handleAutoSaveNotes();
    }, [debouncedNotes, savedAnalysisId, handleAutoSaveNotes]);
    
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if(saveStatus === 'saved') timer = setTimeout(() => setSaveStatus('idle'), 2000);
        return () => clearTimeout(timer);
    }, [saveStatus]);

    return (
        <div className="animate-fade-in-up bg-[#FDFCF8] min-h-screen selection:bg-amber-100 overflow-x-hidden">
            
            {/* 1. SMART COMMAND HEADER */}
            <header className="bg-white border-b border-amber-100 px-4 sm:px-6 py-10 md:py-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-amber-50 rounded-full blur-[80px] md:blur-[120px] -mr-16 md:-mr-32 -mt-16 md:-mt-32 opacity-50 pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-10 mb-10 md:mb-16">
                        <div className="text-center lg:text-left">
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                                <span className="px-3 md:px-4 py-1.5 bg-amber-950 text-amber-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg border border-white/10">
                                    Seminar-Arkitekten
                                </span>
                                <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                    <Presentation className="w-3 md:w-3.5 h-3 md:h-3.5 fill-current" /> Vidensbehandling
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-7xl font-bold text-amber-950 serif leading-none tracking-tighter">
                                Fra slides til <span className="text-amber-700 italic">videnskort.</span>
                            </h1>
                            <p className="text-base md:text-xl text-slate-500 mt-4 md:mt-6 italic font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                Upload dine seminar-slides og lad AI omdanne dem til et struktureret overblik over begreber, jura og metoder.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 sm:gap-4 bg-white/50 backdrop-blur-sm p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] border border-amber-100/50 shadow-inner">
                            <Link href="/mine-seminarer">
                                <Button variant="outline" className="h-16 w-24 sm:h-20 sm:w-32 flex-col gap-1 rounded-2xl bg-amber-50/50 border-amber-100 hover:bg-amber-100">
                                    <History className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800"/>
                                    <span className="text-[10px] sm:text-xs font-bold text-amber-950">Arkiv</span>
                                </Button>
                            </Link>
                             <div className="text-center px-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                <p className="text-2xl font-black text-amber-950 serif">Klar</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
                    
                    {/* LEFT COLUMN: UPLOAD & ANALYSIS */}
                    <div className="lg:col-span-8 space-y-16">
                        
                        {/* Analysis Interface */}
                        {!analysisResult ? (
                            <section>
                                <div className="flex items-center gap-3 mb-8 px-2">
                                    <div className="p-2.5 bg-amber-50 rounded-xl shadow-inner">
                                        <UploadCloud className="w-5 h-5 text-amber-700" />
                                    </div>
                                    <h2 className="text-xl font-bold text-amber-950 serif">Forberedelse</h2>
                                </div>

                                <div className="bg-white p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] border border-amber-100 shadow-sm relative overflow-hidden group">
                                    <div className="relative z-10 space-y-8">
                                        <div className="bg-indigo-50 text-indigo-800 text-xs p-4 rounded-2xl flex items-start gap-3 border border-indigo-100">
                                            <Info className="w-5 h-5 flex-shrink-0"/>
                                            <p className="leading-relaxed font-medium">Download din undervisnings slides som <strong>PDF</strong> og upload dem herunder. Vi udtrækker automatisk essensen af undervisningen for dig.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {pdfFile ? (
                                                <div className="flex items-center justify-between p-6 bg-amber-50 rounded-3xl border border-amber-200 animate-ink">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                            <File className="w-6 h-6 text-amber-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-amber-950 truncate max-w-xs">{pdfFile.name}</p>
                                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Klar til analyse</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setPdfFile(null)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
                                                </div>
                                            ) : (
                                                <label htmlFor="pdf-upload" className="relative block w-full border-2 border-dashed border-slate-100 rounded-[2.5rem] p-16 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all group/upload">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover/upload:scale-110 transition-transform">
                                                        <UploadCloud className="h-10 w-10 text-slate-300 group-hover/upload:text-amber-500" />
                                                    </div>
                                                    <span className="block text-sm font-bold text-amber-950 mb-1">Vælg din PDF-fil</span>
                                                    <span className="block text-xs font-medium text-slate-400">Træk slides herover eller klik for at gennemse</span>
                                                    <input id="pdf-upload" name="pdf-upload" type="file" className="sr-only" accept=".pdf,application/pdf" onChange={(e) => e.target.files && setPdfFile(e.target.files[0])} />
                                                </label>
                                            )}
                                        </div>

                                        {limitError && (
                                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                                                <X className="w-5 h-5 text-rose-500" />
                                                <p className="text-xs font-bold text-rose-700">{limitError} <Link href="/upgrade" className="underline ml-2">Opgrader nu</Link></p>
                                            </div>
                                        )}

                                        <Button 
                                            onClick={handleAnalyze} 
                                            disabled={!pdfFile || isAnalyzing || !!limitError} 
                                            className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest gap-3 shadow-xl active:scale-[0.98] transition-all"
                                        >
                                            {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin"/> : <Sparkles className="w-6 h-6" />}
                                            {isAnalyzing ? 'Udfører Analyse...' : 'Generér Videnskort'}
                                        </Button>
                                        
                                        {error && <p className="text-sm text-rose-500 text-center font-bold">{error}</p>}
                                    </div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                                </div>
                            </section>
                        ) : (
                            <section className="space-y-12 animate-ink">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-3xl font-bold text-amber-950 serif">{analysisResult.overallTitle}</h2>
                                    <Button variant="ghost" onClick={() => setAnalysisResult(null)} className="text-slate-400 hover:text-amber-950">
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Ny analyse
                                    </Button>
                                </div>

                                <div className="space-y-8">
                                    {analysisResult.slides.map((slide, index) => (
                                        <div key={index} className="bg-white p-8 md:p-10 rounded-[3rem] border border-amber-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 font-bold text-sm shadow-inner group-hover:bg-amber-950 group-hover:text-white transition-colors">
                                                    {slide.slideNumber}
                                                </div>
                                                <h3 className="text-xl font-bold text-amber-950 serif">{slide.slideTitle}</h3>
                                            </div>

                                            <p className="text-slate-600 leading-relaxed italic mb-8 border-l-4 border-amber-100 pl-6 py-2">{slide.summary}</p>
                                            
                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    {slide.keyConcepts && slide.keyConcepts.length > 0 && (
                                                        <div>
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                                                <Tags className="w-3.5 h-3.5" /> Begreber
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {slide.keyConcepts.map((c: any, i: number) => (
                                                                    <Link key={i} href={`/concept-explainer?term=${encodeURIComponent(c.term)}`} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold border border-purple-100 hover:bg-purple-100 transition-all">
                                                                        {c.term}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {slide.legalFrameworks && slide.legalFrameworks.length > 0 && (
                                                        <div>
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                                                <Scale className="w-3.5 h-3.5" /> Jura
                                                            </h4>
                                                            <ul className="space-y-3">
                                                                {slide.legalFrameworks.map((l: any, i: number) => (
                                                                    <li key={i} className="text-xs leading-relaxed">
                                                                        <span className="font-bold text-amber-950">{l.law} {l.paragraphs.join(', ')}</span>
                                                                        <p className="text-slate-500 mt-0.5">{l.relevance}</p>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-6">
                                                    {slide.practicalTools && slide.practicalTools.length > 0 && (
                                                        <div>
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                                                <Wrench className="w-3.5 h-3.5" /> Metoder
                                                            </h4>
                                                            <ul className="space-y-3">
                                                                {slide.practicalTools.map((t: any, i: number) => (
                                                                    <li key={i} className="text-xs leading-relaxed">
                                                                        <span className="font-bold text-amber-950">{t.tool}</span>
                                                                        <p className="text-slate-500 mt-0.5">{t.description}</p>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                                            <FileText className="w-3.5 h-3.5" /> Egne Noter
                                                        </h4>
                                                        <Textarea
                                                            placeholder="Notér vigtige pointer..."
                                                            value={slideNotes[slide.slideNumber] || ''}
                                                            onChange={(e) => setSlideNotes(prev => ({...prev, [slide.slideNumber]: e.target.value}))}
                                                            className="bg-amber-50/20 border-amber-100 rounded-2xl text-xs min-h-[100px] focus:ring-amber-950"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex justify-center pb-20">
                                    <div className="bg-white px-6 py-3 rounded-full border border-amber-100 shadow-lg flex items-center gap-4">
                                        {saveStatus === 'saving' ? (
                                            <><Loader2 className="w-4 h-4 animate-spin text-amber-600"/> <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Autogemmer...</span></>
                                        ) : (
                                            <><CheckCircle className="w-4 h-4 text-emerald-500"/> <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Alle ændringer gemt</span></>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT COLUMN: ASIDE */}
                    <aside className="lg:col-span-4 space-y-10">
                        <section className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hurtig Viden</h3>
                                <Target className="w-5 h-5 text-amber-700/30" />
                            </div>
                            <div className="space-y-6">
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <h4 className="text-xs font-bold text-amber-950 mb-1">Maksimal Udbytte</h4>
                                    <p className="text-[10px] text-slate-600 leading-relaxed italic">"Brug videnskortet til at repetere undervisningens kernebegreber før du går i gang med pensumlæsning."</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <p className="text-[10px] font-bold text-slate-500">Automatisk kildehenvisning</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        <p className="text-[10px] font-bold text-slate-500">Direkte link til Begrebsguiden</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="bg-amber-950 p-8 rounded-[2.5rem] text-white shadow-xl">
                            <h3 className="text-lg font-bold serif mb-4">Gode Råd</h3>
                            <p className="text-amber-100/60 text-sm leading-relaxed mb-6 italic">
                                "Et godt videnskort er fundamentet for din eksamensforberedelse. Husk at tilføje dine egne noter løbende."
                            </p>
                            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl h-12" onClick={() => router.push('/mine-seminarer')}>
                                <Layers className="w-4 h-4 mr-2" /> Mine Videnskort
                            </Button>
                        </div>
                    </aside>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="bg-white border-t border-amber-100 px-6 sm:px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-950">Vidensbehandling</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Klar til transformation</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const SeminarArchitectPage = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace(`/?callbackUrl=${encodeURIComponent(pathname)}`);
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }
    
    return <SeminarArchitectPageContent />;
}

export default SeminarArchitectPage;
