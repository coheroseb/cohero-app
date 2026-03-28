
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Info,
  TrendingUp,
  FileSearch,
  BookOpen
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
    { id: '93a09ea5-08f3-126c-ab50-7b3fe0e6d789', name: 'Børn, unge og familie', icon: '👶' },
    { id: '57a72689-008b-b5df-47f8-b6724c8cea1e', name: 'Socialområdet', icon: '🏥' },
    { id: '0eca57d7-cd75-42f2-f731-55f82168eb58', name: 'Arbejdsmarked', icon: '💼' },
    { id: 'fcd9e3a9-a6dc-14be-1f2f-b3b8a9d00e75', name: 'Dagtilbud & Skole', icon: '🏫' },
    { id: 'ae41bac7-c93e-4b56-f432-ac4da9b51c9e', name: 'Ledelse', icon: '📊' },
    { id: '820b03ed-2b07-8b45-6788-4e3660f2e9a3', name: 'Sundhed', icon: '🩺' },
    { id: 'e4043962-757e-9d73-ba9d-973dff77651d', name: 'Ældre', icon: '👵' },
    { id: '33c01510-2358-5584-3781-ef97af3a97df', name: 'Økonomi', icon: '💰' }
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

// Simple Cache Engine
const viveCache: Record<string, { data: VivePublication[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 15; // 15 mins

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
    const [debouncedSearchQuery] = useDebounce(searchQuery, 400);

    const [offset, setOffset] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 12;

    const [isContextSidebarOpen, setIsContextSidebarOpen] = useState(true);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // AI QA State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [userQuestion, setUserQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [qaHistory, setQaHistory] = useState<{question: string, data: ViveReportQaData}[]>([]);
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const isPremium = useMemo(() => !!userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Kollega++', 'Group Pro'].includes(userProfile.membership), [userProfile]);

    const savedArticlesQuery = useMemoFirebase(() => (
        user && firestore ? query(collection(firestore, 'users', user.uid, 'savedViveArticles')) : null
    ), [user, firestore]);
    const { data: savedArticles } = useCollection(savedArticlesQuery);
    const savedArticleIds = useMemo(() => new Set(savedArticles?.map(a => a.articleId)), [savedArticles]);

    // Motor: Optimized Loading with Cache
    const loadPublications = useCallback(async (isInitial = true) => {
        const cacheKey = `${activeAreaId}-${debouncedSearchQuery}-${isInitial ? 0 : offset + PAGE_SIZE}`;
        
        if (isInitial) {
            if (viveCache[cacheKey] && (Date.now() - viveCache[cacheKey].timestamp < CACHE_TTL)) {
                setPublications(viveCache[cacheKey].data);
                setIsLoading(false);
                setHasMore(viveCache[cacheKey].data.length >= PAGE_SIZE);
                return;
            }
            setIsLoading(true);
            setOffset(0);
        } else {
            setIsLoadingMore(true);
        }

        setError(null);
        try {
            const data = await fetchVivePublicationsAction({ 
                searchTerm: debouncedSearchQuery,
                areaId: activeAreaId,
                offset: isInitial ? 0 : offset + PAGE_SIZE,
                limit: PAGE_SIZE,
            });

            if (isInitial) {
                setPublications(data.publications);
                viveCache[cacheKey] = { data: data.publications, timestamp: Date.now() };
            } else {
                setPublications(prev => [...prev, ...data.publications]);
                setOffset(prev => prev + PAGE_SIZE);
            }
            
            setHasMore(data.publications.length >= PAGE_SIZE);
        } catch (err: any) {
            setError(err.message || 'Der opstod en fejl under hentning af data.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [debouncedSearchQuery, activeAreaId, offset]);

    useEffect(() => {
        loadPublications(true);
    }, [debouncedSearchQuery, activeAreaId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploadedFile(file);
        setIsExtracting(true);
        setExtractedText(null);
        setQaHistory([]);
        setIsContextSidebarOpen(true);
        
        try {
            const text = await extractTextFromPdf(file);
            setExtractedText(text);
            toast({ title: "Rapport indlæst", description: "Vores AI har læst rapporten og er klar til dine spørgsmål." });
            
            setIsGeneratingSuggestions(true);
            const response = await generateReportQuestionsAction({ reportText: text });
            setSuggestedQuestions(response.data.suggestions);
        } catch (err) {
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke læse PDF-filen." });
            setUploadedFile(null);
        } finally {
            setIsExtracting(false);
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
            
            // Log activity
            const batch = writeBatch(firestore);
            const userRef = doc(firestore, 'users', user.uid);
            const activityRef = doc(collection(firestore, 'userActivities'));
            batch.set(activityRef, {
                userId: user.uid,
                userName: userProfile.username || user.displayName || 'Anonym',
                actionText: `analyserede en VIVE-rapport: "${uploadedFile?.name}".`,
                createdAt: serverTimestamp()
            });
            await batch.commit();
            await refetchUserProfile();
        } catch (err) {
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
                    description: result.followed ? "Du får besked ved nye udgivelser." : "Du modtager ikke længere opdateringer."
                });
            }
        } catch (err) {
            toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke opdatere abonnement." });
        }
    };

    const handleToggleSave = async (e: React.MouseEvent, pub: VivePublication) => {
        e.preventDefault(); e.stopPropagation();
        if (!user || !firestore) return;

        const articleRef = doc(firestore, 'users', user.uid, 'savedViveArticles', pub.id);
        const isSaved = savedArticleIds.has(pub.id);

        try {
            if (isSaved) {
                await deleteDoc(articleRef);
                toast({ title: "Fjernet fra dit arkiv" });
            } else {
                await setDoc(articleRef, {
                    articleId: pub.id,
                    title: pub.title,
                    description: pub.description,
                    url: pub.url,
                    publicationDate: pub.publicationDate,
                    savedAt: serverTimestamp()
                });
                toast({ title: "Gemt i dit arkiv", description: "Du kan finde den under 'Mit Arkiv'." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke gemme artiklen." });
        }
    };

    const handleCopyApa = (e: React.MouseEvent, id: string, apa: string) => {
        e.preventDefault(); e.stopPropagation();
        const plainText = apa.replace(/<[^>]*>?/gm, '');
        navigator.clipboard.writeText(plainText);
        setCopiedId(id);
        toast({ title: "APA-reference kopieret" });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const isFollowingArea = (areaId: string) => userProfile?.followedViveAreas?.includes(areaId) || false;

    return (
        <div className="h-[calc(100vh-6rem)] bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 selection:bg-cyan-100 overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
                .serif-premium { font-family: 'Playfair Display', serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
            ` }} />

            {/* LEFT NAVIGATION: AREAS */}
            <aside className={`w-80 bg-white border-r border-amber-100/50 flex flex-col h-full z-30 shadow-[4px_0_24px_rgba(0,0,0,0.01)] shrink-0 transition-all duration-500 ${isFocusMode ? '-translate-x-full absolute' : 'translate-x-0'}`}>
                <div className="p-10 flex flex-col gap-6 border-b border-amber-50/50 flex-shrink-0 bg-gradient-to-br from-white to-amber-50/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#1B2B2B] rounded-2xl flex items-center justify-center text-amber-500 shadow-xl shadow-slate-900/10 transition-transform hover:scale-105 active:scale-95"><Building className="w-6 h-6" /></div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">VIVE Indsigt</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 mt-2">Dansk Velfærdsdata</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 py-10 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-4 mb-6 flex items-center justify-between">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Emneområder</h3>
                        <div className="h-[1px] flex-1 bg-slate-100 ml-4"></div>
                    </div>
                    
                    {viveAreas.map(area => {
                        const isFollowing = isFollowingArea(area.id);
                        const isActive = activeAreaId === area.id;
                        return (
                            <div key={area.id} className="relative group/area px-2">
                                <button 
                                    onClick={() => setActiveAreaId(area.id)} 
                                    className={`w-full text-left px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-between group ${isActive ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
                                >
                                    <div className="flex items-center gap-4 truncate">
                                        <span className="text-lg opacity-80">{area.icon}</span>
                                        <span className="truncate">{area.name}</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                                </button>
                                <button
                                    onClick={(e) => handleToggleFollowArea(e, area.id)}
                                    className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isFollowing ? 'text-amber-500 bg-amber-500/10' : 'text-slate-200 opacity-0 group-hover/area:opacity-100 hover:text-slate-900'}`}
                                >
                                    {isFollowing ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                </button>
                            </div>
                        );
                    })}

                    <div className="pt-12 pb-6 px-6 flex items-center gap-4">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Dit Arkiv</h3>
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                    </div>
                    <div className="px-2 space-y-1">
                        <Link href="/mine-gemte-artikler" className="flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-950 transition-all group">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors"><Bookmark className="w-4 h-4" /></div>
                            Gemte rapporter
                        </Link>
                        <Link href="/mine-vive-analyser" className="flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-950 transition-all group">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-cyan-100 group-hover:text-cyan-900 transition-colors"><History className="w-4 h-4" /></div>
                            Mine analyser
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFCF8]">
                {/* DYNAMIC HEADER */}
                <header className="h-24 bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-8 flex items-center justify-between z-40 shrink-0">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                             <Search className="w-5 h-5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Søg i VIVE's arkiv..."
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 h-14 bg-slate-50/50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-cyan-500/5 focus:bg-white focus:outline-none transition-all text-sm font-bold shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-3 ml-8">
                        <button 
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shadow-sm ${isFocusMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-900'}`}
                        >
                            {isFocusMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                        {!isFocusMode && (
                            <button onClick={() => setIsContextSidebarOpen(!isContextSidebarOpen)} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shadow-sm ${isContextSidebarOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-900'}`}>
                                <PanelRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </header>

                <div className="flex-1 relative overflow-hidden flex">
                    {/* SCROLLABLE FEED */}
                    <div className="flex-1 h-full overflow-y-auto custom-scrollbar scroll-smooth">
                        <div className="p-10 sm:p-16 lg:p-24 mx-auto w-full max-w-6xl">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[60vh] flex flex-col items-center justify-center space-y-10">
                                        <div className="relative">
                                            <div className="w-24 h-24 border-2 border-slate-100 border-t-cyan-500 rounded-full animate-spin"></div>
                                            <TrendingUp className="absolute inset-0 m-auto w-8 h-8 text-cyan-600 animate-bounce" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Indlæser Forskningsdata</p>
                                            <p className="text-[13px] text-slate-400 font-medium italic">Vi synkroniserer med VIVE's nyeste udgivelser...</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 pb-40">
                                        
                                        {/* AREA HERO SECTION */}
                                        <div className="relative overflow-hidden p-12 lg:p-16 rounded-[4rem] bg-[#111827] text-white shadow-3xl">
                                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:scale-110"></div>
                                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                                            
                                            <div className="relative z-10">
                                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                                                    <div className="space-y-8 max-w-2xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-4 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-cyan-500/30">
                                                                VIVE Indsigt
                                                            </div>
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Data
                                                            </div>
                                                        </div>
                                                        <h2 className="text-4xl sm:text-6xl font-black serif-premium leading-[0.9] tracking-tight">
                                                            {debouncedSearchQuery ? `Resultater for "${debouncedSearchQuery}"` : viveAreas.find(a => a.id === activeAreaId)?.name}
                                                        </h2>
                                                        <p className="text-lg text-slate-400 leading-relaxed font-medium max-w-xl">
                                                            Vi overvåger løbende VIVE for ny viden, der kan styrke dit faglige skøn og akademiske arbejde.
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-6 shrink-0">
                                                        {!isFollowingArea(activeAreaId) ? (
                                                            <button 
                                                                onClick={(e) => handleToggleFollowArea(e, activeAreaId)}
                                                                className="h-16 px-10 bg-cyan-500 text-slate-900 rounded-2xl font-extrabold uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-cyan-900/30 hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                                            >
                                                                <Bell className="w-5 h-5" /> Følg Område
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={(e) => handleToggleFollowArea(e, activeAreaId)}
                                                                className="h-16 px-10 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-extrabold uppercase text-[11px] tracking-[0.2em] hover:bg-white/20 transition-all flex items-center gap-3"
                                                            >
                                                                <BellRing className="w-5 h-5 text-amber-500" /> Du følger dette
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PUBLICATIONS GRID */}
                                        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
                                            {publications.map((pub, idx) => (
                                                <motion.div 
                                                    key={pub.id} 
                                                    initial={{ opacity: 0, y: 30 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group bg-white p-10 lg:p-14 rounded-[4rem] border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] hover:border-cyan-200 transition-all duration-700 flex flex-col h-full relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 border-bl-4 rounded-bl-[5rem] group-hover:bg-cyan-50 transition-colors duration-700"></div>
                                                    
                                                    <div className="relative z-10 flex flex-col h-full">
                                                        <div className="flex items-center justify-between mb-10">
                                                            <div className="px-5 py-2 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 group-hover:text-cyan-600 transition-colors">
                                                                <Calendar className="w-4 h-4" /> {new Date(pub.publicationDate).toLocaleDateString('da-DK', { year: 'numeric', month: 'short' })}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button 
                                                                    onClick={(e) => handleToggleSave(e, pub)}
                                                                    className={`w-12 h-12 rounded-2xl border transition-all flex items-center justify-center ${savedArticleIds.has(pub.id) ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-900 shadow-sm'}`}
                                                                >
                                                                    <Bookmark className={`w-5 h-5 ${savedArticleIds.has(pub.id) ? 'fill-current' : ''}`} />
                                                                </button>
                                                                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white border border-slate-100 text-slate-300 rounded-2xl flex items-center justify-center hover:bg-cyan-500 hover:text-white hover:border-cyan-500 transition-all shadow-sm">
                                                                    <ExternalLink className="w-5 h-5" />
                                                                </a>
                                                            </div>
                                                        </div>

                                                        <h3 className="text-2xl sm:text-3xl font-bold serif-premium text-slate-900 group-hover:text-cyan-950 transition-colors mb-6 leading-[1.15] line-clamp-3">
                                                            {pub.title}
                                                        </h3>
                                                        
                                                        <p className="text-[15px] sm:text-base text-slate-500 font-medium leading-[1.7] mb-12 line-clamp-6 flex-grow italic">
                                                            &quot;{pub.description}&quot;
                                                        </p>

                                                        {pub.apa && (
                                                            <div className="mb-10 p-6 bg-slate-50/70 rounded-3xl border border-slate-100 group/apa relative overflow-hidden">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                                        <Quote className="w-3 h-3 text-cyan-600" /> APA Reference
                                                                    </span>
                                                                    <button 
                                                                        onClick={(e) => handleCopyApa(e, pub.id, pub.apa!)}
                                                                        className="text-[9px] font-black uppercase bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center gap-2"
                                                                    >
                                                                        {copiedId === pub.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                                        {copiedId === pub.id ? 'Kopieret' : 'Kopier'}
                                                                    </button>
                                                                </div>
                                                                <div 
                                                                    className="text-xs text-slate-500 leading-relaxed font-serif"
                                                                    dangerouslySetInnerHTML={{ __html: pub.apa }}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="pt-10 border-t border-slate-50 flex items-center justify-between">
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => { setIsContextSidebarOpen(true); toast({ title: "Klargør analyse...", description: "Download rapporten fra VIVE og upload den i højre side." }); }} 
                                                                    className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-cyan-600 active:scale-95 transition-all"
                                                                >
                                                                    <FileSearch className="w-4 h-4" /> AI Analyse
                                                                </button>
                                                            </div>
                                                            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-cyan-600 transition-all font-sans group-hover:translate-x-2">
                                                                Læs fuld tekst <ArrowUpRight className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {hasMore && (
                                            <div className="flex justify-center pt-20">
                                                <button 
                                                    onClick={() => loadPublications(false)} 
                                                    disabled={isLoadingMore}
                                                    className="group relative px-12 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-cyan-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                                    <div className="relative z-10 flex items-center gap-4">
                                                        {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180 duration-700" />}
                                                        Udforsk flere rapporter
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* AI ANALYST SIDEBAR */}
                    <AnimatePresence>
                        {isContextSidebarOpen && !isFocusMode && (
                            <motion.aside 
                                initial={{ opacity: 0, x: 400 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: 400 }}
                                className="fixed lg:relative right-0 top-0 w-[90vw] sm:w-[420px] bg-white border-l border-slate-100 flex flex-col h-full z-[100] shadow-4xl lg:shadow-none"
                            >
                                <div className="p-8 sm:p-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-12">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl"><Sparkles className="w-6 h-6" /></div>
                                            <h3 className="text-xl font-bold tracking-tight">AI Forsker</h3>
                                        </div>
                                        <button onClick={() => setIsContextSidebarOpen(false)} className="p-3 text-slate-300 hover:text-slate-900 border border-slate-50 rounded-2xl"><X className="w-5 h-5" /></button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-10">
                                        <section className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-3xl relative overflow-hidden group">
                                            <div className="relative z-10 space-y-8">
                                                <div className="space-y-4">
                                                    <h4 className="text-2xl font-bold serif-premium">Rapport-Analyse</h4>
                                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                                        Stil spørgsmål direkte til forskningsresultater fra VIVE. Vi hjælper dig med at udtrække citater og fund.
                                                    </p>
                                                </div>

                                                {!isPremium ? (
                                                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                                                        <div className="flex items-center gap-3 text-amber-500 font-black uppercase text-[10px] tracking-widest"><Lock className="w-4 h-4" /> Premium Værktøj</div>
                                                        <p className="text-xs text-slate-400">Opgrader til Kollega+ for at uploade rapporter og stille AI-spørgsmål.</p>
                                                        <Button asChild className="w-full bg-cyan-500 hover:bg-white text-slate-950 h-14 rounded-2xl font-bold border-none shadow-xl shadow-cyan-500/20">
                                                            <Link href="/upgrade">Se medlemskab</Link>
                                                        </Button>
                                                    </div>
                                                ) : !uploadedFile ? (
                                                    <label className="block cursor-pointer">
                                                        <div className="w-full py-16 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:bg-white/5 hover:border-cyan-500/50 transition-all group/upload">
                                                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover/upload:scale-110 group-hover/upload:bg-cyan-500 transition-all"><UploadCloud className="w-8 h-8 text-cyan-500 group-hover/upload:text-white" /></div>
                                                            <div className="text-center">
                                                                <span className="block text-[11px] font-black uppercase tracking-widest text-cyan-400 mb-1">Upload VIVE PDF</span>
                                                                <span className="text-[10px] text-slate-500">Træk filen herind</span>
                                                            </div>
                                                        </div>
                                                        <input type="file" className="sr-only" accept=".pdf" onChange={handleFileUpload} />
                                                    </label>
                                                ) : (
                                                    <div className="space-y-8 animate-ink">
                                                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                                            <div className="flex items-center gap-4 truncate">
                                                                <div className="p-2 bg-cyan-500/10 rounded-lg"><File className="w-5 h-5 text-cyan-400 shrink-0" /></div>
                                                                <span className="text-[11px] font-bold truncate max-w-[150px]">{uploadedFile.name}</span>
                                                            </div>
                                                            <button onClick={() => { setUploadedFile(null); setExtractedText(null); setQaHistory([]); }} className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                                                        </div>
                                                        
                                                        {isExtracting ? (
                                                            <div className="py-20 flex flex-col items-center justify-center gap-6">
                                                                <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60">Dekoder Forsknings-PDF...</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-8">
                                                                {qaHistory.length > 0 && (
                                                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                                                                        {qaHistory.map((item, i) => (
                                                                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i} className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                                                                <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">Svar på: {item.question}</p>
                                                                                <div className="text-[13px] text-slate-300 leading-relaxed font-medium italic" dangerouslySetInnerHTML={{ __html: item.data.answer }} />
                                                                            </motion.div>
                                                                        ))}
                                                                        <div ref={chatEndRef} />
                                                                    </div>
                                                                )}

                                                                {suggestedQuestions.length > 0 && qaHistory.length === 0 && (
                                                                    <div className="space-y-4">
                                                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Start din analyse</h5>
                                                                        <div className="flex flex-col gap-2.5">
                                                                            {suggestedQuestions.map((q, i) => (
                                                                                <button key={i} onClick={() => handleAskQuestion(q)} className="text-left p-4 bg-white/5 hover:bg-cyan-500 hover:text-white rounded-2xl text-[11px] font-semibold transition-all border border-white/5 truncate">
                                                                                    {q}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <form onSubmit={handleAskQuestion} className="relative pt-6">
                                                                    <div className="relative group">
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="Stil forskeren et spørgsmål..."
                                                                            value={userQuestion}
                                                                            onChange={(e) => setUserQuestion(e.target.value)}
                                                                            className="w-full pl-6 pr-14 h-16 bg-white/5 border border-white/10 rounded-2xl text-[13px] text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
                                                                        />
                                                                        <button type="submit" disabled={isAsking || !userQuestion.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-cyan-500 text-slate-950 rounded-xl flex items-center justify-center hover:bg-white active:scale-95 disabled:opacity-20 transition-all shadow-xl shadow-cyan-500/20">
                                                                            {isAsking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-start gap-4">
                                            <div className="p-2 bg-white rounded-xl shadow-sm"><Info className="w-5 h-5 text-slate-400" /></div>
                                            <div className="space-y-2">
                                                <h5 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Forsknings-Metode</h5>
                                                <p className="text-[12px] text-slate-500 leading-relaxed font-medium italic">
                                                    VIVE's rapporter er peer-reviewed og anses for at være den mest robuste kilde til velfærdsforskning i Danmark.
                                                </p>
                                            </div>
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
            router.replace(`/?callbackUrl=${pathname ? encodeURIComponent(pathname) : ''}`);
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user) return <AuthLoadingScreen />;
    return <ViveIndsigtPageContent />;
}
