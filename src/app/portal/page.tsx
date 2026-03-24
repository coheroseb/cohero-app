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
  BookCheck,
  Mic,
  HandHelping,
  CreditCard
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { processStripeSession, fetchPoliticalNews, fetchSocialMinistryNews } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, DocumentData, Timestamp, doc, updateDoc, serverTimestamp, increment, getDoc, setDoc, where } from 'firebase/firestore';
import { AssistanceRequest } from '@/ai/flows/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import SurveyWidget from '@/components/SurveyWidget';
import { motion, AnimatePresence } from 'framer-motion';

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
    <section className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all active:scale-[0.98]">
      <div className={`absolute -top-4 -right-4 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
        <Icon className="w-24 h-24 sm:w-32 sm:h-32 -rotate-12" />
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2.5 text-[13px] sm:text-[14px] uppercase tracking-widest">
            <div className={`w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            {title}
          </h3>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50 shadow-sm">Live</span>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : news.length === 0 ? (
          <p className="text-[13px] text-slate-400 font-medium text-center py-8">Afventer nye efterretninger...</p>
        ) : (
          <ul className="space-y-4 flex-grow">
            {news.slice(0, 3).map((item, index) => (
              <li key={index} className="group/item outline-none">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-[20px] hover:bg-slate-50 active:bg-slate-100 transition-colors -mx-4">
                  <p className="text-[14px] sm:text-[15px] font-bold text-slate-700 group-hover/item:text-slate-900 leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 opacity-50 text-slate-500 group-hover/item:opacity-80 transition-opacity">
                     <Clock className="w-3 h-3" />
                     <p className="text-[10px] font-bold uppercase tracking-wider">{new Date(item.pubDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 flex items-center gap-2 group-hover:translate-x-1 transition-all py-2">
            Se fuldt arkiv <ArrowUpRight className="w-3.5 h-3.5" />
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProcessingSession, setIsProcessingSession] = useState(true);
  const [politicalNews, setPoliticalNews] = useState<NewsItem[]>([]);
  const [ministryNews, setMinistryNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Marketplace Pending Payments
  const pendingMarketplacePaymentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'assistance_requests'),
      where('citizenId', '==', user.uid),
      where('status', '==', 'claimed'),
      where('isPaid', '==', false),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: pendingPayments } = useCollection<AssistanceRequest>(pendingMarketplacePaymentsQuery);

  // Fetch News
  useEffect(() => {
    async function getNews() {
      try {
        const [pNews, mNews] = await Promise.all([
          fetchPoliticalNews(),
          fetchSocialMinistryNews()
        ]);
        setPoliticalNews(pNews || []);
        setMinistryNews(mNews || []);
      } catch (error) {
        console.error("Failed to load news", error);
      } finally {
        setNewsLoading(false);
      }
    }
    getNews();
  }, []);

  const booksQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'books')) : null), [firestore]);
  const { data: books } = useCollection<DocumentData>(booksQuery);

  const allKeywords = useMemo(() => {
    if (!books) return [];
    const keywordSet = new Set<string>();
    books.forEach(book => {
        if (book.RAG && typeof book.RAG === 'string') {
            try {
                const parsed = JSON.parse(book.RAG);
                if (Array.isArray(parsed)) {
                    parsed.forEach(k => {
                        if (typeof k === 'string') keywordSet.add(k.trim());
                    });
                }
            } catch (e) {
                book.RAG.split(/[\n,]/).forEach((k: string) => {
                    const trimmed = k.trim();
                    if (trimmed) keywordSet.add(trimmed);
                });
            }
        }
    });
    return Array.from(keywordSet).sort((a, b) => a.localeCompare(b, 'da'));
  }, [books]);

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
      const isFreeTier = userProfile?.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership);
      
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
          oralExam: {
              used: getDailyCount(userProfile?.lastOralExamUsage, userProfile?.dailyOralExamCount),
              total: isFreeTier ? 2 : Infinity
          },
          opinion: {
              used: getMonthlyCount(userProfile?.lastSecondOpinionUsage, userProfile?.monthlySecondOpinionCount),
              total: isFreeTier ? 1 : 10 // Group Pro and Kollega share the same 1/mo limit for second opinion? No, user said Group Pro is like Kollega. Kollega+ has more. Let's make it more consistent.
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
            { name: 'Journal-træner', usage: getDailyCount(userProfile.lastJournalTrainerUsage, userProfile.dailyJournalTrainerCount), path: '/journal-trainer', icon: FileText, cta: 'Træn din journalføring', color: 'text-emerald-500' },
            { name: 'Case-træner', usage: getDailyCount(userProfile.lastCaseTrainerUsage, userProfile.dailyCaseTrainerCount), path: '/case-trainer', icon: Zap, cta: 'Test dit skøn', color: 'text-amber-500' },
            { name: 'Begrebsguide', usage: getDailyCount(userProfile.lastConceptExplainerUsage, userProfile.dailyConceptExplainerCount), path: '/concept-explainer', icon: Book, cta: 'Slå et begreb op', color: 'text-blue-500' },
            { name: 'Eksamens-Arkitekten', usage: getMonthlyCount(userProfile.lastExamArchitectUsage, userProfile.monthlyExamArchitectCount), path: '/exam-architect', icon: Target, cta: 'Byg din opgave', color: 'text-indigo-500' },
        ];
        
        tools.sort((a, b) => a.usage - b.usage);

        return tools[0];

    }, [userProfile]);

    const isConceptLimitReached = useMemo(() => {
        if (!userProfile) return false;
        const isFreeTier = userProfile.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership);
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
      const sessionId = searchParams?.get('session_id');
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

  const handleSearch = (e?: React.FormEvent, overrideTerm?: string) => {
    if (e) e.preventDefault();
    const term = overrideTerm || searchQuery.trim();
    if (term && !isConceptLimitReached) {
      const isLaw = term.includes('§') || 
                    /(\d+)/.test(term) || 
                    term.toLowerCase().includes('lov') || 
                    term.toLowerCase().includes('bekendtgørelse') ||
                    term.toLowerCase().includes('vejledning');

      if (isLaw) {
          router.push(`/lov-portal?search=${encodeURIComponent(term)}`);
      } else {
          router.push(`/concept-explainer?term=${encodeURIComponent(term)}`);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length > 1) {
        setSuggestions(allKeywords.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0, 5));
        setShowSuggestions(true);
    } else {
        setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setSearchQuery(term);
    setShowSuggestions(false);
    handleSearch(undefined, term);
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 10) return "Godmorgen";
    if (hour < 18) return "Goddag";
    return "Godaften";
  };
  
  const toolCategories = useMemo(() => {
    const categories = [
      {
        title: "Praksis-Træning",
        subtitle: "Værktøjer til din daglige myndighedsudøvelse",
        icon: <Library className="w-6 h-6 text-slate-700" />,
        items: [
          { title: "Journal-træner", desc: "Kollega-sparring på dine notater", icon: FileText, path: "/journal-trainer", color: "text-emerald-600 bg-emerald-50 border-emerald-100", badge: "Sparring", limit: limits.journal, limitText: 'i dag' },
          { title: "Case-træner", desc: "Træn svære myndighedsvalg", icon: Zap, path: "/case-trainer", color: "text-amber-600 bg-amber-50 border-amber-100", badge: "Simulering", limit: limits.cases, limitText: 'i dag' },
          { title: "Markedsplads", desc: "Hjælp borgere og få erfaring", icon: HandHelping, path: "/bistand", color: "text-rose-600 bg-rose-50 border-rose-100", badge: "Marketplace" },
          { title: "Begrebsguide", desc: "Opslagsværk for socialrådgivere", icon: Book, path: "/concept-explainer", color: "text-blue-600 bg-blue-50 border-blue-100", badge: "Opslag", limit: limits.concepts, limitText: 'i dag' },
        ]
      },
      {
        title: "Akademisk Design",
        subtitle: "Styrk den røde tråd i dine studier",
        icon: <GraduationCap className="w-6 h-6 text-indigo-500" />,
        items: [
          { title: "Eksamens-Arkitekten", desc: "Design din opgavestruktur", icon: Layout, path: "/exam-architect", color: "text-indigo-600 bg-indigo-50 border-indigo-100", badge: "AI-Draft", limit: limits.architect, limitText: 'denne md.' },
          { title: "Mundtlig Eksamenstræner", desc: "Gennemgang af dit oplæg", icon: Mic, path: "/mundtlig-eksamenstraener", color: "text-blue-600 bg-blue-50 border-blue-100", badge: "Træning", limit: limits.oralExam, limitText: 'i dag' },
          { title: "Second Opinion", desc: "Vurdering af klagegrundlag", icon: SearchCode, path: "/second-opinion", color: "text-rose-600 bg-rose-50 border-rose-100", badge: "Klage-Tjek", limit: limits.opinion, limitText: 'denne md.' },
          { title: "Seminar-Arkitekten", desc: "Fra slides til videnskort", icon: FileSearch, path: "/seminar-architect", color: "text-violet-600 bg-violet-50 border-violet-100", badge: "Transform" },
          { title: "Semester-Planlægger", desc: "Intelligent planlægning", icon: CalendarDays, path: "/semester-planlaegger", color: "text-emerald-600 bg-emerald-50 border-emerald-100", badge: "Sync" }
        ]
      },
      {
        title: "Omverdenen",
        subtitle: "Hold dig opdateret på jura, politik og data",
        icon: <Scale className="w-6 h-6 text-rose-500" />,
        items: [
          { title: "Lovportalen", desc: "Dyk ned i den relevante lovgivning", icon: Scale, path: "/lov-portal", color: "text-sky-600 bg-sky-50 border-sky-100", badge: "Opslag" },
          { title: "Politisk Puls", desc: "Monitorering af lovændringer", icon: Gavel, path: "/folketinget", color: "text-rose-600 bg-rose-50 border-rose-100", badge: "Live" },
          { title: "STAR Indsigt", desc: "Officiel arbejdsmarksstatistik", icon: BarChart3, path: "/star-indsigt", color: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100", badge: "Data", limit: limits.star, limitText: 'i dag' },
          { title: "Faglige Tendenser", desc: "Hvad rører sig på studiet?", icon: Compass, path: "/tendenser", color: "text-indigo-600 bg-indigo-50 border-indigo-100", badge: "Insights" }
        ]
      }
    ];

    if (userProfile?.isQualified) {
        return [
            {
                title: "Juridiske Værktøjer",
                subtitle: "Sparring og monitorering til din praksis",
                icon: <Scale className="w-6 h-6 text-rose-500" />,
                items: [
                    { title: "Lovportalen", desc: "Dyk ned i den relevante lovgivning", icon: Scale, path: "/lov-portal", color: "text-sky-600 bg-sky-50 border-sky-100", badge: "Opslag" },
                    { title: "Politisk Puls", desc: "Monitorering af lovændringer", icon: Gavel, path: "/folketinget", color: "text-rose-600 bg-rose-50 border-rose-100", badge: "Live" },
                    { title: "STAR Indsigt", desc: "Officiel arbejdsmarksstatistik", icon: BarChart3, path: "/star-indsigt", color: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100", badge: "Data", limit: limits.star, limitText: 'i dag' },
                ]
            }
        ];
    }
    return categories;
  }, [userProfile?.isQualified, limits]);

  const handleTrendClick = (tag: string) => {
    if (isConceptLimitReached) return;
    const isLaw = tag.includes('§') || 
                  /(\d+)/.test(tag) || 
                  tag.toLowerCase().includes('lov') || 
                  tag.toLowerCase().includes('bekendtgørelse') ||
                  tag.toLowerCase().includes('vejledning');

    if (isLaw) {
        router.push(`/lov-portal?search=${encodeURIComponent(tag)}`);
    } else {
        router.push(`/concept-explainer?term=${encodeURIComponent(tag)}`);
    }
  };

  return (
    <div className="bg-[#FDFBF7] min-h-[100dvh] selection:bg-amber-200 selection:text-amber-950 font-sans pb-12">
      
      {/* SMART COMMAND HEADER - Mobile First Premium Look */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 sm:px-8 py-8 md:py-16 relative overflow-visible z-10 transition-all rounded-b-[32px] sm:rounded-b-[48px] shadow-sm">
        {/* Dynamic mesh effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1)_0,transparent_60%)] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.03)_0,transparent_60%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10 md:mb-16">
            <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-5">
                <span className="px-3 sm:px-4 py-1.5 bg-slate-100 text-slate-800 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_2px_4px_rgba(0,0,0,0.05)] border border-slate-200/50 flex items-center gap-1.5">
                   <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                   {userProfile?.membership || 'Kollega'} Medlem
                </span>
                <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-rose-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
                   <Flame className="w-3.5 h-3.5 fill-current" /> {userProfile?.dailyChallengeStreak || 0} Dages dannelse
                </div>
              </div>
              <h1 className="text-[34px] sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                {getTimeOfDayGreeting()}, <br className="sm:hidden" /><span className="text-amber-500">{user?.displayName?.split(' ')[0]}</span>
              </h1>
              <p className="text-[16px] sm:text-[18px] text-slate-500 mt-3 sm:mt-5 font-medium max-w-xl mx-auto sm:mx-0 leading-relaxed text-balance">
                {userProfile?.isQualified 
                    ? "Din professionelle rygdækning i praksis. Hold dig opdateret på jura og politik." 
                    : "Din rygdækning gennem hele socialrådgiverstudiet. Hvad er din faglige prioritet i dag?"}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-4 p-2 sm:p-3">
                {!userProfile?.isQualified && (
                    <Link href="/memento" passHref>
                    <Button variant="outline" className="h-[72px] w-[88px] sm:h-20 sm:w-28 flex-col gap-1.5 text-center font-bold !bg-white hover:!bg-slate-50 border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)] rounded-[20px] sm:rounded-[24px] active:scale-[0.96] transition-transform z-20">
                        <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500 shrink-0"/>
                        <span className="text-[10px] sm:text-[11px] text-slate-700">Memento</span>
                    </Button>
                    </Link>
                )}
                <Link href="https://group.cohero.dk" passHref>
                  <Button variant="outline" className="h-[72px] w-[88px] sm:h-20 sm:w-28 flex-col gap-1.5 text-center font-bold !bg-white hover:!bg-slate-50 border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)] rounded-[20px] sm:rounded-[24px] active:scale-[0.96] transition-transform z-20">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 shrink-0"/>
                    <span className="text-[10px] sm:text-[11px] text-slate-700">Grupper</span>
                  </Button>
                </Link>
                <Link href="/folketinget" passHref>
                  <Button variant="outline" className="h-[72px] w-[88px] sm:h-20 sm:w-28 flex-col gap-1.5 text-center font-bold !bg-white hover:!bg-slate-50 border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)] rounded-[20px] sm:rounded-[24px] active:scale-[0.96] transition-transform z-20">
                    <Building className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500 shrink-0"/>
                    <span className="text-[10px] sm:text-[11px] text-slate-700">Folketing.</span>
                  </Button>
                </Link>
                <Link href="/bistand" passHref>
                  <Button variant="outline" className="h-[72px] w-[88px] sm:h-20 sm:w-28 flex-col gap-1.5 text-center font-bold !bg-rose-50 hover:!bg-rose-100 border-rose-100 shadow-[0_4px_12px_rgba(225,29,72,0.05)] rounded-[20px] sm:rounded-[24px] active:scale-[0.96] transition-transform z-20">
                    <HandHelping className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 shrink-0"/>
                    <span className="text-[10px] sm:text-[11px] text-rose-900 font-extrabold">Markedsplads</span>
                  </Button>
                </Link>
                <div className="relative group z-20">
                  <Link href="/settings" passHref>
                    <div className="h-[72px] w-[72px] sm:w-20 sm:h-20 rounded-[24px] bg-slate-900 text-white flex items-center justify-center font-extrabold text-[28px] sm:text-[32px] shadow-[0_8px_20px_rgba(15,23,42,0.15)] active:scale-[0.96] transition-transform cursor-pointer border-2 border-slate-900">
                      {user?.displayName?.charAt(0)}
                    </div>
                  </Link>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-400 rounded-full border-[3px] border-white shadow-sm pointer-events-none"></div>
               </div>
            </div>
          </div>

          <TooltipProvider>
              <Tooltip open={isConceptLimitReached ? undefined : false}>
                  <TooltipTrigger asChild>
                      <form onSubmit={handleSearch} className="max-w-4xl mx-auto sm:mx-0 relative w-full px-1">
                          <div className={`relative bg-slate-100/50 border border-slate-200/80 rounded-[28px] md:rounded-[36px] overflow-visible focus-within:bg-white focus-within:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] focus-within:border-transparent focus-within:ring-4 focus-within:ring-slate-900/5 transition-all duration-300 ${isConceptLimitReached ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''}`}>
                             <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 focus-within:text-slate-900 transition-colors pointer-events-none" />
                             <input 
                                 type="text" 
                                 placeholder={isConceptLimitReached ? "Daglige opslag brugt..." : "Slå et begreb eller en paragraf op..."}
                                 className={`w-full py-6 md:py-8 pl-14 md:pl-20 pr-28 md:pr-36 bg-transparent text-[16px] md:text-[20px] font-bold focus:outline-none placeholder:text-slate-400 placeholder:font-medium text-slate-900 ${isConceptLimitReached ? 'cursor-not-allowed text-slate-500' : ''}`}
                                 value={searchQuery}
                                 onFocus={() => {
                                   setIsSearchFocused(true);
                                   if (searchQuery.length > 1) setShowSuggestions(true);
                                 }}
                                 onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                 onChange={handleSearchChange}
                                 disabled={isConceptLimitReached}
                             />
                             <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2">
                                 <Button type="submit" size="sm" className="h-12 md:h-16 px-5 md:px-8 rounded-[20px] md:rounded-[24px] font-black uppercase text-[11px] md:text-[13px] tracking-widest gap-2.5 bg-slate-900 text-white shadow-lg active:scale-[0.96] transition-transform" disabled={isConceptLimitReached || !searchQuery.trim()}>
                                     <span className="hidden sm:inline">Søg via AI</span>
                                     <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                                 </Button>
                             </div>

                             {/* Suggestions Dropdown */}
                             <AnimatePresence>
                               {showSuggestions && suggestions.length > 0 && (
                                   <motion.div 
                                       initial={{ opacity: 0, y: -10 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       exit={{ opacity: 0, y: -10 }}
                                       className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[24px] shadow-2xl z-50 p-4 overflow-hidden"
                                   >
                                       <p className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 mb-2">Anbefalede søgninger</p>
                                       {suggestions.map((s, i) => (
                                           <button 
                                               key={i} 
                                               type="button"
                                               onClick={() => handleSuggestionClick(s)} 
                                               className="w-full text-left px-4 py-3.5 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-4 text-[15px] font-bold text-slate-600 hover:text-slate-900 group/item"
                                           >
                                               <Sparkles className="w-4 h-4 text-amber-300 group-hover/item:text-amber-500 transition-colors" /> 
                                               {s}
                                           </button>
                                       ))}
                                   </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                       </form>
                  </TooltipTrigger>
                  {isConceptLimitReached && (
                      <TooltipContent className="bg-slate-900 text-white border-slate-800 p-4 rounded-[16px] shadow-2xl" side="bottom">
                          <Link href="/upgrade" className="flex items-center gap-3">
                              <Lock className="w-4 h-4 text-amber-400"/>
                              <div>
                                  <p className="font-bold">Daglige opslag opbrugt</p>
                                  <p className="text-[11px] font-medium text-slate-300 hover:text-white transition-colors">Opgrader for at slå flere begreber op i dag.</p>
                              </div>
                          </Link>
                      </TooltipContent>
                  )}
              </Tooltip>
          </TooltipProvider>

          <div className="mt-8 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 px-2 w-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:inline-block mr-2">Populært nu:</span>
            {trendingTerms.map((tag: string) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTrendClick(tag)}
                  className="px-4 py-2 bg-white text-slate-600 rounded-[14px] text-[11px] font-bold border border-slate-200 shadow-sm active:scale-95 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all uppercase tracking-wider whitespace-nowrap"
                >
                  <TrendingUp className="w-3 h-3 inline-block mr-1.5 -mt-0.5 text-slate-400" />
                  {tag}
                </button>
            ))}
          </div>
        </div>
      </header>


      {/* SURVEY & ANNOUNCEMENT AREA */}
      <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 mt-12 mb-8 relative z-20">
        <SurveyWidget membership={userProfile?.membership || 'Kollega'} />
        
        {/* NEWS BANNER: Mine Seminarer Sharing Management */}
        <Link href="/mine-seminarer" className="group block mt-4 outline-none">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 border border-emerald-200 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:border-emerald-300 transition-all active:scale-[0.98] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-100/30 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-teal-100/20 rounded-full blur-[50px] pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:rotate-6 transition-transform flex-shrink-0">
                <Presentation className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2.5 mx-auto sm:mx-0">
                  <Zap className="w-3 h-3 fill-current" /> Nyt
                </div>
                <h3 className="text-[20px] font-extrabold text-slate-900 leading-tight">
                  Hold styr på dine PowerPoint som aldrig før
                </h3>
                <p className="text-[14px] text-slate-600 font-medium max-w-md mt-1.5">
                  Administrer deling, kontrollér hvem du har delt med, og fjern adgang på få sekunder. Alt fra ét sted.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center w-full sm:w-auto h-14 px-6 bg-white border border-emerald-200 rounded-[20px] shadow-sm text-emerald-600 font-bold text-[12px] uppercase tracking-widest group-hover:bg-emerald-50 transition-colors shrink-0 relative z-10">
              Gå til biblioteket <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
        </Link>
        
        <Link href="/lov-portal" className="group block mt-4 outline-none">
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] hover:border-indigo-200 transition-all active:scale-[0.98]">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:rotate-6 transition-transform flex-shrink-0">
                <Scale className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2.5 mx-auto sm:mx-0">
                  <Zap className="w-3 h-3 fill-current" /> Nyt værktøj
                </div>
                <h3 className="text-[20px] font-extrabold text-slate-900 leading-tight">
                  Udforsk vores nye intelligente Lovportal
                </h3>
                <p className="text-[14px] text-slate-500 font-medium max-w-md mt-1.5">
                  Find juridiske kilder samlet ét sted. Dyk ned med AI-sparring og automatiseret kildegenerator.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center w-full sm:w-auto h-14 px-6 bg-white border border-indigo-100 rounded-[20px] shadow-sm text-indigo-600 font-bold text-[12px] uppercase tracking-widest group-hover:bg-indigo-50 transition-colors shrink-0">
              Udforsk nu <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
        </Link>

        {/* BISTAND / MARKETPLACE BANNER */}
        <Link href="/bistand" className="group block mt-4 outline-none">
          <div className="bg-gradient-to-br from-rose-50 via-white to-orange-50/30 border border-rose-200 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-[0_20px_40px_rgba(225,29,72,0.15)] hover:border-rose-300 transition-all active:scale-[0.98] relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-100/30 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-600 text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:rotate-6 transition-transform flex-shrink-0">
                <HandHelping className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2.5 mx-auto sm:mx-0">
                  <Star className="w-3 h-3 fill-current" /> Markedsplads
                </div>
                <h3 className="text-[20px] font-extrabold text-slate-900 leading-tight">
                  Tjen penge mens du læser
                </h3>
                <p className="text-[14px] text-slate-600 font-medium max-w-md mt-1.5">
                  Brug din faglighed til at hjælpe borgere og få værdifuld erhvervserfaring til dit CV.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center w-full sm:w-auto h-14 px-6 bg-white border border-rose-200 rounded-[20px] shadow-sm text-rose-600 font-bold text-[12px] uppercase tracking-widest group-hover:bg-rose-50 transition-colors shrink-0 relative z-10">
              Se opgaver <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
        </Link>
      </div>


      <main className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* LEFT COLUMN: THE WORKSPACE */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Active Work (The Focus Card) */}
          {!userProfile?.isQualified && (
            <section>
              <div className="flex items-center gap-3.5 mb-8 px-2">
                  <div className="p-3 bg-amber-500 rounded-[16px] shadow-sm flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-[22px] sm:text-2xl font-extrabold text-slate-900 tracking-tight">Anbefalet til dig i dag</h2>
              </div>
              
              <div 
                onClick={() => router.push(recommendedTool?.path || '/portal')}
                className="bg-slate-900 p-8 sm:p-10 md:p-12 rounded-[32px] sm:rounded-[48px] text-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.4)] relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
              >
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div className="flex-1 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400 text-amber-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                          <Sparkles className="w-3.5 h-3.5" /> Dit næste skridt
                        </div>
                          {recommendedTool ? (
                            <>
                                <h3 className="text-[32px] sm:text-[40px] md:text-[48px] font-extrabold tracking-tight leading-[1.05]">
                                    Styrk dit skøn med <br className="hidden lg:block"/><span className="text-amber-400">{recommendedTool.name}</span>.
                                </h3>
                                <p className="text-slate-300 text-[16px] sm:text-[18px] leading-relaxed font-medium max-w-md">
                                    Det er fornuftigt at holde hjernen skarp. Dette værktøj står klar til dig lige nu.
                                </p>
                                <Button size="lg" className="h-14 px-8 rounded-[20px] bg-white text-slate-900 font-bold uppercase tracking-wider text-[13px] hover:bg-slate-100 shadow-xl w-full sm:w-auto mt-2">
                                    {recommendedTool.cta}
                                    <ArrowRight className="w-4 h-4 ml-2 opacity-70"/>
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400"/>
                                <span className="text-slate-400 font-medium">Analyserer din brug...</span>
                            </div>
                        )}
                    </div>
                    {recommendedTool && (
                        <div className="hidden sm:flex w-full md:w-56 h-56 bg-white/5 rounded-[32px] border border-white/10 p-6 flex-col justify-center items-center text-center group-hover:bg-white/10 transition-colors backdrop-blur-md shrink-0">
                            <div className={`w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-5 shadow-xl group-hover:-translate-y-2 transition-transform duration-500 ${recommendedTool.color}`}>
                                {React.createElement(recommendedTool.icon, { className: 'w-10 h-10' })}
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Værktøj</p>
                            <p className="text-[16px] font-bold text-white tracking-wide">{recommendedTool.name}</p>
                        </div>
                    )}
                  </div>
                  {/* Decorative mesh */}
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15)_0,transparent_70%)] rounded-full blur-[40px] pointer-events-none"></div>
              </div>
            </section>
          )}

          {/* Core Categories with Mobile-First Grid Stacking */}
          {toolCategories.map((category, idx) => (
            <section key={idx}>
              <div className="flex items-center gap-4 mb-6 px-2">
                <div className="p-3 bg-white border border-slate-200 rounded-[16px] shadow-sm shrink-0">
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-[20px] sm:text-[22px] font-extrabold text-slate-900 tracking-tight">{category.title}</h3>
                  <p className="text-[13px] sm:text-[14px] text-slate-500 font-medium mt-0.5">{category.subtitle}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {category.items.map((item, i) => (
                    <Link
                        key={i}
                        href={item.limit && item.limit.used >= item.limit.total ? '/upgrade' : item.path}
                        className={`group p-6 sm:p-8 rounded-[32px] border bg-white outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[220px] sm:h-[240px] ${
                            item.limit && item.limit.used >= item.limit.total 
                              ? 'opacity-70 border-slate-200 cursor-not-allowed' 
                              : 'active:scale-[0.98] lg:hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)] border-slate-100 lg:hover:border-slate-300 cursor-pointer shadow-sm'
                        }`}
                    >
                    <div className="relative z-10 flex justify-between items-start">
                         <div className={`w-14 h-14 rounded-[20px] border flex items-center justify-center shadow-sm ${item.color} ${item.limit && item.limit.used >= item.limit.total ? 'grayscale opacity-50' : 'group-hover:scale-105 transition-transform'}`}>
                          {React.createElement(item.icon, { className: 'w-6 h-6' })}
                        </div>
                        {item.limit && item.limit.total !== Infinity && (
                             <div className="text-right flex flex-col items-end">
                                <div className="flex items-baseline gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                   <p className="font-extrabold text-[16px] leading-none text-slate-800">{item.limit.used}</p>
                                   <p className="font-bold text-[12px] leading-none text-slate-400">/{item.limit.total}</p>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5 mr-1">{item.limitText}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="relative z-10 mt-auto">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">{item.badge}</span>
                        </div>
                        <h4 className="text-[18px] sm:text-[20px] font-bold text-slate-900 leading-tight tracking-tight">{item.title}</h4>
                        <p className="text-[13px] text-slate-500 mt-2 font-medium leading-relaxed line-clamp-2">{item.desc}</p>
                    </div>

                    {item.limit && item.limit.used >= item.limit.total && (
                        <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] flex items-center justify-center p-6 text-center z-20">
                            <div className="bg-white/95 backdrop-blur-xl px-5 py-3 rounded-[20px] shadow-xl border border-slate-200 flex flex-col items-center gap-2">
                                <Lock className="w-5 h-5 text-amber-500 mb-1" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Grænse nået</span>
                            </div>
                        </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
          
          {/* USER ARCHIVE SECTION */}
          {!userProfile?.isQualified && (
            <section>
              <div className="flex items-center gap-4 mb-6 px-2">
                <div className="p-3 bg-white border border-slate-200 rounded-[16px] shadow-sm shrink-0">
                  <Layers className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-[20px] sm:text-[22px] font-extrabold text-slate-900 tracking-tight">Mit Arkiv</h3>
                  <p className="text-[13px] sm:text-[14px] text-slate-500 font-medium mt-0.5">Gense dine gemte analyser og byggeplaner</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { title: "Logbog", desc: "Refleksioner", icon: BookMarked, path: "/min-logbog" },
                    { title: "Byggeplaner", desc: "Forberedelse", icon: DraftingCompass, path: "/mine-byggeplaner" },
                    { title: "Seminarer", desc: "Dine oplæg", icon: Presentation, path: "/mine-seminarer" },
                    { title: "Artikler", desc: "Vidensindsigter", icon: Bookmark, path: "/mine-gemte-artikler" },
                    { title: "Paragraffer", desc: "Jura-opslag", icon: Gavel, path: "/mine-gemte-paragraffer" },
                    { title: "Kalender", desc: "Semester", icon: CalendarDays, path: "/mine-semesterplaner" }
                  ].map((item, i) => (
                    <Link key={i} href={item.path} className="group p-5 sm:p-6 rounded-[28px] border border-slate-100 bg-white hover:border-slate-300 hover:shadow-lg transition-all active:scale-[0.98] outline-none flex flex-col items-center justify-center text-center shadow-sm h-36 sm:h-44">
                        <div className="w-12 h-12 rounded-[18px] bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform">
                          {React.createElement(item.icon, { className: 'w-5 h-5' })}
                        </div>
                        <h4 className="text-[14px] sm:text-[15px] font-bold text-slate-900 leading-tight">{item.title}</h4>
                        <p className="text-[9px] text-slate-400 mt-1.5 uppercase font-bold tracking-widest">{item.desc}</p>
                    </Link>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: THE DASHBOARD RAIL */}
        <aside className="lg:col-span-4 space-y-8 lg:space-y-10">
          
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
          <section className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Næste kalenderaftale</h3>
               <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                 <CalendarDays className="w-4 h-4 text-orange-500" />
               </div>
            </div>
            
            <div className="space-y-4 relative z-10 w-full">
                {plansLoading ? (
                    <div className="flex justify-center items-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300"/></div>
                ) : nextEvent ? (
                    <Link href="/mine-semesterplaner" className="block p-5 sm:p-6 bg-slate-50 rounded-[24px] border border-slate-100 hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer">
                        <div className="flex items-center gap-2.5 mb-3">
                           <Clock className="w-4 h-4 text-slate-400" />
                           <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest">{new Date(nextEvent.startDate).toLocaleString('da-DK', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <p className="font-bold text-[16px] sm:text-[18px] text-slate-900 leading-snug tracking-tight mb-4 line-clamp-2">{nextEvent.summary}</p>
                        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                           Se detaljer i kalender <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                    </Link>
                ) : (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50/50">
                        <p className="text-[14px] text-slate-500 font-medium mb-5">Din kalender er fri lige nu.</p>
                        <Button variant="outline" onClick={() => router.push('/semester-planlaegger')} className="h-12 rounded-[16px] border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold px-6 shadow-sm active:scale-95 transition-transform">
                           Auto-planlæg semester
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
