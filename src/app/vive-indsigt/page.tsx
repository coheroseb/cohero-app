'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Bell,
  BellRing,
  ArrowLeft, 
  Search,
  Loader2, 
  ExternalLink,
  Building,
  ChevronRight,
  Library,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  UploadCloud,
  File,
  X,
  Sparkles,
  MessageSquare,
  Send,
  Lock,
  Wand2,
  Lightbulb,
  Bookmark, 
  BookmarkCheck, 
  Quote,
  Copy,
  Check,
  PanelRight,
  Maximize,
  Minimize,
  History,
  Info
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useDebounce } from 'use-debounce';
import { fetchVivePublicationsAction, getViveReportQaAction, generateReportQuestionsAction, toggleViveAreaFollowAction } from '@/app/actions';
import type { VivePublication, ViveReportQaData } from '@/ai/flows/types';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, deleteDoc, serverTimestamp, writeBatch, increment, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const viveAreas = [
    { id: '93a09ea5-08f3-126c-ab50-7b3fe0e6d789', name: 'Børn, unge og familie' },
    { id: '57a72689-008b-b5df-47f8-b6724c8cea1e', name: 'Socialområdet' },
    { id: '0eca57d7-cd75-42f2-f731-55f82168eb58', name: 'Arbejdsmarked' },
    { id: 'fcd9e3a9-a6dc-14be-1f2f-b3b8a9d00e75', name: 'Dagtilbud, skole og uddannelse' },
    { id: 'ae41bac7-c93e-4b56-f432-ac4da9b51c9e', name: 'Ledelse og implementering' },
    { id: '820b03ed-2b07-8b45-6788-4e3660f2e9a3', name: 'Sundhed' },
    { id: 'e4043962-757e-9d73-ba9d-973dff77651d', name: 'Ældre' },
    { id: '33c01510-2358-5584-3781-ef97af3a97df', name: 'Økonomi og styring' }
];

async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
  const pdfjsVersion = '4.10.38'; 
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({data: new Uint8Array(buffer)});
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => ('str' in item ? item.str : '')).join(' ');
    text += strings + '\n';
  }
  return text;
}

