
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
  CalendarDays,
  ArrowUpRight,
  ArrowRight,
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
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const PAGE_SIZE = 12;

    const isPremium = useMemo(() => !!userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Group Pro'].includes(userProfile.membership), [userProfile]);

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
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                .serif-premium { font-family: 'Playfair Display', serif; }
                .sans-premium { font-family: 'Plus Jakarta Sans', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 20px; }
                .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); }
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
            ` }} />

            {/* LEFT NAVIGATION: AREAS */}
            <aside className={`w-85 bg-white border-r border-slate-100 flex flex-col h-full z-30 shadow-[10px_0_40px_rgba(0,0,0,0.02)] shrink-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isFocusMode ? '-translate-x-full absolute' : 'translate-x-0'}`}>
                <div className="p-10 flex flex-col gap-6 flex-shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-cyan-400 shadow-2xl shadow-slate-900/20 transition-all hover:rotate-6">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none sans-premium">VIVE Indsigt</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-600 mt-2.5">Faglig Excellence</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    
                    <div className="px-5 mt-10 mb-8 flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">Emneområder</span>
                        <div className="h-px w-full bg-slate-50"></div>
                    </div>
                    
                    <div className="space-y-1">
                        {viveAreas.map(area => {
                            const isFollowing = isFollowingArea(area.id);
                            const isActive = activeAreaId === area.id;
                            return (
                                <div key={area.id} className="relative group/area px-2">
                                    <button 
                                        onClick={() => setActiveAreaId(area.id)} 
                                        className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-between group sans-premium ${isActive ? 'bg-slate-950 text-white shadow-2xl shadow-slate-950/20 translate-x-2' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
                                    >
                                        <div className="flex items-center gap-4 truncate">
                                            <span className="text-xl transition-transform group-hover:scale-125">{area.icon}</span>
                                            <span className="truncate">{area.name}</span>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} />
                                    </button>
                                    <button
                                        onClick={(e) => handleToggleFollowArea(e, area.id)}
                                        className={`absolute right-12 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${isFollowing ? 'text-amber-500 bg-amber-500/10' : 'text-slate-200 opacity-0 group-hover/area:opacity-100 hover:text-slate-900 hover:bg-slate-100'}`}
                                    >
                                        {isFollowing ? <BellRing className="w-4 h-4 fill-current" /> : <Bell className="w-4 h-4" />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-14 pb-6 px-5 flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">Dit Bibliotek</span>
                        <div className="h-px w-full bg-slate-50"></div>
                    </div>
                    <div className="px-2 space-y-1">
                        <Link href="/mine-gemte-artikler" className="flex items-center gap-5 px-5 py-4 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-950 transition-all group sans-premium">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-900 transition-all shadow-sm"><Bookmark className="w-4 h-4" /></div>
                            Gemte rapporter
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFCF8]">
                {/* DYNAMIC HEADER */}
                <header className="h-24 glass-card border-b border-slate-100/50 px-8 flex items-center justify-between z-40 shrink-0">
                    <div className="flex items-center gap-6 flex-1 max-w-2xl relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                             <Search className="w-5 h-5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Søg i tusindvis af forskningsrapporter..."
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 h-14 bg-slate-100/40 border-none rounded-2xl focus:ring-4 focus:ring-cyan-500/5 focus:bg-white focus:outline-none transition-all text-sm font-semibold sans-premium shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-4 ml-8">
                        <button 
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            title="Fokus tilstand"
                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all border shadow-sm ${isFocusMode ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-900'}`}
                        >
                            {isFocusMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </header>

                <div className="flex-1 relative overflow-hidden flex">
                    {/* SCROLLABLE FEED */}
                    <div className="flex-1 h-full overflow-y-auto custom-scrollbar scroll-smooth">
                        <div className="p-8 sm:p-12 lg:p-16 mx-auto w-full max-w-[1600px]">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[65vh] flex flex-col items-center justify-center space-y-12">
                                        <div className="relative">
                                            <div className="w-24 h-24 border-4 border-slate-100 border-t-cyan-500 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <TrendingUp className="w-8 h-8 text-cyan-600 animate-float" />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 sans-premium">Synkroniserer Bibliotek</p>
                                            <p className="text-xs text-slate-400 font-semibold italic sans-premium">Henter de seneste indsigter...</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }} className="space-y-12 pb-40">
                                        
                                        {/* PUBLICATIONS GRID */}
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                                            {publications.map((pub, idx) => (
                                                <motion.div 
                                                    key={pub.id} 
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true, margin: "-50px" }}
                                                    transition={{ duration: 0.6, delay: (idx % 3) * 0.1, ease: [0.23, 1, 0.32, 1] }}
                                                    className="group bg-white p-8 lg:p-10 rounded-[3rem] border border-slate-100 shadow-[0_5px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:border-cyan-200 transition-all duration-500 flex flex-col h-full relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 border-bl-2 rounded-bl-[4rem] group-hover:bg-cyan-50 transition-colors duration-500 -z-0"></div>
                                                    
                                                    <div className="relative z-10 flex flex-col h-full">
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div className="px-4 py-2 bg-slate-50/50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:bg-white group-hover:text-cyan-600 transition-all border border-transparent group-hover:border-cyan-100">
                                                                <CalendarDays className="w-3.5 h-3.5" /> {new Date(pub.publicationDate).toLocaleDateString('da-DK', { year: 'numeric', month: 'short' })}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={(e) => handleToggleSave(e, pub)}
                                                                    className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center shadow-sm ${savedArticleIds.has(pub.id) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-900'}`}
                                                                >
                                                                    <Bookmark className={`w-4 h-4 ${savedArticleIds.has(pub.id) ? 'fill-current' : ''}`} />
                                                                </button>
                                                                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-slate-100 text-slate-300 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </a>
                                                            </div>
                                                        </div>

                                                        <h3 className="text-xl sm:text-2xl font-bold serif-premium text-slate-900 group-hover:text-slate-950 transition-colors mb-6 leading-tight tracking-tight line-clamp-3">
                                                            {pub.title}
                                                        </h3>
                                                        
                                                        <div className="relative mb-8">
                                                            <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-4 flex-grow italic relative z-10 sans-premium">
                                                                {pub.description}
                                                            </p>
                                                        </div>

                                                        {pub.apa && (
                                                            <div className="mb-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group/apa relative overflow-hidden transition-all group-hover:bg-white group-hover:border-cyan-100">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 sans-premium">
                                                                        <BookOpen className="w-3.5 h-3.5 text-cyan-600" /> Reference
                                                                    </span>
                                                                    <button 
                                                                        onClick={(e) => handleCopyApa(e, pub.id, pub.apa!)}
                                                                        className="text-[9px] font-black uppercase bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-950 hover:text-white transition-all shadow-sm flex items-center gap-2 sans-premium"
                                                                    >
                                                                        {copiedId === pub.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                                        Kopier
                                                                    </button>
                                                                </div>
                                                                <div 
                                                                    className="text-[11px] text-slate-500 leading-relaxed font-serif tracking-wide line-clamp-2"
                                                                    dangerouslySetInnerHTML={{ __html: pub.apa }}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-end">
                                                            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-600 transition-all sans-premium group-hover:translate-x-2">
                                                                Rapport <ArrowUpRight className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {hasMore && (
                                            <div className="flex justify-center pt-24">
                                                <button 
                                                    onClick={() => loadPublications(false)} 
                                                    disabled={isLoadingMore}
                                                    className="group relative px-16 py-8 bg-slate-950 text-white rounded-[3rem] font-black uppercase text-xs tracking-[0.5em] shadow-[0_30px_70px_rgba(0,0,0,0.2)] transition-all active:scale-95 disabled:opacity-50 overflow-hidden sans-premium"
                                                >
                                                    <div className="absolute inset-0 bg-cyan-600 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
                                                    <div className="relative z-10 flex items-center gap-5">
                                                        {isLoadingMore ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6 transition-transform group-hover:rotate-180 duration-1000" />}
                                                        Udforsk Videre
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
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
