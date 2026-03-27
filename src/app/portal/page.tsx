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
  CreditCard,
  Command
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { processStripeSession, fetchPoliticalNews, fetchSocialMinistryNews } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, DocumentData, Timestamp, doc, updateDoc, serverTimestamp, increment, getDoc, setDoc, where, addDoc } from 'firebase/firestore';
import { AssistanceRequest } from '@/ai/flows/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
    <section className="bg-white/70 backdrop-blur-xl p-8 rounded-[40px] border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:bg-white transition-all duration-500">
      <div className={`absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.06] group-hover:-translate-y-2 group-hover:translate-x-2 transition-all duration-700`}>
        <Icon className="w-32 h-32 -rotate-12" />
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[14px] bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h3 className="font-black text-slate-950 text-[11px] uppercase tracking-[0.2em]">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100/30">
             <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Live
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opdaterer kilder...</span>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[14px] text-slate-400 font-medium italic">Afventer nye efterretninger...</p>
          </div>
        ) : (
          <ul className="space-y-2 flex-grow">
            {news.slice(0, 3).map((item, index) => (
              <li key={index} className="group/item">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-[24px] hover:bg-slate-50/80 active:scale-[0.98] transition-all -mx-4">
                  <p className="text-[15px] font-bold text-slate-800 group-hover/item:text-slate-950 leading-snug line-clamp-2 transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                     <div className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover/item:bg-slate-400 transition-colors" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                       {new Date(item.pubDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                     </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
        
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-950 flex items-center gap-2 transition-all group-hover:gap-3">
            Se fuldt arkiv <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

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
              total: isFreeTier ? 1 : Infinity 
          },
          cases: { 
              used: getDailyCount(userProfile?.lastCaseTrainerUsage, userProfile?.dailyCaseTrainerCount), 
              total: isFreeTier ? 1 : Infinity 
          },
          journal: { 
              used: getDailyCount(userProfile?.lastJournalTrainerUsage, userProfile?.dailyJournalTrainerCount), 
              total: isFreeTier ? 0 : Infinity 
          },
          architect: { 
              used: getMonthlyCount(userProfile?.lastExamArchitectUsage, userProfile?.monthlyExamArchitectCount), 
              total: isFreeTier ? 1 : Infinity 
          },
          oralExam: {
              used: getDailyCount(userProfile?.lastOralExamUsage, userProfile?.dailyOralExamCount),
              total: isFreeTier ? 1 : Infinity
          },
          opinion: {
              used: getMonthlyCount(userProfile?.lastSecondOpinionUsage, userProfile?.monthlySecondOpinionCount),
              total: isFreeTier ? 0 : 10
          },
          star: {
              used: getDailyCount(userProfile?.lastStarAnalysisUsage, userProfile?.dailyStarAnalysisCount),
              total: isFreeTier ? 1 : Infinity
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
        if (!globalActivities || globalActivities.length === 0) return ['§ 81', 'Relationskompetence', 'Tavshedspligt', 'VUM 2.0'];
        
        const termCounts: Record<string, number> = {};
        const conceptRegex = /slog begrebet "([^"]+)" op/;
        const lawRegex = /slog (§ .+? i .+?) op/;

        globalActivities.forEach(act => {
            const text = act.actionText || '';
            const match = text.match(conceptRegex) || text.match(lawRegex);
            
            if (match && match[1]) {
                const term = match[1];
                termCounts[term] = (termCounts[term] || 0) + 1;
            }
        });

        // Convert to array of {term, count}, sort by count desc, and take top 5
        const sortedTerms = Object.entries(termCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([term]) => term)
            .slice(0, 5);

        return sortedTerms.length > 0 ? sortedTerms : ['§ 81', 'Relationskompetence', 'Tavshedspligt', 'VUM 2.0'];
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
      // Record Activity
      if (user && firestore) {
        const isLawTerm = term.includes('§') || term.toLowerCase().includes('lov');
        addDoc(collection(firestore, 'userActivities'), {
            userId: user.uid,
            userName: userProfile?.username || user.displayName || 'Anonym bruger',
            actionText: isLawTerm ? `slog ${term} op.` : `slog begrebet "${term}" op.`,
            createdAt: serverTimestamp(),
        }).catch(err => console.error("Failed to record activity:", err));
      }

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const searchInput = document.getElementById('portal-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

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
          { title: "Markedsplads", desc: "Hjælp borgere og få erfaring", icon: HandHelping, path: "/markedsplads", color: "text-rose-600 bg-rose-50 border-rose-100", badge: "Marketplace" },
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
          { title: "Institutionssøgning", desc: "Søg i Danmarks institutionsregister", icon: Building, path: "/institutions", color: "text-amber-600 bg-amber-50 border-amber-100", badge: "Data" },
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
                    { title: "Institutionssøgning", desc: "Søg i Danmarks institutionsregister", icon: Building, path: "/institutions", color: "text-amber-600 bg-amber-50 border-amber-100", badge: "Data" },
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
      <header className="bg-white/90 backdrop-blur-2xl border-b border-slate-200/50 px-5 sm:px-8 py-10 md:py-20 relative overflow-visible z-30 transition-all rounded-b-[48px] sm:rounded-b-[72px] shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        {/* Dynamic mesh effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08)_0,transparent_70%)] pointer-events-none -z-10 animate-pulse transition-all duration-1000"></div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.03)_0,transparent_70%)] pointer-events-none -z-10 animate-pulse delay-700"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-12 md:mb-20">
            <div className="text-center sm:text-left flex flex-col items-center sm:items-start max-w-2xl">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-8">
                <span className="px-4 py-2 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-800 flex items-center gap-2 group cursor-default">
                   <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                   {userProfile?.membership || 'Kollega'} Medlem
                </span>
                <div className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-rose-100 shadow-sm">
                   <Flame className="w-3.5 h-3.5 fill-current" /> {userProfile?.dailyChallengeStreak || 0} Dages dannelse
                </div>
              </div>
              <h1 className="text-[38px] sm:text-6xl md:text-7xl font-extrabold text-slate-950 tracking-[-0.03em] leading-[0.95]">
                {getTimeOfDayGreeting()}, <br className="sm:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">{user?.displayName?.split(' ')[0]}</span>
              </h1>
              <p className="text-[17px] sm:text-xl text-slate-500 mt-6 font-medium max-w-xl mx-auto sm:mx-0 leading-relaxed text-balance">
                {userProfile?.isQualified 
                    ? "Din strategiske partner i myndighedsarbejdet. Hold dig opdateret på de nyeste tendenser." 
                    : "Alt hvad du skal bruge til socialrådgiverstudiet, samlet ét sted. Klar til dagens udfordringer?"}
              </p>
              
              {/* Premium Search Experience */}
              <div className="relative w-full max-w-xl mt-12 group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                      <Search className="w-6 h-6 text-slate-400 group-focus-within:text-amber-500 group-focus-within:scale-110 transition-all duration-300" />
                  </div>
                  <Input 
                      id="portal-search-input"
                      type="text" 
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Søg i din viden, paragraffer og værktøjer..." 
                      className="h-20 pl-16 pr-24 bg-slate-50 border-slate-200/60 rounded-[32px] focus:ring-0 focus:border-amber-400 focus:bg-white text-slate-950 placeholder:text-slate-400 placeholder:font-semibold transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group-focus-within:shadow-[0_20px_50px_rgba(0,0,0,0.08)] group-focus-within:-translate-y-1 text-lg font-medium"
                  />
                  <div className="absolute inset-y-0 right-6 flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/50 rounded-xl text-[10px] font-black text-slate-500 tracking-widest border border-slate-300/30">
                        <Command className="w-3 h-3" /> K
                      </div>
                      <button 
                        onClick={() => handleSearch()}
                        className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all"
                      >
                         <ArrowRight className="w-5 h-5" />
                      </button>
                  </div>

                  {/* Suggestions Dropdown for the new search experience */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-200 rounded-[32px] shadow-2xl z-50 p-6 overflow-hidden"
                        >
                            <p className="px-5 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50 mb-3">Søgninger der hitter</p>
                            <div className="grid grid-cols-1 gap-2">
                                {suggestions.map((s, i) => (
                                    <button 
                                        key={i} 
                                        type="button"
                                        onClick={() => handleSuggestionClick(s)} 
                                        className="w-full text-left px-5 py-4 hover:bg-slate-50 rounded-[20px] transition-all flex items-center gap-4 text-[16px] font-bold text-slate-600 hover:text-slate-950 group/item"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover/item:bg-amber-100 transition-colors">
                                            <Sparkles className="w-5 h-5 text-amber-500" /> 
                                        </div>
                                        {s}
                                        <ArrowUpRight className="w-4 h-4 ml-auto opacity-0 group-hover/item:opacity-40 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
              </div>

              {/* Popular Trends Integrated Under Search */}
              <div className="mt-8 flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:inline-block mr-1">Populært:</span>
                {trendingTerms.map((tag: string) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTrendClick(tag)}
                      className="px-5 py-2.5 bg-slate-100/50 text-slate-600 rounded-full text-[11px] font-bold border border-slate-200/50 hover:bg-white hover:text-slate-950 hover:border-amber-200 hover:shadow-sm transition-all uppercase tracking-wider whitespace-nowrap active:scale-95"
                    >
                      <TrendingUp className="w-3.5 h-3.5 inline-block mr-2 -mt-0.5 text-amber-500" />
                      {tag}
                    </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-5 p-4 sm:p-6 bg-slate-50/50 backdrop-blur-md rounded-[40px] border border-slate-100 shadow-inner shrink-0">
                {!userProfile?.isQualified && (
                    <Link href="/memento" passHref>
                        <Button variant="outline" className="h-[76px] w-[92px] sm:h-24 sm:w-32 flex-col gap-2 text-center font-black !bg-white hover:!bg-slate-50 border-slate-200 shadow-sm rounded-[24px] sm:rounded-[32px] active:scale-[0.96] transition-all group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform"/>
                            <span className="text-[10px] sm:text-[11px] text-slate-800 uppercase tracking-widest">Memento</span>
                        </Button>
                    </Link>
                )}
                <Link href="https://group.cohero.dk" passHref>
                  <Button variant="outline" className="h-[76px] w-[92px] sm:h-24 sm:w-32 flex-col gap-2 text-center font-black !bg-white hover:!bg-slate-50 border-slate-200 shadow-sm rounded-[24px] sm:rounded-[32px] active:scale-[0.96] transition-all group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Users className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 shrink-0 group-hover:scale-110 transition-transform"/>
                    <span className="text-[10px] sm:text-[11px] text-slate-800 uppercase tracking-widest">Grupper</span>
                  </Button>
                </Link>
                <div className="hidden md:block w-px h-16 bg-slate-200/50 mx-2" />
                <Link href="/settings" passHref>
                  <div className="relative group cursor-pointer transition-all duration-500 hover:rotate-2">
                    <div className="h-[80px] w-[80px] sm:w-24 sm:h-24 rounded-[32px] sm:rounded-[40px] bg-slate-950 text-white flex items-center justify-center font-black text-[32px] sm:text-4xl shadow-2xl shadow-slate-950/20 active:scale-[0.94] transition-all border-[3px] border-white group-hover:border-amber-400 group-hover:shadow-amber-500/20">
                      {user?.displayName?.charAt(0)}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-emerald-400 rounded-full border-[4px] border-white shadow-lg pointer-events-none group-hover:scale-110 transition-transform"></div>
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-400 rounded-full scale-x-0 group-hover:scale-x-50 transition-transform origin-center translate-y-4" />
                  </div>
                </Link>
            </div>
          </div>
        </div>
      </header>


      {/* SURVEY & ANNOUNCEMENT AREA */}
      <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 mt-12 mb-8 relative z-20">
        <SurveyWidget membership={userProfile?.membership || 'Kollega'} />
        
        {/* NEWS BANNER: Mine Seminarer Sharing Management */}
        <Link href="/mine-seminarer" className="group block mt-4 outline-none">
          <div className="bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e293b] border border-slate-800 p-8 sm:p-12 rounded-[48px] sm:rounded-[64px] flex flex-col md:flex-row items-center justify-between gap-10 hover:shadow-[0_40px_80px_rgba(0,0,0,0.3)] transition-all duration-500 active:scale-[0.98] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700"></div>
            <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-10 relative z-10 w-full sm:w-auto">
              <div className="w-20 h-20 bg-emerald-500 text-black rounded-[28px] flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 flex-shrink-0">
                <Presentation className="w-10 h-10" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                   <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-inner mb-2 lg:mb-0">
                      Personligt Bibliotek
                   </div>
                   <div className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-2 lg:mb-0">
                      Privat
                   </div>
                </div>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
                    Dit faglige univers, <span className="text-emerald-400">helt privat.</span>
                  </h3>
                  <p className="text-lg text-slate-400 font-medium max-w-lg mt-3 leading-relaxed">
                    Organisér dine PowerPoint-slides, find svære faglige begreber øjeblikkeligt og bevar kontrollen over din viden.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center w-full sm:w-auto h-16 px-10 bg-white text-slate-950 rounded-[28px] font-black text-[13px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-2xl shrink-0 relative z-10">
              Udforsk bibliotek <ArrowRight className="w-5 h-5 ml-3" />
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
        <Link href="/markedsplads" className="group block mt-4 outline-none">
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
              <div className="flex items-center gap-4 mb-8 px-2">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl shadow-[0_8px_20px_rgba(245,158,11,0.2)] flex items-center justify-center text-white">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Anbefalet til dig</h2>
                    <p className="text-[13px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dagens faglige fokus</p>
                  </div>
              </div>
              
              <div 
                onClick={() => router.push(recommendedTool?.path || '/portal')}
                className="bg-[#0f172a] p-10 sm:p-12 md:p-16 rounded-[48px] sm:rounded-[64px] text-white shadow-[0_30px_100px_-20px_rgba(15,23,42,0.4)] relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all duration-700 border border-white/5"
              >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />

                  <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                    <div className="flex-1 space-y-8 text-left">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-amber-400 text-amber-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-400/20">
                          <Sparkles className="w-4 h-4" /> AI-Anbefaling
                        </div>
                          {recommendedTool ? (
                            <div className="space-y-6">
                                <h3 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1] text-balance">
                                    Styrk dit faglige skøn med <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">{recommendedTool.name}</span>.
                                </h3>
                                <p className="text-slate-400 text-lg sm:text-xl leading-relaxed font-medium max-w-lg">
                                    Vi har analyseret dine seneste aktiviteter. Dette værktøj vil give dig mest værdi lige nu.
                                </p>
                                <div className="pt-4">
                                  <Button size="lg" className="h-16 px-10 rounded-[28px] bg-white text-slate-950 font-black uppercase tracking-[0.2em] text-[14px] hover:bg-amber-400 hover:scale-105 shadow-2xl w-full sm:w-auto transition-all duration-300">
                                      {recommendedTool.cta}
                                      <ArrowRight className="w-5 h-5 ml-3" />
                                  </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-amber-400"/>
                                <span className="text-slate-400 text-xl font-bold uppercase tracking-widest">Opdaterer din profil...</span>
                            </div>
                        )}
                    </div>
                    {recommendedTool && (
                        <div className="hidden lg:flex w-72 h-72 bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 p-10 flex-col justify-center items-center text-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-700 shrink-0 shadow-inner">
                            <div className={`w-28 h-28 bg-white rounded-[32px] flex items-center justify-center mb-6 shadow-[0_20px_50px_rgba(255,255,255,0.1)] group-hover:-translate-y-3 transition-transform duration-700 ${recommendedTool.color}`}>
                                {React.createElement(recommendedTool.icon, { className: 'w-12 h-12' })}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Fokusområde</p>
                            <p className="text-[20px] font-black text-white tracking-tight">{recommendedTool.name}</p>
                        </div>
                    )}
                  </div>
              </div>
            </section>
          )}

          {/* Core Categories with Mobile-First Grid Stacking */}
          {toolCategories.map((category, idx) => (
            <section key={idx}>
              <div className="flex items-center gap-4 mb-8 px-2">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">{category.title}</h3>
                  <p className="text-[14px] text-slate-500 font-medium mt-0.5">{category.subtitle}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {category.items.map((item, i) => (
                    <Link
                        key={i}
                        href={item.limit && item.limit.used >= item.limit.total ? '/upgrade' : item.path}
                        className={`group p-8 rounded-[40px] border bg-white outline-none focus-visible:ring-4 focus-visible:ring-slate-900/5 transition-all duration-500 relative overflow-hidden flex flex-col justify-between h-[260px] sm:h-[280px] ${
                            item.limit && item.limit.used >= item.limit.total 
                              ? 'opacity-80 border-slate-200 cursor-not-allowed shadow-none' 
                              : 'active:scale-[0.98] lg:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border-slate-100 lg:hover:border-slate-300 lg:hover:-translate-y-1 cursor-pointer shadow-sm shadow-slate-200/50'
                        }`}
                    >
                    <div className="relative z-10 flex justify-between items-start">
                         <div className={`w-16 h-16 rounded-[22px] border flex items-center justify-center shadow-sm ${item.color} ${item.limit && item.limit.used >= item.limit.total ? 'grayscale opacity-30' : 'group-hover:scale-110 group-hover:rotate-3 transition-all duration-500'}`}>
                           {React.createElement(item.icon, { className: 'w-7 h-7' })}
                        </div>
                        {item.limit && item.limit.total !== Infinity && (
                             <div className="text-right flex flex-col items-end">
                                <div className="flex items-baseline gap-1 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-colors">
                                   <p className="font-black text-lg leading-none text-slate-950">{item.limit.used}</p>
                                   <p className="font-bold text-[13px] leading-none text-slate-400">/{item.limit.total}</p>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 mr-1">{item.limitText}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="relative z-10 mt-auto">
                        <div className="flex items-center gap-2.5 mb-3">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors">{item.badge}</span>
                        </div>
                        <h4 className="text-[22px] font-black text-slate-950 leading-tight tracking-tight group-hover:text-black transition-colors">{item.title}</h4>
                        <p className="text-[15px] text-slate-500 mt-2.5 font-medium leading-relaxed line-clamp-2">{item.desc}</p>
                    </div>

                    {item.limit && item.limit.used >= item.limit.total && (
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[4px] flex items-center justify-center p-8 z-20 group-hover:bg-slate-950/30 transition-all duration-500">
                            <div className="bg-white p-8 rounded-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col items-center gap-4 max-w-[240px] border border-white/20 scale-100 group-hover:scale-105 transition-all duration-500">
                                <div className="w-14 h-14 bg-amber-400 text-amber-950 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20 mb-1">
                                  <Star className="w-7 h-7 fill-current" />
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[16px] font-black text-slate-950 leading-none">Limit nået</p>
                                  <p className="text-[12px] font-medium text-slate-500 leading-snug">Opgrader og få ubegrænset brug af {item.title}.</p>
                                </div>
                                <div className="mt-2 w-full py-4 bg-slate-950 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/10">
                                  Lås op nu
                                </div>
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
              <div className="flex items-center gap-4 mb-8 px-2">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">Mit Arkiv</h3>
                  <p className="text-[14px] text-slate-500 font-medium mt-0.5">Dine personlige viden-skatte</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8">
                  {[
                    { title: "Logbog", desc: "Refleksioner", icon: BookMarked, path: "/min-logbog", color: "text-amber-600 bg-amber-50" },
                    { title: "Byggeplaner", desc: "Forberedelse", icon: DraftingCompass, path: "/mine-byggeplaner", color: "text-indigo-600 bg-indigo-50" },
                    { title: "Seminarer", desc: "Bibliotek", icon: Presentation, path: "/mine-seminarer", color: "text-emerald-600 bg-emerald-50" },
                    { title: "Artikler", desc: "Indsigter", icon: Bookmark, path: "/mine-gemte-artikler", color: "text-rose-600 bg-rose-50" },
                    { title: "Paragraffer", desc: "Jura-opslag", icon: Scale, path: "/mine-gemte-paragraffer", color: "text-sky-600 bg-sky-50" },
                    { title: "Kalender", desc: "Overblik", icon: CalendarDays, path: "/mine-semesterplaner", color: "text-violet-600 bg-violet-50" }
                  ].map((item, i) => (
                    <Link key={i} href={item.path} className="group p-8 rounded-[40px] border border-slate-100 bg-white hover:border-slate-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500 active:scale-[0.98] outline-none flex flex-col items-center justify-center text-center shadow-sm h-48 sm:h-56">
                        <div className={`w-16 h-16 rounded-[24px] border border-slate-50 ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-2 transition-all duration-500 shadow-sm`}>
                          {React.createElement(item.icon, { className: 'w-7 h-7' })}
                        </div>
                        <h4 className="text-[17px] font-black text-slate-950 leading-tight group-hover:text-black transition-colors">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-[0.2em]">{item.desc}</p>
                    </Link>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: THE DASHBOARD RAIL */}
        <aside className="lg:col-span-4 space-y-8 lg:space-y-10">
          
          {/* Upgrade Incentive Card for free users */}
          {(userProfile?.membership === 'Kollega' || !userProfile?.membership) && (
            <section className="bg-slate-900 p-8 sm:p-10 rounded-[32px] sm:rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/20 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-700"></div>
               <div className="relative z-10 flex flex-col gap-6">
                  <div className="w-16 h-16 bg-amber-400 text-amber-950 rounded-2xl flex items-center justify-center shadow-[0_0_30px_-5px_rgba(251,191,36,0.5)] group-hover:rotate-6 transition-transform">
                      <Zap className="w-8 h-8 fill-current" />
                  </div>
                  <div className="space-y-3">
                      <h3 className="text-[22px] font-extrabold text-white leading-tight">Gå efter toppen med Kollega+</h3>
                      <p className="text-[14px] text-slate-300 font-medium">Lås op for ubegrænset brug, personligt arkiv og prioriteret support.</p>
                  </div>
                  <Link href="/upgrade" className="w-full h-14 bg-white text-slate-900 rounded-[20px] font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2.5 hover:bg-slate-50 active:scale-95 transition-all shadow-xl">
                      Prøv gratis i 7 dage <ArrowRight className="w-4 h-4" />
                  </Link>
               </div>
            </section>
          )}

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
