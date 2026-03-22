
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Gavel, 
  Flame, 
  Search, 
  ChevronDown, 
  Sparkles, 
  Scale, 
  BookOpen, 
  Zap, 
  Loader2, 
  CheckCircle, 
  Activity,
  History,
  Target,
  Quote,
  Calendar,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter,
  Clock,
  Star,
  Lock,
  ArrowRight,
  ArrowUpRight,
  MessageSquare,
  Plus
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { fetchFolketingetSager } from '@/app/actions';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useDebounce } from 'use-debounce';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';



// --- Type definitions ---
interface Sag {
  id: number;
  titel: string;
  nummer: string;
  typeid: number;
  statusid: number;
  opdateringsdato: string;
  resume: string | null;
}

interface Sagstype {
  id: number;
  type: string;
}

interface Sagsstatus {
  id: number;
  status: string;
}

// --- Skeleton Component ---
const SagSkeleton = () => (
    <div className="bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 shadow-sm p-8 sm:p-10 animate-pulse">
        <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
                <div className="w-20 h-7 bg-slate-100/80 rounded-xl"></div>
                <div className="w-24 h-7 bg-slate-100/80 rounded-xl"></div>
            </div>
            <div className="w-32 h-5 bg-slate-100/80 rounded-lg"></div>
        </div>
        <div className="space-y-3 mb-8">
            <div className="w-full h-8 bg-slate-200/50 rounded-xl"></div>
            <div className="w-3/4 h-8 bg-slate-200/50 rounded-xl"></div>
        </div>
        <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
            <div className="w-24 h-5 bg-slate-100/80 rounded-lg"></div>
            <div className="w-40 h-10 bg-slate-100/80 rounded-2xl"></div>
        </div>
    </div>
);

