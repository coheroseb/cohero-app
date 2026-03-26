'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  ArrowLeft, 
  Book, 
  ChevronRight, 
  X, 
  BookOpen, 
  Sparkles, 
  Loader2, 
  ChevronDown, 
  Wand2, 
  Lock, 
  ArrowUpRight, 
  Building, 
  Brain, 
  BrainCircuit, 
  Quote, 
  Check, 
  Copy, 
  Info,
  Target,
  Zap,
  TrendingUp,
  History,
  Layout,
  Library,
  BookMarked,
  Clock,
  PanelRight,
  Maximize,
  Minimize,
  Scale as ScaleIcon,
  MessageSquare,
  Share2,
  Bookmark,
  GraduationCap,
  Play
} from 'lucide-react';

import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc, writeBatch, increment, collection, serverTimestamp, query, orderBy, limit, DocumentData } from 'firebase/firestore';
import ConceptVideoPlayer from '@/components/ConceptVideoPlayer';
import { 
  explainConceptAction, 
  explainConceptWithAnalogyAction, 
  fetchVivePublicationsAction,
  generateConceptVideoScriptAction 
} from '@/app/actions';
import type { Explanation, VivePublication, ConceptVideoScript } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

// --- STYLED COMPONENTS ---

const FeatureChip = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="px-6 py-4 bg-white border border-amber-100 rounded-3xl flex items-center gap-4 hover:border-amber-950 hover:shadow-xl transition-all group shrink-0"
    >
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-950 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <span className="text-sm font-bold text-slate-600 group-hover:text-amber-950 transition-colors uppercase tracking-widest text-[10px]">{label}</span>
    </button>
);

const ContentSection = ({ title, icon, children, delay = 0 }: { title: string, icon: React.ReactNode, children: React.ReactNode, delay?: number }) => (
    <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="space-y-6"
    >
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shadow-inner">
                {icon}
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-950/40">{title}</h3>
        </div>
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-amber-100 shadow-sm hover:shadow-xl transition-shadow">
            {children}
        </div>
    </motion.section>
);

// --- MAIN COMPONENT ---

