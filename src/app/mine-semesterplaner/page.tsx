
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookCopy, 
  ChevronDown, 
  Trash2, 
  Loader2, 
  BookOpen, 
  Lightbulb, 
  Clock, 
  Plus, 
  RotateCcw, 
  BrainCircuit, 
  Save, 
  X, 
  Download, 
  Calendar, 
  Wand2, 
  CheckCircle, 
  ListOrdered, 
  RefreshCw,
  Sparkles,
  FileText,
  Activity,
  AlertTriangle,
  History,
  Navigation,
  ExternalLink,
  Brain,
  MessageSquareQuote as MessageSquareQuoteIcon,
  ArrowRight,
  Layout,
  CalendarDays,
  Coffee,
  BookMarked,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  writeBatch, 
  getDoc, 
  serverTimestamp, 
  setDoc, 
  where, 
  getDocs, 
  increment, 
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { generateSemesterPlanAction, suggestConceptsForEventAction, generateStudyScheduleAction, sendInAppNotificationAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import type { SemesterPlan, StudySchedule } from '@/ai/flows/types';

// --- TYPES ---

interface SavedSemesterPlan extends SemesterPlan {
    id: string;
    createdAt: { toDate: () => Date };
    icalUrl: string;
    semesterInfo: string;
}

interface SavedStudySchedule extends StudySchedule {
    id: string;
    createdAt: { toDate: () => Date };
    semesterPlanId?: string;
    planId?: string;
}

// --- HELPER COMPONENT ---

const IntensityHeatmap = ({ weeklyBreakdown }: { weeklyBreakdown: any[] }) => {
    return (
        <div className="flex items-end gap-[2px] h-8 px-2 bg-slate-50 border border-slate-100 rounded-lg">
            {weeklyBreakdown.map((week, i) => (
                <div 
                    key={i} 
                    className={`w-2 rounded-t-[1px] transition-all duration-500`}
                    style={{ 
                        height: `${(week.intensity || 1) * 10}%`,
                        backgroundColor: week.intensity > 7 ? '#f43f5e' : week.intensity > 4 ? '#6366f1' : '#10b981',
                        opacity: 0.2 + ((week.intensity || 1) * 0.08)
                    }}
                    title={`Uge ${week.weekNumber}: Intensitet ${week.intensity || '?'}`}
                />
            ))}
        </div>
    );
};

// --- MAIN DETAIL VIEW ---

const PlanDetailView: React.FC<{ 
  plan: SavedSemesterPlan; 
  user: any; 
  onOpenModal: (plan: SavedSemesterPlan, schedule?: SavedStudySchedule | null) => void;
  savedSchedule?: SavedStudySchedule | null;
}> = ({ plan, user, onOpenModal, savedSchedule }) => {
  const currentWeekNumber = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }, []);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'analysis' | 'studieplan'>('dashboard');
  const [concepts, setConcepts] = useState<string[]>([]);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(false);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [debouncedNotes] = useDebounce(localNotes, 1500);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    const initialNotes: Record<string, string> = {};
    plan.weeklyBreakdown.forEach(week => {
      week.events.forEach((event: any) => {
        if (event.notes) {
          initialNotes[`${event.summary}-${event.startDate}`] = event.notes;
        }
      });
    });
    setLocalNotes(initialNotes);
  }, [plan]);

  useEffect(() => {
    if (Object.keys(debouncedNotes).length === 0) return;
    saveNotes();
  }, [debouncedNotes]);

  const saveNotes = async () => {
    if (!user || !firestore) return;
    setSaveStatus('saving');
    try {
      const updatedBreakdown = plan.weeklyBreakdown.map(week => ({
        ...week,
        events: week.events.map((event: any) => ({
          ...event,
          notes: localNotes[`${event.summary}-${event.startDate}`] || ''
        }))
      }));

      const planRef = doc(firestore, 'users', user.uid, 'semesterPlans', plan.id);
      await updateDoc(planRef, { weeklyBreakdown: updatedBreakdown });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error("Error saving notes:", e);
      setSaveStatus('idle');
    }
  };

  const nextEvent = useMemo(() => {
    const now = new Date();
    let flatEvents: any[] = [];
    plan.weeklyBreakdown.forEach(w => {
      w.events.forEach((e: any) => flatEvents.push(e));
    });
    return flatEvents
      .filter(e => new Date(e.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  }, [plan]);

  const handleNoteChange = (key: string, value: string) => {
    setLocalNotes(prev => ({ ...prev, [key]: value }));
  };

  const currentWeek = useMemo(() => {
    return plan.weeklyBreakdown.find(w => w.weekNumber === currentWeekNumber) || 
           plan.weeklyBreakdown.find(w => {
              if (w.events.length === 0) return false;
              const start = new Date(w.events[0]?.startDate);
              return start > new Date();
           });
  }, [plan, currentWeekNumber]);

  return (
    <div className="flex flex-col min-h-full">
        {/* TOP STATS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Activity className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arbejdspres</p>
                  <p className="text-sm font-black text-slate-800">
                    {currentWeek?.intensity ? `Uge ${currentWeek.weekNumber}: ${currentWeek.intensity}/10` : 'Ingen data'}
                  </p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                  <Calendar className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aktuelle Uge</p>
                  <p className="text-sm font-black text-slate-800">Uge {currentWeekNumber}</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-100">
                  <Clock className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Næste begivenhed</p>
                  <p className="text-sm font-black text-slate-800 truncate max-w-[120px]">
                    {nextEvent?.summary || 'Ingen'}
                  </p>
               </div>
            </div>

            <Button 
                onClick={() => onOpenModal(plan, savedSchedule)}
                className="h-full rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
                <ListOrdered className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{savedSchedule ? 'Min Studieplan' : 'Lav Studieplan'}</span>
            </Button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-2xl w-fit self-center">
            {[
                { id: 'dashboard', label: 'Dashboard', icon: Layout },
                { id: 'calendar', label: 'Kalender', icon: CalendarDays },
                { id: 'analysis', label: 'AI Analyse', icon: BrainCircuit },
                ...(savedSchedule ? [{ id: 'studieplan', label: 'Studieplan', icon: ListOrdered }] : [])
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                        ? 'bg-white text-indigo-600 shadow-sm scale-100' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 scale-95'
                    }`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
            >
                {activeTab === 'dashboard' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900">Overblik</h3>
                                <IntensityHeatmap weeklyBreakdown={plan.weeklyBreakdown} />
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between group cursor-pointer hover:bg-indigo-50 transition-all"
                                     onClick={() => setActiveTab('calendar')}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Navigation className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Gå til aktuel uge</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Uge {currentWeekNumber} ({currentWeek?.events.length || 0} begivenheder)</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                </div>

                                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-all"
                                     onClick={() => setActiveTab('analysis')}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
                                            <Brain className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Se AI-studietips</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Tilpasset dit semesterforløb</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </section>

                        <section className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-10 opacity-10">
                                <Sparkles className="w-32 h-32" />
                             </div>
                             <div className="relative z-10 space-y-6">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Næste skridt</span>
                                    <h3 className="text-2xl font-black mt-2 leading-tight">Gør dette semester til dit bedste endnu.</h3>
                                </div>
                                <p className="text-indigo-100/70 text-sm leading-relaxed">
                                    Brug din semesterplan til at generere en uge-for-uge studieplan. Det hjælper dig med at forberede de rigtige emner på de rigtige tidspunkter.
                                </p>
                                <Button 
                                    onClick={() => onOpenModal(plan, savedSchedule)}
                                    className="w-full h-14 bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl font-black uppercase tracking-widest text-xs"
                                >
                                    {savedSchedule ? 'Se din studieplan' : 'Start din studieplan nu'}
                                </Button>
                             </div>
                        </section>
                    </div>
                )}

                {activeTab === 'calendar' && (
                    <div className="space-y-8">
                         {plan.weeklyBreakdown.map((week) => {
                             const isCurrent = week.weekNumber === currentWeekNumber;
                             return (
                                <div 
                                    id={`week-${week.weekNumber}`}
                                    key={week.weekNumber} 
                                    className={`space-y-4 group/week ${isCurrent ? 'relative' : ''}`}
                                >
                                    {isCurrent && (
                                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] hidden md:block" />
                                    )}
                                    
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 shadow-sm border ${
                                            isCurrent ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-400 border-slate-100'
                                        }`}>
                                            Uge {week.weekNumber} {isCurrent && '(Aktuel)'}
                                        </div>
                                        <div className="h-px w-full bg-slate-100"></div>
                                        {week.intensity && (
                                            <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${
                                                week.intensity > 7 ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm' : 
                                                week.intensity > 4 ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm' : 
                                                'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm'
                                            }`}>
                                                Intensitet: {week.intensity}/10
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {week.events.map((event: any, i: number) => {
                                            const noteKey = `${event.summary}-${event.startDate}`;
                                            return (
                                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all hover:shadow-md group flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex flex-col items-center justify-center border border-slate-100">
                                                                    <span className="text-[8px] font-black uppercase opacity-40">{new Date(event.startDate).toLocaleDateString('da-DK', { weekday: 'short' })}</span>
                                                                    <span className="text-sm font-black leading-none">{new Date(event.startDate).getDate()}.</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                                        {event.startTime || 'Heldags'}
                                                                    </p>
                                                                    <p className="text-xs font-bold text-slate-900 line-clamp-2">{event.summary}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {event.location && (
                                                            <div className="flex items-center gap-2 mb-4 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                                                <Navigation className="w-3 h-3 text-slate-400" />
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase truncate">{event.location}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-slate-50">
                                                        <Textarea 
                                                            placeholder="Egne noter..."
                                                            value={localNotes[noteKey] || ''}
                                                            onChange={(e) => handleNoteChange(noteKey, e.target.value)}
                                                            className="bg-transparent border-none p-0 text-[11px] min-h-[40px] focus-visible:ring-0 placeholder:italic placeholder:text-slate-200 resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                             )
                         })}
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="grid md:grid-cols-3 gap-8">
                        <section className="md:col-span-2 space-y-8">
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <Lightbulb className="w-32 h-32" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100">
                                            <Lightbulb className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">Studietips & Strategi</h3>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider text-left">Personlig AI-Vejleder</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium leading-loose italic bg-amber-50 p-6 rounded-2xl border border-amber-100/50 shadow-inner">
                                        "{plan.studyTips}"
                                    </p>
                                </div>
                            </div>

                            {plan.deadlineClusters && plan.deadlineClusters.length > 0 && (
                                <div className="space-y-4">
                                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-4">Kritiske Perioder</h3>
                                     <div className="grid gap-4">
                                        {plan.deadlineClusters.map((cluster, i) => (
                                            <div key={i} className="bg-rose-50/50 border border-rose-100 p-8 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                                    <AlertTriangle className="w-20 h-20 text-rose-500" />
                                                </div>
                                                <div className="w-14 h-14 bg-white text-rose-500 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100 shadow-sm group-hover:scale-110 transition-transform">
                                                    <AlertTriangle className="w-6 h-6" />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="text-sm font-black text-rose-950 uppercase tracking-tight">{cluster.title}</p>
                                                        <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg border border-rose-400">PÅKRÆVER FOKUS</span>
                                                    </div>
                                                    <p className="text-sm text-rose-900/70 font-medium leading-relaxed max-w-xl">{cluster.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            )}
                        </section>

                        <aside className="space-y-8">
                             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Hovedfag
                                </h3>
                                <div className="grid gap-2">
                                    {plan.mainSubjects.map(subject => (
                                        <div key={subject} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                            {subject}
                                        </div>
                                    ))}
                                </div>
                             </div>

                             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
                                <div className="absolute -bottom-4 -right-4 opacity-5">
                                    <RefreshCw className="w-32 h-32" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Metadata</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                                        <span>Oprettet</span>
                                        <span className="text-slate-900">{(plan.createdAt as any)?.toDate?.().toLocaleDateString('da-DK') || 'Ukendt'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                                        <span>Semester</span>
                                        <span className="text-slate-900">{plan.semesterInfo}</span>
                                    </div>
                                </div>
                             </div>
                        </aside>
                    </div>
                )}
                {activeTab === 'studieplan' && savedSchedule && (
                    <div className="space-y-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Din Personlige Studieplan</h3>
                                <p className="text-xs text-slate-400 font-medium">Udarbejdet af AI-Vejlederen</p>
                            </div>
                            <Button 
                                variant="ghost"
                                onClick={async () => {
                                    if (!window.confirm('Vil du slette din nuværende studieplan og lave en ny?')) return;
                                    const scheduleRef = doc(firestore!, 'users', user.uid, 'studySchedules', savedSchedule.id);
                                    await deleteDoc(scheduleRef);
                                    setActiveTab('dashboard');
                                    toast({ title: "Studieplan slettet" });
                                }}
                                className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Slet & Lav Ny
                            </Button>
                        </div>

                        <div className="grid gap-12">
                            {savedSchedule.schedule.map((week) => (
                                <section key={week.weekNumber} className="space-y-6">
                                    <div className="flex items-center gap-6">
                                        <div className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em]">
                                            Uge {week.weekNumber}
                                        </div>
                                        <div className="h-px flex-grow bg-slate-200" />
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-indigo-500" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{week.selfStudyHours}h Selvstudie</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid lg:grid-cols-4 gap-6">
                                        <div className="lg:col-span-1">
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                                    <Target className="w-3.5 h-3.5 text-indigo-500" /> Ugemål
                                                </h4>
                                                <div className="space-y-2">
                                                    {week.focusAreas.map((focus, idx) => (
                                                        <p key={idx} className="text-[11px] font-bold text-slate-600 leading-relaxed">• {focus}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {week.recommendedBlocks.map((block, i) => (
                                                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                                        <div className={`absolute top-0 right-0 h-full w-1 ${
                                                            block.category === 'preparation' ? 'bg-indigo-500' :
                                                            block.category === 'reading' ? 'bg-emerald-500' :
                                                            block.category === 'assignment' ? 'bg-rose-500' :
                                                            block.category === 'break' ? 'bg-amber-400' :
                                                            'bg-slate-400'
                                                        }`} />
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-slate-50 text-[8px] font-black uppercase tracking-widest rounded border border-slate-100">{block.day}</span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{block.startTime}-{block.endTime}</span>
                                                            </div>
                                                            <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                                {block.category === 'break' ? <Coffee className="w-3 h-3" /> : <BookMarked className="w-3 h-3" />}
                                                            </div>
                                                        </div>
                                                        <h5 className="text-[13px] font-black text-slate-900 mb-1">{block.activity}</h5>
                                                        <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{block.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>

        {/* Global Floating Saving Indicator */}
        <AnimatePresence>
            {saveStatus !== 'idle' && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
                >
                    <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
                        saveStatus === 'saving' ? 'bg-white/90 border-slate-100 text-slate-600' : 'bg-emerald-500/90 border-emerald-400 text-white'
                    }`}>
                        {saveStatus === 'saving' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                <span className="text-xs font-black uppercase tracking-widest">Gemmer dine noter...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest">Alle ændringer er gemt!</span>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

// --- WORKSPACE MODAL ---
// Placeholder for the shared modal since it's used in the code
const WorkspaceModal = ({ isOpen, onClose, plan, user, savedSchedule }: any) => {
    return null; // This should be imported from its own component if possible, or defined here
};

function MineSemesterplanerPage() {
    const { user, userProfile } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [plans, setPlans] = useState<SavedSemesterPlan[]>([]);
    const [schedules, setSchedules] = useState<SavedStudySchedule[]>([]);

    const activePlan = useMemo(() => plans.find(p => p.id === (selectedId || plans[0]?.id)), [plans, selectedId]);

    useEffect(() => {
        if (!user || !firestore) return;
        const q = query(collection(firestore, 'users', user.uid, 'semesterPlans'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedSemesterPlan));
            setPlans(fetchedPlans);
            setIsLoading(false);
            
            if (!selectedId && fetchedPlans.length > 0) {
                setSelectedId(fetchedPlans[0].id);
            }
        }, (err) => {
            console.error('[SemesterPlans] listener error:', err);
            setIsLoading(false);
        });

        const q2 = query(collection(firestore, 'users', user.uid, 'studySchedules'));
        const unsub2 = onSnapshot(q2, (snapshot) => {
            setSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedStudySchedule)));
        }, (err) => {
            console.error('[StudySchedules] listener error:', err);
        });

        return () => { unsub(); unsub2(); };
    }, [user, firestore]);

    const handleDelete = async (id: string) => {
        if (!user || !firestore || !window.confirm('Er du sikker?')) return;
        try {
            const batch = writeBatch(firestore);
            batch.delete(doc(firestore, 'users', user.uid, 'semesterPlans', id));
            await batch.commit();
            toast({ title: "Plan slettet" });
            if (selectedId === id) setSelectedId(plans.find(p => p.id !== id)?.id || null);
        } catch (e) {
            toast({ title: "Fejl", variant: "destructive" });
        }
    };

    const handleRefreshPlan = async (id: string, icalUrl: string) => {
        if (!user || refreshingId) return;
        setRefreshingId(id);
        try {
            const result = await generateSemesterPlanAction({ icalUrl });
            if (!result || !result.data) throw new Error("Ingen data modtaget");
            const planRef = doc(firestore!, 'users', user.uid, 'semesterPlans', id);
            await updateDoc(planRef, { ...result.data, updatedAt: serverTimestamp() });
            
            await sendInAppNotificationAction({
                uid: user.uid,
                title: "Plan Opdateret! 🔄",
                body: `Din semesterplan for ${result.data.title} er blevet frisket op med de seneste kalenderdata.`,
                type: 'info',
                link: `/mine-semesterplaner?id=${id}`
            });

            toast({ title: "Plan opdateret!" });
        } catch (e: any) {
            toast({ title: "Fejl", variant: "destructive" });
        } finally {
            setRefreshingId(null);
        }
    };

    if (isLoading) return <AuthLoadingScreen />;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 py-6 md:py-8 sticky top-0 z-[60]">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/portal" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <History className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Arkiv & Oversigt</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">Mine Semesterplaner</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Link href="/semester-planlaegger">
                        <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-12 px-6 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
                            <Plus className="w-4 h-4 mr-2" />
                            Ny Plan
                        </Button>
                    </Link>
                </div>
            </div>
        </header>

        <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
            {plans.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <CalendarDays className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Ingen planer endnu</h2>
                    <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto font-medium">Opret din første semesterplan ved hjælp af dit iCal-link fra skolen.</p>
                    <Link href="/semester-planlaegger">
                        <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8">
                            Kom godt i gang
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid lg:grid-cols-[300px,1fr] gap-12 items-start">
                    {/* SIDEBAR */}
                    <aside className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4 mb-2">Gemte Planer</h3>
                        <div className="grid gap-2">
                             {plans.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedId(p.id)}
                                    className={`w-full text-left p-6 rounded-[2rem] border transition-all duration-300 relative group ${
                                        selectedId === p.id 
                                        ? 'bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50' 
                                        : 'bg-transparent border-transparent hover:bg-white/50 text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                            selectedId === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                        }`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 pr-6">
                                            <p className={`text-xs font-black truncate ${selectedId === p.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                                {p.title}
                                            </p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">
                                                {p.semesterInfo}
                                            </p>
                                        </div>
                                        {selectedId === p.id && (
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full" />
                                        )}
                                    </div>
                                </button>
                             ))}
                        </div>

                        <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 mt-8 text-center space-y-4">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
                                <RefreshCw className="w-5 h-5" />
                             </div>
                             <p className="text-[11px] font-bold text-indigo-900 leading-relaxed">
                                Sørg for at din plan er opdateret.
                             </p>
                             <Button 
                                variant="ghost" 
                                onClick={() => activePlan && handleRefreshPlan(activePlan.id, activePlan.icalUrl)}
                                disabled={!!refreshingId || !activePlan}
                                className="w-full text-indigo-600 hover:bg-white font-black uppercase tracking-widest text-[9px]"
                             >
                                {refreshingId === activePlan?.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
                                Opdater Kalender
                             </Button>
                        </div>

                        <Button 
                            variant="ghost" 
                            onClick={() => activePlan && handleDelete(activePlan.id)}
                            className="w-full mt-4 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl font-black uppercase tracking-widest text-[9px]"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Slet plan
                        </Button>
                    </aside>

                    {/* MAIN */}
                    <div className="min-h-[600px]">
                        <AnimatePresence mode="wait">
                            {activePlan ? (
                                <motion.div
                                    key={activePlan.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <PlanDetailView 
                                        plan={activePlan} 
                                        user={user} 
                                        onOpenModal={(p, s) => {
                                            router.push(`/studieplanlaegger?planId=${p.id}`);
                                        }} 
                                        savedSchedule={schedules.find(s => s.planId === activePlan.id || s.semesterPlanId === activePlan.id)}
                                    />
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </main>
      </div>
    );
}

export default MineSemesterplanerPage;
