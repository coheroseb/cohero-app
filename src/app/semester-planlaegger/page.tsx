'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  ArrowLeft, 
  Link as LinkIcon, 
  Zap, 
  Sparkles, 
  Loader2,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Flag,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Activity,
  Download,
  BookOpen,
  ArrowRight,
  Terminal,
  Save,
  Trash2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, setDoc, doc, writeBatch, increment, onSnapshot, query, orderBy, getDocs, limit, where, deleteDoc } from 'firebase/firestore';
import { generateSemesterPlanAction, sendInAppNotificationAction } from '@/app/actions';
import type { SemesterPlan } from '@/ai/flows/types';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// --- COMPONENTS ---

const IntensityHeatmap = ({ weeklyBreakdown }: { weeklyBreakdown: SemesterPlan['weeklyBreakdown'] }) => {
  return (
    <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-indigo-100/50 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <Activity className="w-4 h-4 text-indigo-500" />
           <span className="text-sm font-bold text-slate-900">Arbejdspres Overblik</span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Intensitet</span>
      </div>
      <div className="flex gap-1.5 h-16 items-end">
        {weeklyBreakdown.map((week, idx) => {
          const intensity = week.intensity || 0;
          const height = Math.max(15, (intensity / 10) * 100);
          return (
            <motion.div 
              key={idx}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              className={`flex-1 rounded-t-md relative group cursor-pointer transition-all hover:ring-2 hover:ring-indigo-100 ${
                intensity > 8 ? 'bg-indigo-600' : 
                intensity > 5 ? 'bg-indigo-400' :
                'bg-indigo-200'
              }`}
            >
              <div className="absolute opacity-0 group-hover:opacity-100 -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-50 transition-opacity">
                Uge {week.weekNumber}: {intensity}/10
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[9px] font-black text-slate-300 uppercase tracking-tighter">
        <span>Uge {weeklyBreakdown[0]?.weekNumber}</span>
        <span>Semesterets Gangen</span>
        <span>Uge {weeklyBreakdown[weeklyBreakdown.length - 1]?.weekNumber}</span>
      </div>
    </div>
  );
};

const WeekCard = ({ week, isExpanded, onToggle }: { week: any, isExpanded: boolean, onToggle: () => void }) => {
  return (
    <div className={`transition-all duration-300 ${isExpanded ? 'bg-white shadow-xl ring-1 ring-indigo-50 rounded-3xl' : 'bg-white/40 hover:bg-white rounded-2xl'}`}>
      <button 
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
            isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
          }`}>
            {week.weekNumber}
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Uge {week.weekNumber}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {week.events.length} {week.events.length === 1 ? 'Aktivitet' : 'Aktiviteter'}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-400' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              {week.events.map((event: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 group/item hover:bg-slate-50 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 flex-shrink-0 text-center">
                            <p className="text-[9px] font-black text-indigo-600 uppercase">
                                {new Date(event.startDate).toLocaleDateString('da-DK', { weekday: 'short' })}
                            </p>
                            <p className="text-sm font-black text-slate-900">
                                {new Date(event.startDate).getDate()}.
                            </p>
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-bold text-slate-800 leading-snug">{event.summary}</p>
                           <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                    <Clock className="w-3 h-3" />
                                    {event.startTime || 'Heldags'}
                                </span>
                                {event.location && (
                                    <span className="text-[10px] text-slate-400 truncate font-medium">@ {event.location}</span>
                                )}
                           </div>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
              {week.events.length === 0 && (
                <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Calendar className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 italic">Ingen planlagte aktiviteter denne uge.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- MAIN PAGE CONTENT ---

function SemesterPlannerPageContent() {
    const { user, userProfile } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [icalUrl, setIcalUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activePlan, setActivePlan] = useState<SemesterPlan | null>(null);
    const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    const isPremium = useMemo(() => {
        if (!userProfile) return false;
        if (userProfile.isQualified) return true;
        return ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership || '');
    }, [userProfile]);

    const isTrial = useMemo(() => {
        if (!userProfile?.createdAt) return true;
        try {
            const createdAt = userProfile.createdAt.toDate();
            const now = new Date();
            const diffTime = now.getTime() - createdAt.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays <= 7;
        } catch (e) {
            return true;
        }
    }, [userProfile]);

    const hasAccess = isPremium || isTrial;

    // Deep link support
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get('icalUrl');
        if (urlParam) {
            setIcalUrl(urlParam);
            // Optionally auto-trigger? Maybe just pre-fill.
        }
    }, []);

    const handleGeneratePlan = async () => {
        if (!icalUrl || !user || !firestore || !hasAccess) return;
        setIsLoading(true);
        setError(null);
        setActivePlan(null);
        try {
            const response = await generateSemesterPlanAction({ icalUrl });
            setActivePlan(response.data);
            
            // Auto expand the first 3 weeks
            if (response.data.weeklyBreakdown.length > 0) {
                setExpandedWeeks(response.data.weeklyBreakdown.slice(0, 3).map(w => w.weekNumber));
            }

            // Save to Firestore background
            const planRef = doc(collection(firestore, 'users', user.uid, 'semesterPlans'));
            const latestPlanRef = doc(firestore, 'users', user.uid, 'semesterPlans', 'latest');
            const userRef = doc(firestore, 'users', user.uid);
            const batch = writeBatch(firestore);

            const planDataToSave = {
                ...response.data,
                icalUrl: icalUrl,
                createdAt: serverTimestamp(),
            };

            batch.set(planRef, planDataToSave);
            batch.set(latestPlanRef, planDataToSave);

            if (response.usage) {
                const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
                const pointsToAdd = Math.round(totalTokens * 0.05);
                const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
                batch.set(tokenUsageRef, { flowName: 'generateSemesterPlan', ...response.usage, totalTokens, createdAt: serverTimestamp() });
                if (pointsToAdd > 0) {
                    batch.update(userRef, { cohéroPoints: increment(pointsToAdd) });
                }
            }
            await batch.commit();

            await sendInAppNotificationAction({
                uid: user.uid,
                title: "Semesterplan Klar! 🚀",
                body: `Din plan for ${response.data.title} er nu klar til brug. Vi har analyseret dit semesters deadlines og arbejdspres.`,
                type: 'plan',
                link: '/mine-semesterplaner'
            });

            toast({
                title: "Semesterplan Klar!",
                description: "Vi har analyseret din kalender og skabt et overblik.",
            });
        } catch (err: any) {
            console.error("Plan generation error:", err);
            setError(`Kunne ikke generere planen: ${err.message}`);
            toast({
                variant: "destructive",
                title: "Fejl",
                description: "Kunne ikke hente kalenderdata. Tjek linket og prøv igen.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleWeek = (weekNum: number) => {
      setExpandedWeeks(prev => 
        prev.includes(weekNum) ? prev.filter(w => w !== weekNum) : [...prev, weekNum]
      );
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/portal" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Semester-Planlægger</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">AI Kalender Analyse</p>
                    </div>
                </div>
                {activePlan && (
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/mine-semesterplaner">
                            <Button variant="ghost" className="rounded-2xl text-slate-500 font-bold text-xs uppercase tracking-widest">
                                Mine Planer
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>

        <main className="flex-grow py-12 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[400px,1fr] gap-8">
            
            {/* LEFT COLUMN: Input & Info */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                {!hasAccess && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-amber-500/10 active:scale-95 transition-all">
                            <Zap className="w-8 h-8 fill-current" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Kollega+ Påkrævet</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                            Import af semesterkalender er en premium funktion. <br />
                            Prøv Kollega+ gratis i 7 dage.
                        </p>
                        <Link href="/upgrade" className="w-full">
                            <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-xl">
                                Opgradér nu
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                )}
                
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <CalendarDays className="w-24 h-24 text-indigo-600" />
                </div>
                
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                        <LinkIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Importér Semester</h2>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                        Indsæt dit iCal-link fra TimeEdit eller dit uddannelsessted for at starte analysen.
                    </p>

                    <div className="space-y-4">
                        <div className="relative group">
                            <Input
                                type="url"
                                value={icalUrl}
                                onChange={(e) => setIcalUrl(e.target.value)}
                                placeholder="https://timeedit.net/..."
                                className="w-full h-14 pl-6 pr-6 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-slate-700 placeholder:text-slate-300"
                            />
                        </div>
                        <Button 
                            onClick={handleGeneratePlan} 
                            disabled={isLoading || !icalUrl}
                            className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98] ${
                                isLoading ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyserer...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Opret Semesterplan
                                </>
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                        </div>
                    )}
                </div>
              </div>

              {/* Instructions Card */}
              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                   <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700"></div>
                   <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-indigo-300" />
                        Guide
                   </h3>
                   <ul className="space-y-4">
                        <li className="flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                            <p className="text-xs text-indigo-100 font-medium leading-relaxed">Gå til din skoles skemasystem (f.eks. TimeEdit).</p>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                            <p className="text-xs text-indigo-100 font-medium leading-relaxed">Find "Abonner" eller "iCal" knappen og kopier URL'en.</p>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                            <p className="text-xs text-indigo-100 font-medium leading-relaxed">Sæt linket ind herover og lad Arkitekten analysere dit semester.</p>
                        </li>
                   </ul>
              </div>
            </div>

            {/* RIGHT COLUMN: Results / Empty State */}
            <div className="space-y-8">
              <AnimatePresence mode="wait">
                {!activePlan && !isLoading ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full flex flex-col items-center justify-center text-center p-12 bg-white border border-dashed border-slate-200 rounded-[3rem] min-h-[500px]"
                  >
                    <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center mb-8">
                        <LayoutDashboard className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-300">Intet indlæst endnu</h3>
                    <p className="text-slate-400 mt-2 max-w-sm font-medium">Importer din kalender for at se din personlige semesteranalyse og ugeplan.</p>
                  </motion.div>
                ) : isLoading ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center text-center p-12 bg-indigo-50/30 border border-indigo-100 rounded-[3rem] min-h-[500px]"
                    >
                        <div className="relative">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-8">
                                <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                            </div>
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-indigo-400 rounded-full -z-10 blur-xl"
                            />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Analyserer dit semester...</h3>
                        <p className="text-slate-400 mt-2 max-w-sm font-medium">Vi kategoriserer aktiviteter, finder deadlines og beregner arbejdspres.</p>
                        
                        <div className="mt-12 flex gap-3">
                            {[0,1,2].map(i => (
                                <motion.div 
                                    key={i}
                                    animate={{ height: [20, 40, 20] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                    className="w-2 bg-indigo-200 rounded-full"
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : activePlan ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* PLAN HEADER */}
                    <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <Sparkles className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {activePlan?.semesterInfo}
                                </div>
                                {activePlan?.deadlineClusters && activePlan.deadlineClusters.length > 0 && (
                                    <div className="px-3 py-1 bg-amber-400/30 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-amber-200 border border-amber-400/20">
                                        Intensivt Semester
                                    </div>
                                )}
                            </div>
                            <h2 className="text-4xl font-black mb-4 tracking-tight">{activePlan?.title}</h2>
                            <p className="text-indigo-100 text-sm font-medium max-w-2xl leading-relaxed">
                                {activePlan?.studyTips}
                            </p>
                        </div>
                    </div>

                    {/* DASHBOARD GRID */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Main Subjects Card */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Kernekurser</span>
                            </div>
                            <div className="flex flex-wrap gap-2 flex-grow">
                                {activePlan?.mainSubjects.map((s, i) => (
                                    <span key={i} className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-blue-100">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Deadlines Summary */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                             <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                    <Flag className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Deadlines</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600">Eksaminer</span>
                                    <span className="text-sm font-black text-slate-900">{activePlan?.keyDates.examPeriods.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600">Afleveringer</span>
                                    <span className="text-sm font-black text-slate-900">{activePlan?.keyDates.projectDeadlines.length}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-50 rounded-full mt-2 overflow-hidden">
                                     <div className="h-full bg-amber-400 rounded-full" style={{ width: '40%' }} />
                                </div>
                            </div>
                        </div>

                        {/* Intensity Chart */}
                        <IntensityHeatmap weeklyBreakdown={activePlan.weeklyBreakdown} />
                    </div>

                    {/* DEADLINE CLUSTERS (New Feature Visualized) */}
                    <AnimatePresence>
                        {activePlan.deadlineClusters && activePlan.deadlineClusters.length > 0 && (
                            <div className="grid md:grid-cols-2 gap-6">
                                {activePlan.deadlineClusters.map((cluster, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-amber-50/50 border border-amber-100 p-8 rounded-[2.5rem] flex items-start gap-6 group hover:bg-amber-50 transition-all duration-300"
                                    >
                                        <div className="w-12 h-12 bg-white text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-black text-amber-950 uppercase text-xs tracking-widest leading-none">{cluster.title}</h4>
                                                <span className="text-[10px] font-black text-amber-500 bg-white px-2 py-0.5 rounded-full border border-amber-100">
                                                    Uge {cluster.weeks.join(' + ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-amber-900/60 font-medium leading-relaxed">
                                                {cluster.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>

                    {/* WEEKLY BREAKDOWN - THE CORE */}
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Studieuge-program</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gennemgang uge for uge</p>
                            </div>
                            <Button variant="ghost" className="hidden sm:flex rounded-2xl text-slate-400 font-bold text-[10px] uppercase tracking-widest" onClick={() => activePlan && setExpandedWeeks(activePlan.weeklyBreakdown.map(w => w.weekNumber))}>
                                Fold alle ud
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {activePlan?.weeklyBreakdown.map((week) => (
                                <WeekCard 
                                    key={week.weekNumber} 
                                    week={week} 
                                    isExpanded={expandedWeeks.includes(week.weekNumber)}
                                    onToggle={() => toggleWeek(week.weekNumber)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* FINAL ACTION CTA */}
                    <div className="bg-slate-900 p-12 rounded-[3rem] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,1),transparent_70%)]"></div>
                        <h3 className="text-2xl font-black text-white mb-4">Gør planen endnu skarpere</h3>
                        <p className="text-slate-400 max-w-xl mx-auto mb-8 font-medium">
                            Vi har organiseret dit semester. Nu kan du oprette en personlig studieplan, der præcis fortæller dig, hvornår du skal læse op for at undgå deadline-stress.
                        </p>
                        <Link href="/mine-semesterplaner">
                            <Button size="lg" className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/40">
                                Gå til Mine Semesterplaner
                                <ArrowRight className="w-4 h-4 ml-3" />
                            </Button>
                        </Link>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    );
}

const SemesterPlannerPage = () => {
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

    return <SemesterPlannerPageContent />;
};

export default SemesterPlannerPage;
