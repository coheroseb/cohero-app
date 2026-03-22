'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Target, 
  Calendar, 
  CheckCircle, 
  Loader2, 
  BrainCircuit, 
  Info, 
  AlertCircle,
  Zap,
  Coffee,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Save,
  Trash2,
  ChevronRight,
  BookMarked,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore, useDoc } from '@/firebase';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  DocumentData 
} from 'firebase/firestore';
import { generateStudyScheduleAction, sendInAppNotificationAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import type { SemesterPlan, StudySchedule } from '@/ai/flows/types';

// --- TYPES ---

interface SavedSemesterPlan extends SemesterPlan {
    id: string;
    icalUrl: string;
    semesterInfo: string;
}

interface SavedStudySchedule extends StudySchedule {
    id: string;
    planId: string;
    createdAt: any;
}

// --- MAIN PAGE ---

export default function StudieplanlaeggerPage() {
    return (
        <Suspense fallback={<AuthLoadingScreen />}>
            <StudieplanlaeggerContent />
        </Suspense>
    );
}

function StudieplanlaeggerContent() {
    const { user, userProfile } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const planId = searchParams?.get('planId');
    const [plan, setPlan] = useState<SavedSemesterPlan | null>(null);
    const [isPlanLoading, setIsPlanLoading] = useState(true);

    const [weeklyHours, setWeeklyHours] = useState(37);
    const [availability, setAvailability] = useState<Record<string, { unavailable: boolean, after?: string }>>({
        'Mandag': { unavailable: false },
        'Tirsdag': { unavailable: false },
        'Onsdag': { unavailable: false },
        'Torsdag': { unavailable: false },
        'Fredag': { unavailable: false },
        'Lørdag': { unavailable: true },
        'Søndag': { unavailable: true },
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSchedule, setGeneratedSchedule] = useState<StudySchedule | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Plan
    useEffect(() => {
        if (!user || !firestore || !planId) return;
        const fetchPlan = async () => {
            setIsPlanLoading(true);
            try {
                const planSnap = await getDocs(query(collection(firestore, 'users', user.uid, 'semesterPlans'), where('id', '==', planId)));
                if (!planSnap.empty) {
                    setPlan({ id: planSnap.docs[0].id, ...planSnap.docs[0].data() } as SavedSemesterPlan);
                } else {
                    const singleSnap = await getDocs(query(collection(firestore, 'users', user.uid, 'semesterPlans')));
                    const found = singleSnap.docs.find(d => d.id === planId);
                    if (found) setPlan({ id: found.id, ...found.data() } as SavedSemesterPlan);
                }
            } catch (e) {
                console.error("Error fetching plan:", e);
            } finally {
                setIsPlanLoading(false);
            }
        };
        fetchPlan();
    }, [user, firestore, planId]);

    const handleGenerate = async () => {
        if (!plan || isGenerating) return;
        setIsGenerating(true);
        try {
            const result = await generateStudyScheduleAction({
                plan: plan,
                totalWeeklyStudyHours: weeklyHours,
                availability: availability
            });
            if (!result || !result.data) throw new Error("Kunne ikke generere studieplan");
            setGeneratedSchedule(result.data);
            
            toast({
                title: "Studieplan Genereret!",
                description: "AI-algoritmen har lagt det optimale skema til dig.",
            });
        } catch (e: any) {
            toast({
                title: "Fejl ved generering",
                description: e.message,
                variant: 'destructive'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!user || !firestore || !generatedSchedule || !plan) return;
        setIsSaving(true);
        try {
            const schedulesCol = collection(firestore, 'users', user.uid, 'studySchedules');
            const q = query(schedulesCol, where("planId", "==", plan.id));
            const existing = await getDocs(q);
            
            if (!existing.empty) {
                await deleteDoc(existing.docs[0].ref);
            }

            const newDocRef = doc(collection(firestore, 'users', user.uid, 'studySchedules'));
            await setDoc(newDocRef, {
                ...generatedSchedule,
                planId: plan.id,
                createdAt: serverTimestamp()
            });

            await sendInAppNotificationAction({
                uid: user.uid,
                title: "Studieplan Gemt! 🎯",
                body: `Din ugentlige studieplan for ${plan.title} er nu aktiv. Vi har lagt dine læse-blokke ind for dig.`,
                type: 'schedule',
                link: '/mine-semesterplaner'
            });

            toast({
                title: "Studieplan gemt!",
                description: "Du kan nu altid finde dit uge-skema under 'Mine Semesterplaner'.",
            });
            router.push('/mine-semesterplaner');
        } catch (e: any) {
            toast({
                title: "Fejl ved lagring",
                description: e.message,
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isPlanLoading) return <AuthLoadingScreen />;
    if (!plan && !isPlanLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
                <AlertCircle className="w-16 h-16 text-rose-500 mb-6" />
                <h2 className="text-xl font-black text-slate-900 mb-2">Plan ikke fundet</h2>
                <p className="text-sm text-slate-400 mb-8 max-w-xs text-center font-medium">Vi kunne ikke indlæse den semesterplan, som din studieplan skal bygges på.</p>
                <Link href="/mine-semesterplaner">
                    <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8">
                        Gå tilbage
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 pb-20">
            {/* HEADER */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 py-6 md:py-8 sticky top-0 z-[60]">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/mine-semesterplaner" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lav din Studieplan</span>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900">{plan?.title}</h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="px-5 py-2.5 bg-indigo-50 rounded-xl hidden lg:flex items-center gap-3 border border-indigo-100">
                             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Studie-Arkitekt AI</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
                <AnimatePresence mode="wait">
                    {!generatedSchedule ? (
                        <motion.div 
                            key="config"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-4xl mx-auto space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <h2 className="text-4xl font-black text-slate-900 leading-tight">Konfigurer dit arbejdsliv.</h2>
                                <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">AI'en beregner det optimale ugeskema baseret på dit semesters sværhedsgrad og dine egne præferencer.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* LEFT: Hours & Time */}
                                <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            <Calculator className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">Studietid pr. uge</h3>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Antal timer i alt</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-end justify-between">
                                            <span className="text-5xl font-black text-slate-900">{weeklyHours}h</span>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                {weeklyHours < 20 ? 'Lidt pres' : weeklyHours < 40 ? 'Moderate' : 'Højt pres'}
                                            </span>
                                        </div>
                                        <Input
                                            type="range"
                                            min="10"
                                            max="60"
                                            step="1"
                                            value={weeklyHours}
                                            onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                                            Dette inkluderer både undervisning fra din kalender og selvstændig forberedelse/læsning.
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> AI Optimering
                                        </p>
                                        <ul className="space-y-2">
                                            {['Respekterer blokerede tidsrum', 'Prioriterer eksamener', 'Indlægger pauser automatisk'].map(item => (
                                                <li key={item} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>

                                {/* RIGHT: Availability */}
                                <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">Tilgængelighed</h3>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Deaktiver faste fridage</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {Object.entries(availability).map(([day, config]) => (
                                            <div key={day} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                                                config.unavailable ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm shadow-slate-100'
                                            }`}>
                                                <div className="flex items-center gap-4">
                                                    <input 
                                                        type="checkbox"
                                                        checked={!config.unavailable}
                                                        onChange={(e) => setAvailability(prev => ({ 
                                                            ...prev, 
                                                            [day]: { ...prev[day], unavailable: !e.target.checked }
                                                        }))}
                                                        className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <span className={`text-sm font-black ${config.unavailable ? 'text-slate-400' : 'text-slate-900'}`}>{day}</span>
                                                </div>
                                                
                                                {!config.unavailable && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Efter</span>
                                                        <select
                                                            value={config.after || '08:00'}
                                                            onChange={(e) => setAvailability(prev => ({
                                                                ...prev,
                                                                [day]: { ...prev[day], after: e.target.value }
                                                            }))}
                                                            className="bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 focus:ring-1 focus:ring-indigo-500"
                                                        >
                                                            {['06:00', '07:00' ,'08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '16:00'].map(h => <option key={h}>{h}</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <div className="flex flex-col items-center gap-6">
                                <Button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="h-20 px-12 rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-indigo-200 transition-all active:scale-95 group relative overflow-hidden disabled:bg-slate-300"
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                <span className="text-xl font-black uppercase tracking-widest">Genererer...</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                                                    <Sparkles className="w-6 h-6 text-white" />
                                                </div>
                                                <span className="text-xl font-black uppercase tracking-widest">Opbyg Studieplan</span>
                                            </>
                                        )}
                                    </div>
                                </Button>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Tager ca. 15-20 sekunder for AI'en
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-12"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900">{generatedSchedule.title}</h2>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Udarbejdet af din AI-vejleder</p>
                                </div>
                                <div className="flex items-center gap-4">
                                     <Button 
                                        variant="ghost" 
                                        onClick={() => setGeneratedSchedule(null)}
                                        className="rounded-2xl h-14 px-8 text-xs font-black uppercase tracking-widest hover:bg-slate-200"
                                     >
                                        Nulstil
                                     </Button>
                                     <Button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="rounded-2xl h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                                     >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5 mr-3"/>}
                                        {isSaving ? 'Gemmer...' : 'Gem Studieplan'}
                                     </Button>
                                </div>
                            </div>

                            <div className="grid gap-12">
                                {generatedSchedule.schedule.map((week) => (
                                    <section key={week.weekNumber} className="space-y-6">
                                        <div className="flex items-center gap-6">
                                            <div className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em]">
                                                Uge {week.weekNumber}
                                            </div>
                                            <div className="h-px flex-grow bg-slate-200" />
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selvstudie: {week.selfStudyHours}h</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fokus: {week.focusAreas.length} områder</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid lg:grid-cols-4 gap-6">
                                            {/* LEFT: Focus Areas */}
                                            <div className="lg:col-span-1 space-y-4">
                                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                                        <Target className="w-3.5 h-3.5 text-indigo-500" /> Ugemål
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {week.focusAreas.map((focus) => (
                                                            <div key={focus} className="flex items-start gap-4 group">
                                                                <div className="w-5 h-5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                    <div className="w-1.5 h-1.5 bg-current rounded-full" />
                                                                </div>
                                                                <p className="text-xs font-bold text-slate-700 leading-relaxed">{focus}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT: Daily Blocks */}
                                            <div className="lg:col-span-3">
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {week.recommendedBlocks.map((block, i) => (
                                                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all hover:shadow-md group flex flex-col justify-between relative overflow-hidden mb-2">
                                                            {/* Category Indicator */}
                                                            <div className={`absolute top-0 right-0 h-full w-1 ${
                                                                block.category === 'preparation' ? 'bg-indigo-500' :
                                                                block.category === 'reading' ? 'bg-emerald-500' :
                                                                block.category === 'assignment' ? 'bg-rose-500' :
                                                                block.category === 'break' ? 'bg-amber-400' :
                                                                'bg-slate-400'
                                                            }`} />

                                                            <div>
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="px-3 py-1 bg-slate-50 text-slate-900 rounded-lg border border-slate-100 text-[9px] font-black uppercase tracking-widest">{block.day}</div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Clock className="w-3 h-3 text-slate-300" />
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{block.startTime} - {block.endTime}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                                                                        block.category === 'break' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                                                    }`}>
                                                                        {block.category === 'break' ? <Coffee className="w-4 h-4" /> : <BookMarked className="w-4 h-4" />}
                                                                    </div>
                                                                </div>
                                                                <h5 className="text-sm font-black text-slate-900 mb-1">{block.activity}</h5>
                                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{block.description}</p>
                                                            </div>

                                                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                                                    block.category === 'preparation' ? 'text-indigo-500' :
                                                                    block.category === 'reading' ? 'text-emerald-500' :
                                                                    block.category === 'assignment' ? 'text-rose-500' :
                                                                    block.category === 'break' ? 'text-amber-500' :
                                                                    'text-slate-500'
                                                                }`}>
                                                                    #{block.category}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                 </div>
                                            </div>
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function Suspense(props: any) {
    return <React.Suspense fallback={props.fallback}>{props.children}</React.Suspense>;
}
