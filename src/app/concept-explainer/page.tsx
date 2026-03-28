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
  Play,
  Gavel
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
                  <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-12">
                      
                      {/* TAB NAVIGATION */}
                      <div className="flex items-center justify-center p-2 bg-white/50 backdrop-blur-xl border border-amber-100/50 rounded-[2.5rem] max-w-2xl mx-auto sticky top-24 z-40 shadow-xl shadow-amber-950/5">
                          {[
                              { id: 'explanation', label: 'Overblik', icon: Brain },
                              { id: 'relevance', label: 'Praksis', icon: Target },
                              { id: 'case', label: 'Jura', icon: ScaleIcon },
                              { id: 'sources', label: 'Vidensbank', icon: Library },
                          ].map((tab) => (
                              <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id as any)}
                                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                                      activeTab === tab.id 
                                          ? 'bg-amber-950 text-amber-400 shadow-lg scale-[1.02]' 
                                          : 'text-slate-400 hover:text-amber-950 hover:bg-amber-50'
                                  }`}
                              >
                                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                                  <span className="hidden sm:block">{tab.label}</span>
                              </button>
                          ))}
                      </div>

                      <AnimatePresence mode="wait">
                          <motion.div
                              key={activeTab}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="w-full"
                          >
                            {activeTab === 'explanation' && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    {/* PRIMARY DEFINITION */}
                                    <div className="lg:col-span-12 xl:col-span-7">
                                        <section className="bg-white p-10 md:p-16 rounded-[4rem] border border-amber-100 shadow-sm relative overflow-hidden group min-h-[400px]">
                                            <div className="absolute top-0 right-0 p-12 w-64 h-64 bg-amber-50 rounded-full translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-110" />
                                            <div className="relative z-10 space-y-10">
                                                <div className="flex items-center gap-3 border-b border-amber-50 pb-8">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-950 border border-amber-100">
                                                        <Info className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-950/40 leading-none">Pædagogisk Definition</h3>
                                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-2 last:mb-0">Essensen af {searchQuery}</p>
                                                    </div>
                                                </div>
                                                <div className="prose prose-amber prose-xl max-w-none text-slate-700 leading-relaxed font-medium selection:bg-amber-100 serif" dangerouslySetInnerHTML={{ __html: explanation.definition }} />
                                            </div>
                                        </section>
                                    </div>

                                    {/* SIDEBAR: ETYMOLOGY & ANALOGY */}
                                    <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                                        {explanation.etymology && (
                                            <section className="bg-amber-50/30 p-10 rounded-[3rem] border border-amber-100 shadow-sm">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-950/40 mb-6 flex items-center gap-2">
                                                    <History className="w-3.5 h-3.5" /> Oprindelse & Kontext
                                                </h4>
                                                <div className="text-sm text-slate-600 italic leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: explanation.etymology }} />
                                            </section>
                                        )}

                                        {!analogy && !isGettingAnalogy ? (
                                            <button 
                                                onClick={handleGetAnalogy}
                                                className="w-full p-10 bg-white border-2 border-dashed border-amber-200 rounded-[3rem] flex items-center gap-6 text-amber-950 font-bold hover:bg-amber-50 hover:border-amber-950/20 transition-all group"
                                            >
                                                <div className="w-14 h-14 bg-amber-950 rounded-2xl flex items-center justify-center text-amber-400 group-hover:rotate-12 transition-transform shadow-lg shadow-amber-950/20">
                                                    <MessageSquare className="w-6 h-6" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-lg serif italic">Stadig svært at forstå?</p>
                                                    <p className="text-[10px] uppercase tracking-widest text-amber-600 font-black mt-1">Få en pædagogisk analogi</p>
                                                </div>
                                            </button>
                                        ) : isGettingAnalogy ? (
                                            <div className="w-full p-12 bg-amber-50 rounded-[3rem] flex flex-col items-center justify-center gap-4 border border-amber-100 animate-pulse">
                                                <Loader2 className="w-8 h-8 text-amber-950 animate-spin" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-950/40">Syntetiserer analogi...</p>
                                            </div>
                                        ) : analogy && (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-amber-950 p-12 rounded-[3.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden group">
                                                <Quote className="absolute top-0 right-0 w-40 h-40 text-white/5 -translate-y-6 translate-x-6 group-hover:rotate-12 transition-transform" />
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-amber-950"><Quote className="w-4 h-4 fill-current" /></div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-400">Hverdags-analogi</h4>
                                                </div>
                                                <div className="prose prose-invert prose-lg text-amber-50/90 italic leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: analogy }} />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'relevance' && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    {/* CORE RELEVANCE */}
                                    <div className="lg:col-span-12 xl:col-span-8">
                                        <section className="bg-white p-12 md:p-20 rounded-[4rem] border border-amber-100 shadow-sm relative overflow-hidden h-full">
                                            <div className="flex items-center gap-4 mb-12">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-950 text-amber-400 flex items-center justify-center shadow-xl shadow-amber-950/20">
                                                    <Target className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-amber-950 serif tracking-tight">Socialfaglig Praksis</h3>
                                                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">Hvordan begrebet anvendes i virkeligheden</p>
                                                </div>
                                            </div>
                                            <div className="prose prose-amber prose-lg max-w-none text-slate-700 font-medium leading-[2] mb-16" dangerouslySetInnerHTML={{ __html: explanation.relevance }} />
                                            
                                            {explanation.practicalExample && (
                                                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 relative group transition-all hover:bg-white hover:shadow-xl">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm transition-all group-hover:text-amber-950"><Zap className="w-4 h-4" /></div>
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Case Eksempel</h4>
                                                    </div>
                                                    <div className="prose prose-slate prose-lg text-slate-600 italic font-serif leading-relaxed" dangerouslySetInnerHTML={{ __html: explanation.practicalExample }} />
                                                </div>
                                            )}
                                        </section>
                                    </div>

                                    {/* REFLECTION & CHALLENGE */}
                                    <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                                        {explanation.criticalReflection && (
                                            <section className="bg-amber-950 p-12 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden group">
                                                <Brain className="absolute top-0 right-0 w-32 h-32 text-white/5 -translate-y-4 translate-x-4 transition-transform group-hover:scale-110" />
                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 backdrop-blur-md">
                                                        <BrainCircuit className="w-5 h-5" />
                                                    </div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-400">Kritisk Refleksion</h4>
                                                </div>
                                                <div className="text-amber-50/80 font-medium italic leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: explanation.criticalReflection }} />
                                            </section>
                                        )}

                                        {explanation.socraticQuestion && (
                                            <section className="p-12 bg-white border-2 border-amber-950 rounded-[3.5rem] shadow-2xl relative group">
                                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-950 text-amber-400 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                                                    <Sparkles className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-950/40 mb-6 mt-4">Udfordring til din faglighed</h4>
                                                <p className="text-xl serif italic text-amber-950 leading-relaxed" dangerouslySetInnerHTML={{ __html: `"${explanation.socraticQuestion}"` }} />
                                            </section>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'case' && (
                                <div className="max-w-6xl mx-auto space-y-12">
                                    {explanation.legalContext ? (
                                        <section className="bg-amber-950 p-12 md:p-20 rounded-[5rem] text-white shadow-2xl relative overflow-hidden group">
                                            <ScaleIcon className="absolute top-0 right-0 w-[500px] h-[500px] text-white/5 -translate-y-20 translate-x-20 group-hover:scale-105 transition-transform duration-1000" />
                                            <div className="relative z-10 space-y-12">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/10 pb-12">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 rounded-[2rem] bg-amber-400 text-amber-950 flex items-center justify-center shadow-2xl shadow-amber-400/20">
                                                            <ScaleIcon className="w-8 h-8" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-3xl font-black serif tracking-tight">Juridisk Grundlag</h3>
                                                            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-2">{explanation.legalContext.lawTitle}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-xl">
                                                        <span className="text-xs font-black uppercase tracking-widest text-white/40">Paragraf</span>
                                                        <span className="text-4xl font-black serif italic text-amber-100">{explanation.legalContext.paragraphNumber}</span>
                                                    </div>
                                                </div>

                                                <div className="grid lg:grid-cols-2 gap-12">
                                                    <div className="space-y-8">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Lovens ordlyd</h4>
                                                        <div 
                                                            className="p-10 bg-white/5 border border-white/10 rounded-[4rem] text-lg text-amber-50/90 leading-relaxed font-serif italic backdrop-blur-md"
                                                            dangerouslySetInnerHTML={{ __html: `"${explanation.legalContext.exactText}"` }}
                                                        />
                                                    </div>
                                                    <div className="space-y-8">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Juridisk Relevans</h4>
                                                        <div className="text-xl text-white/80 font-medium leading-relaxed tracking-tight" dangerouslySetInnerHTML={{ __html: explanation.legalContext.relevance }} />
                                                        
                                                        {explanation.legalAnchor && (
                                                            <div className="p-8 bg-amber-400 text-amber-950 rounded-[3rem] shadow-xl flex items-center gap-6">
                                                                <div className="w-12 h-12 bg-amber-950 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                                                                    <Gavel className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-[9px] font-black uppercase tracking-widest opacity-60">Juridisk Forankring</h5>
                                                                    <div className="text-lg font-black leading-tight" dangerouslySetInnerHTML={{ __html: explanation.legalAnchor }} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    ) : (
                                        <div className="p-20 bg-white border border-dashed border-amber-200 rounded-[5rem] text-center space-y-6">
                                            <ScaleIcon className="w-16 h-16 text-amber-100 mx-auto" />
                                            <h3 className="text-2xl font-black text-amber-950 serif">Ingen direkte juridisk kobling</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto font-medium">Dette begreb er primært teoretisk/metodisk og har ikke en direkte tilknytning til en specifik lovparagraf.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'sources' && (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {/* LITERATURE */}
                                        <section className="space-y-8 bg-white p-12 rounded-[4rem] border border-amber-50 shadow-sm">
                                            <div className="flex items-center gap-4 border-b border-amber-50 pb-8">
                                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                                                    <Book className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Relevant Pensum</h4>
                                            </div>
                                            <div className="space-y-6">
                                                {explanation.suggestedLiterature?.map((lit, i) => (
                                                    <div key={i} className="group cursor-default">
                                                        <h5 className="text-lg font-bold text-amber-950 serif group-hover:text-amber-600 transition-colors">{lit.title}</h5>
                                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">af {lit.author}</p>
                                                        <div className="text-xs text-slate-500 italic mt-4 leading-relaxed p-4 bg-slate-50 rounded-2xl border border-slate-100" dangerouslySetInnerHTML={{ __html: `"${lit.relevance}"` }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* THEORISTS */}
                                        <section className="space-y-8 bg-white p-12 rounded-[4rem] border border-amber-50 shadow-sm">
                                            <div className="flex items-center gap-4 border-b border-amber-50 pb-8">
                                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                                                    <GraduationCap className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Centrale Teoretikere</h4>
                                            </div>
                                            <div className="space-y-8">
                                                {explanation.relevantTheorists?.map((theorist, i) => (
                                                    <div key={i} className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <h5 className="text-lg font-bold text-amber-950 serif">{theorist.name}</h5>
                                                            <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-2 py-1 rounded-lg uppercase tracking-widest">{theorist.era}</span>
                                                        </div>
                                                        <div className="text-sm text-slate-600 font-medium leading-relaxed font-serif bg-purple-50/30 p-6 rounded-3xl border border-purple-100/30" dangerouslySetInnerHTML={{ __html: theorist.contribution }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* RESEARCH & EXTRAS */}
                                        <div className="space-y-8">
                                            {viveArticles.length > 0 && (
                                                <section className="space-y-8 bg-cyan-950 p-12 rounded-[4rem] text-white shadow-xl relative overflow-hidden group">
                                                    <Building className="absolute top-0 right-0 w-32 h-32 text-white/5 -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform" />
                                                    <div className="flex items-center gap-4 border-b border-white/10 pb-8">
                                                        <div className="w-12 h-12 bg-cyan-400 text-cyan-950 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-400/20">
                                                            <Building className="w-6 h-6" />
                                                        </div>
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400">VIVE Forskning</h4>
                                                    </div>
                                                    <div className="grid gap-4">
                                                        {viveArticles.map(art => (
                                                            <a key={art.id} href={art.url} target="_blank" className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white hover:text-cyan-950 transition-all flex items-center justify-between group/link">
                                                                <h6 className="text-[11px] font-bold line-clamp-2 leading-snug flex-1">{art.title}</h6>
                                                                <ArrowUpRight className="w-4 h-4 text-cyan-400 opacity-40 group-hover/link:opacity-100 transition-all ml-4" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {/* RELATED CONCEPTS */}
                                            {explanation.relatedConcepts && (
                                                <section className="bg-white p-12 rounded-[4rem] border border-amber-50 shadow-sm">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 border-b border-amber-50 pb-4">Fortsæt din udforskning</h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {explanation.relatedConcepts.map((concept, i) => (
                                                            <button 
                                                                key={i} 
                                                                onClick={() => handleExplain(concept)}
                                                                className="px-5 py-3 bg-amber-50 text-amber-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-950 hover:text-white transition-all border border-amber-100/50"
                                                            >
                                                                {concept}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                          </motion.div>
                      </AnimatePresence>

                      {/* PERSISTENT ACTION BAR - FLOATING AT BOTTOM */}
                      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-2xl px-8 py-5 rounded-[3rem] border border-amber-100 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] z-50">
                          <button onClick={() => window.print()} className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20">
                              <Share2 className="w-4 h-4" />
                              <span className="hidden sm:block">Print Notat</span>
                          </button>
                          <div className="w-[1px] h-6 bg-slate-200" />
                          <button className="p-3 bg-amber-50 text-amber-900 rounded-full hover:bg-amber-100 transition-all active:scale-90">
                              <Bookmark className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all active:scale-90"
                          >
                              <ArrowUpRight className="w-5 h-5 -rotate-45" />
                          </button>
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