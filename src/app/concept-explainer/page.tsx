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
  Minimize
} from 'lucide-react';

import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc, writeBatch, increment, collection, serverTimestamp, query, orderBy, limit, DocumentData } from 'firebase/firestore';
import { explainConceptAction, explainConceptWithAnalogyAction, fetchVivePublicationsAction } from '@/app/actions';
import type { Explanation, VivePublication } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from 'framer-motion';

const Paywall: React.FC<{ featureName: string }> = ({ featureName }) => (
    <div className="relative mt-8 p-8 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-[2.5rem] text-center shadow-inner">
        <div className="relative z-10">
            <Lock className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h4 className="font-bold text-amber-950 text-lg">Lås op for {featureName}</h4>
            <p className="text-sm text-slate-500 mt-2 mb-6 max-w-xs mx-auto italic leading-relaxed">Dette afsnit er kun tilgængeligt for Kollega+ medlemmer.</p>
            <Link href="/upgrade">
                <Button size="lg" className="group h-12 px-8 rounded-xl shadow-lg shadow-amber-950/10">
                    Opgrader nu
                    <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
            </Link>
        </div>
    </div>
);

function ConceptExplainerPageContent() {
  const { user, userProfile, refetchUserProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedConceptTerm, setSelectedConceptTerm] = useState<string | null>(null);
  
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isGettingAnalogy, setIsGettingAnalogy] = useState(false);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [viveArticles, setViveArticles] = useState<VivePublication[]>([]);
  const [isLoadingVive, setIsLoadingVive] = useState(false);

  const [analogy, setAnalogy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(0);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isContextSidebarOpen, setIsContextSidebarOpen] = useState(false); // Default to closed on small screens
  const [isFocusMode, setIsFocusMode] = useState(false);

  const isPremium = useMemo(() => !!userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership), [userProfile]);
  
  const booksQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'books')) : null), [firestore]);
  const { data: books } = useCollection<DocumentData>(booksQuery);

  const allKeywords = useMemo(() => {
    if (!books) return [];
    const keywordSet = new Set<string>();
    books.forEach(book => {
        if (book.RAG && typeof book.RAG === 'string') {
            try {
                const parsed = JSON.parse(book.RAG);
                if (Array.isArray(parsed)) {
                    parsed.forEach(k => {
                        if (typeof k === 'string') keywordSet.add(k.trim());
                    });
                }
            } catch (e) {
                book.RAG.split(/[\n,]/).forEach((k: string) => {
                    const trimmed = k.trim();
                    if (trimmed) keywordSet.add(trimmed);
                });
            }
        }
    });
    return Array.from(keywordSet).sort((a, b) => a.localeCompare(b, 'da'));
  }, [books]);

  const handleExplain = useCallback(async (term: string) => {
    if (!term) return;

    setSelectedConceptTerm(term);
    setExplanation(null);
    setAnalogy(null);
    setViveArticles([]);
    setError(null);
    setLimitError(null);
    setIsLoadingExplanation(true);
    setIsLoadingVive(true);
    setShowSuggestions(false);

    if (!user || !userProfile || !firestore) return;
    
    const userRef = doc(firestore, 'users', user.uid);

    // Perform limit check
    if (userProfile.membership === 'Kollega') {
        const getDailyCount = (lastUsage?: any, dailyCount?: number) => {
            if (!lastUsage) return 0;
            const today = new Date();
            const lastUsageDate = lastUsage.toDate();
            return lastUsageDate.toDateString() === today.toDateString() ? dailyCount || 0 : 0;
        };

        const count = getDailyCount(userProfile.lastConceptExplainerUsage, userProfile.dailyConceptExplainerCount);
        
        if (count >= 3) {
            setLimitError('Du har brugt dine 3 gratis opslag for i dag. Opgrader til Kollega+ for ubegrænset sparring.');
            setIsLoadingExplanation(false);
            setIsLoadingVive(false);
            return;
        }
    }

    // Fetch VIVE articles
    fetchVivePublicationsAction({ searchTerm: term, limit: 3 })
        .then(res => setViveArticles(res.publications))
        .catch(err => console.error("Failed to fetch VIVE articles", err))
        .finally(() => setIsLoadingVive(false));

    // Check cache
    const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9æøå-]/g, '-');
    const explanationDocRef = doc(firestore, 'conceptExplanations', normalizedTerm);
    
    try {
        const docSnap = await getDoc(explanationDocRef);
        if (docSnap.exists()) {
            setExplanation(docSnap.data().explanation as Explanation);
            setIsLoadingExplanation(false);
        } else {
            const response = await explainConceptAction({ concept: term });
            setExplanation(response.data);
            await setDoc(explanationDocRef, {
                conceptName: term,
                explanation: response.data,
                createdAt: serverTimestamp()
            });
        }

        // Update user stats
        const batch = writeBatch(firestore);
        // @ts-ignore
        const currentRecent = userProfile?.recentConcepts || [];
        const updatedRecent = [term, ...currentRecent.filter((t: string) => t !== term)].slice(0, 10);
        
        batch.update(userRef, {
            lastConceptExplainerUsage: serverTimestamp(),
            dailyConceptExplainerCount: increment(1),
            recentConcepts: updatedRecent
        });

        const activityRef = doc(collection(firestore, 'userActivities'));
        batch.set(activityRef, {
            userId: user.uid,
            userName: userProfile.username || user.displayName || 'En bruger',
            actionText: `slog begrebet "${term}" op i Guiden.`,
            createdAt: serverTimestamp()
        });
        await batch.commit();
        await refetchUserProfile();

    } catch (err) {
        console.error(err);
        setError('Kunne ikke hente forklaring. Prøv igen.');
    } finally {
        setIsLoadingExplanation(false);
    }
  }, [user, firestore, userProfile, refetchUserProfile, toast]);

  useEffect(() => {
    const termFromUrl = searchParams.get('term');
    if (termFromUrl) {
      const decodedTerm = decodeURIComponent(termFromUrl);
      if (decodedTerm !== searchQuery) {
        setSearchQuery(decodedTerm);
        handleExplain(decodedTerm);
        router.replace('/concept-explainer', { scroll: false });
      }
    }
  }, [searchParams, router, handleExplain, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length > 1) {
        setSuggestions(allKeywords.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0, 5));
        setShowSuggestions(true);
    } else {
        setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setSearchQuery(term);
    handleExplain(term);
  };

  const handleGetAnalogy = async () => {
    if (!explanation || !selectedConceptTerm) return;
    setIsGettingAnalogy(true);
    try {
        const response = await explainConceptWithAnalogyAction({
            conceptName: selectedConceptTerm,
            definition: explanation.definition
        });
        setAnalogy(response.data.analogy);
    } catch(err) {
        toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke hente analogi." });
    } finally {
        setIsGettingAnalogy(false);
    }
  };

  const handleCopyCitation = (e: React.MouseEvent, id: string, apa: string) => {
    e.preventDefault();
    e.stopPropagation();
    const plainText = apa.replace(/<[^>]*>?/gm, '');
    navigator.clipboard.writeText(plainText);
    setCopiedId(id);
    toast({ title: "Kopieret til udklipsholder" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 selection:bg-amber-100 overflow-x-hidden">
      
      {/* SIDEBAR: HISTORY & RECENT */}
      <aside className={`w-72 bg-white border-r border-amber-100 flex flex-col sticky top-0 h-screen z-30 shadow-sm ${isFocusMode ? 'hidden' : 'hidden lg:flex'}`}>
        <div className="p-8 flex items-center gap-4 border-b border-amber-50">
            <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-lg"><Wand2 className="w-6 h-6" /></div>
            <div>
                <h1 className="text-xl font-bold text-amber-950 serif tracking-tight">Guiden</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Begrebs-Arkiv</p>
            </div>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 mb-4">Dine seneste opslag</h3>
            {/* @ts-ignore */}
            {userProfile?.recentConcepts?.map((c: string) => (
                <button key={c} onClick={() => handleExplain(c)} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${selectedConceptTerm === c ? 'bg-amber-100 text-amber-950 shadow-sm' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-950'}`}>
                    <span className="truncate">{c}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${selectedConceptTerm === c ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                </button>
            ))}
            {/* @ts-ignore */}
            {(!userProfile?.recentConcepts || userProfile.recentConcepts.length === 0) && (
                <p className="px-4 py-8 text-xs text-slate-400 italic">Dine søgninger vil blive vist her.</p>
            )}
        </nav>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative custom-scrollbar">
        <header className="h-24 bg-white/90 backdrop-blur-xl border-b border-amber-100 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 shadow-sm">
            <form onSubmit={(e) => { e.preventDefault(); handleExplain(searchQuery); }} className="flex items-center gap-4 sm:gap-6 flex-1 max-w-3xl relative">
                <div ref={searchContainerRef} className="relative flex-1 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-1000"></div>
                    <div className="relative bg-[#FDFCF8] border border-amber-100 rounded-2xl shadow-sm group-focus-within:shadow-xl group-focus-within:border-amber-950 group-focus-within:scale-[1.01] transition-all duration-300 overflow-hidden">
                        <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 h-5 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Hvad vil du have forklaret?"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                            className="w-full pl-11 sm:pl-14 pr-10 sm:pr-12 py-3 sm:py-4 bg-transparent text-sm sm:text-base font-bold text-amber-950 focus:outline-none placeholder:text-slate-300" 
                        />
                        {searchQuery && (
                            <button 
                                type="button" 
                                onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-amber-950 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-3 bg-white border border-amber-100 rounded-2xl shadow-2xl z-50 p-3 overflow-hidden animate-ink"
                            >
                                <p className="px-4 py-2 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-amber-50 mb-2">Foreslåede begreber</p>
                                {suggestions.map((s, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleSuggestionClick(s)} 
                                        className="w-full text-left px-4 py-3 hover:bg-amber-50 rounded-xl transition-all flex items-center gap-4 text-sm font-bold text-slate-600 hover:text-amber-950 group/item"
                                    >
                                        <Sparkles className="w-4 h-4 text-amber-200 group-hover/item:text-amber-500 transition-colors" /> 
                                        {s}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </form>
            <div className="flex items-center gap-2 sm:gap-4 ml-4 sm:ml-8">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                onClick={() => setIsFocusMode(!isFocusMode)}
                                className={`p-2.5 sm:p-3.5 rounded-xl transition-all border shadow-sm active:scale-95 ${isFocusMode ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}
                            >
                                {isFocusMode ? <Minimize className="w-4 h-4 sm:w-5 h-5" /> : <Maximize className="w-4 h-4 sm:w-5 h-5" />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isFocusMode ? 'Afslut fokus' : 'Fokustilstand'}</p></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                onClick={() => setIsContextSidebarOpen(!isContextSidebarOpen)} 
                                className={`p-2.5 sm:p-3.5 rounded-xl transition-all border shadow-sm active:scale-95 ${isContextSidebarOpen && selectedConceptTerm ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}
                            >
                                <PanelRight className="w-4 h-4 sm:w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isContextSidebarOpen ? 'Skjul sidepanel' : 'Vis sidepanel'}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </header>

        <div className={`p-6 sm:p-8 md:p-16 mx-auto w-full transition-all duration-500 ${isFocusMode ? 'max-w-full' : 'max-w-5xl'}`}>
            <AnimatePresence mode="wait">
                {isLoadingExplanation ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[60vh] flex flex-col items-center justify-center space-y-8">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-amber-950/20" />
                            <Brain className="absolute inset-0 m-auto w-5 h-5 sm:w-6 sm:h-6 text-amber-950 animate-pulse" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl sm:text-2xl font-bold text-amber-950 serif">AI'en tænker...</h3>
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Forbinder begreb med teori og praksis</p>
                        </div>
                    </motion.div>
                ) : limitError ? (
                    <motion.div key="limit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[60vh] flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-[3rem] sm:rounded-[4rem] border-2 border-dashed border-amber-200">
                        <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400 mb-8" />
                        <h3 className="text-2xl sm:text-3xl font-bold text-amber-950 serif mb-4">Daglige opslag brugt</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed italic text-sm sm:text-base">{limitError}</p>
                        <Link href="/upgrade"><Button size="lg" className="rounded-2xl h-12 sm:h-14 px-10 shadow-xl shadow-amber-950/20">Opgrader til Kollega+</Button></Link>
                    </motion.div>
                ) : explanation ? (
                    <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 sm:space-y-16 pb-32">
                        <div className="flex items-center gap-4 sm:gap-6 border-b border-amber-100 pb-8 sm:pb-10">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 text-amber-900 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center shadow-inner shrink-0 group hover:rotate-6 transition-transform duration-500"><Brain className="w-8 h-8 sm:w-10 sm:h-10" /></div>
                            <div>
                                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-amber-950 serif tracking-tight leading-tight">{selectedConceptTerm}</h2>
                                <p className="text-xs sm:text-sm text-slate-400 font-medium italic mt-1 sm:mt-2">Faglig forklaring genereret af Cohéro AI</p>
                            </div>
                        </div>

                        <div className="grid gap-10 sm:gap-16">
                            <section className="space-y-4 sm:space-y-6">
                                <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40 flex items-center gap-2"><Info className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> Definition</h3>
                                <div className="prose prose-amber prose-base sm:prose-lg max-w-none text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: explanation.definition }} />
                            </section>

                            <section className="space-y-4 sm:space-y-6">
                                <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40 flex items-center gap-2"><Target className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> Relevans for praksis</h3>
                                <div className="prose prose-amber prose-base sm:prose-lg max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: explanation.relevance }} />
                            </section>

                            {isPremium ? (
                                <section className="space-y-4 sm:space-y-6">
                                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40 flex items-center gap-2"><Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> Eksempel fra praksis</h3>
                                    <div className="bg-amber-50/50 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] border border-amber-100 shadow-inner relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><Quote className="w-16 h-16 sm:w-24 sm:h-24 rotate-12" /></div>
                                        <div className="relative z-10 prose prose-amber prose-base sm:prose-lg max-w-none text-slate-600 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: explanation.example }} />
                                    </div>
                                </section>
                            ) : (
                                <Paywall featureName="Praksis-eksempler" />
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8 sm:space-y-10">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-amber-50 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center text-amber-200 shadow-inner group transition-transform hover:rotate-6">
                            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                            <h2 className="text-2xl sm:text-4xl font-bold text-amber-950 serif">Slå et begreb op</h2>
                            <p className="text-sm sm:text-lg text-slate-500 max-w-sm mx-auto italic leading-relaxed">Få styr på teorien før din næste case eller opgave.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                            {['Anerkendelse', 'Magtanvendelse', 'Systemisk teori', 'Relationskompetence'].map(tag => (
                                <button key={tag} onClick={() => handleExplain(tag)} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-amber-100 rounded-full text-[10px] sm:text-xs font-bold text-amber-950 hover:border-amber-950 transition-all shadow-sm active:scale-95">{tag}</button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </main>

      {/* CONTEXT SIDEBAR (RIGHT) - Overlay on mobile */}
      <AnimatePresence>
          {isContextSidebarOpen && !isFocusMode && selectedConceptTerm && (
              <>
                {/* Mobile Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setIsContextSidebarOpen(false)}
                    className="fixed inset-0 bg-amber-950/40 backdrop-blur-sm z-[45] lg:hidden"
                />
                <motion.aside 
                    initial={{ opacity: 0, x: 300 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 300 }} 
                    className="fixed lg:sticky right-0 top-0 w-[85vw] sm:w-80 bg-white border-l border-amber-100 flex flex-col h-screen z-[50] shadow-2xl"
                >
                    <div className="p-6 sm:p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40">Faglig Kontekst</h3>
                            <button onClick={() => setIsContextSidebarOpen(false)} className="p-2 text-slate-300 hover:text-amber-950 transition-colors"><X className="w-4 h-4" /></button>
                        </div>

                        {/* ANALOGY CALLOUT */}
                        <section className="bg-amber-950 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-amber-950 shadow-lg group-hover:rotate-6 transition-transform">
                                        <Quote className="w-5 h-5 fill-current" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Svært at forstå?</span>
                                </div>
                                {isGettingAnalogy ? <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-white"/></div> : 
                                analogy ? <div className="prose prose-sm text-amber-50/80 italic leading-relaxed animate-ink text-xs" dangerouslySetInnerHTML={{ __html: analogy }} /> :
                                <>
                                    <p className="text-xs text-amber-100/60 leading-relaxed mb-6 italic">Lad AI'en bruge en hverdags-analogi til at gøre det krystalklart.</p>
                                    <Button onClick={handleGetAnalogy} variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white hover:text-amber-950 text-[10px] h-11 rounded-xl">Forklar mig det anderledes</Button>
                                </>
                                }
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                        </section>

                        {/* LITERATURE & RESEARCH */}
                        {explanation && (
                            <section className="space-y-10">
                                {explanation.suggestedLiterature && explanation.suggestedLiterature.length > 0 && (
                                    <div className="space-y-6">
                                        <h4 className="font-bold text-sm serif flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-700" /> Pensum-Referencer</h4>
                                        <div className="space-y-4">
                                            {explanation.suggestedLiterature.map((lit, i) => (
                                                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group/lit">
                                                    <p className="text-xs font-bold text-amber-950 leading-tight mb-1">{lit.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{lit.author}</p>
                                                    {lit.relevance && <p className="mt-3 text-[10px] italic text-slate-500 leading-relaxed border-l-2 border-amber-200 pl-3">"{lit.relevance}"</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isLoadingVive ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-cyan-600"/></div> : viveArticles.length > 0 && (
                                    <div className="space-y-6">
                                        <h4 className="font-bold text-sm serif flex items-center gap-2"><Building className="w-4 h-4 text-cyan-700" /> Aktuel Forskning (VIVE)</h4>
                                        <div className="space-y-4">
                                            {viveArticles.map((art) => (
                                                <div key={art.id} className="p-4 bg-cyan-50/30 border border-cyan-100 rounded-2xl group/art transition-all hover:bg-white">
                                                    <a href={art.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-950 hover:text-cyan-700 transition-colors line-clamp-2 leading-snug mb-3">{art.title}</a>
                                                    {art.apa && (
                                                        <div className="p-2 bg-white rounded-lg border border-cyan-50 relative group/apa">
                                                            <button onClick={(e) => handleCopyCitation(e, art.id, art.apa!)} className="absolute top-1.5 right-1.5 opacity-0 group-hover/apa:opacity-100 text-cyan-600 hover:text-cyan-900 transition-all">
                                                                {copiedId === art.id ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                                                            </button>
                                                            <div className="text-[8px] text-slate-500 leading-relaxed italic pr-4 select-all" dangerouslySetInnerHTML={{ __html: art.apa }} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {explanation.relevantTheorists && explanation.relevantTheorists.length > 0 && (
                                    <div className="space-y-6">
                                        <h4 className="font-bold text-sm serif flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-purple-600" /> Nøgleteoretikere</h4>
                                        <div className="space-y-4">
                                            {explanation.relevantTheorists.map((t, i) => (
                                                <div key={i} className="p-4 bg-purple-50/30 border border-purple-100 rounded-2xl">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-bold text-amber-950">{t.name}</p>
                                                        <span className="text-[8px] font-black text-slate-300">{t.era}</span>
                                                    </div>
                                                    <p className="text-[10px] italic text-slate-600 leading-relaxed mb-2">"{t.contribution}"</p>
                                                    {t.source && <p className="text-[8px] font-bold text-purple-700 uppercase tracking-tighter">Kilde: {t.source.bookTitle}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </motion.aside>
              </>
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
            router.replace(`/?callbackUrl=${encodeURIComponent(pathname)}`);
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