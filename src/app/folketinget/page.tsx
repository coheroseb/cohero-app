
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
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-amber-100 shadow-sm p-6 sm:p-10 animate-pulse">
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
                <div className="w-16 sm:w-20 h-6 bg-slate-100 rounded-lg"></div>
                <div className="w-20 sm:w-24 h-6 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="w-24 sm:w-32 h-4 bg-slate-100 rounded"></div>
        </div>
        <div className="w-full sm:w-3/4 h-8 bg-slate-200 rounded-lg mb-4"></div>
        <div className="pt-6 border-t border-amber-50 flex justify-between items-center">
            <div className="w-24 h-4 bg-slate-100 rounded"></div>
            <div className="w-32 sm:w-36 h-8 bg-slate-100 rounded-lg"></div>
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
        <div id={`sag-${sag.id}`} className={`bg-white rounded-[2rem] sm:rounded-[2.5rem] border transition-all overflow-hidden scroll-mt-32 shadow-sm hover:shadow-xl ${isHighlighted ? 'border-amber-400 ring-4 ring-amber-400/5' : 'border-amber-100'}`}>
           <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-900 text-[9px] sm:text-[10px] font-black uppercase rounded-lg border border-amber-100">{sag.nummer || 'Info'}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${ sag.statusid === 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700' }`}>{getStatusString(sag.statusid)}</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isAdmin && (
                    <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <button onClick={(e) => onHighlight(e, sag)} className={`p-2 rounded-xl border transition-all ${isHighlighted ? 'bg-amber-950 text-amber-400 border-amber-950 shadow-lg' : 'text-slate-300 border-transparent hover:border-amber-200 hover:text-amber-500'}`}>
                                <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${isHighlighted ? 'fill-current' : ''}`} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isHighlighted ? 'Fjern fra fremhævede' : 'Fremhæv for alle'}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={(e) => onFollow(e, sag.id)} className="p-2 text-slate-300 hover:text-amber-500 transition-colors">
                            <Star className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${isFollowed ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>{isFollowed ? 'Følger ikke længere' : 'Følg sag'}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex items-center gap-1.5 ml-2 text-slate-400">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter">Opdateret: {new Date(sag.opdateringsdato).toLocaleDateString('da-DK')}</span>
                  </div>
                </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-950 serif mb-6 leading-tight line-clamp-3 sm:line-clamp-none">{sag.titel}</h3>
            <div className="flex items-center justify-between pt-6 border-t border-amber-50">
               <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">{getTypeString(sag.typeid)}</span>
                <Link href={`/folketinget/case/view/${sag.id}`} className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-900 hover:text-rose-700 transition-colors">
                    <span className="hidden xs:inline">Proces & Dokumenter</span>
                    <span className="xs:hidden">Se mere</span>
                    <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform`} />
                </Link>
            </div>
            </div>
        </div>
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
    return userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership);
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
                lastUpdatedAt: new Date(sagToFollow.opdateringsdato),
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
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col relative overflow-hidden">
      <header className="bg-white/80 backdrop-blur-xl border-b border-amber-100 px-4 sm:px-6 py-6 lg:py-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          <div className="flex items-start gap-4 sm:gap-6">
            <Link href="/portal" className="p-2 sm:p-3 bg-rose-50 text-rose-900 rounded-2xl hover:bg-rose-100 transition-all group active:scale-95 shrink-0">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <Gavel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-700" />
                 <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-rose-900/50">ODA Realtids-Monitorering</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-950 serif leading-tight">Politisk Puls</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-1 max-w-2xl gap-3 sm:gap-4 items-center w-full">
            <TooltipProvider>
                <Tooltip open={!isPremiumUser ? undefined : false}>
                    <TooltipTrigger asChild>
                        <div className={`relative flex-1 group w-full ${!isPremiumUser ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
                            <input 
                                id="search-query" 
                                name="search-query" 
                                type="text" 
                                placeholder={isPremiumUser ? "Søg i lovforslag..." : "Søgning kræver Kollega+"} 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                disabled={!isPremiumUser}
                                className={`w-full pl-11 sm:pl-14 pr-6 py-3 sm:py-4 bg-[#FDFCF8] border border-amber-100 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all shadow-inner text-sm font-medium ${!isPremiumUser ? 'cursor-not-allowed' : ''}`}
                            />
                            {!isPremiumUser && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500" />}
                        </div>
                    </TooltipTrigger>
                    {!isPremiumUser && (
                        <TooltipContent className="bg-amber-950 text-white border-amber-800 p-4" side="bottom">
                            <Link href="/upgrade" className="flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-amber-400"/>
                                <div>
                                    <p className="font-bold">Søgning er en premium funktion</p>
                                    <p className="text-xs text-amber-100/70 hover:underline">Opgrader til Kollega+ for at søge i arkivet.</p>
                                </div>
                            </Link>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
            <Link href="/opslagstavle" className="px-5 py-3 sm:px-6 sm:py-4 bg-amber-950 text-white rounded-xl sm:rounded-2xl font-bold shadow-lg hover:bg-rose-900 transition-all flex items-center gap-2 w-full sm:w-auto justify-center text-sm">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Nyt opslag</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 lg:py-12 grid lg:grid-cols-12 gap-8 lg:gap-10">
            {/* SIDEBAR - TOP ON MOBILE */}
            <aside className="lg:col-span-3 space-y-8 lg:space-y-10 h-fit lg:sticky lg:top-32">
                <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2 flex items-center gap-2"><Filter className="w-3.5 h-3.5"/>Filtre</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                        <div className="relative">
                            <select 
                                value={activeTypeId || ''}
                                onChange={(e) => setActiveTypeId(e.target.value ? Number(e.target.value) : null)} 
                                className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-amber-100 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-200 shadow-sm"
                            >
                                <option value="">Alle sagstyper</option>
                                {typer.map(t => <option key={t.id} value={t.id}>{t.type}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                        </div>
                        <div className="relative">
                             <select 
                                value={activeStatusId || ''}
                                onChange={(e) => setActiveStatusId(e.target.value ? Number(e.target.value) : null)} 
                                className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-amber-100 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-200 shadow-sm"
                            >
                                <option value="">Alle statusser</option>
                                {statusser.map(s => <option key={s.id} value={s.id}>{s.status}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
                        </div>
                        <Button 
                            variant={showOnlyFollowed ? 'secondary' : 'outline'} 
                            onClick={() => setShowOnlyFollowed(!showOnlyFollowed)} 
                            className="w-full justify-start rounded-xl text-xs h-11"
                        >
                            <Star className={`w-3.5 h-3.5 mr-2 ${showOnlyFollowed ? 'text-amber-500 fill-amber-500' : ''}`} />
                            Mine Fulgte Sager
                        </Button>
                    </div>
                </section>
                
                {/* HIGHLIGHTED SAGER - HIDDEN ON VERY SMALL MOBILE OR REORGANIZED */}
                <section className="hidden xs:block">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2 flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-rose-500"/>Fremhævede Sager
                    </h3>
                    {highlightedSagerLoading ? (
                        <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-amber-200"/></div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {highlightedSager?.map((sag) => {
                                const isClickable = isPremiumUser;
                                const href = isClickable ? `/folketinget/case/view/${sag.sagId}` : '/upgrade';
                                
                                return (
                                    <TooltipProvider key={sag.id}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Link 
                                            href={href} 
                                            onClick={(e) => !isClickable && e.preventDefault()}
                                            className={`block p-3 bg-white border border-amber-100/50 rounded-xl transition-colors group ${isClickable ? 'hover:bg-rose-50 hover:border-rose-200 cursor-pointer' : 'cursor-default opacity-70'}`}
                                          >
                                            <div className="flex justify-between items-center gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-[11px] font-bold text-amber-900 ${isClickable ? 'group-hover:text-rose-900' : ''} truncate`}>{sag.alias || sag.titel}</p>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{sag.nummer}</p>
                                                </div>
                                                {!isClickable && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                            </div>
                                          </Link>
                                        </TooltipTrigger>
                                        {!isClickable && (
                                          <TooltipContent>
                                            <p>Opgrader til Kollega+ for at tilgå fremhævede sager.</p>
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                            {(highlightedSager?.length === 0) && <p className="text-[10px] text-center text-slate-400 italic">Ingen fremhævede sager.</p>}
                        </div>
                    )}
                </section>
            </aside>

            {/* MAIN LIST */}
            <div className="lg:col-span-9 space-y-6 sm:space-y-8">
                {isLoading ? (
                  <div className="grid gap-4 sm:gap-6">
                    {[...Array(5)].map((_, i) => <SagSkeleton key={i} />)}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:gap-6">
                      {sager.map((sag) => (
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
                        <div className="py-20 sm:py-24 text-center bg-white rounded-[2rem] sm:rounded-[3rem] border border-dashed border-amber-100 shadow-inner">
                           <Search className="w-10 h-10 sm:w-12 sm:h-12 text-amber-100 mx-auto mb-4" />
                           <p className="text-sm text-slate-400 italic font-medium">Ingen sager matchede dine filtre.</p>
                        </div>
                      )}

                      {hasMore && !isLoading && sager.length > 0 && isPremiumUser && (
                        <div className="text-center mt-8 sm:mt-12">
                          <Button onClick={() => fetchSagerData(true)} variant="outline" disabled={isLoadingMore} className="rounded-xl px-8 h-12">
                            {isLoadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                            Hent flere sager
                          </Button>
                        </div>
                      )}
                  </div>
                )}
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
