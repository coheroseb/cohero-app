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
  Lock,
  Search
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
  const { user } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [activeStep, setActiveStep] = useState<'content' | 'quiz' | 'reflection' | 'challenge'>('content');
  
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({}); // key: "mod-less-q", value: selectedIndex
  const [reflections, setReflections] = useState<Record<string, string>>({}); // key: "mod-less", value: reflection text
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Fetch Course
  useEffect(() => {
    async function fetchCourse() {
      if (!firestore || !id || !user) return;
      try {
        const docRef = doc(firestore, 'users', user.uid, 'courseDesigns', id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCourse(snap.data() as CourseDesign);
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

  const handleNext = () => {
    if (activeStep === 'content' && interactive?.quiz?.length) {
        setActiveStep('quiz');
    } else if (activeStep === 'quiz' && interactive?.reflectionQuestion) {
        setActiveStep('reflection');
    } else if (activeStep === 'reflection' && interactive?.caseChallenge) {
        setActiveStep('challenge');
    } else {
      // Move to next lesson/module
      if (activeLesson < (currentModule?.lessons.length || 0) - 1) {
        setActiveLesson(prev => prev + 1);
        setActiveStep('content');
      } else if (activeModule < (course?.modules.length || 0) - 1) {
        setActiveModule(prev => prev + 1);
        setActiveLesson(0);
        setActiveStep('content');
      } else {
        setIsCompleted(true);
        handleAnalyzeResults();
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyzeResults = async () => {
      setIsAnalyzing(true);
      // In a real app, I'd call an AI flow here. 
      // For this demo, let's simulate a deep analysis of "Strengths and Weaknesses"
      setTimeout(() => {
          setAnalysisResult({
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
          });
          setIsAnalyzing(false);
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
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-50 sticky top-0 z-50 px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-amber-50 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6 text-amber-950" />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Digitalt Kursus</p>
                        <h2 className="text-xl font-bold text-amber-950 truncate max-w-[300px]">{course?.courseTitle}</h2>
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-xs font-black text-amber-950">LEKTION {activeLesson + 1} AF {currentModule?.lessons.length}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{currentModule?.title}</p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-amber-950/40 px-1">
                    <span>Din fremgang</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-amber-50" />
            </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
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

                <div className="prose prose-amber max-w-none">
                    <p className="text-xl leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">{currentLesson?.contentSummary}</p>
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

                <Button onClick={handleNext} className="w-full h-16 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest mt-12 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                    Start Interaktiv Øvelse <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
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
                                            onClick={() => setQuizAnswers(prev => ({ ...prev, [key]: oIdx }))}
                                            className={`p-6 rounded-2xl text-left border-2 transition-all flex items-center justify-between group ${
                                                selected === oIdx 
                                                    ? (oIdx === q.correctOptionIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-rose-500 bg-rose-50 text-rose-950') 
                                                    : 'border-slate-100 bg-white hover:border-amber-200'
                                            }`}
                                        >
                                            <span className="font-medium text-sm">{opt}</span>
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                                                selected === oIdx ? 'bg-amber-950 border-amber-950 text-white' : 'border-slate-100 bg-slate-50'
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

                <Button 
                    disabled={interactive.quiz.some((_, i) => quizAnswers[`${activeModule}-${activeLesson}-${i}`] === undefined)}
                    onClick={handleNext} 
                    className="w-full h-16 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50"
                >
                    Videre til refleksion <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
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
                        onChange={(e) => setReflections(prev => ({ ...prev, [`${activeModule}-${activeLesson}`]: e.target.value }))}
                    />
                </div>

                <Button 
                    disabled={!reflections[`${activeModule}-${activeLesson}`]?.trim()}
                    onClick={handleNext} 
                    className="w-full h-16 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50"
                >
                    Videre til udfordringen <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
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
                </div>

                <Button 
                    onClick={handleNext} 
                    className="w-full h-20 rounded-[2.5rem] bg-emerald-600 text-white font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                    {activeLesson < (currentModule?.lessons.length || 0) - 1 || activeModule < (course?.modules.length || 0) - 1 
                        ? "Næste Lektion" 
                        : "Gennemfør Kursus & Se Analyse"} <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
             </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
