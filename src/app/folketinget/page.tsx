'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  Sparkles, 
  BookOpen, 
  Zap, 
  Loader2, 
  CheckCircle, 
  Activity,
  Star,
  Lock,
  ArrowRight,
  Filter,
  Building,
  Flame,
  Scale
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { fetchFolketingetSager, fetchFolketingetMetadataAction } from '@/app/actions';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useDebounce } from 'use-debounce';
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
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 sm:p-10 animate-pulse">
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
                <div className="w-20 h-6 bg-slate-50 rounded-lg"></div>
                <div className="w-24 h-6 bg-slate-50 rounded-lg"></div>
            </div>
            <div className="w-8 h-8 bg-slate-50 rounded-full"></div>
        </div>
        <div className="space-y-3 mb-8">
            <div className="w-full h-8 bg-slate-100 rounded-xl"></div>
            <div className="w-2/3 h-8 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
            <div className="w-32 h-4 bg-slate-50 rounded-lg"></div>
            <div className="w-32 h-10 bg-slate-100 rounded-xl"></div>
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
    getTypeString,
    onGenerateAI,
    isGeneratingAI
}: { 
    sag: Sag, 
    onFollow: (e: React.MouseEvent, sagId: number) => void, 
    isFollowed: boolean, 
    onHighlight: (e: React.MouseEvent, sag: Sag) => void,
    isHighlighted: boolean,
    isAdmin: boolean,
    metadata?: { legalFields: string[], impactSummary: string, failed?: boolean },
    getStatusString: (id: number) => string, 
    getTypeString: (id: number) => string,
    onGenerateAI: (sag: Sag) => void,
    isGeneratingAI: boolean
}) => {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group bg-white p-8 sm:p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-500 relative overflow-hidden`}
        >
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-100">
                        {sag.nummer}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                        [10, 18].includes(sag.statusid) ? 'bg-emerald-50 text-emerald-600' :
                        sag.statusid === 11 ? 'bg-rose-50 text-rose-600' :
                        'bg-slate-50 text-slate-500'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${[10, 18].includes(sag.statusid) ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {getStatusString(sag.statusid)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button 
                            onClick={(e) => onHighlight(e, sag)} 
                            className={`p-2 rounded-xl transition-all ${isHighlighted ? 'bg-amber-100 text-amber-600' : 'text-slate-300 hover:bg-slate-50'}`}
                        >
                            <Flame className={`w-4 h-4 ${isHighlighted ? 'fill-current' : ''}`} />
                        </button>
                    )}
                    <button 
                        onClick={(e) => onFollow(e, sag.id)} 
                        className={`p-2 rounded-xl transition-all ${isFollowed ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-50'}`}
                    >
                        <Star className={`w-4 h-4 ${isFollowed ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6 mb-10">
                <Link href={`/folketinget/case/view/${sag.id}`} className="block group/title">
                    <h3 className="text-2xl font-black text-slate-900 serif leading-tight group-hover/title:text-indigo-600 transition-colors">
                        {sag.titel}
                    </h3>
                </Link>
                <div className="flex items-center gap-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <Building className="w-4 h-4" />
                    {getTypeString(sag.typeid)}
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    Opdateret {new Date(sag.opdateringsdato).toLocaleDateString('da-DK')}
                </div>
            </div>

            {/* AI Insight */}
            {metadata && !metadata.failed ? (
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 mb-8 relative group/insight">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">AI Strategisk Vurdering</span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-700 leading-relaxed italic">
                        "{metadata.impactSummary}"
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {metadata.legalFields?.map((field, i) => (
                            <span key={i} className="px-2 py-1 bg-white text-[9px] font-black uppercase text-slate-500 rounded-lg border border-slate-100">
                                {field}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => onGenerateAI(sag)}
                    disabled={isGeneratingAI}
                    className="w-full p-6 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all mb-8 flex items-center justify-between group/ai"
                >
                    <div className="flex items-center gap-4 text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isGeneratingAI ? 'bg-indigo-600 text-white animate-spin' : 'bg-white text-slate-400 group-hover/ai:text-indigo-600 group-hover/ai:scale-110'}`}>
                            {isGeneratingAI ? <Loader2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">AI Analyse</p>
                            <p className="text-xs font-bold text-slate-600">Generer strategisk vurdering</p>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                </button>
            )}

            {/* Footer CTA */}
            <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lovgivning</span>
                </div>
                <Link 
                    href={`/folketinget/case/view/${sag.id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-900/10 group/btn"
                >
                    Udforsk sag
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
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
  const [generatingAIIds, setGeneratingAIIds] = useState<Set<number>>(new Set());

  const isPremiumUser = useMemo(() => {
    return !!(userProfile && ['Kollega+', 'Semesterpakken'].includes(userProfile.membership || ''));
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
        const { typer: t, statusser: s } = await fetchFolketingetMetadataAction();
        setTyper(t);
        setStatusser(s);
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

        const limitVal = isPremiumUser ? 20 : 2;
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

  const handleGenerateAI = async (sag: Sag) => {
    if (!isPremiumUser || generatingAIIds.has(sag.id)) return;
    
    setGeneratingAIIds(prev => new Set(prev).add(sag.id));
    try {
        const { getFTSagMetadataAction } = await import('@/app/actions');
        const res = await getFTSagMetadataAction({
            sagId: sag.id,
            title: sag.titel,
            resume: sag.resume || undefined
        });
        
        if (res && res.data) {
            setSagerMetadata(prev => ({
                ...prev,
                [sag.id]: res.data as any
            }));
            toast({ title: 'AI Analyse færdig', description: 'Vi har nu genereret en strategisk vurdering af denne sag.' });
        } else {
            setSagerMetadata(prev => ({
                ...prev,
                [sag.id]: { failed: true } as any
            }));
            toast({ variant: 'destructive', title: 'AI Analyse fejlede', description: 'Vi kunne ikke generere en vurdering i denne omgang.' });
        }
    } catch (error) {
        console.error("AI Generation error:", error);
    } finally {
        setGeneratingAIIds(prev => {
            const next = new Set(prev);
            next.delete(sag.id);
            return next;
        });
    }
  };

  const handleFollow = async (e: React.MouseEvent, sagId: number) => {
    e.stopPropagation();
    if (!user || !firestore || !userProfile) return;
    const isCurrentlyFollowed = followedSagerIds.has(sagId);
    
    try {
        if (isCurrentlyFollowed) {
            const existingDoc = followedSagerDocs?.find(d => d.sagId === sagId);
            if (existingDoc) {
                await deleteDoc(doc(firestore, 'followedSager', existingDoc.id));
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
                statusId: targetSag.statusid || targetSag.statusId,
                createdAt: serverTimestamp(),
                lastUpdatedAt: serverTimestamp(),
            });
        }
        toast({ title: isCurrentlyFollowed ? "Overvågning fjernet" : "Overvågning aktiveret", description: `Du ${isCurrentlyFollowed ? 'følger ikke længere' : 'følger nu'} sagen.` });
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
    }
  };

  const getStatusString = (id: number) => statusser.find((s) => s.id === id)?.status || 'Ukendt';
  const getTypeString = (id: number) => typer.find((t) => t.id === id)?.type || 'Sag';

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col relative overflow-hidden font-sans">
      {/* Premium Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.02),transparent)] pointer-events-none" />
      
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
                <Link href="/portal" className="p-3 hover:bg-slate-100 rounded-2xl transition-all group">
                    <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div className="h-8 w-px bg-slate-200 hidden md:block" />
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Politisk Puls</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 serif tracking-tight">Lovgivnings-Monitorering</h1>
                </div>
            </div>

            <div className="flex-1 max-w-2xl w-full relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-slate-900 focus:bg-white rounded-2xl h-14 pl-14 pr-6 text-sm font-bold transition-all outline-none placeholder:text-slate-300"
                    placeholder="Søg i lovforslag (f.eks. Barnets Lov)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={!isPremiumUser}
                />
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12">
                {/* Simplified Filter Sidebar */}
                <aside className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 sticky top-32">
                        <div className="space-y-2">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                               <Filter className="w-4 h-4 text-slate-400" /> Filtrering
                           </h3>
                           <div className="h-1 w-12 bg-slate-900 rounded-full" />
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kategori</label>
                               <select 
                                  value={activeTypeId || ''} 
                                  onChange={(e) => setActiveTypeId(e.target.value ? Number(e.target.value) : null)} 
                                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                               >
                                  <option value="">Alle sagstyper</option>
                                  {typer.map(t => <option key={t.id} value={t.id}>{t.type}</option>)}
                               </select>
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
                               <select 
                                  value={activeStatusId || ''} 
                                  onChange={(e) => setActiveStatusId(e.target.value ? Number(e.target.value) : null)} 
                                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-slate-900 focus:border-slate-900 transition-all cursor-pointer"
                               >
                                  <option value="">Alle statusser</option>
                                  {statusser.map(s => <option key={s.id} value={s.id}>{s.status}</option>)}
                               </select>
                            </div>

                            <button 
                               onClick={() => setShowOnlyFollowed(!showOnlyFollowed)} 
                               className={`w-full flex items-center justify-between h-12 rounded-xl px-4 text-[11px] font-black transition-all duration-300 ${showOnlyFollowed ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'}`}
                            >
                               <div className="flex items-center gap-2">
                                  <Star className={`w-3.5 h-3.5 ${showOnlyFollowed ? 'fill-amber-400 text-amber-400' : ''}`} />
                                  Overvågede
                               </div>
                               {followedSagerIds.size > 0 && (
                                 <span className={`px-2 py-0.5 rounded-lg text-[9px] ${showOnlyFollowed ? 'bg-white/20' : 'bg-slate-200'}`}>
                                   {followedSagerIds.size}
                                 </span>
                               )}
                            </button>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <Link href="/concept-explainer" className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl group">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-indigo-400 leading-none mb-1">AI Sparring</p>
                                    <p className="text-xs font-bold text-indigo-900">Spørg om lovgivning</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </aside>

                <div className="lg:col-span-9 space-y-8">
                    {/* Featured highlights if any */}
                    {!highlightedSagerLoading && highlightedSager && highlightedSager.length > 0 && !showOnlyFollowed && !searchQuery && (
                        <div className="grid sm:grid-cols-2 gap-6">
                            {highlightedSager.slice(0, 2).map((sag) => (
                                <Link 
                                    key={sag.id}
                                    href={`/folketinget/case/view/${sag.sagId}`}
                                    className="group relative h-64 bg-slate-900 rounded-[2.5rem] overflow-hidden p-10 flex flex-col justify-between hover:scale-[1.02] transition-all"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Flame className="w-20 h-20 text-amber-500 fill-current" />
                                    </div>
                                    <div className="relative z-10">
                                        <span className="px-3 py-1 bg-amber-500 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">Vigtigt Lovforslag</span>
                                        <h3 className="text-xl font-black text-white serif line-clamp-2 leading-tight">{sag.alias || sag.titel}</h3>
                                    </div>
                                    <div className="flex items-center justify-between text-white/50 relative z-10 pt-4 border-t border-white/5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{sag.nummer}</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                              {[...Array(3)].map((_, i) => <SagSkeleton key={i} />)}
                          </motion.div>
                        ) : (
                          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
                                    onGenerateAI={handleGenerateAI}
                                    isGeneratingAI={generatingAIIds.has(sag.id)}
                                />
                              ))}
                              
                              {sager.length === 0 && (
                                <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                      <Search className="w-10 h-10 text-slate-200" />
                                   </div>
                                   <h3 className="text-xl font-black text-slate-900 serif mb-2">Ingen sager fundet</h3>
                                   <p className="text-sm text-slate-400 font-medium">Prøv at justere dine søgekriterier.</p>
                                </div>
                              )}

                              {hasMore && isPremiumUser && (
                                <div className="text-center pt-8">
                                   <Button 
                                      onClick={() => fetchSagerData(true)} 
                                      disabled={isLoadingMore}
                                      variant="outline"
                                      className="px-12 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 hover:text-white transition-all"
                                   >
                                      {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                      {isLoadingMore ? 'Henter...' : 'Se flere sager'}
                                   </Button>
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

export default function FolketingetPage() {
    const { isUserLoading, user } = useApp();
    if (isUserLoading) return <AuthLoadingScreen />;
    if (!user) return null;
    return <FolketingetPageContent />;
}
