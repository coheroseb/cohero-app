
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  ArrowUpRight,
  Book,
  Search,
  Flame,
  Zap,
  Lock,
  Star,
  Users,
  ShieldCheck,
  FileSearch,
  CalendarDays,
  Gavel,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Layout,
  Target,
  FileText,
  Compass,
  GraduationCap,
  History,
  MessageSquare,
  Library,
  BookOpen,
  Scale,
  Plus,
  Loader2,
  RefreshCw,
  BookCopy,
  Building,
  TrendingUp,
  Settings,
  Brain,
  Layers,
  BookMarked,
  DraftingCompass,
  Presentation,
  Wand2,
  SearchCode,
  Bookmark,
  ArrowRight,
  BarChart3,
  BookCheck
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { processStripeSession, fetchPoliticalNews, fetchSocialMinistryNews } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, DocumentData, Timestamp, doc, updateDoc, serverTimestamp, increment, getDoc, setDoc } from 'firebase/firestore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import SurveyWidget from '@/components/SurveyWidget';


// --- Type Definitions ---
interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

// --- Sub-components for a cleaner Workspace ---

function BriefingReport({ title, icon: Icon, isLoading, news, link, color }: {
  title: string;
  icon: React.ElementType;
  isLoading: boolean;
  news: NewsItem[];
  link: string;
  color: string;
}) {
  return (
    <section className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-amber-100/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
        <Icon className="w-20 h-20 sm:w-24 sm:h-24 -rotate-12" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-amber-950 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-widest">
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
            {title}
          </h3>
          <span className="text-[8px] sm:text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Live</span>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
          </div>
        ) : news.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-8">Afventer nye efterretninger...</p>
        ) : (
          <ul className="space-y-5">
            {news.slice(0, 3).map((item, index) => (
              <li key={index} className="group/item">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                  <p className="text-sm font-bold text-amber-900 group-hover/item:text-amber-600 leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 opacity-40">
                     <Clock className="w-3 h-3" />
                     <p className="text-[10px] font-bold uppercase">{new Date(item.pubDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
        
        <div className="mt-8 pt-6 border-t border-amber-50">
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 hover:text-amber-600 flex items-center gap-2 group-hover:translate-x-1 transition-all">
            Se fuldt arkiv <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
};

const PortalPageContent: React.FC = () => {
  const { user, userProfile, isUserLoading: isAppLoading, refetchUserProfile } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const firestore = useFirestore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProcessingSession, setIsProcessingSession] = useState(true);
  const [politicalNews, setPoliticalNews] = useState<NewsItem[]>([]);
  const [ministryNews, setMinistryNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Fetch News
  useEffect(() => {
    async function getNews() {
      try {
        const [pNews, mNews] = await Promise.all([
          fetchPoliticalNews(),
          fetchSocialMinistryNews()
        ]);
        setPoliticalNews(pNews);
        setMinistryNews(mNews);
      } catch (error) {
        console.error("Failed to load news", error);
      } finally {
        setNewsLoading(false);
      }
    }
    getNews();
  }, []);

  const semesterPlanQuery = useMemoFirebase(() => (
      firestore && user ? query(collection(firestore, 'users', user.uid, 'semesterPlans'), orderBy('createdAt', 'desc'), limit(1)) : null
  ), [firestore, user]);
  const { data: semesterPlans, isLoading: plansLoading } = useCollection<DocumentData>(semesterPlanQuery);
  
  const nextEvent = useMemo(() => {
      if (!semesterPlans || semesterPlans.length === 0) return null;
      const plan = semesterPlans[0];
      if (!plan.weeklyBreakdown) return null;

      const now = new Date();
      const allEvents = plan.weeklyBreakdown
          .flatMap((week: any) => week.events)
          .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      return allEvents.find((event: any) => new Date(event.startDate) > now);
  }, [semesterPlans]);

    const getDailyCount = (lastUsage?: Timestamp, dailyCount?: number) => {
        if (!lastUsage) return 0;
        const today = new Date();
        const lastUsageDate = lastUsage.toDate();
        return lastUsageDate.toDateString() === today.toDateString() ? dailyCount || 0 : 0;
    };

    const getMonthlyCount = (lastUsage?: Timestamp, monthlyCount?: number) => {
        if (!lastUsage) return 0;
        const today = new Date();
        const lastUsageDate = lastUsage.toDate();
        return lastUsageDate.getFullYear() === today.getFullYear() && lastUsageDate.getMonth() === today.getMonth() ? monthlyCount || 0 : 0;
    };


  const limits = useMemo(() => {
      if (!userProfile) return { concepts: { used: 0, total: 0 }, cases: { used: 0, total: 0 }, journal: { used: 0, total: 0 }, architect: { used: 0, total: 0 }, opinion: { used: 0, total: 0 }, star: { used: 0, total: 0 } };
      const isFreeTier = userProfile?.membership === 'Kollega';
      
      return {
          concepts: { 
              used: getDailyCount(userProfile?.lastConceptExplainerUsage, userProfile?.dailyConceptExplainerCount), 
              total: isFreeTier ? 3 : Infinity 
          },
          cases: { 
              used: getDailyCount(userProfile?.lastCaseTrainerUsage, userProfile?.dailyCaseTrainerCount), 
              total: isFreeTier ? 3 : Infinity 
          },
          journal: { 
              used: getDailyCount(userProfile?.lastJournalTrainerUsage, userProfile?.dailyJournalTrainerCount), 
              total: isFreeTier ? 1 : Infinity 
          },
          architect: { 
              used: getMonthlyCount(userProfile?.lastExamArchitectUsage, userProfile?.monthlyExamArchitectCount), 
              total: isFreeTier ? 2 : Infinity 
          },
          opinion: {
              used: getMonthlyCount(userProfile?.lastSecondOpinionUsage, userProfile?.monthlySecondOpinionCount),
              total: isFreeTier ? 1 : 3
          },
          star: {
              used: getDailyCount(userProfile?.lastStarAnalysisUsage, userProfile?.dailyStarAnalysisCount),
              total: isFreeTier ? 3 : Infinity
          }
      };
  }, [userProfile]);

    const recommendedTool = useMemo(() => {
        if (!userProfile) return null;

        const tools = [
            { name: 'Journal-træner', usage: getDailyCount(userProfile.lastJournalTrainerUsage, userProfile.dailyJournalTrainerCount), path: '/journal-trainer', icon: FileText, cta: 'Træn din journalføring' },
            { name: 'Case-træner', usage: getDailyCount(userProfile.lastCaseTrainerUsage, userProfile.dailyCaseTrainerCount), path: '/case-trainer', icon: Zap, cta: 'Test dit skøn' },
            { name: 'Begrebsguide', usage: getDailyCount(userProfile.lastConceptExplainerUsage, userProfile.dailyConceptExplainerCount), path: '/concept-explainer', icon: Book, cta: 'Slå et begreb op' },
            { name: 'Eksamens-Arkitekten', usage: getMonthlyCount(userProfile.lastExamArchitectUsage, userProfile.monthlyExamArchitectCount), path: '/exam-architect', icon: Target, cta: 'Byg din opgave' },
        ];
        
        tools.sort((a, b) => a.usage - b.usage);

        return tools[0];

    }, [userProfile]);

    const levels = [
        { name: 'Nystartet Kollega', minPoints: 0 },
        { name: 'Kollega', minPoints: 500 },
        { name: 'Erfaren Kollega', minPoints: 2000 },
        { name: 'Senior Kollega', minPoints: 5000 },
        { name: 'Ekspert Kollega', minPoints: 10000 },
    ];

    const userLevel = useMemo(() => {
        const points = userProfile?.cohéroPoints || 0;
        return levels.slice().reverse().find(level => points >= level.minPoints) || levels[0];
    }, [userProfile?.cohéroPoints, levels]);

    const nextLevel = useMemo(() => {
        if (!userLevel) return levels[1];
        const currentLevelIndex = levels.findIndex(l => l.name === userLevel.name);
        return levels[currentLevelIndex + 1] || null;
    }, [userLevel, levels]);

    const progressPercentage = useMemo(() => {
        if (!nextLevel) return 100;
        const points = userProfile?.cohéroPoints || 0;
        const currentLevelMin = userLevel?.minPoints || 0;
        const nextLevelMin = nextLevel.minPoints;
        const progress = ((points - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
        return Math.max(0, Math.min(100, progress));
    }, [userProfile?.cohéroPoints, userLevel, nextLevel]);

    const isConceptLimitReached = useMemo(() => {
        if (!userProfile) return false;
        const isFreeTier = userProfile.membership === 'Kollega';
        if (!isFreeTier) return false;
    
        const dailyCount = getDailyCount(userProfile.lastConceptExplainerUsage, userProfile.dailyConceptExplainerCount);
        return dailyCount >= 3;
    }, [userProfile]);

    // Fetch Global Trends for "Hurtig-opslag"
    const globalActivitiesQuery = useMemoFirebase(() => (
        firestore ? query(collection(firestore, 'userActivities'), orderBy('createdAt', 'desc'), limit(50)) : null
    ), [firestore]);
    const { data: globalActivities } = useCollection<DocumentData>(globalActivitiesQuery);

    const trendingTerms = useMemo(() => {
        if (!globalActivities) return ['§ 81', 'Relationskompetence', 'Tavshedspligt', 'VUM 2.0'];
        
        const terms: string[] = [];
        const conceptRegex = /slog begrebet "([^"]+)" op/;
        const lawRegex = /slog (§ .+? i .+?) op/;

        globalActivities.forEach(act => {
            const text = act.actionText || '';
            const conceptMatch = text.match(conceptRegex);
            if (conceptMatch) terms.push(conceptMatch[1]);
            
            const lawMatch = text.match(lawRegex);
            if (lawMatch) terms.push(lawMatch[1]);
        });

        const uniqueTerms = Array.from(new Set(terms)).slice(0, 5);
        return uniqueTerms.length > 0 ? uniqueTerms : ['§ 81', 'Relationskompetence', 'Tavshedspligt', 'VUM 2.0'];
    }, [globalActivities]);

  useEffect(() => {
      if (isAppLoading || userProfile === undefined) return;
      const sessionId = searchParams.get('session_id');
      if (sessionId && user && firestore) {
          const processSession = async () => {
              const result = await processStripeSession(sessionId);
              if (result.success && result.updateData) {
                  const userRef = doc(firestore, 'users', user.uid);
                  try {
                      await updateDoc(userRef, result.updateData);
                      toast({
                          title: 'Opgradering fuldført!',
                          description: `Du har nu adgang til ${result.updateData.membership}.`,
                      });
                      await refetchUserProfile();
                  } catch (dbError) {
                      console.error("Firestore update failed:", dbError);
                      toast({
                          variant: 'destructive',
                          title: 'Databasefejl',
                          description: "Kunne ikke opdatere din profil. Kontakt venligst support.",
                      });
                  }
              } else if (result.message) {
                  toast({
                      variant: 'destructive',
                      title: 'Fejl ved opgradering',
                      description: result.message,
                  });
              }
              router.replace('/portal', { scroll: false });
              setIsProcessingSession(false);
          };

          processSession();
      } else {
          setIsProcessingSession(false);
      }
  }, [searchParams, user, firestore, userProfile, isAppLoading, router, toast, refetchUserProfile]);

  if (isAppLoading || !user || userProfile === undefined) {
    return <AuthLoadingScreen />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !isConceptLimitReached) {
      router.push(`/concept-explainer?term=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 10) return "Godmorgen";
    if (hour < 18) return "Goddag";
    return "Godaften";
  };
  
  const toolCategories = [
    {
      title: "Praksis-Træning",
      subtitle: "Værktøjer til din daglige myndighedsudøvelse",
      icon: <Library className="w-5 h-5 text-amber-700" />,
      items: [
        { title: "Journal-træner", desc: "Kollega-sparring på dine notater", icon: FileText, path: "/journal-trainer", color: "text-emerald-700 bg-emerald-50", badge: "Sparring", limit: limits.journal, limitText: 'i dag' },
        { title: "Case-træner", desc: "Træn svære myndighedsvalg", icon: Zap, path: "/case-trainer", color: "text-amber-700 bg-amber-50", badge: "Simulering", limit: limits.cases, limitText: 'i dag' },
        { title: "Begrebsguide", desc: "Opslagsværk for socialrådgivere", icon: Book, path: "/concept-explainer", color: "text-amber-900 bg-amber-100/50", badge: "Opslag", limit: limits.concepts, limitText: 'i dag' },
      ]
    },
    {
      title: "Akademisk Design",
      subtitle: "Styrk den røde tråd i dine studier",
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      items: [
        { title: "Eksamens-Arkitekten", desc: "Design din opgavestruktur", icon: Layout, path: "/exam-architect", color: "text-indigo-700 bg-indigo-50", badge: "AI-Draft", limit: limits.architect, limitText: 'denne md.' },
        { title: "Second Opinion", desc: "Vurdering af klagegrundlag", icon: SearchCode, path: "/second-opinion", color: "text-rose-700 bg-rose-50", badge: "Klage-Tjek", limit: limits.opinion, limitText: 'denne md.' },
        { title: "Seminar-Arkitekten", desc: "Fra slides til videnskort", icon: FileSearch, path: "/seminar-architect", color: "text-amber-700 bg-amber-50", badge: "Transform" },
        { title: "Semester-Planlægger", desc: "Intelligent planlægning", icon: CalendarDays, path: "/semester-planlaegger", color: "text-emerald-700 bg-emerald-50", badge: "Sync" }
      ]
    },
    {
      title: "Omverdenen",
      subtitle: "Hold dig opdateret på jura, politik og data",
      icon: <Scale className="w-5 h-5 text-rose-600" />,
      items: [
        { title: "Lovportalen", desc: "Dyk ned i den relevante lovgivning", icon: Scale, path: "/lov-portal", color: "text-blue-700 bg-blue-50", badge: "Opslag" },
        { title: "Politisk Puls", desc: "Monitorering af lovændringer", icon: Gavel, path: "/folketinget", color: "text-rose-700 bg-rose-50", badge: "Live" },
        { title: "STAR Indsigt", desc: "Officiel arbejdsmarksstatistik", icon: BarChart3, path: "/star-indsigt", color: "text-indigo-700 bg-indigo-50", badge: "Data", limit: limits.star, limitText: 'i dag' },
        { title: "Faglige Tendenser", desc: "Hvad rører sig på studiet?", icon: Compass, path: "/tendenser", color: "text-indigo-700 bg-indigo-50", badge: "Insights" }
      ]
    }
  ];

  const handleTrendClick = (tag: string) => {
    if (isConceptLimitReached) return;
    const isLaw = tag.includes('§');
    if (isLaw) {
        router.push(`/lov-portal?search=${encodeURIComponent(tag)}`);
    } else {
        router.push(`/concept-explainer?term=${encodeURIComponent(tag)}`);
    }
  };

  return (
    <div className="animate-fade-in-up bg-[#FDFCF8] min-h-screen selection:bg-amber-100 overflow-x-hidden">
      
      {/* 1. SMART COMMAND HEADER - Mobile First */}
      <header className="bg-white border-b border-amber-100 px-4 sm:px-6 py-10 md:py-16 relative overflow-hidden transition-all duration-700">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-amber-50 rounded-full blur-[80px] md:blur-[120px] -mr-16 md:-mr-32 -mt-16 md:-mt-32 opacity-50 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-10 mb-10 md:mb-16 animate-ink">
            <div className="text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                <span className="px-3 md:px-4 py-1.5 bg-amber-950 text-amber-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg border border-white/10">
                  {userProfile?.membership || 'Kollega'} Medlem
                </span>
                <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-rose-100">
                  <Flame className="w-3 md:w-3.5 h-3 md:h-3.5 fill-current" /> {userProfile?.dailyChallengeStreak || 0} Dages dannelse
                </div>
              </div>
              <h1 className="text-4xl md:text-7xl font-bold text-amber-950 serif leading-none tracking-tighter">
                {getTimeOfDayGreeting()}, <span className="text-amber-700 italic">{user?.displayName?.split(' ')[0]}</span>
              </h1>
              <p className="text-base md:text-xl text-slate-500 mt-4 md:mt-6 italic font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Din rygdækning gennem hele socialrådgiverstudiet. Hvad er din faglige prioritet i dag?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 bg-white/50 backdrop-blur-sm p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] border border-amber-100/50 shadow-inner">
                <Link href="/memento" passHref>
                  <Button variant="outline" className="h-16 w-24 sm:h-20 sm:w-32 flex-col gap-1 rounded-2xl bg-amber-50/50 border-amber-100 hover:bg-amber-100">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800"/>
                    <span className="text-[10px] sm:text-xs font-bold text-amber-950">Memento</span>
                  </Button>
                </Link>
                <Link href="/folketinget" passHref>
                  <Button variant="outline" className="h-16 w-24 sm:h-20 sm:w-32 flex-col gap-1 rounded-2xl bg-amber-50/50 border-amber-100 hover:bg-amber-100">
                    <Building className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800"/>
                    <span className="text-[10px] sm:text-xs font-bold text-amber-950">Folketinget</span>
                  </Button>
                </Link>
               <div className="relative group">
                  <Link href="/settings" passHref>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[1.8rem] bg-amber-950 flex items-center justify-center text-amber-100 font-black text-2xl sm:text-3xl shadow-2xl border-4 border-white hover:rotate-3 transition-transform cursor-pointer">
                      {user?.displayName?.charAt(0)}
                    </div>
                  </Link>
                  <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 rounded-full border-2 border-white shadow-md"></div>
               </div>
            </div>
          </div>

        <TooltipProvider>
            <Tooltip open={isConceptLimitReached ? undefined : false}>
                <TooltipTrigger asChild>
                    <form onSubmit={handleSearch} className="max-w-4xl mx-auto lg:mx-0 relative group">
                        <div className={`absolute -inset-1 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 rounded-[2rem] md:rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-50 ${isSearchFocused ? 'opacity-50' : ''} ${isConceptLimitReached ? '!opacity-0' : ''}`}></div>
                        <div className={`relative bg-white border border-amber-100 rounded-[1.8rem] md:rounded-[2.2rem] shadow-2xl overflow-hidden transition-all duration-500 group-focus-within:scale-[1.01] ${isConceptLimitReached ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''}`}>
                        <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-300 group-focus-within:text-amber-950 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={isConceptLimitReached ? "Daglige opslag brugt..." : "Slå et begreb op i arkivet..."}
                            className={`w-full py-6 md:py-8 pl-16 md:pl-20 pr-24 md:pr-32 bg-transparent text-base md:text-xl font-medium focus:outline-none placeholder:text-slate-300 text-amber-950 ${isConceptLimitReached ? 'cursor-not-allowed placeholder:text-slate-400' : ''}`}
                            value={searchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={isConceptLimitReached}
                        />
                        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2">
                            <Button type="submit" size="sm" className="h-12 md:h-16 px-4 md:px-8 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest gap-2 shadow-xl shadow-amber-950/10 active:scale-95 transition-all" disabled={isConceptLimitReached}>
                                <span className="hidden sm:inline">Opslag</span> <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                            </Button>
                        </div>
                        </div>
                    </form>
                </TooltipTrigger>
                {isConceptLimitReached && (
                    <TooltipContent className="bg-amber-950 text-white border-amber-800 p-4" side="bottom">
                        <Link href="/upgrade" className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-amber-400"/>
                            <div>
                                <p className="font-bold">Grænse for opslag nået</p>
                                <p className="text-xs text-amber-100/70 hover:underline">Opgrader til Kollega+ for ubegrænset brug.</p>
                            </div>
                        </Link>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>

          <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 self-center mr-2">Populært nu:</span>
            {trendingTerms.map((tag: string) => (
                <button
                key={tag}
                type="button"
                onClick={() => handleTrendClick(tag)}
                className="px-3 py-1.5 bg-amber-50 text-amber-900 rounded-lg text-[9px] font-bold border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition-all uppercase tracking-widest whitespace-nowrap"
                >
                <TrendingUp className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                {tag}
                </button>
            ))}
          </div>
        </div>
      </header>

      {/* SURVEY & ANNOUNCEMENT AREA */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-10 animate-ink">
        <SurveyWidget membership={userProfile?.membership || 'Kollega'} />
        <Link href="/lov-portal" className="group block">
          <div className="bg-indigo-50 border border-indigo-100 p-6 sm:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white hover:border-indigo-600 transition-all shadow-sm hover:shadow-xl group">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform flex-shrink-0">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest mb-1.5 mx-auto sm:mx-0">
                  Nyhed
                </div>
                <h3 className="text-lg font-bold text-indigo-950 leading-tight">
                  Udforsk vores nye Lovportal
                </h3>
                <p className="text-sm text-indigo-900/60 font-medium max-w-md">
                  Find alle dine juridiske kilder samlet ét sted med pædagogisk AI-sparring og kildegenerator.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform whitespace-nowrap">
              Prøv den nu <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 md:mt-20 grid lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* LEFT COLUMN: THE WORKSPACE - Prioritize main tools */}
        <div className="lg:col-span-8 space-y-16 md:space-y-20">
          
          {/* Active Work (The Focus Card) */}
          <section className="animate-ink">
             <div className="flex items-center gap-3 mb-8 md:mb-10 px-2">
                <div className="p-2.5 bg-amber-50 rounded-xl shadow-inner">
                   <Target className="w-5 h-5 text-amber-700" />
                </div>
                <h2 className="text-xl font-bold text-amber-950 serif">Dit Aktive Dossier</h2>
             </div>
             
             <div 
               onClick={() => router.push(recommendedTool?.path || '/portal')}
               className="bg-amber-950 p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-all duration-500"
             >
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12">
                   <div className="flex-1 space-y-6 md:space-y-8 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-amber-950 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                         <Sparkles className="w-3.5 h-3.5" /> Anbefalet forberedelse
                      </div>
                       {recommendedTool ? (
                          <>
                              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold serif leading-tight">
                                  Klar til næste skridt i din <br className="hidden sm:block"/><span className="text-amber-400 italic">dannelsesrejse</span>?
                              </h3>
                              <p className="text-amber-100/60 text-base md:text-lg leading-relaxed italic max-w-lg mx-auto md:mx-0">
                                  Vi kan se, du ikke har brugt <strong>{recommendedTool.name}</strong> i dag. Det er et gode sted at starte for at styrke dine kompetencer.
                              </p>
                              <Button size="lg" className="bg-white text-amber-950 hover:bg-amber-100 shadow-xl shadow-black/10 w-full sm:w-auto">
                                  {recommendedTool.cta}
                                  <ArrowUpRight className="w-4 h-4 ml-2"/>
                              </Button>
                          </>
                      ) : (
                          <div className="flex items-center gap-3">
                              <Loader2 className="w-5 h-5 animate-spin"/>
                              <span>Indlæser anbefaling...</span>
                          </div>
                      )}
                   </div>
                   {recommendedTool && (
                       <div className="w-full md:w-64 h-56 md:h-64 bg-white/5 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 p-8 flex flex-col justify-center items-center text-center group-hover:bg-white/10 transition-colors">
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-400 rounded-2xl flex items-center justify-center text-amber-950 mb-4 sm:mb-6 shadow-xl group-hover:scale-110 transition-transform">
                              {React.createElement(recommendedTool.icon, { className: 'w-7 h-7 sm:w-8 sm:h-8' })}
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-2">Anbefalet Værktøj</p>
                          <p className="text-sm font-bold text-amber-50">{recommendedTool.name}</p>
                       </div>
                   )}
                </div>
                {/* Decorative textures */}
                <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-amber-400/5 rounded-full blur-[80px] md:blur-[100px] -mr-24 -mt-24 pointer-events-none"></div>
             </div>
          </section>

          {/* Værktøjsbiblioteket - Better mobile stacking */}
          {toolCategories.map((category, idx) => (
            <section key={idx} className="animate-ink" style={{ animationDelay: `${0.3 + (idx * 0.2)}s` }}>
              <div className="flex items-center gap-3 border-b border-amber-100 pb-6 mb-8 md:mb-10 px-2">
                <div className="p-2.5 bg-white border border-amber-100 rounded-2xl shadow-sm">
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-amber-950 serif">{category.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium">{category.subtitle}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {category.items.map((item, i) => (
                    <Link
                        key={i}
                        href={item.limit && item.limit.used >= item.limit.total ? '/upgrade' : item.path}
                        className={`group p-6 sm:p-8 rounded-[2.5rem] md:rounded-[3rem] border bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col justify-between h-56 sm:h-64 ${
                            item.limit && item.limit.used >= item.limit.total ? 'opacity-60 border-slate-200 grayscale' : 'border-amber-100 hover:border-amber-950 shadow-sm'
                        }`}
                    >
                    <div className="relative z-10 flex justify-between items-start">
                         <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                          {React.createElement(item.icon, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
                        </div>
                        {item.limit && item.limit.total !== Infinity && (
                             <div className="text-right space-y-1">
                                <div className="flex items-end justify-end gap-1">
                                   <p className="font-mono font-black text-xl sm:text-2xl leading-none text-amber-950">{item.limit.used}</p>
                                   <p className="font-mono font-bold text-xs sm:text-sm leading-none text-slate-300">/{item.limit.total}</p>
                                </div>
                                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">{item.limitText}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-700/40">{item.badge}</span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold text-amber-950 serif group-hover:text-amber-700 transition-colors leading-tight">{item.title}</h4>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2 font-medium leading-relaxed line-clamp-2">{item.desc}</p>
                    </div>

                    {item.limit && item.limit.used >= item.limit.total ? (
                        <div className="absolute inset-0 bg-slate-50/20 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl border border-amber-100 flex items-center gap-2 transform scale-100 sm:scale-110">
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-950">Grænse nået</span>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                        </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
          
          {/* USER ARCHIVE SECTION */}
          <section className="animate-ink">
             <div className="flex items-center gap-3 border-b border-amber-100 pb-6 mb-8 md:mb-10 px-2">
                <div className="p-2.5 bg-white border border-amber-100 rounded-2xl shadow-sm">
                  <Layers className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-amber-950 serif">Mit Arkiv</h3>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium">Gense dine gemte analyser og planer</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {[
                    { title: "Min Logbog", desc: "Dine refleksioner", icon: BookMarked, path: "/min-logbog" },
                    { title: "Mine Byggeplaner", desc: "Dine opgavestrukturer", icon: DraftingCompass, path: "/mine-byggeplaner" },
                    { title: "Mine Seminarer", desc: "Dine analyserede slides", icon: Presentation, path: "/mine-seminarer" },
                    { title: "Gemte Artikler", desc: "VIVE-rapporter", icon: Bookmark, path: "/mine-gemte-artikler" },
                    { title: "Gemte Paragraffer", desc: "Lov-bogmærker", icon: Gavel, path: "/mine-gemte-paragraffer" },
                    { title: "Mine Semesterplaner", desc: "Kalender-synk", icon: CalendarDays, path: "/mine-semesterplaner" }
                  ].map((item, i) => (
                    <Link key={i} href={item.path} className="group p-6 sm:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-amber-100 bg-white hover:border-amber-950 hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col justify-center items-center text-center sm:text-left sm:items-start">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-inner">
                          {React.createElement(item.icon, { className: 'w-5 h-5' })}
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-amber-950 serif group-hover:text-amber-700 transition-colors leading-tight">{item.title}</h4>
                        <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest">{item.desc}</p>
                    </Link>
                  ))}
              </div>
          </section>
        </div>

        {/* RIGHT COLUMN: THE DASHBOARD RAIL - Stacks on mobile */}
        <aside className="lg:col-span-4 space-y-10 md:space-y-12 animate-ink">
          
          {/* Intel Briefings (The Feeds) */}
          <BriefingReport 
             title="Nyt fra Borgen" 
             icon={Gavel} 
             isLoading={newsLoading} 
             news={politicalNews} 
             link="https://www.dr.dk/nyheder/politik"
             color="text-rose-600"
          />

          <BriefingReport 
             title="Social- & Boligministeriet" 
             icon={Building} 
             isLoading={newsLoading} 
             news={ministryNews} 
             link="https://www.sm.dk/nyheder/nyhedsarkiv"
             color="text-blue-600"
          />

          {/* Upcoming Schedule */}
          <section className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-amber-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 md:mb-10">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Næste aktivitet</h3>
               <CalendarDays className="w-5 h-5 text-amber-700/30" />
            </div>
            <div className="space-y-4 relative z-10">
                {plansLoading ? (
                    <div className="flex justify-center items-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-300"/></div>
                ) : nextEvent ? (
                    <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group/event hover:border-amber-950 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                           <Clock className="w-3.5 h-3.5 text-amber-700" />
                           <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest">{new Date(nextEvent.startDate).toLocaleString('da-DK', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <p className="font-bold text-base md:text-lg text-amber-950 serif leading-tight mb-4">{nextEvent.summary}</p>
                        <button onClick={() => router.push('/mine-semesterplaner')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/event:text-amber-950 transition-colors">
                           Gå til planlægger <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-amber-50 rounded-[2.5rem]">
                        <p className="text-xs text-slate-400 italic mb-6">Ingen kommende aktiviteter fundet.</p>
                        <Button variant="outline" size="sm" onClick={() => router.push('/semester-planlaegger')} className="rounded-xl border-amber-200 text-amber-900 hover:bg-amber-50 h-10">
                           Synkronisér nu
                        </Button>
                    </div>
                )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};


const PortalPage: React.FC = () => {
  const { user, isUserLoading, userProfile } = useApp();
  const router = useRouter();

  const memoizedHooks = useMemo(() => {
    if (isUserLoading || !user || userProfile === undefined) {
      return null;
    }
    return <PortalPageContent />;
  }, [isUserLoading, user, userProfile]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || userProfile === undefined) {
    return <AuthLoadingScreen />;
  }
  
  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      {memoizedHooks}
    </Suspense>
  );
};

export default PortalPage;
