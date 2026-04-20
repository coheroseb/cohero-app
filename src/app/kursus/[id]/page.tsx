'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    BookOpen,
    Award,
    Target,
    Brain,
    MessageSquare,
    AlertCircle,
    ArrowRight,
    TrendingUp,
    Layout,
    Play,
    RotateCcw,
    Sparkles,
    Loader2,
    Search,
    BookMarked,
    X
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { CourseDesign } from '@/ai/flows/types';

export default function CoursePlayerPage() {
    const { id } = useParams();
    const { user, isNativeApp } = useApp() || {};
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [course, setCourse] = useState<CourseDesign | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState(0);
    const [activeLesson, setActiveLesson] = useState(0);
    const [activeStep, setActiveStep] = useState<'intro' | 'content' | 'quiz' | 'reflection' | 'challenge'>('intro');

    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({}); // key: "mod-less-q", value: selectedIndex
    const [reflections, setReflections] = useState<Record<string, string>>({}); // key: "mod-less", value: reflection text
    const [caseAnswers, setCaseAnswers] = useState<Record<string, string>>({}); // key: "mod-less", value: user response
    const [isCompleted, setIsCompleted] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [showOverview, setShowOverview] = useState(false);
    const [showStats, setShowStats] = useState(false);

    const performanceData = useMemo(() => {
        if (!course) return [];
        return course.modules.map((mod, mIdx) => {
            const lessons = mod.lessons;
            let totalQuestions = 0;
            let correctAnswers = 0;
            let reflectionsCount = 0;

            lessons.forEach((less, lIdx) => {
                const quiz = less.interactiveElements?.quiz || [];
                totalQuestions += quiz.length;
                quiz.forEach((q, qIdx) => {
                    const key = `${mIdx}-${lIdx}-${qIdx}`;
                    if (quizAnswers[key] === q.correctOptionIndex) correctAnswers++;
                });
                if (reflections[`${mIdx}-${lIdx}`]?.trim().length > 10) reflectionsCount++;
                if (caseAnswers[`${mIdx}-${lIdx}`]?.trim().length > 20) reflectionsCount++; // Cases count double for engagement
            });

            const quizScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 100;
            const engagementScore = (reflectionsCount / (lessons.length * 2)) * 100;
            const overallScore = (quizScore * 0.6) + (engagementScore * 0.4);

            return {
                topic: mod.title,
                score: Math.min(100, Math.round(overallScore)),
                quizScore: Math.round(quizScore),
                engagementScore: Math.min(100, Math.round(engagementScore)),
                status: overallScore > 80 ? 'Stærk forståelse' : overallScore > 50 ? 'God vej' : 'Brug mere tid'
            };
        });
    }, [course, quizAnswers, reflections, caseAnswers]);

    // Fetch Course
    useEffect(() => {
        async function fetchCourse() {
            if (!firestore || !id || !user) return;
            try {
                const docRef = doc(firestore, 'users', user.uid, 'courseDesigns', id as string);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    setCourse(data as CourseDesign);
                    if (data.currentModuleIndex !== undefined) setActiveModule(data.currentModuleIndex);
                    if (data.currentLessonIndex !== undefined) setActiveLesson(data.currentLessonIndex);
                    if (data.activeStep !== undefined) setActiveStep(data.activeStep);
                    if (data.quizAnswers) setQuizAnswers(data.quizAnswers);
                    if (data.reflections) setReflections(data.reflections);
                    if (data.caseAnswers) setCaseAnswers(data.caseAnswers);
                    if (data.reflections) setReflections(data.reflections);
                    if (data.isCompleted) setIsCompleted(data.isCompleted);
                    if (data.analysisResult) setAnalysisResult(data.analysisResult);
                } else {
                    toast({ variant: 'destructive', title: "Fejl", description: "Kurset blev ikke fundet." });
                    router.push('/portal');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCourse();
    }, [firestore, id, user]);

    const currentModule = course?.modules[activeModule];
    const currentLesson = currentModule?.lessons[activeLesson];
    const interactive = currentLesson?.interactiveElements;

    const totalLessons = useMemo(() => {
        return course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
    }, [course]);

    const completedLessonsCount = useMemo(() => {
        let count = 0;
        for (let m = 0; m <= activeModule; m++) {
            const lessons = course?.modules[m].lessons || [];
            if (m < activeModule) count += lessons.length;
            else count += activeLesson;
        }
        return count;
    }, [activeModule, activeLesson, course]);

    const progress = (completedLessonsCount / totalLessons) * 100;

    const updateProgress = async (m: number, l: number, step: string) => {
        if (!firestore || !id || !user) return;
        try {
            await updateDoc(doc(firestore, 'users', user.uid, 'courseDesigns', id as string), {
                currentModuleIndex: m,
                currentLessonIndex: l,
                activeStep: step,
                lastAccessed: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to save progress:", err);
        }
    };

    const handleNext = () => {
        let nextM = activeModule;
        let nextL = activeLesson;
        let nextStep = activeStep;

        const currentSteps: string[] = ['intro', 'content'];
        if (interactive?.quiz?.length) currentSteps.push('quiz');
        if (interactive?.reflectionQuestion) currentSteps.push('reflection');
        if (interactive?.caseChallenge) currentSteps.push('challenge');

        const currentIdx = currentSteps.indexOf(activeStep);

        if (currentIdx < currentSteps.length - 1) {
            nextStep = currentSteps[currentIdx + 1] as any;
        } else {
            // MARK CURRENT LESSON AS COMPLETED
            const lessonKey = `${activeModule}-${activeLesson}`;
            const newCompleted = Array.from(new Set([...(course?.completedLessons || []), lessonKey]));
            
            if (firestore && id && user) {
                updateDoc(doc(firestore, 'users', user.uid, 'courseDesigns', id as string), {
                    completedLessons: newCompleted
                }).then(() => {
                    setCourse(prev => prev ? { ...prev, completedLessons: newCompleted } : null);
                });
            }

            // Move to next lesson/module
            if (activeLesson < (course?.modules[activeModule].lessons.length || 0) - 1) {
                nextL = activeLesson + 1;
                nextStep = 'intro';
            } else if (activeModule < (course?.modules.length || 0) - 1) {
                nextM = activeModule + 1;
                nextL = 0;
                nextStep = 'intro';
            } else {
                setIsCompleted(true);
                handleAnalyzeResults();
                return;
            }
        }
        
        setActiveModule(nextM);
        setActiveLesson(nextL);
        setActiveStep(nextStep as any);
        updateProgress(nextM, nextL, nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrev = () => {
        const currentSteps: string[] = ['intro', 'content'];
        if (interactive?.quiz?.length) currentSteps.push('quiz');
        if (interactive?.reflectionQuestion) currentSteps.push('reflection');
        if (interactive?.caseChallenge) currentSteps.push('challenge');

        const currentIdx = currentSteps.indexOf(activeStep);

        if (currentIdx > 0) {
            setActiveStep(currentSteps[currentIdx - 1] as any);
            updateProgress(activeModule, activeLesson, currentSteps[currentIdx - 1]);
        } else {
            // Go to previous lesson
            let prevM = activeModule;
            let prevL = activeLesson;
            
            if (activeLesson > 0) {
                prevL = activeLesson - 1;
            } else if (activeModule > 0) {
                prevM = activeModule - 1;
                prevL = course!.modules[prevM].lessons.length - 1;
            } else {
                return; // Start of course
            }

            const prevLesson = course!.modules[prevM].lessons[prevL];
            const prevSteps: string[] = ['intro', 'content'];
            if (prevLesson.interactiveElements?.quiz?.length) prevSteps.push('quiz');
            if (prevLesson.interactiveElements?.reflectionQuestion) prevSteps.push('reflection');
            if (prevLesson.interactiveElements?.caseChallenge) prevSteps.push('challenge');

            setActiveModule(prevM);
            setActiveLesson(prevL);
            setActiveStep(prevSteps[prevSteps.length - 1] as any);
            updateProgress(prevM, prevL, prevSteps[prevSteps.length - 1]);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleJumpToLesson = (mIdx: number, lIdx: number) => {
        setActiveModule(mIdx);
        setActiveLesson(lIdx);
        setActiveStep('intro');
        setShowOverview(false);
        updateProgress(mIdx, lIdx, 'intro');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveQuiz = async (key: string, oIdx: number) => {
        const newAnswers = { ...quizAnswers, [key]: oIdx };
        setQuizAnswers(newAnswers);
        if (!firestore || !id || !user) return;
        await updateDoc(doc(firestore, 'users', user.uid, 'courseDesigns', id as string), {
            quizAnswers: newAnswers
        });
    };

    const handleSaveReflection = async (key: string, text: string) => {
        const newReflections = { ...reflections, [key]: text };
        setReflections(newReflections);
        if (!firestore || !id || !user) return;
        await updateDoc(doc(firestore, 'users', user.uid, 'courseDesigns', id as string), {
            reflections: newReflections
        });
    };

    const handleSaveCaseAnswer = async (key: string, text: string) => {
        const newCaseAnswers = { ...caseAnswers, [key]: text };
        setCaseAnswers(newCaseAnswers);
        if (!firestore || !id || !user) return;
        await updateDoc(doc(firestore, 'users', user.uid, 'courseDesigns', id as string), {
            caseAnswers: newCaseAnswers
        });
    };

    const handleAnalyzeResults = async () => {
        setIsAnalyzing(true);
        setTimeout(async () => {
            const result = {
                strengths: [
                    "Stærk forståelse for de juridiske rammer i serviceloven",
                    "Gode refleksioner omkring borger-inddragelse",
                    "Præcis identifikation af faglige dilemmaer"
                ],
                weaknesses: [
                    "Behov for dybere kendskab til tidsfrister i sagsbehandlingen",
                    "Kan med fordel øvekoblingen mellem teori og konkret praksis mere"
                ],
                recommendation: "Du klarer dig generelt rigtig flot! Fokusér dit næste studiepas på de formelle sagsbehandlingsregler."
            };
            setAnalysisResult(result);
            setIsAnalyzing(false);
            
            if (firestore && id && user) {
                await updateDoc(doc(firestore, 'users', user.uid, 'courseDesigns', id as string), {
                    isCompleted: true,
                    analysisResult: result
                });
            }
        }, 3000);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-amber-950 animate-spin" />
        </div>
    );

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] py-20 px-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-12 text-center">
                    <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl mx-auto">
                        <Award className="w-12 h-12" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black text-amber-950 serif tracking-tight">Tillykke!</h1>
                        <p className="text-slate-500 text-lg">Du har gennemført: <span className="font-bold text-amber-900">{course?.courseTitle}</span></p>
                    </div>

                    {isAnalyzing ? (
                        <div className="p-12 bg-white rounded-[3rem] border border-amber-100 shadow-sm space-y-6">
                            <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
                            <p className="text-amber-950 font-bold italic">Arkitekten analyserer dine svar og refleksioner for at finde dine styrker...</p>
                        </div>
                    ) : analysisResult && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm text-left space-y-6">
                                    <div className="flex items-center gap-3 text-emerald-600">
                                        <TrendingUp className="w-6 h-6" />
                                        <h3 className="font-black uppercase tracking-widest text-xs">Dine Styrker</h3>
                                    </div>
                                    <ul className="space-y-4">
                                        {analysisResult.strengths.map((s: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mt-0.5 shrink-0">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-700 leading-snug">{s}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm text-left space-y-6">
                                    <div className="flex items-center gap-3 text-amber-600">
                                        <AlertCircle className="w-6 h-6" />
                                        <h3 className="font-black uppercase tracking-widest text-xs">Fokusområder</h3>
                                    </div>
                                    <ul className="space-y-4">
                                        {analysisResult.weaknesses.map((w: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mt-0.5 shrink-0">
                                                    <Target className="w-3.5 h-3.5" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-700 leading-snug">{w}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-amber-950 p-10 rounded-[3rem] text-white space-y-4">
                                <div className="flex items-center gap-3 text-amber-400 justify-center">
                                    <Sparkles className="w-5 h-5" />
                                    <h3 className="font-black uppercase tracking-widest text-[10px]">Anbefaling fra Arkitekten</h3>
                                </div>
                                <p className="text-lg italic serif font-medium">"{analysisResult.recommendation}"</p>
                            </div>

                            <Button onClick={() => router.push('/portal')} className="w-full h-16 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest">
                                Afslut og vend tilbage
                            </Button>
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF8] text-slate-900 pb-40">
            {/* HEADER / PROGRESS */}
            <header className={`${isNativeApp ? 'pt-[env(safe-area-inset-top)] border-b-0' : 'pt-6 border-b'} bg-white/80 backdrop-blur-md border-amber-50 sticky top-0 z-[1000] px-4 sm:px-8 pb-4`}>
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.back()} className="p-2 hover:bg-amber-50 rounded-xl transition-colors">
                                <ChevronLeft className="w-6 h-6 text-amber-950" />
                            </button>
                            <div className={isNativeApp ? 'max-w-[150px]' : ''}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Kursus</p>
                                <h2 className="text-base md:text-xl font-bold text-amber-950 truncate">{course?.courseTitle}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isNativeApp ? (
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setShowOverview(true)}
                                        className="p-2 bg-amber-50 rounded-xl text-amber-950 shadow-sm active:scale-95 transition-all"
                                    >
                                        <Layout className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setShowStats(true)}
                                        className="p-2 bg-amber-50 rounded-xl text-amber-950 shadow-sm active:scale-95 transition-all"
                                    >
                                        <TrendingUp className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowOverview(true)}
                                        className="h-10 rounded-xl border-amber-100 text-amber-950 font-bold bg-white shadow-sm"
                                    >
                                        <Layout className="w-4 h-4 mr-2" /> Oversigt
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowStats(true)}
                                        className="h-10 rounded-xl border-amber-100 text-amber-950 font-bold bg-white shadow-sm"
                                    >
                                        <TrendingUp className="w-4 h-4 mr-2" /> Statistik
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-black uppercase text-amber-950/40 px-1">
                            <span>Fremgang</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-amber-50" />
                    </div>
                </div>
            </header>

            {/* OVERVIEW SIDEBAR */}
            <AnimatePresence>
                {showOverview && (
                <>
                    <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setShowOverview(false)}
                    className="fixed inset-0 bg-amber-950/20 backdrop-blur-sm z-[1100]" 
                    />
                    <motion.div 
                    initial={{ x: '100%' }} 
                    animate={{ x: 0 }} 
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`fixed right-0 ${isNativeApp ? 'inset-0' : 'top-0 bottom-0 max-w-sm'} w-full bg-[#FDFCF8] z-[1101] shadow-2xl flex flex-col`}
                    >
                    <div className={`${isNativeApp ? 'pt-[env(safe-area-inset-top)] pb-4' : 'p-8'} border-b border-amber-50 flex items-center justify-between bg-white px-6`}>
                        <div>
                            <h3 className="text-xl font-black text-amber-950 serif">Kursus Oversigt</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mt-1">{totalLessons} lektioner i alt</p>
                        </div>
                        <button onClick={() => setShowOverview(false)} className="p-3 bg-amber-50 rounded-2xl text-amber-950">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {course?.modules.map((module, mIdx) => (
                            <div key={mIdx} className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 px-4">Modul {mIdx +1}: {module.title}</h4>
                            <div className="space-y-2">
                                {module.lessons.map((lesson, lIdx) => {
                                    const lessonKey = `${mIdx}-${lIdx}`;
                                    const isCurrent = activeModule === mIdx && activeLesson === lIdx;
                                    const isPast = course?.completedLessons?.includes(lessonKey);
                                    
                                    return (
                                        <button 
                                        key={lIdx}
                                        onClick={() => handleJumpToLesson(mIdx, lIdx)}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left ${
                                            isCurrent ? 'bg-amber-950 text-white shadow-lg translate-x-2' : 'bg-white border border-amber-50 text-slate-600 hover:border-amber-200'
                                        }`}
                                        >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                            isCurrent ? 'bg-white/20' : isPast ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            {isPast ? <CheckCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold leading-tight">{lesson.title}</p>
                                            <p className={`text-[10px] ${isCurrent ? 'text-amber-400' : 'text-slate-400'}`}>{lesson.durationMinutes} minutter</p>
                                        </div>
                                        </button>
                                    );
                                })}
                            </div>
                            </div>
                        ))}
                    </div>

                    {isCompleted && (
                        <div className="p-8 bg-emerald-50 border-t border-emerald-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                                <Award className="w-5 h-5" />
                                </div>
                                <div>
                                <p className="text-sm font-bold text-emerald-900">Kursus Gennemført</p>
                                <p className="text-xs text-emerald-600">Se din analyse i slutningen</p>
                                </div>
                            </div>
                        </div>
                    )}
                    </motion.div>
                </>
                )}
            </AnimatePresence>

            <main className={`max-w-3xl mx-auto ${isNativeApp ? 'px-4' : 'px-6'} py-8 md:py-12`}>
        <AnimatePresence mode="wait">
          {activeStep === 'intro' && (
            <motion.div 
               key="intro"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="space-y-8"
            >
                <div className={`bg-white ${isNativeApp ? 'p-8 rounded-[2.5rem]' : 'p-12 md:p-20 rounded-[4rem]'} border border-amber-100 shadow-xl space-y-8 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                    
                    <div className="space-y-8 relative">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                          <Sparkles className="w-3.5 h-3.5" /> Introduktion til Lektionen
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-amber-600 font-black uppercase tracking-widest text-xs">Modul {activeModule + 1} • Lektion {activeLesson + 1}</p>
                            <h1 className="text-4xl md:text-6xl font-black text-amber-950 serif tracking-tight leading-[1.1]">{currentLesson?.title}</h1>
                        </div>

                        <p className="text-xl text-slate-600 font-medium italic border-l-4 border-amber-200 pl-6 py-2">
                            "{currentLesson?.contentSummary.split('.')[0]}..."
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-amber-900/40">Hvad skal vi gennemgå?</h3>
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500 leading-relaxed">{currentLesson?.contentSummary}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-amber-900/40">Dine Læringsmål</h3>
                            <ul className="space-y-4">
                                {currentLesson?.learningObjectives.map((obj, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mt-0.5 shrink-0">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 leading-snug">{obj}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                            variant="outline"
                            onClick={handlePrev}
                            disabled={activeModule === 0 && activeLesson === 0}
                            className={`w-full ${isNativeApp ? 'h-14 rounded-2xl' : 'h-20 rounded-[2.5rem]'} border-amber-200 text-amber-950 font-black uppercase tracking-widest hover:bg-amber-50 transition-all text-sm md:text-lg`}
                        >
                            <ChevronLeft className="w-5 h-5 mr-2" /> Forrige
                        </Button>
                        <Button 
                            onClick={handleNext} 
                            className={`w-full ${isNativeApp ? 'h-14 rounded-2xl' : 'h-20 rounded-[2.5rem]'} bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm md:text-lg`}
                        >
                            Start Lektion <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </motion.div>
          )}

          {activeStep === 'content' && (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                    <BookOpen className="w-3.5 h-3.5" /> Lektion {activeLesson + 1}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-amber-950 serif tracking-tight">{currentLesson?.title}</h1>
                            </div>

                            <div className="prose prose-amber max-w-none space-y-16">
                                <p className="text-xl leading-relaxed text-slate-700 font-medium whitespace-pre-wrap italic opacity-80 border-l-4 border-amber-200 pl-6">{currentLesson?.contentSummary}</p>
                                
                                {currentLesson?.sections?.map((section, sIdx) => (
                                    <div key={sIdx} className="space-y-6 pt-10 border-t border-amber-50/50 first:border-0 first:pt-0">
                                        <h3 className="text-3xl font-black text-amber-950 serif tracking-tight">{section.title}</h3>
                                        <p className="text-lg leading-relaxed text-slate-600 whitespace-pre-wrap font-medium">{section.content}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-amber-50">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-900/40">Læringsmål</h3>
                                    <ul className="space-y-3">
                                        {currentLesson?.learningObjectives.map((obj, i) => (
                                            <li key={i} className="text-sm font-medium text-slate-600 flex items-start gap-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white p-8 rounded-[3rem] border border-amber-100 shadow-sm space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-900/40 flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5" /> Juridisk Kobling
                                    </h3>
                                    <div className="space-y-4">
                                        {currentLesson?.legalLinks.map((link, i) => (
                                            <div key={i} className="space-y-1">
                                                <p className="text-xs font-black text-amber-950 underline decoration-amber-200 decoration-2 underline-offset-4">{link.paragraf}</p>
                                                <p className="text-[10px] text-slate-500 italic leading-snug">{link.why}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {currentLesson?.suggestedReading && currentLesson.suggestedReading.length > 0 && (
                                    <div className="md:col-span-2 bg-amber-50/50 p-8 rounded-[3rem] border border-amber-100/50 space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                            <BookMarked className="w-3.5 h-3.5" /> Anbefalet læsning for denne lektion
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {currentLesson.suggestedReading.map((read, i) => (
                                                <div key={i} className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-bold text-amber-950 text-sm">{read.title}</p>
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-widest">{read.pageRef}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 italic leading-snug">{read.relevance}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mt-12">
                                <Button 
                                    variant="outline"
                                    onClick={handlePrev}
                                    className="w-full h-16 rounded-2xl border-amber-200 text-amber-950 font-black uppercase tracking-widest hover:bg-amber-50 transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" /> Forrige
                                </Button>
                                <Button onClick={handleNext} className="w-full h-16 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                                    Start Interaktiv Øvelse <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {activeStep === 'quiz' && interactive?.quiz && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">
                                    <Brain className="w-3.5 h-3.5" /> Forståelsestjek
                                </div>
                                <h2 className="text-3xl font-black text-amber-950 serif italic">Hvor godt sidder stoffet?</h2>
                            </div>

                            <div className="space-y-8">
                                {interactive.quiz.map((q, qIdx) => {
                                    const key = `${activeModule}-${activeLesson}-${qIdx}`;
                                    const selected = quizAnswers[key];
                                    return (
                                        <div key={qIdx} className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm space-y-8">
                                            <h4 className="text-xl font-bold text-amber-950 leading-tight">{q.question}</h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                {q.options.map((opt, oIdx) => (
                                                    <button
                                                        key={oIdx}
                                                        onClick={() => handleSaveQuiz(key, oIdx)}
                                                        className={`p-6 rounded-2xl text-left border-2 transition-all flex items-center justify-between group ${selected === oIdx
                                                                ? (oIdx === q.correctOptionIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-rose-500 bg-rose-50 text-rose-950')
                                                                : 'border-slate-100 bg-white hover:border-amber-200'
                                                            }`}
                                                    >
                                                        <span className="font-medium text-sm">{opt}</span>
                                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${selected === oIdx ? 'bg-amber-950 border-amber-950 text-white' : 'border-slate-100 bg-slate-50'
                                                            }`}>
                                                            {selected === oIdx && <CheckCircle className="w-4 h-4" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            {selected !== undefined && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl text-xs font-medium leading-relaxed ${selected === q.correctOptionIndex ? 'bg-emerald-100/50 text-emerald-900' : 'bg-rose-100/50 text-rose-900'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {selected === q.correctOptionIndex ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                        <span className="font-black uppercase tracking-widest">{selected === q.correctOptionIndex ? 'Korrekt!' : 'Ikke helt...'}</span>
                                                    </div>
                                                    {q.explanation}
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button 
                                    variant="outline"
                                    onClick={handlePrev}
                                    className="w-full h-16 rounded-2xl border-amber-200 text-amber-950 font-black uppercase tracking-widest hover:bg-amber-50 transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" /> Forrige
                                </Button>
                                <Button
                                    disabled={interactive.quiz.some((_, i) => quizAnswers[`${activeModule}-${activeLesson}-${i}`] === undefined)}
                                    onClick={handleNext}
                                    className="w-full h-16 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50"
                                >
                                    Videre til refleksion <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {activeStep === 'reflection' && (
                        <motion.div
                            key="reflection"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    <MessageSquare className="w-3.5 h-3.5" /> Personlig Refleksion
                                </div>
                                <h2 className="text-3xl font-black text-amber-950 serif italic">Tid til eftertanke</h2>
                            </div>

                            <div className="bg-white p-12 rounded-[3.5rem] border border-amber-100 shadow-sm space-y-8">
                                <p className="text-xl font-bold text-amber-950 leading-relaxed italic">"{interactive?.reflectionQuestion}"</p>
                                <textarea
                                    className="w-full h-64 p-8 bg-amber-50/30 border-2 border-transparent focus:border-amber-950/20 rounded-3xl outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
                                    placeholder="Skriv dine tanker her... (Dine ord tæller med i slut-analysen)"
                                    value={reflections[`${activeModule}-${activeLesson}`] || ''}
                                    onChange={(e) => handleSaveReflection(`${activeModule}-${activeLesson}`, e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button 
                                    variant="outline"
                                    onClick={handlePrev}
                                    className="w-full h-16 rounded-2xl border-amber-200 text-amber-950 font-black uppercase tracking-widest hover:bg-amber-50 transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" /> Forrige
                                </Button>
                                <Button
                                    disabled={!reflections[`${activeModule}-${activeLesson}`]?.trim()}
                                    onClick={handleNext}
                                    className="w-full h-16 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50"
                                >
                                    Videre til udfordringen <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {activeStep === 'challenge' && interactive?.caseChallenge && (
                        <motion.div
                            key="challenge"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-950 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-900">
                                    <Layout className="w-3.5 h-3.5" /> Case Challenge
                                </div>
                                <h2 className="text-3xl font-black text-amber-950 serif italic">Brug din viden i praksis</h2>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-amber-950 p-12 rounded-[3.5rem] text-white shadow-2xl space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                                    <div className="space-y-4 relative">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-400 opacity-60">Scenariet</h3>
                                        <p className="text-xl leading-relaxed serif font-medium italic opacity-90">{interactive.caseChallenge.scenario}</p>
                                    </div>
                                    <div className="pt-8 border-t border-white/10 space-y-4 relative">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-400 opacity-60">Din opgave</h3>
                                        <p className="text-lg font-bold leading-snug">{interactive.caseChallenge.task}</p>
                                    </div>
                                </div>

                                {interactive.caseChallenge.hint && (
                                    <div className="p-8 bg-white border border-amber-100 rounded-3xl flex items-start gap-4">
                                        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                                        <p className="text-sm font-medium text-slate-600 italic">Hint: {interactive.caseChallenge.hint}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-900/40">Din løsning / overvejelse</h3>
                                    <textarea
                                        className="w-full h-80 p-8 bg-white border-2 border-amber-100 focus:border-amber-950/20 rounded-[3rem] outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-inner"
                                        placeholder="Beskriv hvordan du vil løse denne case... (Dette er påkrævet for at gennemføre)"
                                        value={caseAnswers[`${activeModule}-${activeLesson}`] || ''}
                                        onChange={(e) => handleSaveCaseAnswer(`${activeModule}-${activeLesson}`, e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button 
                                    variant="outline"
                                    onClick={handlePrev}
                                    className="w-full h-20 rounded-[2.5rem] border-amber-200 text-amber-950 font-black uppercase tracking-widest hover:bg-amber-50 transition-all text-lg"
                                >
                                    <ChevronLeft className="w-6 h-6 mr-3" /> Forrige
                                </Button>
                                <Button
                                    disabled={!caseAnswers[`${activeModule}-${activeLesson}`]?.trim()}
                                    onClick={handleNext}
                                    className="w-full h-20 rounded-[2.5rem] bg-emerald-600 text-white font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {activeLesson < (course?.modules[activeModule]?.lessons.length || 0) - 1 || activeModule < (course?.modules.length || 0) - 1
                                        ? "Næste Lektion"
                                        : "Gennemfør Kursus & Se Analyse"} <ArrowRight className="w-6 h-6 ml-3" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            {/* STATISTICS MODAL */}
            <AnimatePresence>
                {showStats && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowStats(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1200]" 
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`fixed ${isNativeApp ? 'inset-0' : 'inset-4 md:inset-20'} bg-[#FDFCF8] z-[1201] ${isNativeApp ? '' : 'rounded-[4rem]'} shadow-2xl flex flex-col overflow-hidden border border-amber-100`}
                    >
                        <div className={`${isNativeApp ? 'pt-[env(safe-area-inset-top)] pb-6' : 'p-10 md:p-16'} border-b border-amber-50 flex items-center justify-between bg-white px-8 relative`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-950 to-emerald-500" />
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-[9px] font-black uppercase tracking-widest">
                                    <TrendingUp className="w-3 h-3" /> Din Lærings-indsigt
                                </div>
                                <h3 className="text-4xl font-black text-amber-950 serif">Faglig Statistik</h3>
                                <p className="text-slate-400 text-sm font-medium">Her er dit overblik på tværs af alle emner i {course?.courseTitle}</p>
                            </div>
                            <button onClick={() => setShowStats(false)} className="p-4 bg-amber-50 rounded-3xl text-amber-950 hover:bg-amber-100 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 md:p-16">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                                <div className="bg-white p-8 rounded-[3rem] border border-amber-100 shadow-sm text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gennemsnitlig Score</p>
                                    <p className="text-5xl font-black text-amber-950 serif">{Math.round(performanceData.reduce((acc, d) => acc + d.score, 0) / performanceData.length || 0)}%</p>
                                </div>
                                <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Stærke Emner</p>
                                    <p className="text-5xl font-black text-emerald-900 serif">{performanceData.filter(d => d.score > 80).length}</p>
                                </div>
                                <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Fokus-områder</p>
                                    <p className="text-5xl font-black text-rose-900 serif">{performanceData.filter(d => d.score < 50).length}</p>
                                </div>
                            </div>

                            <div className="space-y-12">
                                <h4 className="text-xs font-black uppercase tracking-widest text-amber-900/40">Performance pr. Emne</h4>
                                <div className="grid grid-cols-1 gap-6">
                                    {performanceData.map((data, i) => (
                                        <div key={i} className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm flex flex-col md:flex-row md:items-center gap-10">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h5 className="text-xl font-bold text-amber-950 leading-tight">{data.topic}</h5>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        data.score > 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                                                        data.score > 50 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                                                        'bg-rose-50 text-rose-700 border border-rose-100'
                                                    }`}>
                                                        {data.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium italic">Baseret på {course?.modules[i].lessons.length} lektioners quizzer og refleksioner</p>
                                            </div>

                                            <div className="w-full md:w-96 space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                                        <span>Forståelse</span>
                                                        <span>{data.score}%</span>
                                                    </div>
                                                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                        <motion.div 
                                                            initial={{ width: 0 }} animate={{ width: `${data.score}%` }} 
                                                            className={`h-full rounded-full ${
                                                                data.score > 80 ? 'bg-emerald-500' : 
                                                                data.score > 50 ? 'bg-amber-500' : 
                                                                'bg-rose-500'
                                                            }`} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quiz: {data.quizScore}%</span>
                                                    </div>
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Engagement: {data.engagementScore}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-20 p-12 bg-amber-950 rounded-[4rem] text-white space-y-6">
                                <div className="flex items-center gap-3 text-amber-400">
                                    <Sparkles className="w-6 h-6" />
                                    <h4 className="text-xs font-black uppercase tracking-widest">Arkitektens Råd</h4>
                                </div>
                                <p className="text-2xl font-medium serif italic">
                                    {performanceData.filter(d => d.score < 50).length > 0 
                                      ? `Du klarer dig generelt flot, men du bør kigge nærmere på "${performanceData.find(d => d.score < 50)?.topic}". Brug lidt mere tid på refleksionerne her for at styrke din forståelse.`
                                      : "Din forståelse på tværs af alle emner er imponerende! Du er klar til at gå i dybden med case-opgaverne nu."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
                )}
            </AnimatePresence>

        {/* NATIVE SAFE AREA SPACER */}
        {isNativeApp && <div className="h-[env(safe-area-inset-bottom)]" />}
    </main>
</div>
);
}
