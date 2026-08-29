'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Bell,
  BellRing,
  Search,
  Loader2, 
  ExternalLink,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  X,
  Sparkles,
  Bookmark, 
  BookmarkCheck, 
  Copy,
  Check,
  TrendingUp,
  BookOpen,
  Filter,
  FileText
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useDebounce } from 'use-debounce';
import { fetchVivePublicationsAction, toggleViveAreaFollowAction } from '@/app/actions';
import type { VivePublication } from '@/ai/flows/types';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/PageHeader';

const viveAreas = [
  { id: '93a09ea5-08f3-126c-ab50-7b3fe0e6d789', name: 'Børn & Familie', icon: '👶' },
  { id: '57a72689-008b-b5df-47f8-b6724c8cea1e', name: 'Socialområdet', icon: '🏥' },
  { id: '0eca57d7-cd75-42f2-f731-55f82168eb58', name: 'Beskæftigelse', icon: '💼' },
  { id: 'fcd9e3a9-a6dc-14be-1f2f-b3b8a9d00e75', name: 'Dagtilbud & Skole', icon: '🏫' },
  { id: '820b03ed-2b07-8b45-6788-4e3660f2e9a3', name: 'Sundhed', icon: '🩺' },
  { id: 'e4043962-757e-9d73-ba9d-973dff77651d', name: 'Ældre', icon: '👵' },
  { id: 'ae41bac7-c93e-4b56-f432-ac4da9b51c9e', name: 'Ledelse', icon: '📊' },
  { id: '33c01510-2358-5584-3781-ef97af3a97df', name: 'Økonomi', icon: '💰' }
];