const SagItem = ({ 
    sag, 
    onFollow, 
    isFollowed, 
    onHighlight,
    isHighlighted,
    isAdmin,
    getStatusString, 
    getTypeString 
}: { 
    sag: Sag, 
    onFollow: (e: React.MouseEvent, sagId: number) => void, 
    isFollowed: boolean, 
    onHighlight: (e: React.MouseEvent, sag: Sag) => void,
    isHighlighted: boolean,
    isAdmin: boolean,
    getStatusString: (id: number) => string, 
    getTypeString: (id: number) => string 
}) => {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            id={`sag-${sag.id}`} 
            className={`group bg-white rounded-[2.5rem] border transition-all overflow-hidden scroll-mt-32 shadow-sm hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] active:scale-[0.99] ${isHighlighted ? 'border-amber-400 ring-4 ring-amber-400/5' : 'border-slate-100'}`}
        >
            <div className="p-8 sm:p-12 relative overflow-hidden">
                {/* Subtle glass effect pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(245,245,247,0.5)_0,transparent_70%)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/10 border border-slate-800">
                                {sag.nummer || 'ID:' + sag.id}
                            </span>
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors shadow-sm ${ 
                                [10, 18].includes(sag.statusid) ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-700/5' :
                                sag.statusid === 11 ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-700/5' :
                                sag.statusid === 12 ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                [14, 15, 16].includes(sag.statusid) ? 'bg-sky-50 text-sky-700 border-sky-100 shadow-sky-700/5' :
                                'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                                {getStatusString(sag.statusid)}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3 self-end sm:self-auto bg-slate-50/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-100/50">
                            {isAdmin && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                onClick={(e) => onHighlight(e, sag)} 
                                                className={`p-2.5 rounded-xl transition-all active:scale-90 ${isHighlighted ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-amber-500 hover:bg-white border border-transparent hover:border-amber-100'}`}
                                            >
                                                <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${isHighlighted ? 'fill-current' : ''}`} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-900 text-white border-slate-800"><p>{isHighlighted ? 'Fjern fra fremhævede' : 'Fremhæv for alle'}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button 
                                            onClick={(e) => onFollow(e, sag.id)} 
                                            className={`p-2.5 rounded-xl transition-all active:scale-90 ${isFollowed ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'text-slate-400 hover:text-amber-500 hover:bg-white border border-transparent hover:border-amber-100'}`}
                                        >
                                            <Star className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${isFollowed ? 'fill-current' : ''}`} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-slate-900 text-white border-slate-800"><p>{isFollowed ? 'Følger ikke længere' : 'Følg sag'}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <div className="h-6 w-[1px] bg-slate-200/50 mx-1"></div>

                            <div className="flex items-center gap-2 px-3 text-slate-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">Opdateret: {new Date(sag.opdateringsdato || Date.now()).toLocaleDateString('da-DK', { day: '2-digit', month: 'short' })}</span>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-[22px] sm:text-[34px] font-extrabold text-slate-900 tracking-tight mb-10 leading-[1.1] line-clamp-3 sm:line-clamp-none decoration-rose-500/20 underline-offset-8 group-hover:underline transition-all">
                        {sag.titel}
                    </h3>

                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-6 pt-10 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Kategori</p>
                                <p className="text-[13px] font-bold text-slate-700">{getTypeString(sag.typeid)}</p>
                            </div>
                        </div>

                        <Link 
                            href={`/folketinget/case/view/${sag.id}`} 
                            className="group/btn relative h-16 px-10 rounded-[1.5rem] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 overflow-hidden transition-all hover:bg-black active:scale-[0.97] shadow-2xl shadow-slate-900/20"
                        >
                            <span className="relative z-10">Udforsk sag</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-2 transition-transform duration-300" />
                            {/* Animated reflection */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


const FolketingetPageContent: React.FC = () => {
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [sager, setSager] = useState<Sag[]>([]);
  const [typer, setTyper] = useState<Sagstype[]>([]);
  const [statusser, setStatusser] = useState<Sagsstatus[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [activeTypeId, setActiveTypeId] = useState<number | null>(3); // Set default to 'Lovforslag' (ID 3)
  const [activeStatusId, setActiveStatusId] = useState<number | null>(null);
  const [showOnlyFollowed, setShowOnlyFollowed] = useState(false);
  
  const isPremiumUser = useMemo(() => {
    return userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership || '');
  }, [userProfile]);

  const isAdmin = useMemo(() => userProfile?.role === 'admin', [userProfile]);

  const followedSagerQuery = useMemoFirebase(
    () => user && firestore ? query(collection(firestore, 'followedSager'), where('userId', '==', user.uid)) : null,
    [user, firestore]
  );
  const { data: followedSagerDocs } = useCollection(followedSagerQuery);
  const followedSagerIds = useMemo(() => new Set(followedSagerDocs?.map(doc => doc.sagId)), [followedSagerDocs]);

  const highlightedSagerQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'highlightedSager'), orderBy('highlightedAt', 'desc'), limit(20)) : null,
    [firestore]
  );
  const { data: highlightedSager, isLoading: highlightedSagerLoading } = useCollection(highlightedSagerQuery);
  const highlightedSagerIds = useMemo(() => new Set(highlightedSager?.map(s => s.sagId)), [highlightedSager]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [typerRes, statusserRes] = await Promise.all([
          fetch('https://oda.ft.dk/api/Sagstype').then(r => r.json()),
          fetch('https://oda.ft.dk/api/Sagsstatus').then(r => r.json())
        ]);
        setTyper(typerRes.value || []);
        setStatusser(statusserRes.value || []);
      } catch (error) {
        console.error("Fejl ved hentning af metadata:", error);
      }
    };
    fetchMetadata();
  }, []);

  const fetchSagerData = useCallback(async (loadMore = false) => {
    if(!loadMore) setIsLoading(true); else setIsLoadingMore(true);
    try {
        const currentOffset = loadMore ? sager.length : 0;
        const followedIds = showOnlyFollowed ? Array.from(followedSagerIds) : null;
        
        if (showOnlyFollowed && (!followedIds || followedIds.length === 0)) {
            setSager([]);
            setHasMore(false);
            return;
        }

        const limit = isPremiumUser ? 20 : 5;

        if (!isPremiumUser && loadMore) {
            setHasMore(false);
            setIsLoadingMore(false);
            return;
        }
        
        const sagerRes = await fetchFolketingetSager({
            searchTerm: isPremiumUser ? debouncedSearchQuery : '',
            typeId: activeTypeId,
            statusId: activeStatusId,
            followedIds,
            skip: currentOffset,
            top: limit,
        });
        
        if (sagerRes.length < limit || !isPremiumUser) {
            setHasMore(false);
        } else {
            setHasMore(true);
        }

        setSager(prev => loadMore ? [...prev, ...sagerRes] : sagerRes);

    } catch (error) {
        console.error("Fejl ved hentning af FT data:", error);
    } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
    }
  }, [debouncedSearchQuery, activeTypeId, activeStatusId, showOnlyFollowed, followedSagerIds, isPremiumUser, sager.length]);

  useEffect(() => {
    fetchSagerData(false);
  }, [debouncedSearchQuery, activeTypeId, activeStatusId, showOnlyFollowed]);

  const handleFollow = async (e: React.MouseEvent, sagId: number) => {
    e.stopPropagation();
    if (!user || !firestore || !userProfile) return;

    const isCurrentlyFollowed = followedSagerIds.has(sagId);
    const followedSagerColRef = collection(firestore, 'followedSager');

    try {
        if (isCurrentlyFollowed) {
            const q = query(followedSagerColRef, where('userId', '==', user.uid), where('sagId', '==', sagId));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });
        } else {
            const sagToFollow = sager.find(s => s.id === sagId) || highlightedSager?.find(s => s.sagId === sagId);
            if (!sagToFollow) {
                toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke finde sagsoplysninger for at følge sagen.' });
                return;
            }
            await addDoc(followedSagerColRef, {
                userId: user.uid,
                userEmail: user.email,
                userName: userProfile?.username || user.displayName || 'Bruger',
                sagId: sagId,
                createdAt: serverTimestamp(),
                lastUpdatedAt: new Date(sagToFollow.opdateringsdato || Date.now()),
            });
        }
        
        toast({
          title: isCurrentlyFollowed ? "Følger ikke længere sag" : "Følger sag",
          description: `Du ${isCurrentlyFollowed ? 'følger ikke længere' : 'følger nu'} sagen.`,
        });
    } catch (error) {
        console.error("Error updating followed sager:", error);
        toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke opdatere dine fulgte sager.' });
    }
  };

  const handleHighlight = async (e: React.MouseEvent, sag: Sag) => {
    e.stopPropagation();
    if (!isAdmin || !firestore) return;

    const highlightRef = doc(firestore, 'highlightedSager', sag.id.toString());
    const isCurrentlyHighlighted = highlightedSagerIds.has(sag.id);

    try {
        if (isCurrentlyHighlighted) {
            await deleteDoc(highlightRef);
            toast({ title: "Fjernet", description: "Sagen er fjernet fra de fremhævede." });
        } else {
            await setDoc(highlightRef, {
                sagId: sag.id,
                titel: sag.titel,
                nummer: sag.nummer,
                typeid: sag.typeid,
                opdateringsdato: sag.opdateringsdato,
                highlightedAt: serverTimestamp(),
            });
            toast({ title: "Fremhævet", description: "Sagen er nu fremhævet for alle brugere." });
        }
    } catch (error) {
        console.error("Error highlighting sag:", error);
        toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke opdatere fremhævelse.' });
    }
  };

  const getStatusString = (id: number) => statusser.find(s => s.id === id)?.status || 'Ukendt';
  const getTypeString = (id: number) => typer.find(t => t.id === id)?.type || 'Sag';
  
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col relative overflow-hidden font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Decorative Gradients */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.03)_0,transparent_70%)] rounded-full blur-[80px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.03)_0,transparent_70%)] rounded-full blur-[80px] pointer-events-none z-0"></div>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100/80 px-4 sm:px-8 py-6 md:py-10 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/portal" className="p-3.5 sm:p-5 bg-white border border-slate-200 text-slate-900 rounded-[24px] hover:bg-slate-50 hover:border-slate-300 transition-all group active:scale-95 shrink-0 shadow-sm flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1.5 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                 <div className="p-1 xs:p-1.5 bg-rose-50 rounded-lg xs:rounded-xl border border-rose-100">
                    <Gavel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
                 </div>
                 <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">ODA Monitorering</span>
              </div>
              <h1 className="text-[28px] sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none group cursor-default">
                Politisk <span className="text-rose-600">Puls</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-1 max-w-2xl gap-4 items-center w-full">
            <TooltipProvider>
                <Tooltip open={!isPremiumUser ? undefined : false}>
                    <TooltipTrigger asChild>
                        <div className={`relative flex-1 group/search w-full ${!isPremiumUser ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <Search className={`w-6 h-6 ${isPremiumUser ? 'text-slate-400 group-focus-within/search:text-rose-500' : 'text-slate-300'} transition-colors`} />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-white/80 backdrop-blur-xl border border-slate-100 hover:border-slate-200 focus:border-rose-500/50 rounded-[24px] h-16 md:h-20 pl-16 pr-8 text-[15px] font-bold transition-all focus:ring-[12px] focus:ring-rose-500/5 outline-none shadow-sm hover:shadow-md disabled:cursor-not-allowed placeholder:text-slate-300"
                                placeholder={isPremiumUser ? "Gennemsøg 10.000+ lovforslag..." : "Søgning kræver Kollega+"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={!isPremiumUser}
                            />
                            {!isPremiumUser && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-100">
                                    <Lock className="w-3 h-3" />
                                    Premium
                                </div>
                            )}
                        </div>
                    </TooltipTrigger>
                    {!isPremiumUser && (
                        <TooltipContent className="bg-slate-900 text-white border-slate-800 p-6 rounded-[24px] shadow-2xl max-w-xs" side="bottom">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-400 text-amber-950 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                                        <Sparkles className="w-5 h-5 fill-current"/>
                                    </div>
                                    <p className="font-bold text-lg leading-tight">Lås op for alle efterretninger</p>
                                </div>
                                <p className="text-sm text-slate-400 font-medium">Som Kollega+ medlem får du fuld adgang til at gennemsøge FT arkivet og opstille egne monitoreringer.</p>
                                <Link href="/upgrade">
                                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl mt-2 py-6">Opgrader nu</Button>
                                </Link>
                            </div>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
            <Link href="/opslagstavle" className="h-16 md:h-20 px-8 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest shadow-[0_12px_30px_-5px_rgba(15,23,42,0.3)] hover:bg-rose-900 transition-all flex items-center gap-3 w-full sm:w-auto justify-center text-[12px] group focus:ring-4 focus:ring-slate-900/10 active:scale-95">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>Nyt opslag</span>
            </Link>
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 lg:py-20 grid lg:grid-cols-12 gap-12 lg:gap-16 relative z-10">
            {/* SIDEBAR - TOP ON MOBILE */}
            <aside className="lg:col-span-4 space-y-12 h-fit lg:sticky lg:top-40">
                <motion.section 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 sm:p-10 rounded-[32px] border border-slate-100 shadow-sm"
                >
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 px-2 flex items-center gap-3">
                        <div className="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                           <Filter className="w-4 h-4"/>
                        </div>
                        Kontrolpanel
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Kategorifilter</p>
                           <div className="relative group/select">
                               <select 
                                   value={activeTypeId || ''}
                                   onChange={(e) => setActiveTypeId(e.target.value ? Number(e.target.value) : null)} 
                                   className="w-full appearance-none pl-6 pr-12 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
                               >
                                   <option value="">Alle sagstyper</option>
                                   {typer.map(t => <option key={t.id} value={t.id}>{t.type}</option>)}
                               </select>
                               <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-focus-within/select:rotate-180 transition-transform"/>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Statusfilter</p>
                           <div className="relative group/select">
                                <select 
                                   value={activeStatusId || ''}
                                   onChange={(e) => setActiveStatusId(e.target.value ? Number(e.target.value) : null)} 
                                   className="w-full appearance-none pl-6 pr-12 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
                               >
                                   <option value="">Alle statusser</option>
                                   {statusser.map(s => <option key={s.id} value={s.id}>{s.status}</option>)}
                               </select>
                               <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-focus-within/select:rotate-180 transition-transform"/>
                           </div>
                        </div>

                        <Button 
                            variant="outline"
                            onClick={() => setShowOnlyFollowed(!showOnlyFollowed)} 
                            className={`w-full justify-between h-16 rounded-2xl border-slate-100 text-[13px] font-bold px-6 active:scale-95 transition-all ${
                                showOnlyFollowed 
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                                    : 'bg-white hover:bg-slate-50 hover:border-slate-200'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <Star className={`w-4 h-4 ${showOnlyFollowed ? 'fill-current' : ''}`} />
                                Mine Fulgte Sager
                            </span>
                            {followedSagerIds.size > 0 && (
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${showOnlyFollowed ? 'bg-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {followedSagerIds.size}
                                </span>
                            )}
                        </Button>
                    </div>
                </motion.section>
                
                {/* HIGHLIGHTED SAGER */}
                <motion.section 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 px-2 flex items-center gap-3">
                        <div className="w-7 h-7 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                           <Flame className="w-4 h-4 fill-current"/>
                        </div>
                        Fremhævede Sager
                    </h3>
                    
                    {highlightedSagerLoading ? (
                        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-slate-200"/></div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {highlightedSager?.map((sag, idx) => {
                                const isClickable = isPremiumUser;
                                const href = isClickable ? `/folketinget/case/view/${sag.sagId}` : '/upgrade';
                                
                                return (
                                    <motion.div
                                        key={sag.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + idx * 0.05 }}
                                    >
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Link 
                                                href={href} 
                                                onClick={(e) => !isClickable && e.preventDefault()}
                                                className={`group block p-6 bg-white border border-slate-100 rounded-3xl transition-all relative overflow-hidden ${isClickable ? 'hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)] hover:border-rose-100 hover:bg-rose-50/10' : 'opacity-70 grayscale-[0.5]'}`}
                                              >
                                                <div className="relative z-10 flex justify-between items-start gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-[15px] font-extrabold text-slate-900 group-hover:text-rose-700 transition-colors leading-tight mb-2 ${!isClickable ? '' : ''}`}>
                                                            {sag.alias || sag.titel}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                                                                {sag.nummer}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                                                Opdateret: {new Date(sag.opdateringsdato || Date.now()).toLocaleDateString('da-DK', { day: '2-digit', month: 'short' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!isClickable ? (
                                                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                                                            <Lock className="w-4 h-4 text-amber-600" />
                                                        </div>
                                                    ) : (
                                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                                                    )}
                                                </div>
                                              </Link>
                                            </TooltipTrigger>
                                            {!isClickable && (
                                              <TooltipContent side="right" className="bg-slate-900 text-white border-slate-800">
                                                <p>Opgrader til Kollega+ for at tilgå fremhævede sager.</p>
                                              </TooltipContent>
                                            )}
                                          </Tooltip>
                                        </TooltipProvider>
                                    </motion.div>
                                );
                            })}
                            {(highlightedSager?.length === 0) && (
                                <div className="p-12 text-center bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                                    <p className="text-[12px] text-slate-400 font-medium italic">Ingen fremhævede sager lige nu.</p>
                                </div>
                            )}
                        </div>
                    )}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20"
                >
                    <div className="relative z-10">
                        <Sparkles className="w-8 h-8 text-amber-400 mb-6 group-hover:rotate-12 transition-transform duration-500" />
                        <h4 className="text-[20px] font-black leading-tight mb-4 tracking-tight">Vores AI analyserer løbende Folketinget for dig.</h4>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">Vi matcher lovforslag med relevante vidensnotater og principmeddelelser automatisk.</p>
                        <Link href="/about-monitorering">
                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-2xl h-14">Læs hvordan det virker</Button>
                        </Link>
                    </div>
                    {/* Mesh Gradient */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                </motion.section>
            </aside>

            {/* MAIN LIST */}
            <div className="lg:col-span-8 space-y-8 min-h-[600px]">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-8"
                      >
                        {[...Array(3)].map((_, i) => <SagSkeleton key={i} />)}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid gap-8"
                      >
                          {sager.map((sag, idx) => (
                            <SagItem 
                                key={sag.id}
                                sag={sag}
                                isAdmin={isAdmin}
                                onFollow={handleFollow}
                                isFollowed={followedSagerIds.has(sag.id)}
                                onHighlight={handleHighlight}
                                isHighlighted={highlightedSagerIds.has(sag.id)}
                                getStatusString={getStatusString}
                                getTypeString={getTypeString}
                            />
                          ))}
                          
                          {sager.length === 0 && !isLoading && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-32 sm:py-40 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-inner"
                            >
                               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                   <Search className="w-10 h-10 text-slate-200" />
                               </div>
                               <h3 className="text-xl font-bold text-slate-900 mb-2">Ingen sager fundet</h3>
                               <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">Prøv at justere dine filtre eller søgekriterier for at se flere resultater.</p>
                               <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setSearchQuery('');
                                        setActiveTypeId(3);
                                        setActiveStatusId(null);
                                        setShowOnlyFollowed(false);
                                    }}
                                    className="mt-8 rounded-xl px-6 h-12 font-bold"
                               >
                                   Nulstil filtre
                               </Button>
                            </motion.div>
                          )}

                          {hasMore && !isLoading && sager.length > 0 && isPremiumUser && (
                            <div className="text-center pt-8">
                              <Button 
                                onClick={() => fetchSagerData(true)} 
                                variant="outline" 
                                disabled={isLoadingMore} 
                                className="rounded-2xl px-12 h-16 border-slate-200 text-slate-900 font-bold hover:bg-slate-50 active:scale-95 transition-all shadow-md"
                              >
                                {isLoadingMore ? <Loader2 className="w-5 h-5 mr-3 animate-spin"/> : null}
                                {isLoadingMore ? 'Henter sager...' : 'Indlæs flere efterretninger'}
                              </Button>
                            </div>
                          )}
                      </motion.div>
                    )}
                </AnimatePresence>
            </div>
      </main>

    </div>
  );
};


const FolketingetPage = () => {
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

    return <FolketingetPageContent />;
};

export default FolketingetPage;