const ViveIndsigtPageContent: React.FC = () => {
    const { user, userProfile, refetchUserProfile } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [publications, setPublications] = useState<VivePublication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeAreaId, setActiveAreaId] = useState<string>('93a09ea5-08f3-126c-ab50-7b3fe0e6d789');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    const [offset, setOffset] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 12;

    const [isContextSidebarOpen, setIsContextSidebarOpen] = useState(true);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Report QA State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [userQuestion, setUserQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [qaHistory, setQaHistory] = useState<{question: string, data: ViveReportQaData}[]>([]);
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const isPremium = useMemo(() => !!userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership), [userProfile]);

    const savedArticlesQuery = useMemoFirebase(() => (
        user && firestore ? query(collection(firestore, 'users', user.uid, 'savedViveArticles')) : null
    ), [user, firestore]);
    const { data: savedArticles } = useCollection(savedArticlesQuery);
    const savedArticleIds = useMemo(() => new Set(savedArticles?.map(a => a.articleId)), [savedArticles]);

    useEffect(() => {
        const loadInitialPublications = async () => {
            setIsLoading(true);
            setError(null);
            setOffset(0);
            setHasMore(true);
            try {
                const data = await fetchVivePublicationsAction({ 
                    searchTerm: debouncedSearchQuery,
                    areaId: activeAreaId,
                    offset: 0,
                    limit: PAGE_SIZE,
                });
                setPublications(data.publications);
                if (data.publications.length < PAGE_SIZE) {
                    setHasMore(false);
                }
            } catch (err: any) {
                setError(err.message || 'Der opstod en fejl under hentning af data.');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialPublications();
    }, [debouncedSearchQuery, activeAreaId]);
    
    const handleLoadMore = async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const newOffset = offset + PAGE_SIZE;

        try {
            const data = await fetchVivePublicationsAction({ 
                searchTerm: debouncedSearchQuery,
                areaId: activeAreaId,
                offset: newOffset,
                limit: PAGE_SIZE,
            });
            
            if (data.publications.length > 0) {
                setPublications(prev => [...prev, ...data.publications]);
                setOffset(newOffset);
            }

            if (data.publications.length < PAGE_SIZE) {
                setHasMore(false);
            }

        } catch (err: any) {
            setError(err.message || 'Der opstod en fejl under hentning af flere data.');
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploadedFile(file);
        setIsExtracting(true);
        setExtractedText(null);
        setQaHistory([]);
        setSuggestedQuestions([]);
        setIsContextSidebarOpen(true);
        
        try {
            const text = await extractTextFromPdf(file);
            setExtractedText(text);
            toast({ title: "Rapport indlæst", description: "Du kan nu stille spørgsmål til indholdet." });
            handleGenerateSuggestions(text);
        } catch (err) {
            console.error("PDF extraction failed", err);
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke læse PDF-filen." });
            setUploadedFile(null);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleGenerateSuggestions = async (text: string) => {
        setIsGeneratingSuggestions(true);
        try {
            const response = await generateReportQuestionsAction({ reportText: text });
            setSuggestedQuestions(response.data.suggestions);
        } catch (err) {
            console.error("Failed to generate suggestions", err);
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    const handleAskQuestion = async (e: React.FormEvent | string) => {
        if (typeof e !== 'string') e.preventDefault();
        const question = typeof e === 'string' ? e : userQuestion;
        
        if (!question.trim() || !extractedText || isAsking || !user || !userProfile || !firestore) return;

        setIsAsking(true);
        try {
            const response = await getViveReportQaAction({
                reportText: extractedText,
                question: question
            });

            setQaHistory(prev => [...prev, { question: question, data: response.data }]);
            if (typeof e !== 'string') setUserQuestion('');
            
            const batch = writeBatch(firestore);
            const userRef = doc(firestore, 'users', user.uid);
            
            const activityRef = doc(collection(firestore, 'userActivities'));
            batch.set(activityRef, {
                userId: user.uid,
                userName: userProfile.username || user.displayName || 'Anonym',
                actionText: `analyserede en VIVE-rapport: "${uploadedFile?.name}".`,
                createdAt: serverTimestamp()
            });

            if (response.usage) {
                const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
                const pointsToAdd = Math.round(totalTokens * 0.05);
                if (pointsToAdd > 0) batch.update(userRef, { cohéroPoints: increment(pointsToAdd) });
                
                const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
                batch.set(tokenUsageRef, { flowName: 'viveReportQaFlow', ...response.usage, totalTokens, createdAt: serverTimestamp(), userId: user.uid, userName: userProfile.username || 'Anonym' });
            }
            await batch.commit();
            await refetchUserProfile();

        } catch (err) {
            console.error("QA error:", err);
            toast({ variant: "destructive", title: "Fejl", description: "AI'en kunne ikke svare i øjeblikket." });
        } finally {
            setIsAsking(false);
        }
    };

    const handleToggleFollowArea = async (e: React.MouseEvent, areaId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !userProfile) return;

        try {
            const result = await toggleViveAreaFollowAction(user.uid, areaId);
            if (result.success) {
                await refetchUserProfile();
                toast({
                    title: result.followed ? "Område fulgt!" : "Ikke længere fulgt",
                    description: result.followed ? "Du modtager nu en notifikation, når der kommer nye udgivelser i dette område." : "Du modtager ikke længere automatiske opdateringer herfra."
                });
            } else {
                console.error("Follow error:", result.message);
                toast({ variant: 'destructive', title: "Fejl", description: result.message || "Kunne ikke opdatere abonnement." });
            }
        } catch (err) {
            toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke opdatere abonnement." });
        }
    };

    const isFollowingArea = (areaId: string) => {
        return userProfile?.followedViveAreas?.includes(areaId) || false;
    };

    const handleToggleSave = async (e: React.MouseEvent, pub: VivePublication) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !firestore) return;

        const articleRef = doc(firestore, 'users', user.uid, 'savedViveArticles', pub.id);
        const isSaved = savedArticleIds.has(pub.id);

        try {
            if (isSaved) {
                await deleteDoc(articleRef);
                toast({ title: "Artikel fjernet" });
            } else {
                await setDoc(articleRef, {
                    articleId: pub.id,
                    title: pub.title,
                    description: pub.description,
                    url: pub.url,
                    publicationDate: pub.publicationDate,
                    savedAt: serverTimestamp()
                });
                toast({ title: "Artikel gemt", description: "Du kan finde den i dit arkiv." });
            }
        } catch (error) {
            console.error("Error toggling save:", error);
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke gemme artiklen." });
        }
    };

    const handleCopyApa = (e: React.MouseEvent, id: string, apa: string) => {
        e.preventDefault();
        e.stopPropagation();
        const plainText = apa.replace(/<[^>]*>?/gm, '');
        navigator.clipboard.writeText(plainText);
        setCopiedId(id);
        toast({ title: "Kopieret til udklipsholder" });
        setTimeout(() => setCopiedId(null), 2000);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [qaHistory]);

    return (
        <div className="h-[calc(100vh-6rem)] bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 selection:bg-cyan-100 overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes ink-flow {
                    0% { opacity: 0; transform: translateY(10px) scale(0.98); filter: blur(4px); }
                    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                }
                .animate-ink {
                    animation: ink-flow 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            ` }} />

            {/* LEFT SIDEBAR: AREAS & RECENT */}
            <aside className={`w-80 bg-white border-r border-amber-100/50 flex flex-col h-full z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0 ${isFocusMode ? 'hidden' : 'hidden lg:flex'}`}>
                <div className="p-10 flex flex-col gap-6 border-b border-amber-50/50 flex-shrink-0 bg-gradient-to-br from-white to-amber-50/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-950 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/20 rotate-3"><Building className="w-6 h-6" /></div>
                        <div>
                            <h1 className="text-2xl font-black text-amber-950 serif tracking-tight leading-none">VIVE Indsigt</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 mt-2">Dansk Velfærd-Forskning</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 py-10 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="px-4 mb-6 flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Forsknings-Kategorier</h3>
                        <div className="h-[1px] flex-1 bg-amber-100/50 ml-4"></div>
                    </div>
                    
                    {viveAreas.map(area => {
                        const isFollowing = isFollowingArea(area.id);
                        const isActive = activeAreaId === area.id;
                        return (
                            <div key={area.id} className="relative group/area">
                                <button 
                                    onClick={() => setActiveAreaId(area.id)} 
                                    className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-between group ${isActive ? 'bg-amber-950 text-amber-400 shadow-lg shadow-amber-950/10 -translate-y-0.5' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-950'}`}
                                >
                                    <span className="truncate pr-10">{area.name}</span>
                                    <ChevronRight className={`w-4 h-4 transition-all duration-300 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                                </button>
                                <button
                                    onClick={(e) => handleToggleFollowArea(e, area.id)}
                                    className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isFollowing ? 'text-amber-500 bg-amber-900/10' : 'text-slate-300 opacity-0 group-hover/area:opacity-100 hover:text-amber-950 hover:bg-amber-100'}`}
                                    title={isFollowing ? "Følger (Klik for at stoppe)" : "Modtag notifikationer fra dette område"}
                                >
                                    {isFollowing ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                </button>
                            </div>
                        );
                    })}

                    <div className="pt-12 pb-6 px-4 flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Mit Arkiv</h3>
                        <div className="h-[1px] flex-1 bg-amber-100/50 ml-4"></div>
                    </div>
                    <Link href="/mine-gemte-artikler" className="flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-amber-50 hover:text-amber-950 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-amber-200 group-hover:text-amber-950 transition-colors"><Bookmark className="w-4 h-4" /></div>
                        Gemte artikler
                    </Link>
                    <Link href="/mine-vive-analyser" className="flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-amber-50 hover:text-amber-950 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-amber-200 group-hover:text-amber-950 transition-colors"><History className="w-4 h-4" /></div>
                        Mine analyser
                    </Link>
                </nav>
            </aside>

            {/* MIDDLE WRAPPER */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFCF8]">
                {/* SHARED HEADER */}
                <header className="h-24 bg-white/80 backdrop-blur-md border-b border-amber-100/50 px-8 flex items-center justify-between z-40 shrink-0">
                    <div className="flex items-center gap-6 flex-1 max-w-2xl relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Søg i VIVE's arkiv..."
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-cyan-500/10 focus:bg-white focus:outline-none transition-all text-sm font-bold h-14"
                        />
                    </div>
                    <div className="flex items-center gap-4 ml-8">
                        <button 
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className={`p-4 rounded-2xl transition-all border shadow-sm active:scale-95 ${isFocusMode ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}
                        >
                            {isFocusMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                        {!isFocusMode && (
                            <button onClick={() => setIsContextSidebarOpen(!isContextSidebarOpen)} className={`p-4 rounded-2xl transition-all border shadow-sm active:scale-95 ${isContextSidebarOpen ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}>
                                <PanelRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden relative">
                    {/* SCROLLABLE MAIN CONTENT */}
                    <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
                        <div className="p-8 sm:p-12 md:p-16 mx-auto w-full max-w-6xl">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[60vh] flex flex-col items-center justify-center space-y-10">
                                        <div className="relative">
                                            <div className="w-24 h-24 border-4 border-cyan-100 border-t-cyan-600 rounded-full animate-spin"></div>
                                            <Building className="absolute inset-0 m-auto w-8 h-8 text-cyan-700 animate-pulse" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Synkroniserer</p>
                                            <p className="text-xs text-slate-400 mt-2 font-medium italic">Vi henter den nyeste forskning fra VIVE...</p>
                                        </div>
                                    </motion.div>
                                ) : error ? (
                                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center bg-rose-50/50 rounded-[4rem] border-2 border-dashed border-rose-100 max-w-2xl mx-auto">
                                        <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center text-rose-600 mx-auto mb-8"><X className="w-10 h-10" /></div>
                                        <p className="text-rose-950 font-black serif text-2xl px-12">{error}</p>
                                        <button onClick={() => window.location.reload()} className="mt-10 px-10 py-4 bg-rose-950 text-rose-50 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-900/20 active:scale-95 transition-all">Prøv igen</button>
                                    </motion.div>
                                ) : (
                                    <motion.div key="content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 pb-32">
                                        
                                        {/* HERO HEADER */}
                                        <section className="relative overflow-hidden p-12 rounded-[4rem] bg-amber-950 text-white shadow-2xl shadow-amber-950/20 animate-ink">
                                            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                                            
                                            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-10">
                                                <div className="space-y-6 max-w-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10"><Library className="w-5 h-5 text-amber-400" /></div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Beskæftigelse & Velfærd</span>
                                                    </div>
                                                    <h2 className="text-4xl md:text-5xl font-black serif leading-none tracking-tight">Aktuel Forskning</h2>
                                                    <p className="text-base text-amber-100/70 leading-relaxed font-medium max-w-xl italic">
                                                        Du kigger på &quot;{viveAreas.find(a => a.id === activeAreaId)?.name}&quot;. Udforsk de seneste analyser, der danner grundlag for fremtidens sociale indsats.
                                                    </p>
                                                </div>
                                                
                                                <div className="flex flex-col items-end gap-6 shrink-0">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest opacity-60">Resultater</p>
                                                            <p className="text-3xl font-black">{publications.length}</p>
                                                        </div>
                                                        <div className="h-10 w-[1px] bg-white/20"></div>
                                                        {!isFollowingArea(activeAreaId) ? (
                                                            <button 
                                                                onClick={(e) => handleToggleFollowArea(e, activeAreaId)}
                                                                className="px-8 py-4 bg-cyan-500 text-cyan-950 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-cyan-900/40 hover:bg-white hover:shadow-cyan-400/20 active:scale-95 transition-all flex items-center gap-3"
                                                            >
                                                                <Bell className="w-4 h-4" /> Følg område
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={(e) => handleToggleFollowArea(e, activeAreaId)}
                                                                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/20 active:scale-95 transition-all flex items-center gap-3"
                                                            >
                                                                <BellRing className="w-4 h-4 text-amber-400" /> Du følger dette
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* GRID OF PUBLICATIONS */}
                                        <div className="grid md:grid-cols-2 gap-10">
                                            {publications.map((pub, idx) => (
                                                <div 
                                                    key={pub.id} 
                                                    className="group bg-white p-10 rounded-[3.5rem] border border-amber-100/50 shadow-sm hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] hover:border-cyan-200 transition-all duration-500 flex flex-col h-full relative overflow-hidden animate-ink"
                                                    style={{ animationDelay: `${idx * 0.08}s` }}
                                                >
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50/30 rounded-bl-[5rem] translate-x-12 -translate-y-12 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700 ease-out"></div>
                                                    
                                                    <div className="relative z-10 flex flex-col h-full">
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-cyan-600 group-hover:bg-cyan-50 transition-colors"><Calendar className="w-4 h-4" /></div>
                                                                {new Date(pub.publicationDate).toLocaleDateString('da-DK', { year: 'numeric', month: 'long' })}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button 
                                                                    onClick={(e) => handleToggleSave(e, pub)}
                                                                    className={`w-12 h-12 rounded-2xl border transition-all flex items-center justify-center group/btn active:scale-90 ${savedArticleIds.has(pub.id) ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-inner' : 'bg-white border-slate-100 text-slate-300 hover:text-amber-950 hover:border-amber-950 shadow-sm'}`}
                                                                >
                                                                    {savedArticleIds.has(pub.id) ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />}
                                                                </button>
                                                                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center hover:bg-cyan-100 hover:text-cyan-700 transition-all active:scale-90 shadow-sm">
                                                                    <ExternalLink className="w-5 h-5" />
                                                                </a>
                                                            </div>
                                                        </div>

                                                        <h3 className="text-2xl font-black text-amber-950 serif leading-tight group-hover:text-cyan-900 transition-colors mb-6 line-clamp-3 decoration-cyan-400/0 hover:decoration-cyan-400/100">
                                                            {pub.title}
                                                        </h3>
                                                        
                                                        <p className="text-[15px] text-slate-500 leading-relaxed mb-10 line-clamp-5 flex-grow font-medium leading-[1.6]">
                                                            {pub.description}
                                                        </p>

                                                        {pub.apa && (
                                                            <div className="mb-10 p-6 bg-slate-50/80 rounded-[2rem] border border-slate-100 group/apa relative shadow-inner overflow-hidden">
                                                                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover/apa:opacity-100 transition-opacity"></div>
                                                                <div className="relative z-10">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                                            <Quote className="w-3 h-3 text-cyan-600" /> APA Source
                                                                        </div>
                                                                        <button 
                                                                            onClick={(e) => handleCopyApa(e, pub.id, pub.apa!)}
                                                                            className="text-[8px] font-black uppercase tracking-widest text-cyan-700 hover:text-amber-950 px-3 py-1.5 bg-white rounded-lg border border-cyan-100 transition-all active:scale-95 shadow-sm"
                                                                        >
                                                                            {copiedId === pub.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                                            <span className="ml-2">{copiedId === pub.id ? 'Færdig' : 'Kopier'}</span>
                                                                        </button>
                                                                    </div>
                                                                    <div 
                                                                        className="text-[11px] text-slate-600 leading-relaxed italic pr-2 select-all font-serif"
                                                                        dangerouslySetInnerHTML={{ __html: pub.apa }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="pt-8 border-t border-amber-50 flex items-center justify-between mt-auto">
                                                            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.25em] text-amber-900 hover:text-cyan-700 transition-all group-hover:translate-x-2">
                                                                Læs fuld rapport <ArrowUpRight className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {hasMore && (
                                            <div className="text-center mt-24">
                                                <button 
                                                    onClick={handleLoadMore} 
                                                    disabled={isLoadingMore}
                                                    className="relative group px-12 py-6 bg-white border border-amber-200 text-amber-950 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-xl hover:shadow-2xl hover:border-cyan-400 transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-amber-50 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                                    <div className="relative z-10 flex items-center gap-4 mx-auto justify-center">
                                                        {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin"/> : <RefreshCw className="w-5 h-5" />}
                                                        Indlæs flere rapporter
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* SCROLLABLE RIGHT SIDEBAR */}
                    <AnimatePresence>
                        {isContextSidebarOpen && !isFocusMode && (
                            <motion.aside 
                                initial={{ opacity: 0, x: 300 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: 300 }}
                                className="fixed lg:relative right-0 top-0 w-[85vw] sm:w-[384px] bg-white border-l border-amber-100 flex flex-col h-full z-[50] shadow-2xl lg:shadow-none shrink-0 overflow-hidden"
                            >
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-10">
                                    <div className="flex items-center justify-between flex-shrink-0">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40">AI-Forskeren</h3>
                                        <button onClick={() => setIsContextSidebarOpen(false)} className="p-2 text-slate-300 hover:text-amber-950 transition-colors lg:hidden"><X className="w-4 h-4" /></button>
                                    </div>

                                    <section className="bg-cyan-950 p-6 sm:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-cyan-400 rounded-2xl flex items-center justify-center text-cyan-950 shadow-lg group-hover:rotate-6 transition-transform">
                                                    <Sparkles className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold serif text-lg">Analyse-værktøj</h3>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Eksklusivt for Kollega+</p>
                                                </div>
                                            </div>

                                            {!isPremium ? (
                                                <div className="space-y-6">
                                                    <p className="text-xs text-cyan-100/60 leading-relaxed italic">
                                                        Upload en VIVE-rapport eller artikel og brug AI til at udtrække de vigtigste pointer til din opgave.
                                                    </p>
                                                    <Link href="/upgrade" className="block">
                                                        <Button className="w-full bg-cyan-400 text-cyan-950 hover:bg-white border-none shadow-xl shadow-black/20 text-xs font-black uppercase h-12 rounded-xl">
                                                            <Lock className="w-4 h-4 mr-2" /> Opgrader for adgang
                                                        </Button>
                                                    </Link>
                                                </div>
                                            ) : !uploadedFile ? (
                                                <div className="space-y-6">
                                                    <p className="text-xs text-cyan-100/60 leading-relaxed italic">
                                                        Har du en specifik rapport du arbejder med? Upload den her og få pædagogisk sparring på indholdet.
                                                    </p>
                                                    <label className="cursor-pointer block">
                                                        <div className="w-full py-10 border-2 border-dashed border-cyan-400/30 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                                                            <UploadCloud className="w-8 h-8 text-cyan-400" />
                                                            <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Upload PDF</span>
                                                        </div>
                                                        <input type="file" className="sr-only" accept=".pdf" onChange={handleFileUpload} />
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="space-y-6 animate-ink">
                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                                                        <div className="flex items-center gap-3 truncate">
                                                            <File className="w-5 h-5 text-cyan-400 shrink-0" />
                                                            <span className="text-[10px] font-bold truncate">{uploadedFile.name}</span>
                                                        </div>
                                                        <button onClick={() => { setUploadedFile(null); setExtractedText(null); setQaHistory([]); setSuggestedQuestions([]); }} className="p-1 hover:text-cyan-400 transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    
                                                    {isExtracting ? (
                                                        <div className="py-10 flex flex-col items-center justify-center gap-4">
                                                            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                                                            <p className="text-[10px] font-black uppercase text-cyan-400/60">Læser rapport...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            {qaHistory.length > 0 && (
                                                                <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                                                    {qaHistory.map((item, i) => (
                                                                        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 text-[11px] leading-relaxed text-cyan-50 italic">
                                                                            <strong className="text-cyan-400 block mb-1">Sp: {item.question}</strong>
                                                                            <div dangerouslySetInnerHTML={{ __html: item.data.answer }} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            
                                                            {suggestedQuestions.length > 0 && qaHistory.length === 0 && (
                                                                <div className="space-y-3">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400/60 flex items-center gap-2">
                                                                        <Lightbulb className="w-3 h-3" /> Foreslåede spørgsmål
                                                                    </p>
                                                                    <div className="flex flex-col gap-2">
                                                                        {suggestedQuestions.map((q, i) => (
                                                                            <button key={i} onClick={() => handleAskQuestion(q)} className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-medium transition-colors border border-white/5">
                                                                                {q}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <form onSubmit={handleAskQuestion} className="relative mt-4">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Stil et spørgsmål..."
                                                                    value={userQuestion}
                                                                    onChange={(e) => setUserQuestion(e.target.value)}
                                                                    className="w-full pl-4 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-cyan-100/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                                                />
                                                                <button type="submit" disabled={isAsking || !userQuestion.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-white disabled:opacity-30">
                                                                    {isAsking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                                                                </button>
                                                            </form>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                                    </section>

                                    <div className="p-6 bg-cyan-50 border border-cyan-100 rounded-[2rem] flex items-start gap-4 shadow-inner">
                                        <Info className="w-5 h-5 text-cyan-700 shrink-0 mt-1" />
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-cyan-950 mb-2">Forsknings-tips</p>
                                            <p className="text-[10px] text-cyan-800 leading-relaxed italic">
                                                Brug VIVE-analysen til at underbygge dine argumenter i din eksamensopgave. AI&apos;en kan hjælpe dig med at finde præcis de fund, der er relevante for din problemformulering.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default function ViveIndsigtPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUserLoading && !user) {
            const callbackUrl = pathname ? encodeURIComponent(pathname) : '';
            router.replace(`/?callbackUrl=${callbackUrl}`);
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <ViveIndsigtPageContent />;
}