// Simple Cache Engine
const viveCache: Record<string, { data: VivePublication[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 15; // 15 mins

const ViveIndsigtPageContent: React.FC = () => {
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [publications, setPublications] = useState<VivePublication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAreaId, setActiveAreaId] = useState<string>('93a09ea5-08f3-126c-ab50-7b3fe0e6d789');
  const [viewMode, setViewMode] = useState<'browse' | 'saved'>('browse');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 350);

  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const PAGE_SIZE = 12;

  const savedArticlesQuery = useMemoFirebase(() => (
    user && firestore ? query(collection(firestore, 'users', user.uid, 'savedViveArticles')) : null
  ), [user, firestore]);
  const { data: savedArticles } = useCollection<any>(savedArticlesQuery);
  const savedArticleIds = useMemo(() => new Set(savedArticles?.map(a => a.articleId)), [savedArticles]);

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
      setError(err.message || 'Der opstod en fejl under hentning af forskningsrapporter.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedSearchQuery, activeAreaId, offset]);

  useEffect(() => {
    if (viewMode === 'browse') {
      loadPublications(true);
    }
  }, [debouncedSearchQuery, activeAreaId, viewMode]);

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
          description: result.followed ? "Du får besked ved nye forskningsudgivelser." : "Du modtager ikke længere opdateringer."
        });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke opdatere abonnement." });
    }
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
        toast({ title: "Fjernet fra dit arkiv" });
      } else {
        await setDoc(articleRef, {
          articleId: pub.id,
          title: pub.title,
          description: pub.description,
          url: pub.url,
          publicationDate: pub.publicationDate,
          apa: pub.apa || '',
          savedAt: serverTimestamp()
        });
        toast({ title: "Gemt i dit arkiv", description: "Rapporten er tilføjet til dine gemte kilder." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke gemme rapporten." });
    }
  };

  const handleCopyApa = (e: React.MouseEvent, id: string, apa: string) => {
    e.preventDefault();
    e.stopPropagation();
    const plainText = apa.replace(/<[^>]*>?/gm, '');
    navigator.clipboard.writeText(plainText);
    setCopiedId(id);
    toast({ title: "APA 7th reference kopieret!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isFollowingArea = (areaId: string) => userProfile?.followedViveAreas?.includes(areaId) || false;

  const currentAreaName = viveAreas.find(a => a.id === activeAreaId)?.name || 'Forskningsrapporter';

  const displayedList = useMemo(() => {
    if (viewMode === 'saved') {
      if (!savedArticles) return [];
      return savedArticles.map(a => ({
        id: a.articleId || a.id,
        title: a.title,
        description: a.description,
        url: a.url,
        publicationDate: a.publicationDate,
        apa: a.apa
      } as VivePublication));
    }
    return publications;
  }, [viewMode, savedArticles, publications]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-32">
      
      {/* ── Top Header ─────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-200/80 px-6 sm:px-8 py-4 sticky top-0 z-30">
        <PageHeader
          title="Forskningsrapporter"
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="bg-indigo-50 text-indigo-600"
          className="mb-0"
          backHref="/portal"
          actions={
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setViewMode('browse')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'browse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Udforsk VIVE
                </button>
                <button
                  onClick={() => setViewMode('saved')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'saved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Gemte ({savedArticles?.length || 0})</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-sm">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>VIVE & Evidens</span>
              </div>
            </div>
          }
        />
      </div>

      {/* ── Main Content Area ────────────────────────────── */}
      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 relative z-10 space-y-6">
        
        {/* Search & Area Filter Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Søg i forskningsrapporter, temaer, forfattere eller emner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Area Category Carousel */}
          {viewMode === 'browse' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Emneområder & Temaer
                </span>
                {isFollowingArea(activeAreaId) && (
                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                    <BellRing className="w-3 h-3 fill-current" /> Du følger dette område
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {viveAreas.map(area => {
                  const isActive = activeAreaId === area.id;
                  const isFollowing = isFollowingArea(area.id);
                  return (
                    <button
                      key={area.id}
                      onClick={() => setActiveAreaId(area.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                        isActive 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="text-sm">{area.icon}</span>
                      <span>{area.name}</span>
                      {isFollowing && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Publications Grid */}
        <div className="space-y-6">
          {isLoading && viewMode === 'browse' ? (
            <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-800">Henter forskningsrapporter...</p>
                <p className="text-xs text-slate-400">Synkroniserer med VIVEs officielle vidensdatabase</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-rose-100 shadow-sm p-8">
              <p className="text-sm font-bold text-rose-600">{error}</p>
              <Button onClick={() => loadPublications(true)} variant="outline" className="rounded-xl text-xs font-bold">
                Prøv igen
              </Button>
            </div>
          ) : displayedList.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-800">Ingen rapporter fundet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {viewMode === 'saved' 
                    ? 'Du har endnu ikke gemt nogen rapporter. Klik på bogmærke-ikonet på en rapport for at gemme den her.' 
                    : 'Ingen forskningsrapporter matchede din søgning. Prøv et andet søgeord eller vælg et andet emneområde.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedList.map((pub, idx) => (
                  <motion.div
                    key={pub.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (idx % 6) * 0.04 }}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all p-6 flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      {/* Card Header: Date & Bookmark Actions */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] font-bold text-slate-500">
                          <CalendarDays className="w-3 h-3 text-indigo-500" />
                          {pub.publicationDate ? new Date(pub.publicationDate).toLocaleDateString('da-DK', { year: 'numeric', month: 'short' }) : 'Udgivelse'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleToggleSave(e, pub)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${
                              savedArticleIds.has(pub.id)
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200/60 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title={savedArticleIds.has(pub.id) ? "Fjern fra gemte" : "Gem rapport"}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.has(pub.id) ? 'fill-current' : ''}`} />
                          </button>

                          <a
                            href={pub.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 border border-slate-200/60 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 flex items-center justify-center transition-all"
                            title="Åbn på VIVE.dk"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                        {pub.title}
                      </h3>

                      {/* Summary Excerpt */}
                      {pub.description && (
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                          {pub.description}
                        </p>
                      )}

                      {/* APA 7 Reference Box */}
                      {pub.apa && (
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-indigo-500" />
                              APA 7th Reference
                            </span>
                            <button
                              onClick={(e) => handleCopyApa(e, pub.id, pub.apa!)}
                              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                            >
                              {copiedId === pub.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600">Kopieret</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Kopiér</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p 
                            className="text-[10px] text-slate-600 leading-normal italic line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: pub.apa }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        VIVE Forskningscenter
                      </span>
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors group-hover:translate-x-0.5"
                      >
                        <span>Læs rapport</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && viewMode === 'browse' && (
                <div className="flex justify-center pt-8">
                  <Button
                    onClick={() => loadPublications(false)}
                    disabled={isLoadingMore}
                    className="h-12 px-8 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Henter flere...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Hent flere rapporter</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
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
