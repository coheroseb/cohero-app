'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Flag,
  Target,
  CalendarDays,
  Search,
  Flame,
  Zap,
  Star,
  FileSearch,
  Gavel,
  Sparkles,
  Layout,
  FileText,
  GraduationCap,
  Library,
  BookOpen,
  Scale,
  Loader2,
  Building,
  TrendingUp,
  Brain,
  Quote,
  ArrowRight,
  Crown,
  Clock,
  Command,
  ChevronRight,
  MessageSquare,
  Mic,
  Upload,
  CheckCircle2,
  Briefcase,
  RefreshCw,
  XCircle,
  Heart,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
  Bookmark,
  FileBox
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useToast } from '@/hooks/use-toast';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Capacitor } from '@capacitor/core';
import { fetchPoliticalNews, fetchSocialMinistryNews, processStudyRegulationAction, searchLiteratureAction } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase, useFunctions } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, where, doc, updateDoc, deleteField } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// --- Sub-components for a "Light" feel ---

const ActionCard = ({ title, icon: Icon, description, path, color }: any) => (
  <motion.div 
    whileHover={{ y: -8, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="relative group cursor-pointer"
  >
    <Link href={path} className="block h-full">
      <div className="bg-white p-8 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-slate-100/60 flex flex-col items-center text-center gap-6 group-hover:shadow-[var(--shadow-lg)] group-hover:border-indigo-100/60 transition-all duration-500 h-full">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-2 shadow-sm ${color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
          <Icon className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-slate-400 font-medium text-sm leading-relaxed px-4">{description}</p>
        </div>
        <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-900 transition-colors">
          Start nu <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  </motion.div>
);

const SmallTool = ({ title, icon: Icon, path }: any) => (
  <Link href={path} className="group flex items-center gap-4 p-4 bg-white/50 hover:bg-white border border-transparent hover:border-indigo-100 rounded-[var(--radius-md)] transition-all">
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
      <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
    </div>
    <span className="font-semibold text-slate-600 group-hover:text-slate-950 transition-colors">{title}</span>
    <ChevronRight className="w-4 h-4 ml-auto text-slate-200 group-hover:text-indigo-400 transition-colors" />
  </Link>
);

// --- Helpers ---
function getSemNum(semester: string): number {
  return parseInt(semester?.match(/\d+/)?.[0] ?? '1');
}

// Deterministic gradients for book cards
const getGradient = (title: string) => {
  const gradients = [
    'from-rose-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-blue-600 to-indigo-600',
    'from-violet-600 to-purple-600',
    'from-amber-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-pink-500 to-rose-500',
  ];
  let sum = 0;
  for (let i = 0; i < title.length; i++) {
    sum += title.charCodeAt(i);
  }
  return gradients[sum % gradients.length];
};

const PortalPageContent: React.FC = () => {
  const { user, userProfile, isUserLoading, refetchUserProfile } = useApp();
  const hasProAccess = userProfile?.membership === 'Cohéro Student' || userProfile?.membership === 'Semesterpakken' || userProfile?.membership === 'Kollega+' || userProfile?.role === 'admin';
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [isNative, setIsNative] = useState(false);
  const functions = useFunctions();
  const [isSSOLoading, setIsSSOLoading] = useState(false);

  const handleSSORedirect = async (url: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!functions || isSSOLoading) {
      window.open(url, '_blank');
      return;
    }

    setIsSSOLoading(true);
    try {
      const generateSSOToken = httpsCallable(functions, 'generateSSOToken');
      const result = await generateSSOToken();
      const token = (result.data as any).token;
      
      const targetUrl = new URL(url);
      targetUrl.searchParams.set('token', token);
      window.open(targetUrl.toString(), '_blank');
    } catch (err) {
      console.error("SSO failed", err);
      window.open(url, '_blank');
    } finally {
      setIsSSOLoading(false);
    }
  };


  // Dashboard Data
  const [plans, setPlans] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSemesterReminder, setShowSemesterReminder] = useState(false);

  // Initialize reminder visibility from localStorage
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    const isDismissed = localStorage.getItem('semester_reminder_dismissed_v1');
    if (!isDismissed) {
      setShowSemesterReminder(true);
    }
  }, []);

  const dismissReminder = () => {
    localStorage.setItem('semester_reminder_dismissed_v1', 'true');
    setShowSemesterReminder(false);
  };

  // Relevant Literature for Learning Goals
  const [expandedGoalIndex, setExpandedGoalIndex] = useState<number | null>(null);
  const [goalLiterature, setGoalLiterature] = useState<Record<string, { loading: boolean; results?: any[]; error?: string }>>({});
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

  const fetchLiteratureForGoal = async (goal: string) => {
    if (goalLiterature[goal]?.results || goalLiterature[goal]?.loading) return;

    setGoalLiterature(prev => ({
      ...prev,
      [goal]: { loading: true }
    }));

    try {
      const response = await searchLiteratureAction(goal, 3); // limit to 3
      setGoalLiterature(prev => ({
        ...prev,
        [goal]: { loading: false, results: response?.results || [] }
      }));
    } catch (error: any) {
      console.error("Failed to fetch literature for goal:", error);
      setGoalLiterature(prev => ({
        ...prev,
        [goal]: { loading: false, error: "Kunne ikke hente litteraturforslag." }
      }));
    }
  };

  const handleCopyCitation = async (citation: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(citation);
      setCopiedCitation(citation);
      setTimeout(() => setCopiedCitation(null), 2000);
      toast({
        title: "Kopieret!",
        description: "Litteraturhenvisningen er kopieret til udklipsholderen.",
      });
    } catch (err) {
      console.error("Failed to copy citation:", err);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke kopiere henvisningen.",
      });
    }
  };

  // Quick Semantic Search
  const [portalSearchQuery, setPortalSearchQuery] = useState('');
  const [portalSearchResults, setPortalSearchResults] = useState<any[] | null>(null);
  const [isPortalSearchLoading, setIsPortalSearchLoading] = useState(false);
  const [portalSearchError, setPortalSearchError] = useState<string | null>(null);

  const handlePortalSearch = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) return;

    setIsPortalSearchLoading(true);
    setPortalSearchError(null);
    try {
      const response = await searchLiteratureAction(cleanQuery, 3);
      setPortalSearchResults(response?.results || []);
    } catch (err: any) {
      console.error("Portal literature search error:", err);
      setPortalSearchError("Kunne ikke gennemføre søgningen. Prøv igen.");
    } finally {
      setIsPortalSearchLoading(false);
    }
  };

  const clearPortalSearch = () => {
    setPortalSearchQuery('');
    setPortalSearchResults(null);
    setPortalSearchError(null);
  };

  // --- Curriculum / Module Identification ---
  const curriculumsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.profession) return null;
    return query(
      collection(firestore, 'curriculums'),
      where('profession', '==', userProfile.profession)
    );
  }, [firestore, userProfile?.profession]);

  const { data: curriculumsRaw } = useCollection<any>(curriculumsQuery);

  const curriculum = useMemo(() => {
    // Priority 1: User's own custom curriculum
    if (userProfile?.customCurriculum) {
      return userProfile.customCurriculum;
    }

    // Priority 2: Global institutional curriculum
    if (!curriculumsRaw || curriculumsRaw.length === 0) return null;

    const currentSemId = userProfile?.semester;
    
    // NEW: If user has a specific module ID, find the curriculum that actually contains this module
    if (currentSemId && (currentSemId.length > 2 || isNaN(parseInt(currentSemId)))) {
       const containingCurriculum = curriculumsRaw.find((c: any) => 
         c.modules?.some((m: any) => String(m.id) === String(currentSemId))
       );
       if (containingCurriculum) return containingCurriculum;
    }

    const userInst = (userProfile?.institution || '').toLowerCase().trim();
    const studyStarted = userProfile?.studyStarted;

    const normalize = (s: string) => {
      let res = s.toLowerCase()
        .replace(/professionshøjskolen\s+/gs, '')
        .replace(/university college\s+/gs, '')
        .replace(/erhvervsakademi og professionshøjskole\s+/gs, '')
        .replace(/professionshøjskole\s+/gs, '')
        .replace(/\bsjælland\b/g, 'absalon')
        .trim();
      const mapping: Record<string, string> = {
        'københavns professionshøjskole': 'kp', 'københavn': 'kp', 'københavns': 'kp',
        'professionshøjskolen absalon': 'absalon', 'lillebælt': 'ucl',
        'erhvervsakademi lillebælt': 'ucl', 'ucl erhvervsakademi og professionshøjskole': 'ucl'
      };
      let mapped = mapping[res];
      if (!mapped) {
        if (res.includes('lillebælt')) mapped = 'ucl';
        else if (res.includes('københavn')) mapped = 'kp';
        else if (res.includes('sjælland')) mapped = 'absalon';
        else if (res.includes('midtjylland')) mapped = 'via';
        else if (res.includes('nordjylland')) mapped = 'ucn';
      }
      return mapped || res;
    };

    const normalizedUserInst = normalize(userInst);
    const instMatches = curriculumsRaw.filter((c: any) => {
      const nInst = normalize(c.institution || '');
      return nInst === normalizedUserInst || nInst.includes(normalizedUserInst) || normalizedUserInst.includes(nInst);
    });

    if (instMatches.length === 0) return null;
    if (studyStarted) {
      const dateMatch = instMatches.find((c: any) => (!c.validFrom || studyStarted >= c.validFrom) && (!c.validTo || studyStarted < c.validTo));
      if (dateMatch) return dateMatch;
    }
    return instMatches[0];
  }, [curriculumsRaw, userProfile?.studyStarted, userProfile?.institution, userProfile?.customCurriculum]);

  const activeModule = useMemo(() => {
    if (!curriculum) return null;
    const currentSem = userProfile?.semester || '1';
    const semNum = getSemNum(currentSem);
    const isSimpleNumber = /^\d+$/.test(currentSem.trim());
    
    // 1. Try exact ID match
    let found = curriculum.modules.find((m: any) => String(m.id) === String(currentSem));
    
    // 2. Try exact name match (case insensitive)
    if (!found) {
      found = curriculum.modules.find((m: any) => String(m.name).toLowerCase() === currentSem.toLowerCase());
    }
    
    // 3. Try included name match
    if (!found) {
      found = curriculum.modules.find((m: any) => String(m.name).toLowerCase().includes(currentSem.toLowerCase()));
    }
    
    // 4. Fallback to semester number ONLY if it's a simple number (e.g. "2")
    if (!found && isSimpleNumber) {
      found = curriculum.modules.find((m: any) => m.semester === semNum);
    }
    
    // 5. Ultimate fallback
    return found || curriculum.modules[0];
  }, [curriculum, userProfile?.semester]);

  // --- Plan Identification ---
  const activePlan = useMemo(() => {
    if (!plans || !activeModule) return null;
    return plans.find((p: any) => String(p.moduleId) === String(activeModule.id)) || plans[0];
  }, [plans, activeModule]);

  const activeSchedule = useMemo(() => schedules.find(s => s.semesterPlanId === activePlan?.id || s.planId === activePlan?.id), [schedules, activePlan]);

  const currentWeekNumber = useMemo(() => {
    const d = new Date();
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }, []);

  const upcomingEvents = useMemo(() => {
    if (!activePlan) return [];
    const now = new Date();
    const flat: any[] = [];
    activePlan.weeklyBreakdown?.forEach((w: any) => 
      w.events?.forEach((e: any) => flat.push({ ...e, weekNumber: w.weekNumber }))
    );
    return flat
      .filter(e => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 3);
  }, [activePlan]);

  const progressPercentage = useMemo(() => {
    if (!activePlan?.weeklyBreakdown?.length) return 0;
    const weeks = activePlan.weeklyBreakdown;
    const startWeek = weeks[0].weekNumber;
    const endWeek = weeks[weeks.length - 1].weekNumber;
    if (currentWeekNumber < startWeek) return 0;
    if (currentWeekNumber > endWeek) return 100;
    return Math.round(((currentWeekNumber - startWeek) / (endWeek - startWeek)) * 100);
  }, [activePlan, currentWeekNumber]);


  useEffect(() => {
    if (!user || !firestore) return;

    // Fetch Semester Plans
    const qPlans = query(collection(firestore, 'users', user.uid, 'semesterPlans'), orderBy('createdAt', 'desc'), limit(1));
    const unsubPlans = onSnapshot(qPlans, (snap) => {
      setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsDataLoading(false);
    });

    // Fetch Study Schedules
    const qSchedules = query(collection(firestore, 'users', user.uid, 'studySchedules'), limit(5));
    const unsubSchedules = onSnapshot(qSchedules, (snap) => {
      setSchedules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch News
    async function getNews() {
      const [pNews, mNews] = await Promise.all([fetchPoliticalNews(), fetchSocialMinistryNews()]);
      setNews([...(pNews || []), ...(mNews || [])].slice(0, 3));
      setNewsLoading(false);
    }
    getNews();

    return () => { unsubPlans(); unsubSchedules(); };
  }, [user, firestore]);

  // Auto-scroll to active module in timeline
  useEffect(() => {
    if (activeModule?.id) {
      setTimeout(() => {
        const el = document.getElementById(`module-${activeModule.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 500);
    }
  }, [activeModule?.id]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore) return;

    if (file.type !== 'application/pdf') {
        setUploadError('Vælg venligst en PDF-fil.');
        return;
    }

    setIsProcessingPdf(true);
    setUploadError(null);

    try {
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            
            const result = await processStudyRegulationAction({
                pdfBase64: base64,
                institution: userProfile?.institution,
                profession: userProfile?.profession
            });

            if (result.success && result.data) {
                await updateDoc(doc(firestore, 'users', user.uid), {
                    customCurriculum: result.data,
                    updatedAt: serverTimestamp()
                });
                toast({
                    title: "Studieordning opdateret",
                    description: "Vi har nu analyseret din studieordning og tilpasset din portal.",
                });
            } else {
                setUploadError(result.message || "Kunne ikke analysere studieordningen.");
            }
            setIsProcessingPdf(false);
        };
        reader.readAsDataURL(file);
    } catch (err: any) {
        console.error("Error processing custom curriculum:", err);
        setUploadError("Der skete en fejl under analysen af din studieordning. Prøv igen.");
        setIsProcessingPdf(false);
    }
  };

  const handleRemoveCustomCurriculum = async () => {
    if (!user || !firestore) return;
    if (window.confirm("Er du sikker på, at du vil fjerne din egen studieordning og gå tilbage til den officielle?")) {
        await updateDoc(doc(firestore, 'users', user.uid), {
            customCurriculum: deleteField(),
            updatedAt: serverTimestamp()
        });
    }
  };

  const handleSearch = (termOverride?: string) => {
    const term = termOverride || searchQuery.trim();
    if (!term) return;

    const questionWords = ['hvad', 'hvordan', 'hvilke', 'hvilken', 'hvem', 'hvor', 'hvorfor', 'er', 'kan', 'skal', 'bør', 'må'];
    const isQuestion = term.endsWith('?') || 
                      questionWords.some(word => term.toLowerCase().startsWith(word + ' ')) ||
                      term.split(' ').length > 6;

    if (isQuestion || term.includes('§') || term.toLowerCase().includes('lov')) {
      handleSSORedirect(`https://law.cohero.dk/?search=${encodeURIComponent(term)}`);
    } else {
      router.push(`/concept-explainer?term=${encodeURIComponent(term)}`);
    }
  };

  if (isUserLoading || !user || !userProfile) return <AuthLoadingScreen />;

  const hour = new Date().getHours();
  const greeting = hour < 10 ? 'Godmorgen' : hour < 18 ? 'Goddag' : 'Godaften';

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100 pb-20">
      


      <main className="max-w-[1400px] mx-auto px-6 py-8">
        

        


        {/* --- DASHBOARD GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Academic/Professional Focus */}
          <div className="lg:col-span-8 space-y-8">
            


            {/* GRADUATED / PROFESSIONAL HEADER */}
            {userProfile?.isQualified && (
               <div className="relative bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-white shadow-2xl overflow-hidden group">
                  {/* Filmic Ambient Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,#312e81_0%,transparent_50%)] opacity-40" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,#1e1b4b_0%,transparent_50%)] opacity-40" />
                  <div className="absolute top-0 right-0 p-6 sm:p-12 opacity-[0.05] group-hover:scale-110 transition-transform duration-[2000ms]">
                    <Building className="w-32 h-32 sm:w-64 sm:h-64" />
                  </div>

                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
                        <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-3 py-1 bg-amber-400/20 text-amber-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-400/20">Professionel Profil</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 sm:gap-4">
                          <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight serif">{greeting}, {userProfile.username || 'Kollega'}</h2>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 pt-4">
                      {[
                        { label: 'Profession', value: userProfile.profession || 'Socialrådgiver', icon: Briefcase },
                        { label: 'Status', value: 'Færdiguddannet', icon: CheckCircle2 },
                        { label: 'Erfaring', value: 'Autoriseret Praktiker', icon: Star },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                          <div className="flex items-center gap-3 text-white/40 mb-2">
                            <stat.icon className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                          </div>
                          <p className="text-sm font-bold text-white">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            )}
            {/* EDUCATION OVERVIEW & TIMELINE (Students Only) */}
            {curriculum && !userProfile?.isQualified && (
              <div className="space-y-8 mb-4">
                <div className="px-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Library className="w-4 h-4 text-indigo-500" />
                    {curriculum.institution} · {curriculum.profession}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-2">{curriculum.title}</p>
                </div>

                <div className="relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                  <div className="flex items-center gap-6 overflow-x-auto pb-6 pt-2 px-2 no-scrollbar relative z-10">
                    {curriculum.modules.map((m: any, i: number) => {
                      const isCurrent = String(m.id) === String(activeModule?.id);
                      const isPast = !isCurrent && curriculum.modules.indexOf(m) < curriculum.modules.indexOf(activeModule as any);
                      
                      return (
                        <div key={i} id={`module-${m.id}`} className="flex-shrink-0 w-48 group">
                          <div className="relative flex flex-col items-center text-center gap-4">
                            <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center font-black text-[10px] transition-all duration-500 ${
                              isCurrent ? 'bg-indigo-600 border-indigo-100 text-white scale-110 shadow-lg shadow-indigo-200' : 
                              isPast ? 'bg-emerald-500 border-emerald-50 text-white' : 
                              'bg-white border-slate-100 text-slate-300 group-hover:border-indigo-200 group-hover:text-indigo-400'
                            }`}>
                              {i + 1}
                            </div>
                            <div className="space-y-1">
                              <p className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {m.semester ? `${m.semester}. Semester` : `Modul ${i + 1}`}
                              </p>
                              <p className={`text-[10px] font-bold leading-tight line-clamp-2 px-2 transition-colors ${isCurrent ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                {m.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}



            {/* SEMESTER HUB HERO (Students Only) */}
            {!userProfile?.isQualified && (
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <GraduationCap className="w-64 h-64" />
              </div>
              
              <div className="relative z-10 space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Uge {currentWeekNumber}</span>
                  </div>
                  {activeModule?.ects && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{activeModule.ects} ECTS</span>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-950 leading-tight tracking-tighter serif">
                      {activeModule?.name || activePlan?.title || 'Mit Semester'}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full">
                        {userProfile?.semester || '1. Semester'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-4">
                      {activeModule?.about && activeModule.about !== 'Ukendt semester' 
                        ? activeModule.about 
                        : activePlan?.semesterInfo && activePlan.semesterInfo !== 'Ukendt semester'
                        ? activePlan.semesterInfo
                        : 'Her får du det fulde overblik over dit aktuelle modul og dine akademiske mål.'}
                    </p>
                  </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <Link href="/mine-semesterplaner">
                        <Button className="rounded-2xl bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] px-8 h-12 hover:bg-indigo-600 transition-all shadow-xl">
                          Se studieplan
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <div className="flex items-center gap-3">
                        {curriculum?.pdfUrl && (
                          <a href={curriculum.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] px-8 h-12 hover:bg-slate-50 transition-all">
                              <BookOpen className="w-4 h-4 mr-2" />
                              Se original kilde
                            </Button>
                          </a>
                        )}

                        {/* Custom Curriculum Upload / Remove */}
                        <div className="relative">
                            <input 
                                type="file" 
                                id="custom-curriculum-upload" 
                                className="hidden" 
                                accept=".pdf"
                                onChange={handlePdfUpload}
                                disabled={isProcessingPdf}
                            />
                            {userProfile?.customCurriculum ? (
                                <Button 
                                    variant="outline" 
                                    onClick={handleRemoveCustomCurriculum}
                                    className="rounded-2xl border-rose-100 text-rose-500 font-black uppercase tracking-widest text-[10px] px-8 h-12 hover:bg-rose-50 transition-all"
                                >
                                    Fjern egen ordning
                                </Button>
                            ) : (
                                <label 
                                    htmlFor="custom-curriculum-upload"
                                    className={`flex items-center gap-2 px-8 h-12 rounded-2xl border border-dashed border-amber-200 bg-amber-50/30 text-amber-700 font-black uppercase tracking-widest text-[10px] hover:bg-amber-50 transition-all cursor-pointer ${isProcessingPdf ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {isProcessingPdf ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Analyserer...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload egen ordning
                                        </>
                                    )}
                                </label>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {uploadError && (
                      <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          {uploadError}
                      </div>
                  )}



                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dagens Program</p>
                    {upcomingEvents.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingEvents.map((e, i) => (
                          <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">
                              {new Date(e.startDate).getDate()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 truncate">{e.summary}</p>
                              <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">{e.startTime || 'Heldags'} · Uge {e.weekNumber}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center italic text-slate-300 text-xs font-medium">
                        Ingen planlagte timer i dag
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* PROFESSIONAL TOOLS / GUIDELINES for Graduated users */}
            {userProfile?.isQualified && (
               <div className="space-y-8">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-500" />
                      Professionelle Værktøjer
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">


                    <Link href="/case-analyser" className="group relative bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Brain className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 mb-2">Sagsanalyse</h4>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">Faglig og juridisk vurdering.</p>
                    </Link>

                    <Link href="/concept-explainer" className="group relative bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Library className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-sky-500 transition-colors" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 mb-2">Opslagsværk</h4>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">Definitioner og fagudtryk.</p>
                    </Link>

                    <Link href="/second-opinion" className="group relative bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Scale className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-rose-500 transition-colors" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 mb-2">Second Opinion</h4>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">Uvildig AI-karakteranalyse.</p>
                    </Link>
                  </div>
               </div>
            )}

            {/* 4 KERNESØJLER HUB (Students Only) */}
            {!userProfile?.isQualified && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Faglige Kerneværktøjer
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Strukturér, planlæg, organisér og søg viden til dit semester</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Søjle 1: Strukturering */}
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">1. Strukturering</div>
                      <h4 className="text-base font-black text-slate-900 mb-2">Juridisk Sagsanalyse</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Metodisk 4-trins sagsanalyse, faktumkortlægning og subsumption.
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <Link href="/case-analyser" className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center justify-between">
                        <span>Gå til Sagsanalyse</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link href="/concept-explainer" className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center justify-between">
                        <span>Begrebsguide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Søjle 2: Planlægning */}
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">2. Planlægning</div>
                      <h4 className="text-base font-black text-slate-900 mb-2">Studie- & Læseplan</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Ugeplaner, tidsestimater, eksamensdeadlines og studieoplæg.
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <Link href="/semester-planlaegger" className="text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center justify-between">
                        <span>Semesterplanlægger</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link href="/studieplanlaegger" className="text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center justify-between">
                        <span>Læseplanlægger</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Søjle 3: Organisering */}
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileBox className="w-6 h-6" />
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">3. Organisering</div>
                      <h4 className="text-base font-black text-slate-900 mb-2">Mit Pensum & Noter</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Materialearkiv, egne kompendier, opgavedispositioner og bogmærker.
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <Link href="/mine-materialer" className="text-xs font-bold text-slate-700 hover:text-amber-600 flex items-center justify-between">
                        <span>Mit Pensum & Materialer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link href="/mine-semesterplaner" className="text-xs font-bold text-slate-700 hover:text-amber-600 flex items-center justify-between">
                        <span>Mine Semesterplaner</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Søjle 4: Videnssøgning */}
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1">4. Videnssøgning</div>
                      <h4 className="text-base font-black text-slate-900 mb-2">Pensumsøgning & Jura</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Semantisk søgning i litteratur med APA-referencer og Second Opinion.
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <Link href="/pensum-search" className="text-xs font-bold text-slate-700 hover:text-purple-600 flex items-center justify-between">
                        <span>Pensumsøgning</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link href="/concept-explainer" className="text-xs font-bold text-slate-700 hover:text-purple-600 flex items-center justify-between">
                        <span>Begrebsguide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LEARNING GOALS - (Only for students) */}
            {!userProfile?.isQualified && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-500" />
                    Centrale Læringsmål
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                    {activeModule?.learningGoals?.length || 0} mål fundet
                  </span>
                </div>

                {/* Banner when module refers to external local semester document / URL */}
                {activeModule?.learningGoals?.some((g: string) => g.includes('http') || g.includes('beskrevet i') || g.includes('separat modul')) && (
                  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-[2.5rem] space-y-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900">Uddannelsens specifikke modulbeskrivelse</h4>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                          For dette modul henviser den overordnede studieordning til dit lokale semester- eller modulbeskrivelsesdokument. Klik på linket i målet nedenfor for at hente det, eller upload din modul-PDF her under <strong>Upload egen ordning</strong>, så udtrækker Cohéro AI dine specifikke læringsmål automatisk!
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <label 
                        htmlFor="custom-curriculum-upload"
                        className="px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-slate-950/10 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4 text-amber-400" />
                        Upload din modulbeskrivelse (PDF)
                      </label>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {(activeModule?.learningGoals || ['Find dine læringsmål ved at vælge din uddannelse i indstillinger.']).map((goal: string, i: number) => {
                    const isExpanded = expandedGoalIndex === i;
                    const toggleExpand = () => {
                      if (isExpanded) {
                        setExpandedGoalIndex(null);
                      } else {
                        setExpandedGoalIndex(i);
                        fetchLiteratureForGoal(goal);
                      }
                    };

                    const renderTextWithLinks = (text: string) => {
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const parts = text.split(urlRegex);
                      return parts.map((part, idx) => {
                        if (part.match(urlRegex)) {
                          return (
                            <a
                              key={idx}
                              href={part}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-600 font-bold underline hover:text-indigo-800 transition-colors inline-flex items-center gap-1 mx-1"
                            >
                              {part}
                              <ArrowRight className="w-3 h-3 inline" />
                            </a>
                          );
                        }
                        return part;
                      });
                    };

                    return (
                      <div 
                        key={i} 
                        onClick={toggleExpand}
                        className="flex flex-col items-start p-6 bg-white rounded-[2rem] border border-slate-100 group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 cursor-pointer"
                      >
                        <div className="flex items-start gap-4 w-full">
                          <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {i + 1}
                          </div>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed pt-1.5 flex-grow">{renderTextWithLinks(goal)}</p>
                          <div className="shrink-0 pt-1 text-slate-300 group-hover:text-indigo-500 transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Expandable Section */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden w-full"
                            >
                              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 w-full">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <Library className="w-3.5 h-3.5" />
                                    Foreslået Litteratur
                                  </h4>
                                  <Link 
                                    href={`/pensum-search?q=${encodeURIComponent(goal)}`} 
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                  >
                                    Søg mere <ArrowRight className="w-2.5 h-2.5" />
                                  </Link>
                                </div>

                                {/* Loader */}
                                {goalLiterature[goal]?.loading && (
                                  <div className="py-6 flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Søger i bogbasen...</span>
                                  </div>
                                )}

                                {/* Error */}
                                {goalLiterature[goal]?.error && (
                                  <p className="text-xs text-rose-500 font-bold">{goalLiterature[goal].error}</p>
                                )}

                                {/* Results */}
                                {!goalLiterature[goal]?.loading && !goalLiterature[goal]?.error && (
                                  <div className="space-y-3">
                                    {(!goalLiterature[goal]?.results || goalLiterature[goal].results.length === 0) ? (
                                      <p className="text-xs text-slate-400 italic">Ingen kilder fundet i pensum-databasen for dette mål.</p>
                                    ) : (
                                      goalLiterature[goal].results.map((book: any, bIdx: number) => (
                                        <div key={bIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3" onClick={(e) => e.stopPropagation()}>
                                          <div className="flex gap-3">
                                            {/* Miniature Spine Cover */}
                                            <div className={`w-8 h-12 bg-gradient-to-br ${getGradient(book.bookTitle)} rounded-md shadow-sm shrink-0 flex items-end p-1`}>
                                              <BookOpen className="w-2.5 h-2.5 text-white/50" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-black text-slate-900 leading-snug truncate" title={book.bookTitle}>
                                                {book.bookTitle}
                                              </p>
                                              <p className="text-[10px] text-slate-400 font-bold truncate">
                                                {book.bookAuthor} {book.bookYear ? `(${book.bookYear})` : ''}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Matching Chapters */}
                                          {book.matchingChapters && book.matchingChapters.length > 0 && (
                                            <div className="pl-11 space-y-1">
                                              {book.matchingChapters.map((chap: any, cIdx: number) => (
                                                <div key={cIdx} className="flex justify-between text-[10px] text-slate-500 font-bold">
                                                  <span className="truncate pr-2">· {chap.title}</span>
                                                  {chap.pageNumber && <span className="shrink-0 text-slate-400">Side {chap.pageNumber}</span>}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Copy Reference */}
                                          {book.apaCitation && (
                                            <div className="pl-11 flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
                                              <span className="text-[9px] text-slate-400 font-medium italic truncate max-w-[150px] md:max-w-[200px]" title={book.apaCitation}>
                                                {book.apaCitation}
                                              </span>
                                              <button
                                                onClick={(e) => handleCopyCitation(book.apaCitation, e)}
                                                className="p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm shrink-0 flex items-center justify-center"
                                                title="Kopier reference"
                                              >
                                                {copiedCitation === book.apaCitation ? (
                                                  <Check className="w-3 h-3 text-emerald-600" />
                                                ) : (
                                                  <Copy className="w-3 h-3" />
                                                )}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DEADLINE CLUSTERS & CRITICAL PERIODS */}
            {activePlan?.deadlineClusters && activePlan.deadlineClusters.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2 px-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Kritiske Perioder
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activePlan.deadlineClusters.map((cluster: any, i: number) => (
                    <div key={i} className="bg-rose-50/50 border border-rose-100 rounded-[2rem] p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-rose-500 text-white text-[9px] font-black rounded-full uppercase">
                          Uge {Array.isArray(cluster.weeks) ? cluster.weeks.join(' - ') : cluster.weeks}
                        </span>
                        <Flag className="w-4 h-4 text-rose-300" />
                      </div>
                      <h4 className="text-xs font-black text-rose-900">{cluster.title}</h4>
                      <p className="text-[11px] text-rose-800/60 font-medium leading-relaxed">{cluster.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}



          </div>

          {/* RIGHT COLUMN: Tools & News */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* HURTIG PENSUMSØGNING */}
            {!hasProAccess ? (
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm text-center relative overflow-hidden flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">Pensumsøgning med sidetal & APA 7th</h4>
                <p className="text-[11px] text-slate-400 mb-4 max-w-xs leading-relaxed">Få fuld adgang til semantisk søgning i al pensumlitteratur med Cohéro Student.</p>
                <Link href="/upgrade" className="w-full">
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[9px] h-10 shadow-sm active:scale-95 transition-all">
                    Opgrader til Cohéro Student
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Hurtig Pensumsøgning</h3>
                    <p className="text-[10px] text-slate-400 leading-none">Find relevante kilder i pensum-databasen</p>
                  </div>
                </div>
                <form 
                  onSubmit={(e) => { e.preventDefault(); handlePortalSearch(portalSearchQuery); }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={portalSearchQuery}
                      onChange={(e) => setPortalSearchQuery(e.target.value)}
                      placeholder="Søg i dit pensum..."
                      className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                    />
                    {portalSearchQuery && (
                      <button
                        type="button"
                        onClick={clearPortalSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Button 
                    type="submit"
                    disabled={isPortalSearchLoading || !portalSearchQuery.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[9px] h-10 shadow-sm active:scale-95 transition-all"
                  >
                    Søg
                  </Button>
                </form>
                
                {/* Popular Topics */}
                {!portalSearchResults && !isPortalSearchLoading && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Magtrelationer", "Forvaltningsloven", "Børnekonventionen"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => { setPortalSearchQuery(tag); handlePortalSearch(tag); }}
                        className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 text-[9px] text-slate-500 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Loading state */}
                {isPortalSearchLoading && (
                  <div className="py-6 text-center space-y-2 border-t border-slate-100 pt-4">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Søger i bogbasen...</p>
                  </div>
                )}

                {/* Error state */}
                {portalSearchError && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-xl border border-rose-100">
                    {portalSearchError}
                  </div>
                )}

                {/* Search Results */}
                {portalSearchResults && !isPortalSearchLoading && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                        <Library className="w-3.5 h-3.5" />
                        Resultater ({portalSearchResults.length})
                      </h4>
                      <button
                        type="button"
                        onClick={clearPortalSearch}
                        className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                      >
                        Ryd
                      </button>
                    </div>

                    {portalSearchResults.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">Ingen matchende litteratur fundet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {portalSearchResults.map((book: any, bIdx: number) => (
                          <div 
                            key={bIdx} 
                            className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2 hover:bg-white transition-all duration-300"
                          >
                            <div className="flex gap-2.5 items-start">
                              <div className={`w-8 h-11 bg-gradient-to-br ${getGradient(book.bookTitle)} rounded shadow-sm shrink-0 flex items-end p-1`}>
                                <BookOpen className="w-2.5 h-2.5 text-white/50" />
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <h5 className="text-[10px] font-black text-slate-900 leading-snug line-clamp-2" title={book.bookTitle}>
                                  {book.bookTitle}
                                </h5>
                                <p className="text-[9px] text-slate-400 font-bold truncate">
                                  {book.bookAuthor} {book.bookYear ? `(${book.bookYear})` : ''}
                                </p>
                              </div>
                            </div>
                            
                            {book.matchingChapters && book.matchingChapters.length > 0 && (
                              <div className="pl-10 space-y-1">
                                {book.matchingChapters.map((chap: any, cIdx: number) => (
                                  <div key={cIdx} className="flex justify-between text-[9px] text-slate-500 font-bold leading-normal">
                                    <span className="truncate pr-2">· {chap.title}</span>
                                    {chap.pageNumber && <span className="shrink-0 text-slate-400">s. {chap.pageNumber}</span>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {book.apaCitation && (
                              <div className="pl-10 flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/50">
                                <span className="text-[8px] text-slate-400 font-medium italic truncate max-w-[120px]" title={book.apaCitation}>
                                  {book.apaCitation}
                                </span>
                                <button
                                  onClick={(e) => handleCopyCitation(book.apaCitation, e)}
                                  className="p-1 rounded bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm shrink-0 flex items-center justify-center"
                                >
                                  {copiedCitation === book.apaCitation ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}



            {/* EXAM INFO CARD */}
            {activeModule?.examForm && (
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                      <GraduationCap className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Eksamen</p>
                      <h3 className="text-sm font-black serif">Prøveform</h3>
                    </div>
                  </div>

                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-xs font-bold text-slate-300 leading-snug">{activeModule.examForm}</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Gode råd</p>
                    <ul className="space-y-3">
                      {[
                        "Læs studieordningens kriterier grundigt.",
                        "Inddrag praksis-cases i din besvarelse.",
                        "Fokusér på den røde tråd i din argumentation."
                      ].map((tip, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <div className="w-4 h-4 rounded bg-indigo-600/30 flex items-center justify-center shrink-0 mt-0.5">
                            <ArrowRight className="w-2.5 h-2.5 text-indigo-400" />
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* NEWS FEED */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 pl-2">Seneste Nyt</h3>
              <div className="space-y-4 divide-y divide-slate-50">
                {newsLoading ? (
                  <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-200" /></div>
                ) : (
                  news.map((item, i) => (
                    <a key={i} href={item.link} target="_blank" className="block pt-4 first:pt-0 hover:opacity-60 transition-opacity">
                      <p className="text-[12px] font-bold text-slate-700 leading-relaxed line-clamp-2">{item.title}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase mt-2">{new Date(item.pubDate).toLocaleDateString('da-DK')}</p>
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* SUPPORT BUTTON */}
            <a href="/raadgivning" className="block bg-amber-50 border border-amber-100 rounded-3xl p-6 hover:bg-amber-100 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm group-hover:rotate-6 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-widest">Få Hjælp</h4>
                  <p className="text-[10px] font-bold text-amber-600 mt-0.5">Skriv til os direkte</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-amber-400" />
              </div>
            </a>

          </div>

        </div>
      </main>

      {/* --- UPGRADE FLOATER --- */}
      {!hasProAccess && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-8 inset-x-0 flex justify-center z-50 px-6 pointer-events-none"
        >
          <Link href="/upgrade" className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full flex items-center gap-3 sm:gap-4 shadow-2xl hover:scale-105 transition-all border border-indigo-500/30 group pointer-events-auto cursor-pointer">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">
              Opgrader til Semesterpakken <span className="text-emerald-400 ml-1 font-extrabold">(Spar 33%)</span>
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-amber-400 group-hover:text-amber-950 transition-colors">
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </Link>
        </motion.div>
      )}
    </div>
  );
};

const PortalPage: React.FC = () => {
  const { user, isUserLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/');
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) return <AuthLoadingScreen />;

  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <PortalPageContent />
    </Suspense>
  );
};

export default PortalPage;