function ConceptExplainerPageContent() {
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Core State
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [analogy, setAnalogy] = useState<string | null>(null);
  const [viveArticles, setViveArticles] = useState<VivePublication[]>([]);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explanation' | 'relevance' | 'case' | 'sources'>('explanation');
  const [isGettingAnalogy, setIsGettingAnalogy] = useState(false);
  const [searchProgress, setSearchProgress] = useState<{ step: number; label: string }>({ step: 0, label: '' });
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoScript, setVideoScript] = useState<ConceptVideoScript | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [hasCachedVideo, setHasCachedVideo] = useState(false);

  const resultsRef = useRef<HTMLElement>(null);

  const isKollegaPlus = (userProfile?.role === 'admin') || (userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership));



  // UI Helpers
  const [showHistory, setShowHistory] = useState(false);

  const handleExplain = useCallback(async (term: string) => {
    if (!term || !user || !userProfile || !firestore) return;

    setSearchQuery(term);
    setIsLoading(true);
    setExplanation(null);
    setAnalogy(null);
    setViveArticles([]);
    setLimitError(null);
    setSearchProgress({ step: 1, label: 'Analyserer begrebets kerne...' });

    // Scroll to results area automatically
    setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    let progressInterval: NodeJS.Timeout | undefined;
    // Progress simulation
    progressInterval = setInterval(() => {
        setSearchProgress(prev => {
            if (prev.step === 1) return { step: 2, label: 'Indhenter relevant teori og litteratur...' };
            if (prev.step === 2) return { step: 3, label: 'Forbinder til socialfaglig praksis...' };
            if (prev.step === 3) return { step: 4, label: 'Syntetiserer pædagogisk forklaring...' };
            return prev;
        });
    }, 1500);

    // Limit Check (Free Tier)
    if (userProfile.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership)) {
        const today = new Date().toDateString();
        const lastUsage = userProfile.lastConceptExplainerUsage?.toDate().toDateString();
        const count = lastUsage === today ? userProfile.dailyConceptExplainerCount || 0 : 0;
        
        if (count >= 3) {
            setLimitError('Dine opslag for i dag er brugt. Opgrader til Kollega+ for fri adgang.');
            setIsLoading(false);
            return;
        }
    }

    try {
        // Fetch VIVE research parallel
        fetchVivePublicationsAction({ searchTerm: term, limit: 3 }).then(res => setViveArticles(res.publications));

        // Get AI Explanation
        const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9æøå-]/g, '-');
        const docRef = doc(firestore, 'conceptExplanations-v2', normalizedTerm);
        const snap = await getDoc(docRef);

        let finalExplanation: Explanation;
        if (snap.exists()) {
            finalExplanation = snap.data().explanation;
        } else {
            const res = await explainConceptAction({ concept: term });
            finalExplanation = res.data;
            await setDoc(docRef, { conceptName: term, explanation: res.data, createdAt: serverTimestamp() });
        }
        setExplanation(finalExplanation);

        // Update User Activity
        const batch = writeBatch(firestore);
        const recent = [term, ...(userProfile.recentConcepts || [])].filter((t, i, self) => self.indexOf(t) === i).slice(0, 10);
        
        const activitiesCol = collection(firestore, 'userActivities');
        batch.set(doc(activitiesCol), {
            userId: user.uid,
            userName: userProfile?.username || user.displayName || 'Anonym bruger',
            actionText: `slog begrebet "${term}" op.`,
            createdAt: serverTimestamp(),
        });

        batch.update(doc(firestore, 'users', user.uid), {
            lastConceptExplainerUsage: serverTimestamp(),
            dailyConceptExplainerCount: increment(1),
            recentConcepts: recent
        });
        await batch.commit();
        await refetchUserProfile();

    } catch (err) {
        toast({ variant: 'destructive', title: "Fejl", description: "Der opstod en fejl. Prøv igen senere." });
    } finally {
        setIsLoading(false);
        setSearchProgress({ step: 0, label: '' });
        // @ts-ignore
        if (typeof progressInterval !== 'undefined') clearInterval(progressInterval);
    }
  }, [user, firestore, userProfile, refetchUserProfile, toast]);

  const handleGetAnalogy = useCallback(async () => {
    if (!explanation || isGettingAnalogy || !user) return;
    setIsGettingAnalogy(true);
    try {
        const res = await explainConceptWithAnalogyAction({ conceptName: searchQuery, definition: explanation.definition });
        setAnalogy(res.data.analogy);
    } catch (err) {
        toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke hente analogi." });
    } finally {
        setIsGettingAnalogy(false);
    }
  }, [explanation, searchQuery, user, isGettingAnalogy, toast]);

  const handleGenerateVideo = useCallback(async () => {
    if (!explanation || isGeneratingVideo || !user) return;
    setIsGeneratingVideo(true);
    try {
        const res = await generateConceptVideoScriptAction({ concept: searchQuery, explanation });
        setVideoScript(res.data);
        setShowVideoPlayer(true);
    } catch (err) {
        toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke danne videoforklaring." });
    } finally {
        setIsGeneratingVideo(false);
    }
  }, [explanation, searchQuery, user, isGeneratingVideo, toast]);


  const hasUrlTermProcessed = useRef(false);
  // Initial term from URL
  useEffect(() => {
    if (hasUrlTermProcessed.current) return;
    const term = searchParams?.get('term');
    if (term) {
      const decoded = decodeURIComponent(term);
      handleExplain(decoded);
      hasUrlTermProcessed.current = true;
    }
  }, [searchParams, handleExplain]);

  // Check for cached video when explanation changes
  useEffect(() => {
    if (explanation && searchQuery && firestore) {
        const normalizedTerm = searchQuery.toLowerCase().trim().replace(/\s+/g, '-');
        const docRef = doc(firestore, 'conceptVideos', normalizedTerm);
        getDoc(docRef).then(snap => {
            setHasCachedVideo(snap.exists());
            if (snap.exists()) {
                setVideoScript(snap.data() as ConceptVideoScript);
            }
        });
    }
  }, [explanation, searchQuery, firestore]);


  return (
    <div className="min-h-screen bg-[#FDFCF8] selection:bg-amber-100 flex flex-col items-center">
      
      {/* HEADER / NAVIGATION */}
      <header className="w-full h-20 bg-white/80 backdrop-blur-md border-b border-amber-50 px-8 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-6">
              <Link href="/lov-portal" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all border border-amber-100">
                  <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-lg"><Wand2 className="w-5 h-5" /></div>
                  <h1 className="text-xl font-bold text-amber-950 serif tracking-tight hidden sm:block">Guiden</h1>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-3 rounded-2xl transition-all border ${showHistory ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}
              >
                  <History className="w-5 h-5" />
              </button>
              <Link href="/upgrade" className="hidden sm:block">
                  <Button variant="outline" className="rounded-xl border-amber-200 text-amber-900">Opgrader</Button>
              </Link>
          </div>
      </header>

      {/* SEARCH AREA (TRANSFORMS BASED ON STATE) */}
      <div className={`w-full max-w-[1600px] px-6 sm:px-12 transition-all duration-700 ease-in-out ${explanation ? 'pt-12 pb-12' : 'pt-[20vh] pb-24'}`}>
          <div className={`space-y-12 ${explanation ? 'text-left' : 'text-center'}`}>
              {!explanation && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100 mx-auto">
                          <Sparkles className="w-4 h-4 text-amber-500" /> Din personlige faglige makker
                      </div>
                      <h2 className="text-5xl md:text-8xl font-black text-amber-950 serif tracking-tighter">Hvad vil du lære <span className="text-amber-400 italic">nu</span>?</h2>
                      <p className="text-lg text-slate-500 font-medium italic max-w-lg mx-auto leading-relaxed">Vores AI transformerer komplekse teorier til klar, socialfaglig indsigt på sekunder.</p>
                  </motion.div>
              )}

                <div className={`flex flex-col gap-6 ${explanation ? 'md:flex-row md:items-center' : 'items-center'}`}>
                {explanation && (
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-950 border border-amber-100 shadow-sm"><BrainCircuit className="w-5 h-5" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40">Faglig Analyse</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-amber-950 serif tracking-tighter leading-none">{searchQuery}</h2>
                    </div>
                )}
                
                    {/* SEARCH FORM & VIDEO ACTION WRAPPER */}
                    <div className={`flex flex-col gap-4 w-full ${explanation ? 'max-w-4xl md:ml-auto' : 'mx-auto'}`}>
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full">
                            
                            {/* SEARCH BAR */}
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleExplain(searchQuery); }}
                                className={`relative group flex-1 z-10`}
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-amber-950/20 rounded-[3rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                                <input 
                                    type="text" 
                                    placeholder={explanation ? "Nyt opslag..." : "Indtast et begreb eller en paragraf..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-10 pr-40 bg-white border-2 border-amber-100 rounded-[3rem] font-bold text-amber-950 focus:border-amber-950 focus:ring-4 focus:ring-amber-950/5 transition-all outline-none shadow-xl ${explanation ? 'py-5 text-lg' : 'py-8 text-xl'}`}
                                />
                                <button 
                                    type="submit"
                                    disabled={isLoading || !searchQuery.trim()}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 bg-amber-950 text-amber-400 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 ${explanation ? 'h-12 px-6' : 'h-16 px-8'}`}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    {explanation ? 'Søg' : 'Slå op'}
                                </button>
                            </form>

                            {/* VIDEO CALL TO ACTION (INLINE) - SET TO UNDER DEVELOPMENT */}
                            {explanation && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="shrink-0"
                                >
                                    <button 
                                        disabled={true}
                                        className="flex items-center gap-4 px-8 py-5 rounded-[3rem] border-2 bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed transition-all shadow-sm opacity-80"
                                    >
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[11px] font-black uppercase tracking-widest leading-none">Video under udvikling</p>
                                            <p className="text-[8px] opacity-60 font-black uppercase tracking-[0.2em] mt-1 whitespace-nowrap">Kommer snart ✨</p>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>

              </div>


              {!explanation && !isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap items-center justify-center gap-4">
                      <FeatureChip icon={<ScaleIcon className="w-5 h-5"/>} label="Retssikkerhed" onClick={() => handleExplain('Retssikkerhed')} />
                      <FeatureChip icon={<Brain className="w-5 h-5"/>} label="Mentalisering" onClick={() => handleExplain('Mentalisering')} />
                      <FeatureChip icon={<Target className="w-5 h-5"/>} label="Systemisk Teori" onClick={() => handleExplain('Systemisk Teori')} />
                  </motion.div>
              )}
          </div>
      </div>

      {/* CONTENT AREA */}
      <main ref={resultsRef} className="w-full max-w-[1600px] px-6 sm:px-12 pb-40">
          <AnimatePresence mode="wait">
              {isLoading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="py-12 flex flex-col items-center gap-12 max-w-lg mx-auto"
                  >
                      <div className="relative group">
                          <div className="absolute -inset-8 bg-amber-400/20 rounded-full blur-3xl animate-pulse group-hover:bg-amber-400/30 transition-all"></div>
                          <div className="relative w-32 h-32 flex items-center justify-center">
                              <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                  className="absolute inset-0 border-4 border-dashed border-amber-950/10 rounded-full"
                              />
                              <motion.div 
                                  animate={{ rotate: -360 }}
                                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                  className="absolute inset-4 border-2 border-dashed border-amber-400/20 rounded-full"
                              />
                              <div className="w-20 h-20 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center relative z-10 border border-amber-50">
                                  <Brain className="w-10 h-10 text-amber-950" />
                              </div>
                          </div>
                      </div>

                      <div className="space-y-8 w-full">
                          <div className="space-y-2 text-center">
                              <h3 className="text-3xl font-bold text-amber-950 serif">Guiden analyserer...</h3>
                              <p className="text-slate-500 font-medium italic">Vi bygger en pædagogisk bro mellem begreb og virkelighed.</p>
                          </div>

                          <div className="space-y-4">
                              {[
                                  { step: 1, label: 'Analyserer begrebets kerne' },
                                  { step: 2, label: 'Indhenter teori og litteratur' },
                                  { step: 3, label: 'Forbinder til praksis' },
                                  { step: 4, label: 'Syntetiserer forklaring' }
                              ].map((s) => (
                                  <div key={s.step} className={`flex items-center gap-4 transition-all duration-500 ${searchProgress.step >= s.step ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-y-2'}`}>
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold ${searchProgress.step > s.step ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : searchProgress.step === s.step ? 'bg-amber-950 text-amber-400 animate-pulse shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                          {searchProgress.step > s.step ? <Check className="w-4 h-4" /> : s.step}
                                      </div>
                                      <span className={`text-xs font-black uppercase tracking-widest ${searchProgress.step === s.step ? 'text-amber-950' : 'text-slate-400'}`}>{s.label}</span>
                                  </div>
                              ))}
                          </div>

                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <motion.div 
                                  className="h-full bg-amber-950"
                                  initial={{ width: "0%" }}
                                  animate={{ width: `${(searchProgress.step / 4) * 100}%` }}
                                />
                          </div>
                      </div>
                  </motion.div>
              ) : limitError ? (
                  <motion.div 
                    key="limit"
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-amber-50 p-12 rounded-[4rem] text-center space-y-8 border-2 border-dashed border-amber-200"
                  >
                      <Lock className="w-12 h-12 text-amber-400 mx-auto" />
                      <div className="space-y-2">
                        <h3 className="text-3xl font-bold text-amber-950 serif underline decoration-amber-400 underline-offset-8">Dagens grænse nået</h3>
                        <p className="text-slate-500 font-medium">{limitError}</p>
                      </div>
                      <Link href="/upgrade">
                        <Button size="lg" className="rounded-2xl h-14 px-12 bg-amber-950 text-amber-400 shadow-xl hover:shadow-amber-950/20">Lås helt op her</Button>
                      </Link>
                  </motion.div>
              ) : explanation ? (
                  <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                      
                      {/* 360 DASHBOARD VIEW */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          
                          {/* COLUMN 1: DEFINITION & ETYMOLOGY */}
                          <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                              <section className="bg-white p-10 md:p-14 rounded-[4rem] border border-amber-100 shadow-sm relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-12 w-48 h-48 bg-amber-50 rounded-full translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-110" />
                                  <div className="relative z-10 space-y-8">
                                      <div className="flex items-center gap-3 border-b border-amber-50 pb-6">
                                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shadow-inner"><Info className="w-4 h-4" /></div>
                                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-950/40">Pædagogisk Definition</h3>
                                      </div>
                                      <div className="prose prose-amber prose-lg max-w-none text-slate-700 leading-relaxed font-medium selection:bg-amber-100" dangerouslySetInnerHTML={{ __html: explanation.definition }} />
                                      
                                      {explanation.etymology && (
                                        <div className="pt-8 border-t border-amber-50">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-2">
                                                <History className="w-3 h-3" /> Oprindelse & Historik
                                            </h4>
                                            <p className="text-sm text-slate-500 italic leading-relaxed">{explanation.etymology}</p>
                                        </div>
                                      )}
                                  </div>
                              </section>

                              {!analogy && !isGettingAnalogy && (
                                <button 
                                    onClick={handleGetAnalogy}
                                    className="w-full p-8 bg-amber-50 border border-amber-200 rounded-[2.5rem] flex items-center gap-6 text-amber-900 font-bold hover:bg-amber-100 transition-all shadow-sm group"
                                >
                                    <div className="w-12 h-12 bg-amber-950 rounded-2xl flex items-center justify-center text-amber-400 group-hover:rotate-12 transition-transform"><MessageSquare className="w-5 h-5" /></div>
                                    <div className="text-left">
                                        <p className="text-sm">Stadig svært at forstå?</p>
                                        <p className="text-[10px] uppercase tracking-widest text-amber-900/40">Få en hverdags-analogi</p>
                                    </div>
                                </button>
                              )}

                              {analogy && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-amber-950 p-10 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                                    <Quote className="absolute top-0 right-0 w-32 h-32 text-white/5 -translate-y-4 translate-x-4" />
                                    <h4 className="text-lg font-bold serif flex items-center gap-3"><Quote className="w-5 h-5 text-amber-400 fill-current" /> Analogi</h4>
                                    <div className="prose prose-invert prose-sm text-amber-100/80 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: analogy }} />
                                </motion.div>
                              )}

                               {explanation.legalContext && (
                                <motion.section 
                                    initial={{ opacity: 0, scale: 0.98 }} 
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-amber-950 p-10 md:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group"
                                >
                                    <ScaleIcon className="absolute top-0 right-0 w-48 h-48 text-white/5 -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                                            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-amber-950 shadow-lg"><ScaleIcon className="w-4 h-4" /></div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">Juridisk Grundlag</h3>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="px-4 py-1.5 bg-amber-400 text-amber-950 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-amber-400/20">{explanation.legalContext.lawTitle}</div>
                                                <span className="text-2xl font-black serif italic text-amber-100">{explanation.legalContext.paragraphNumber}</span>
                                            </div>
                                            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] italic text-sm text-amber-50/80 leading-relaxed font-serif backdrop-blur-sm">
                                               "{explanation.legalContext.exactText}"
                                            </div>
                                            <div className="flex items-start gap-4 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Zap className="w-3.5 h-3.5" /></div>
                                                <p className="text-[11px] text-white/60 font-medium italic leading-relaxed">{explanation.legalContext.relevance}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.section>
                               )}
                          </div>

                          {/* COLUMN 2: RELEVANCE & REFLECTION */}
                          <div className="lg:col-span-6 xl:col-span-3 space-y-8 self-stretch">
                              <section className="bg-slate-50/50 p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative group hover:bg-white hover:shadow-xl transition-all h-full flex flex-col">
                                  <div className="flex items-center gap-3 border-b border-slate-200 pb-6 mb-8">
                                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-700 shadow-sm"><Target className="w-4 h-4" /></div>
                                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Socialfaglig Praksis</h3>
                                  </div>
                                  <div className="prose prose-slate prose-sm max-w-none text-slate-600 font-medium flex-grow" dangerouslySetInnerHTML={{ __html: explanation.relevance }} />
                                  
                                  {explanation.criticalReflection && (
                                    <div className="mt-12 pt-8 border-t border-slate-200">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
                                            <Brain className="w-3 h-3" /> Kritisk Refleksion
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium italic leading-relaxed">{explanation.criticalReflection}</p>
                                    </div>
                                  )}
                              </section>
                          </div>

                          {/* COLUMN 3: CASE & JURA */}
                          <div className="lg:col-span-6 xl:col-span-4 space-y-8">
                              <section className="bg-amber-50/20 p-10 rounded-[3.5rem] border border-amber-100 shadow-sm relative group hover:shadow-xl transition-all">
                                  <div className="flex items-center gap-3 border-b border-amber-100 pb-6 mb-8">
                                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-900 shadow-inner"><Zap className="w-4 h-4" /></div>
                                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-950/20">Virkeligheden som case</h3>
                                  </div>
                                  <div className="prose prose-amber prose-sm max-w-none text-slate-700 font-serif leading-relaxed italic mb-8" dangerouslySetInnerHTML={{ __html: explanation.practicalExample }} />
                                  
                                  {explanation.legalAnchor && (
                                    <div className="p-6 bg-white rounded-3xl border border-amber-100 shadow-sm flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700"><ScaleIcon className="w-5 h-5" /></div>
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-900/40">Juridisk Forankring</h4>
                                            <p className="text-[11px] font-black text-emerald-950">{explanation.legalAnchor}</p>
                                        </div>
                                    </div>
                                  )}
                              </section>
                              
                              {explanation.socraticQuestion && (
                                <section className="p-10 bg-amber-950 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                                    <Sparkles className="absolute top-0 right-0 w-32 h-32 text-amber-400/10 -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4">Udfordring til dig</h4>
                                    <p className="text-sm font-medium serif italic opacity-90 leading-relaxed">"{explanation.socraticQuestion}"</p>
                                </section>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                  <button onClick={() => window.print()} className="p-6 bg-white border border-amber-50 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-amber-50 transition-all font-bold text-slate-400 group">
                                      <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] uppercase tracking-widest">Del / Print</span>
                                  </button>
                                  <button className="p-6 bg-white border border-amber-50 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-amber-50 transition-all font-bold text-slate-400 group">
                                      <Bookmark className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] uppercase tracking-widest">Gem</span>
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* BOTTOM ROW: KNOWLEDGE DISCOVERY */}
                      <div className="pt-12 border-t border-amber-100">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-950/20 mb-12 text-center">Vidensbank & Fordybelse</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              
                               {/* RELATED CONCEPTS */}
                               {explanation.relatedConcepts && explanation.relatedConcepts.length > 0 && (
                                  <section className="space-y-6">
                                      <div className="flex items-center gap-3 px-6">
                                          <Sparkles className="w-4 h-4 text-amber-500" />
                                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relaterede Begreber</h4>
                                      </div>
                                      <div className="flex flex-wrap gap-2 px-6">
                                          {explanation.relatedConcepts.map((concept, i) => (
                                              <button 
                                                key={i} 
                                                onClick={() => handleExplain(concept)}
                                                className="px-4 py-2 bg-white border border-amber-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-950 hover:bg-amber-950 hover:text-white transition-all shadow-sm"
                                              >
                                                  {concept}
                                              </button>
                                          ))}
                                      </div>
                                  </section>
                               )}

                              {/* LITERATURE */}
                              <section className="space-y-6">
                                  <div className="flex items-center gap-3 px-6">
                                      <Book className="w-4 h-4 text-emerald-600" />
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relevant Pensum</h4>
                                  </div>
                                  <div className="space-y-4">
                                      {explanation.suggestedLiterature?.map((lit, i) => (
                                          <div key={i} className="p-8 bg-white rounded-[2.5rem] border border-amber-100 shadow-sm hover:translate-x-1 transition-transform">
                                              <h5 className="text-md font-bold text-amber-950 serif">{lit.title}</h5>
                                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">af {lit.author}</p>
                                              <p className="text-xs text-slate-500 italic">"{lit.relevance}"</p>
                                          </div>
                                      ))}
                                  </div>
                              </section>

                              {/* THEORISTS */}
                              <section className="space-y-6">
                                  <div className="flex items-center gap-3 px-6">
                                      <GraduationCap className="w-4 h-4 text-purple-600" />
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Centrale Teoretikere</h4>
                                  </div>
                                  <div className="space-y-4">
                                      {explanation.relevantTheorists?.map((theorist, i) => (
                                          <div key={i} className="p-8 bg-purple-50/10 rounded-[2.5rem] border border-purple-100 shadow-sm hover:translate-x-1 transition-transform">
                                              <h5 className="text-md font-bold text-amber-950 serif">{theorist.name} <span className="text-[9px] font-black text-purple-400 tracking-widest ml-2">{theorist.era}</span></h5>
                                              <p className="text-xs text-slate-500 font-medium leading-relaxed font-serif mt-2">"{theorist.contribution}"</p>
                                          </div>
                                      ))}
                                  </div>
                              </section>

                              {/* RESEARCH */}
                              {viveArticles.length > 0 && (
                                  <section className="space-y-6">
                                      <div className="flex items-center gap-3 px-6">
                                          <Building className="w-4 h-4 text-cyan-600" />
                                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aktuel Forskning (VIVE)</h4>
                                      </div>
                                      <div className="grid gap-4">
                                          {viveArticles.map(art => (
                                              <a key={art.id} href={art.url} target="_blank" className="p-6 bg-cyan-50/20 border border-cyan-100 rounded-3xl hover:bg-white transition-all flex items-center justify-between group">
                                                  <h6 className="text-xs font-bold text-amber-950 line-clamp-2 leading-snug flex-1">{art.title}</h6>
                                                  <ArrowUpRight className="w-4 h-4 text-cyan-700 opacity-20 group-hover:opacity-100 transition-all ml-4" />
                                              </a>
                                          ))}
                                      </div>
                                  </section>
                              )}
                          </div>
                      </div>
                  </motion.div>
              ) : null}
          </AnimatePresence>
      </main>

      {/* HISTORY OVERLAY */}
      <AnimatePresence>
          {showHistory && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-amber-950/20 backdrop-blur-sm"
              >
                  <div className="w-full max-w-xl bg-white rounded-[4rem] shadow-2xl border border-amber-50 overflow-hidden flex flex-col max-h-[80vh]">
                      <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-amber-950 serif">Dine seneste opslag</h3>
                          <button onClick={() => setShowHistory(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-amber-950 transition-colors"><X className="w-6 h-6"/></button>
                      </div>
                      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                          {userProfile?.recentConcepts?.map((c: string) => (
                              <button 
                                key={c} 
                                onClick={() => { handleExplain(c); setShowHistory(false); }}
                                className="w-full p-6 text-left hover:bg-amber-50 rounded-[2rem] transition-all flex items-center justify-between group"
                              >
                                  <div className="flex items-center gap-6">
                                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-amber-700 shadow-sm transition-all"><BookMarked className="w-5 h-5"/></div>
                                      <span className="text-lg font-bold text-slate-600 group-hover:text-amber-950 transition-colors">{c}</span>
                                  </div>
                                  <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-amber-400 transition-all opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0"/>
                              </button>
                          ))}
                          {(!userProfile?.recentConcepts || userProfile.recentConcepts.length === 0) && (
                              <div className="py-20 text-center space-y-4">
                                  <Clock className="w-12 h-12 text-slate-100 mx-auto" />
                                  <p className="text-slate-400 font-medium italic">Du har ikke foretaget nogen søgninger endnu.</p>
                              </div>
                          )}
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* VIDEO PLAYER OVERLAY */}
      <AnimatePresence>
          {showVideoPlayer && videoScript && (
              <ConceptVideoPlayer 
                script={videoScript} 
                onClose={() => setShowVideoPlayer(false)} 
              />
          )}
      </AnimatePresence>

    </div>

  );
};

export default function ConceptExplainerPage() {
    const { user, isUserLoading, userProfile } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace(`/?callbackUrl=${encodeURIComponent(pathname || '/')}`);
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user || !userProfile) {
        return <AuthLoadingScreen />;
    }

    return (
      <Suspense fallback={<AuthLoadingScreen />}>
        <ConceptExplainerPageContent />
      </Suspense>
    );
}