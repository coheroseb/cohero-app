
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
    metadata,
    getStatusString, 
    getTypeString 
}: { 
    sag: Sag, 
    onFollow: (e: React.MouseEvent, sagId: number) => void, 
    isFollowed: boolean, 
    onHighlight: (e: React.MouseEvent, sag: Sag) => void,
    isHighlighted: boolean,
    isAdmin: boolean,
    metadata?: { legalFields: string[], impactSummary: string, failed?: boolean },
    getStatusString: (id: number) => string, 
    getTypeString: (id: number) => string 
}) => {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={`group bg-white rounded-[32px] border transition-all overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] border-slate-100 relative ${isHighlighted ? 'ring-2 ring-amber-400/20' : ''}`}
        >
            <div className="p-8 sm:p-10 relative">
                {/* Status & Actions Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200/50">
                            {sag.nummer || 'ID:' + sag.id}
                        </span>
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ 
                            [10, 18].includes(sag.statusid) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            sag.statusid === 11 ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            sag.statusid === 12 ? 'bg-slate-100 text-slate-500 border-slate-200' :
                            [14, 15, 16].includes(sag.statusid) ? 'bg-sky-50 text-sky-700 border-sky-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                            {getStatusString(sag.statusid)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="bg-slate-50 p-1 rounded-xl border border-slate-100 flex items-center gap-1">
                            {isAdmin && (
                                <button 
                                    onClick={(e) => onHighlight(e, sag)} 
                                    className={`p-2 rounded-lg transition-all ${isHighlighted ? 'bg-amber-400 text-white shadow-sm' : 'text-slate-400 hover:text-amber-500 hover:bg-white'}`}
                                >
                                    <Flame className={`w-4 h-4 ${isHighlighted ? 'fill-current' : ''}`} />
                                </button>
                            )}
                            <button 
                                onClick={(e) => onFollow(e, sag.id)} 
                                className={`p-2 rounded-lg transition-all ${isFollowed ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-white'}`}
                            >
                                <Star className={`w-4 h-4 ${isFollowed ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{new Date(sag.opdateringsdato || Date.now()).toLocaleDateString('da-DK', { day: '2-digit', month: 'short' })}</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <Link href={`/folketinget/case/view/${sag.id}`} className="block group/title mb-8">
                    <h3 className="text-[20px] sm:text-[24px] font-extrabold text-slate-900 tracking-tight leading-tight group-hover/title:text-slate-700 transition-colors">
                        {sag.titel}
                    </h3>
                </Link>

                {/* AI Insights Section */}
                {metadata && !metadata.failed && (
                    <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {(metadata.legalFields || []).map((field, i) => (
                                <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-md flex items-center gap-1.5 shadow-sm">
                                    <Scale className="w-3 h-3" />
                                    {field}
                                </span>
                            ))}
                        </div>
                        <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic line-clamp-2">
                            "{metadata.impactSummary}"
                        </p>
                    </div>
                )}

                {/* Footer Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Indholdstype</span>
                            <span className="text-[13px] font-bold text-slate-700">{getTypeString(sag.typeid)}</span>
                        </div>
                    </div>

                    <Link 
                        href={`/folketinget/case/view/${sag.id}`} 
                        className="group/btn relative py-3.5 px-8 rounded-xl bg-slate-900 md:hover:bg-black text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10"
                    >
                        Udforsk sag
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
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
  const [activeTypeId, setActiveTypeId] = useState<number | null>(3); 
  const [activeStatusId, setActiveStatusId] = useState<number | null>(null);
  const [showOnlyFollowed, setShowOnlyFollowed] = useState(false);

  const [sagerMetadata, setSagerMetadata] = useState<Record<number, { legalFields: string[], impactSummary: string, failed?: boolean }>>({});

  const isPremiumUser = useMemo(() => {
    return !!(userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership || ''));
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
    if (user && isPremiumUser) {
        import('@/app/actions').then(m => m.checkFollowedSagerUpdatesAction(user.uid, user.email || ''));
    }
  }, [user, isPremiumUser]);

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

        const limitVal = isPremiumUser ? 20 : 5;
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
            top: limitVal,
        });
        
        setHasMore(sagerRes.length >= limitVal && isPremiumUser);
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

  useEffect(() => {
    if (!isPremiumUser || sager.length === 0) return;
    
    const sagerToFetch = sager.filter(s => !sagerMetadata[s.id]).slice(0, 5);
    if (sagerToFetch.length === 0) return;

    const fetchAllMetadata = async () => {
        const { getFTSagMetadataAction } = await import('@/app/actions');
        const results = await Promise.all(sagerToFetch.map(s => getFTSagMetadataAction({
            sagId: s.id,
            title: s.titel,
            resume: s.resume || undefined
        })));
        
        setSagerMetadata(prev => {
            const next = { ...prev };
            sagerToFetch.forEach((s, i) => {
                const res = results[i];
                if (res && res.data) {
                    // @ts-ignore
                    next[s.id] = res.data;
                } else {
                    // @ts-ignore
                    next[s.id] = { failed: true };
                }
            });
            return next;
        });
    };
    fetchAllMetadata();
  }, [sager, isPremiumUser, sagerMetadata]);

  const handleFollow = async (e: React.MouseEvent, sagId: number) => {
    e.stopPropagation();
    if (!user || !firestore || !userProfile) return;
    const isCurrentlyFollowed = followedSagerIds.has(sagId);
    
    try {
        if (isCurrentlyFollowed) {
            // Find the Doc ID from our real-time list
            const existingDoc = followedSagerDocs?.find(d => d.sagId === sagId);
            if (existingDoc) {
                await deleteDoc(doc(firestore, 'followedSager', existingDoc.id));
            } else {
                // Fallback to query if not found in local state (unlikely but safe)
                const followedSagerColRef = collection(firestore, 'followedSager');
                const q = query(followedSagerColRef, where('userId', '==', user.uid), where('sagId', '==', sagId));
                const querySnapshot = await getDocs(q);
                const deletions = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
                await Promise.all(deletions);
            }
        } else {
            const followedSagerColRef = collection(firestore, 'followedSager');
            const sagToFollow = sager.find(s => s.id === sagId);
            const hlSag = highlightedSager?.find(s => s.sagId === sagId);
            
            const targetSag = sagToFollow || hlSag;

            if (!targetSag) {
                toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke finde sagsoplysninger for at følge sagen.' });
                return;
            }

            await addDoc(followedSagerColRef, {
                userId: user.uid,
                userEmail: user.email,
                userName: userProfile?.username || user.displayName || 'Bruger',
                sagId: sagId,
                statusId: targetSag.statusid || targetSag.statusId, // support both case styles
                createdAt: serverTimestamp(),
                lastUpdatedAt: serverTimestamp(),
            });
        }
        toast({ title: isCurrentlyFollowed ? "Følger ikke længere sag" : "Følger sag", description: `Du ${isCurrentlyFollowed ? 'følger ikke længere' : 'følger nu'} sagen.` });
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
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.02)_0,transparent_70%)] rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.02)_0,transparent_70%)] rounded-full blur-[100px] pointer-events-none z-0"></div>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 py-6 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="w-12 h-12 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center shadow-sm shrink-0">
               <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="p-1 bg-rose-50 rounded-lg border border-rose-100">
                    <Activity className="w-3.5 h-3.5 text-rose-600" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lovgivning & Monitorering</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Politisk Puls</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-1 max-w-2xl gap-4 items-center w-full">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                    type="text"
                    className="w-full bg-slate-50/50 border border-slate-100 focus:border-slate-900 rounded-2xl h-14 pl-14 pr-8 text-[14px] font-bold transition-all focus:ring-4 focus:ring-slate-900/5 outline-none placeholder:text-slate-300"
                    placeholder="Søg i sager, lovforslag og beslutninger..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={!isPremiumUser}
                />
                {!isPremiumUser && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Lock className="w-4 h-4 text-slate-300" />
                    </div>
                )}
            </div>
            <Link href="/opslagstavle" className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all flex items-center gap-3 w-full sm:w-auto justify-center shadow-lg shadow-slate-900/10 active:scale-95">
              <Plus className="w-4 h-4" />
              Nyt opslag
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-12 relative z-10 flex flex-col gap-12">
            
            {/* FEATURED CARDS SECTION - HERO-LIKE */}
            {!highlightedSagerLoading && highlightedSager && highlightedSager.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8 px-2">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                         <Flame className="w-4 h-4 text-amber-600 fill-amber-600" />
                      </div>
                      <h2 className="text-[18px] font-black text-slate-900 uppercase tracking-tight">Fremhævede efterretninger</h2>
                   </div>
                   <div className="flex gap-2">
                      <div className="h-1.5 w-8 bg-amber-400 rounded-full"></div>
                      <div className="h-1.5 w-2 bg-slate-200 rounded-full"></div>
                      <div className="h-1.5 w-2 bg-slate-200 rounded-full"></div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {highlightedSager.slice(0, 3).map((sag, idx) => (
                      <Link 
                        key={sag.id} 
                        href={isPremiumUser ? `/folketinget/case/view/${sag.sagId}` : '/upgrade'}
                        className="group relative bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-[32px] overflow-hidden shadow-2xl hover:scale-[1.02] transition-all duration-500 min-h-[220px] flex flex-col justify-between"
                      >
                         <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/10 rounded-full blur-[40px] group-hover:bg-rose-500/20 transition-all"></div>
                         <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                               <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                               <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Særlig Vigtig</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 leading-tight line-clamp-2">{sag.alias || sag.titel}</h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{sag.nummer}</p>
                         </div>
                         <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/5 pt-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Læs Analyse</span>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 transition-all">
                               <ArrowRight className="w-4 h-4" />
                            </div>
                         </div>
                      </Link>
                    ))}
                </div>
              </section>
            )}

            <div className="grid lg:grid-cols-12 gap-12">
                {/* FILTERS COLUMN */}
                <aside className="lg:col-span-4 space-y-10">
                    <section className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8 px-1">
                           <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                              <Filter className="w-4 h-4 text-slate-500" />
                           </div>
                           <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900">Filtrering</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2.5">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kategori</p>
                               <div className="relative group">
                                   <select 
                                      value={activeTypeId || ''} 
                                      onChange={(e) => setActiveTypeId(e.target.value ? Number(e.target.value) : null)} 
                                      className="w-full appearance-none pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-all"
                                   >
                                      <option value="">Alle sagstyper</option>
                                      {typer.map(t => <option key={t.id} value={t.id}>{t.type}</option>)}
                                   </select>
                                   <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform"/>
                               </div>
                            </div>

                            <div className="space-y-2.5">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</p>
                               <div className="relative group">
                                    <select 
                                       value={activeStatusId || ''} 
                                       onChange={(e) => setActiveStatusId(e.target.value ? Number(e.target.value) : null)} 
                                       className="w-full appearance-none pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-all"
                                    >
                                       <option value="">Alle statusser</option>
                                       {statusser.map(s => <option key={s.id} value={s.id}>{s.status}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform"/>
                               </div>
                            </div>

                            <button 
                               onClick={() => setShowOnlyFollowed(!showOnlyFollowed)} 
                               className={`w-full flex items-center justify-between h-14 rounded-2xl px-6 text-[13px] font-bold transition-all ${showOnlyFollowed ? 'bg-amber-400 text-amber-950 shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                            >
                               <div className="flex items-center gap-3">
                                  <Star className={`w-4 h-4 ${showOnlyFollowed ? 'fill-current' : ''}`} />
                                  Fulgte Sager
                               </div>
                               {followedSagerIds.size > 0 && (
                                 <span className="px-2 py-0.5 bg-black/10 rounded-lg text-[10px]">
                                   {followedSagerIds.size}
                                 </span>
                               )}
                            </button>
                        </div>
                    </section>

                    {/* Stats Card */}
                    <section className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-[1.25rem] flex items-center justify-center mb-6 backdrop-blur-md">
                               <Zap className="w-6 h-6 text-indigo-200 fill-indigo-200" />
                            </div>
                            <h4 className="text-[20px] font-black leading-tight mb-3">AI Monitorering</h4>
                            <p className="text-indigo-100/70 text-[13px] font-medium leading-relaxed mb-8">Vi overvåger Folketinget 24/7 og analyserer betydningen for dit studie.</p>
                            <Link href="/concept-explainer" className="w-full h-12 bg-white text-indigo-700 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center hover:bg-slate-50 transition-colors">
                                Prøv AI sparringen
                            </Link>
                        </div>
                    </section>
                </aside>

                <div className="lg:col-span-8 space-y-8">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-8">
                              {[...Array(3)].map((_, i) => <SagSkeleton key={i} />)}
                          </motion.div>
                        ) : (
                          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-8">
                              {sager.map((sag) => (
                                <SagItem 
                                    key={sag.id}
                                    sag={sag}
                                    isAdmin={isAdmin}
                                    onFollow={handleFollow}
                                    isFollowed={followedSagerIds.has(sag.id)}
                                    onHighlight={handleHighlight}
                                    isHighlighted={highlightedSagerIds.has(sag.id)}
                                    metadata={sagerMetadata[sag.id]}
                                    getStatusString={getStatusString}
                                    getTypeString={getTypeString}
                                />
                              ))}
                              
                              {sager.length === 0 && (
                                <div className="py-24 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                      <Search className="w-8 h-8 text-slate-200" />
                                   </div>
                                   <h3 className="text-lg font-bold text-slate-900 mb-1">Ingen sager fundet</h3>
                                   <p className="text-[13px] text-slate-400 font-medium">Prøv at fjerne filtre eller ændre din søgning.</p>
                                   <button onClick={() => { setSearchQuery(''); setActiveTypeId(null); setActiveStatusId(null); setShowOnlyFollowed(false); }} className="mt-8 text-[12px] font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1">Nulstil alt</button>
                                </div>
                              )}

                              {hasMore && isPremiumUser && (
                                <div className="text-center pt-8">
                                   <button 
                                      onClick={() => fetchSagerData(true)} 
                                      disabled={isLoadingMore}
                                      className="px-12 h-16 bg-white border border-slate-200 rounded-2xl text-[14px] font-black uppercase tracking-widest text-slate-900 hover:border-slate-900 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm"
                                   >
                                      {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Indlæs flere efterretninger'}
                                   </button>
                                </div>
                              )}
                          </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
      </main>
    </div>
  );
};

const FolketingetPage = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    useEffect(() => { if (!isUserLoading && !user) router.replace('/'); }, [user, isUserLoading, router]);
    if (isUserLoading || !user) return <AuthLoadingScreen />;
    return <FolketingetPageContent />;
};

export default FolketingetPage;
