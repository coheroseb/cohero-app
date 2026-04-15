
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
  Plus,
  Building
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { fetchFolketingetSager, fetchFolketingetMetadataAction } from '@/app/actions';
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -8 }}
            className={`group relative bg-white rounded-[40px] border transition-all duration-500 overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_80px_-20px_rgba(45,35,15,0.08)] border-slate-100 ${isHighlighted ? 'ring-2 ring-amber-400/20' : ''}`}
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.02)_0%,transparent_70%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.05)_0%,transparent_70%)] transition-all duration-700 pointer-events-none"></div>

            <div className="p-8 sm:p-12 relative">
                {/* Status & Actions Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 group/id hover:scale-105 transition-transform cursor-help">
                            <span className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-[900] uppercase tracking-widest rounded-xl border border-slate-200/50 shadow-sm">
                                {sag.nummer || 'ID:' + sag.id}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-[900] uppercase tracking-widest border shadow-sm ${ 
                                [10, 18].includes(sag.statusid) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                sag.statusid === 11 ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                sag.statusid === 12 ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                [14, 15, 16].includes(sag.statusid) ? 'bg-sky-50 text-sky-700 border-sky-100' :
                                'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                                <span className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                        [10, 18].includes(sag.statusid) ? 'bg-emerald-500' :
                                        sag.statusid === 11 ? 'bg-rose-500' :
                                        'bg-slate-400'
                                    }`} />
                                    {getStatusString(sag.statusid)}
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-slate-50/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 flex items-center gap-1.5 shadow-inner">
                            {isAdmin && (
                                <button 
                                    onClick={(e) => onHighlight(e, sag)} 
                                    className={`p-2.5 rounded-xl transition-all duration-300 ${isHighlighted ? 'bg-amber-400 text-white shadow-lg ring-4 ring-amber-400/20' : 'text-slate-400 hover:text-amber-500 hover:bg-white hover:shadow-sm'}`}
                                >
                                    <Flame className={`w-4 h-4 ${isHighlighted ? 'fill-current' : ''}`} />
                                </button>
                            )}
                            <button 
                                onClick={(e) => onFollow(e, sag.id)} 
                                className={`p-2.5 rounded-xl transition-all duration-300 ${isFollowed ? 'bg-slate-900 text-white shadow-lg ring-4 ring-slate-900/10' : 'text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm'}`}
                            >
                                <Star className={`w-4 h-4 ${isFollowed ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden sm:block opacity-50"></div>
                        <div className="flex flex-col text-right">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Opdateret</span>
                           <span className="text-[12px] font-bold text-slate-900">{new Date(sag.opdateringsdato || Date.now()).toLocaleDateString('da-DK', { day: '2-digit', month: 'short' })}</span>
                        </div>
                    </div>
                </div>

                {/* Title & Author Info Stack */}
                <div className="relative mb-10 overflow-hidden group/content">
                    <Link href={`/folketinget/case/view/${sag.id}`} className="block">
                        <h3 className="text-[24px] sm:text-[32px] font-[900] text-slate-900 tracking-[-0.04em] leading-[1.1] mb-6 group-hover/content:text-slate-700 transition-colors">
                            {sag.titel}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                            <Building className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Lovgivningsproces • {getTypeString(sag.typeid)}</span>
                    </div>
                </div>

                {/* AI Insights Section - Professional Law-Tech Stack */}
                {metadata && !metadata.failed ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-10 group/insight"
                    >
                        <div className="relative p-8 bg-gradient-to-br from-[#FDFBF7] to-white rounded-[32px] border border-amber-100/50 shadow-[0_4px_12px_rgba(251,191,36,0.03)] group-hover/insight:border-amber-200/50 transition-all duration-500 overflow-hidden">
                            {/* Decorative Corner */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-50 to-transparent pointer-events-none"></div>
                            
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-900/60">AI Strategisk Vurdering</span>
                            </div>

                            <p className="text-[15px] font-bold text-slate-800 leading-relaxed mb-8 italic relative">
                                <span className="text-4xl text-amber-200 font-serif absolute -top-4 -left-2 pointer-events-none opacity-40">"</span>
                                {metadata.impactSummary}
                                <span className="text-4xl text-amber-200 font-serif absolute -bottom-8 right-0 pointer-events-none opacity-40">"</span>
                            </p>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-100/30">
                                {(metadata.legalFields || []).map((field, i) => (
                                    <div key={i} className="px-3 py-1.5 bg-white border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-sm group-hover/insight:border-amber-200/30 transition-all">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                        {field}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="mb-10">
                        <button 
                            onClick={() => onGenerateAI(sag)}
                            disabled={isGeneratingAI}
                            className="w-full group/ai relative p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition-all duration-500 text-left overflow-hidden"
                        >
                            {/* Animated Background Mesh */}
                            {isGeneratingAI && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.1)_0%,transparent_70%)] animate-pulse"
                                />
                            )}
                            
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${isGeneratingAI ? 'bg-amber-400 text-white rotate-180' : 'bg-white border border-slate-200 text-slate-400 group-hover/ai:border-amber-400 group-hover/ai:text-amber-500 group-hover/ai:scale-110'}`}>
                                        {isGeneratingAI ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">AI Efterretning</span>
                                        <h4 className="text-[17px] font-[900] text-slate-900 tracking-tight">
                                            {isGeneratingAI ? 'Genererer strategisk oversigt...' : 'Genere AI Strategi & Vurdering'}
                                        </h4>
                                        <p className="text-[13px] font-bold text-slate-500 mt-1 max-w-sm">
                                            Få AI-drevet indsigt i hvordan dette lovforslag påvirker din praksis.
                                        </p>
                                    </div>
                                </div>
                                {!isGeneratingAI && (
                                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover/ai:border-amber-400 group-hover/ai:text-amber-500 transition-all">
                                        <Zap className="w-4 h-4 fill-current" />
                                    </div>
                                )}
                            </div>
                        </button>
                    </div>
                )}

                {/* Visual Impact Indicator (New Law-Tech element) */}
                <div className="relative mb-10 group/pulse">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Socialfaglig Relevans</span>
                        <span className="text-[13px] font-[900] text-slate-900 tracking-tight">HØJ</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1 group-hover/pulse:gap-0.5 transition-all duration-500">
                        <div className="h-full w-[40%] bg-slate-900 rounded-full" />
                        <div className="h-full w-[30%] bg-slate-900 rounded-full" />
                        <div className="h-full w-[20%] bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                        <div className="h-full flex-grow bg-slate-200/50" />
                    </div>
                </div>

                {/* Final CTA Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pt-10 border-t border-slate-50 relative">
                    <div className="flex items-center gap-4 group/author">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover/author:border-slate-900 group-hover/author:text-slate-900 transition-all duration-500 shadow-inner">
                            <BookOpen className="w-6 h-6 transition-transform group-hover/author:scale-110" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1.5">Niveau</span>
                            <span className="text-sm font-[900] text-slate-900 tracking-tight">Ekspertniveau</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 pr-6 border-r border-slate-100">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-[11px] font-bold text-slate-500">Læst af AI</span>
                        </div>
                        <Link 
                            href={`/folketinget/case/view/${sag.id}`} 
                            className="group/btn relative h-14 px-10 rounded-2xl bg-slate-900 md:hover:bg-black text-white font-[900] text-[12px] uppercase tracking-widest flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] origin-center overflow-hidden"
                        >
                            <span className="relative z-10">Udforsk sag</span>
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform relative z-10" />
                            
                            {/* Hover effect div */}
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
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

  const getStatusString = (id: number) => statusser.find((s) => s.id === id)?.status || 'Ukendt';
  const getTypeString = (id: number) => typer.find((t) => t.id === id)?.type || 'Sag';

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col relative overflow-hidden font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Immersive Background Elements */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.03)_0%,transparent_70%)] rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed -bottom-1/4 -left-1/4 w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.02)_0%,transparent_70%)] rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.015] pointer-events-none z-0"></div>

      <header className="sticky top-6 z-[100] mx-6">
        <div className="max-w-7xl mx-auto">
            <div className="bg-white/70 backdrop-blur-3xl border border-white/60 rounded-[32px] px-8 py-5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                    <Link href="/portal" className="w-14 h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 hover:border-slate-900 hover:scale-105 transition-all flex items-center justify-center shadow-sm shrink-0 group">
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <div className="px-3 py-1 bg-rose-50 rounded-lg border border-rose-100 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-800">Live Monitorering</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Politisk Puls</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-[900] text-slate-900 tracking-[-0.04em] leading-tight">Lovgivnings Puls</h1>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-1 max-w-xl gap-4 items-center w-full">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                        <input
                            type="text"
                            className="w-full bg-slate-50/50 border border-slate-100 focus:border-slate-900 focus:bg-white rounded-2xl h-16 pl-16 pr-10 text-[15px] font-bold transition-all focus:ring-8 focus:ring-slate-900/5 outline-none placeholder:text-slate-300 shadow-inner"
                            placeholder="Søg i lovforslag, sager og beslutninger..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={!isPremiumUser}
                        />
                        {!isPremiumUser && (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <Lock className="w-4 h-4 text-slate-300" />
                            </div>
                        )}
                        {/* Interactive focus decoration */}
                        <div className="absolute bottom-1 left-6 right-6 h-[2px] bg-slate-900 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 rounded-full" />
                </div>
            </div>
        </div>
      </div>
    </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-12 relative z-10 flex flex-col gap-12">
            
            {/* FEATURED INTELLIGENCE SECTION */}
            {!highlightedSagerLoading && highlightedSager && highlightedSager.length > 0 && (
              <section className="mt-8">
                <div className="flex items-center justify-between mb-10 px-2">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20 ring-4 ring-amber-400/10">
                         <Flame className="w-6 h-6 text-white fill-current" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] leading-none mb-1.5">Redaktionens Valg</span>
                        <h2 className="text-2xl font-[900] text-slate-900 tracking-tight">Vigtigste Efterretninger</h2>
                      </div>
                   </div>
                   
                   <div className="hidden sm:flex items-center gap-4 bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/60 shadow-sm">
                        <div className="flex -space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black">AI</div>
                            <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[10px] font-black">⭐</div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">Analyseres løbende</span>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {highlightedSager.slice(0, 3).map((sag, idx) => (
                      <motion.div
                        key={sag.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Link 
                            href={isPremiumUser ? `/folketinget/case/view/${sag.sagId}` : '/upgrade'}
                            className="group relative h-[320px] bg-slate-950 rounded-[40px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:scale-[1.02] transition-all duration-700 flex flex-col p-10 group/item"
                        >
                            {/* Visual Layering */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-30 pointer-events-none"></div>
                            <div className={`absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15)_0%,transparent_70%)] rounded-full blur-[60px] opacity-0 group-hover/item:opacity-100 transition-opacity duration-1000`}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-[1]"></div>
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl">
                                            <span className="text-[10px] font-[900] text-amber-400 uppercase tracking-[0.2em]">{sag.nummer}</span>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                                    </div>
                                    <h3 className="text-2xl font-[900] text-white leading-[1.1] tracking-tight group-hover/item:text-amber-50 group-hover/item:translate-y-[-2px] transition-all duration-500 line-clamp-3">
                                        {sag.alias || sag.titel}
                                    </h3>
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-white/10">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Status</span>
                                        <span className="text-[12px] font-bold text-white/90">Aktiv behandling</span>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover/item:bg-white group-hover/item:text-slate-950 group-hover/item:scale-110 transition-all duration-500 shadow-xl">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                      </motion.div>
                    ))}
                </div>
              </section>
            )}
            <div className="grid lg:grid-cols-12 gap-12">
                {/* FILTERS COLUMN - Law-Tech Styled */}
                <aside className="lg:col-span-4 space-y-10">
                    <section className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] relative overflow-hidden group/filter">
                        {/* Organic background gradient */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100/20 rounded-full blur-2xl group-hover/filter:scale-110 transition-transform duration-700 pointer-events-none"></div>

                        <div className="flex items-center gap-4 mb-10 px-1">
                           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10">
                              <Filter className="w-5 h-5 text-white" />
                           </div>
                           <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Præcision</span>
                                <h3 className="text-[15px] font-[900] text-slate-900 tracking-tight">Filtrering</h3>
                           </div>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="space-y-3">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 group-focus-within:text-slate-900 transition-colors">Vælg Kategori</p>
                               <div className="relative group/select">
                                   <select 
                                      value={activeTypeId || ''} 
                                      onChange={(e) => setActiveTypeId(e.target.value ? Number(e.target.value) : null)} 
                                      className="w-full appearance-none pl-6 pr-14 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-[900] text-slate-700 outline-none hover:border-slate-900 focus:border-slate-900 hover:bg-white transition-all shadow-inner"
                                   >
                                      <option value="">Alle sagstyper</option>
                                      {typer.map(t => <option key={t.id} value={t.id}>{t.type}</option>)}
                                   </select>
                                   <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:rotate-180 transition-transform duration-300"/>
                               </div>
                            </div>

                            <div className="space-y-3">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 group-focus-within:text-slate-900 transition-colors">Vælg Status</p>
                               <div className="relative group/select">
                                    <select 
                                       value={activeStatusId || ''} 
                                       onChange={(e) => setActiveStatusId(e.target.value ? Number(e.target.value) : null)} 
                                       className="w-full appearance-none pl-6 pr-14 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-[900] text-slate-700 outline-none hover:border-slate-900 focus:border-slate-900 hover:bg-white transition-all shadow-inner"
                                    >
                                       <option value="">Alle statusser</option>
                                       {statusser.map(s => <option key={s.id} value={s.id}>{s.status}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:rotate-180 transition-transform duration-300"/>
                               </div>
                            </div>

                            <button 
                               onClick={() => setShowOnlyFollowed(!showOnlyFollowed)} 
                               className={`w-full flex items-center justify-between h-16 rounded-2xl px-6 text-[13px] font-[900] transition-all duration-300 active:scale-[0.98] tracking-tight ${showOnlyFollowed ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-900 border border-transparent'}`}
                            >
                               <div className="flex items-center gap-4">
                                  <Star className={`w-4 h-4 transition-transform duration-500 ${showOnlyFollowed ? 'fill-amber-400 text-amber-400 scale-125' : ''}`} />
                                  Monitorerede Sager
                               </div>
                               {followedSagerIds.size > 0 && (
                                 <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${showOnlyFollowed ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-900'}`}>
                                   {followedSagerIds.size}
                                 </span>
                               )}
                            </button>
                        </div>
                    </section>

                    {/* AI Monitorering Stats Card - Premium Law-Tech */}
                    <section className="bg-slate-950 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group/ai">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center mb-10 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10">
                               <Zap className="w-6 h-6 text-white fill-current" />
                            </div>
                            
                            <h4 className="text-[22px] font-[900] leading-[1.2] mb-4 tracking-tight">AI Monitorering & Lov-logik</h4>
                            <p className="text-slate-400 text-[14px] font-bold leading-relaxed mb-10">
                                Vores system analyserer Folketinget i realtid og identificerer paragraffer, der påvirker din praksis.
                            </p>
                            
                            <Link href="/concept-explainer" className="group/link w-full h-14 bg-white text-slate-950 rounded-2xl font-[900] uppercase tracking-widest text-[11px] flex items-center justify-center hover:bg-indigo-50 hover:shadow-xl hover:scale-[1.02] transition-all origin-center">
                                Gå til AI Sparring
                                <ArrowRight className="ml-3 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
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
                                    onGenerateAI={handleGenerateAI}
                                    isGeneratingAI={generatingAIIds.has(sag.id)}
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
