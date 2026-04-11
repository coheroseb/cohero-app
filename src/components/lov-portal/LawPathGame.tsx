
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Heart, 
  Zap, 
  Trophy, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  Trophy as TrophyIcon,
  Star,
  Brain,
  Scale,
  Gavel,
  ShieldCheck,
  BookOpen,
  Target,
  GraduationCap,
  Bird,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { generateQuizAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// --- GAME DATA: THE LAW TREE ---

const LAW_NODES = [
  {
    id: 'intro',
    title: 'Velkommen til Jurahaven',
    type: 'level',
    description: 'Begynd din rejse som juridisk mester.',
    icon: <Sparkles className="w-10 h-10" />,
    color: 'bg-emerald-500',
    lawId: 'barnets-lov',
  },
  {
    id: 'barnets-lov-1',
    title: 'Barnets Lov: Formålet',
    type: 'level',
    lawId: 'barnets-lov',
    chapterIdx: 0,
    icon: <ShieldCheck className="w-6 h-6" />,
    color: 'bg-blue-500',
  },
  {
    id: 'barnets-lov-2',
    title: 'Barnets Lov: Inddragelse',
    type: 'level',
    lawId: 'barnets-lov',
    chapterIdx: 1,
    icon: <Users className="w-6 h-6" />,
    color: 'bg-blue-500',
  },
  {
    id: 'fvl-intro',
    title: 'Forvaltningsloven: Grundstenen',
    type: 'milestone',
    description: 'Lær de regler der gælder for alle myndigheder.',
    icon: <Gavel className="w-8 h-8" />,
    color: 'bg-amber-500',
  },
  {
    id: 'fvl-1',
    title: 'FVL: Vejledningspligt',
    type: 'level',
    lawId: 'forvaltningsloven',
    chapterIdx: 0,
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-amber-500',
  },
  {
    id: 'fvl-2',
    title: 'FVL: Partshøring',
    type: 'level',
    lawId: 'forvaltningsloven',
    chapterIdx: 1,
    icon: <Brain className="w-6 h-6" />,
    color: 'bg-amber-500',
  },
  {
    id: 'retssikkerhed-1',
    title: 'Officialprincippet',
    type: 'level',
    lawId: 'retssikkerhedsloven',
    chapterIdx: 0,
    icon: <Scale className="w-6 h-6" />,
    color: 'bg-rose-500',
  },
  {
    id: 'master',
    title: 'Juridisk Ekspert',
    type: 'end',
    description: 'Du har mestret de mest fundamentale paragraffer!',
    icon: <TrophyIcon className="w-12 h-12" />,
    color: 'bg-indigo-600',
  }
];

// --- COMPONENTS ---

export default function LawPathGame() {
  const { user, userProfile, refetchUserProfile, setIsNavbarHidden } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const [gameState, setGameState] = useState<'path' | 'lesson' | 'finished'>('path');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hearts, setHearts] = useState(5);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  
  // Lesson state
  const [quizData, setQuizData] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [lessonScore, setLessonScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (userProfile) {
        setStreak(userProfile.dailyChallengeStreak || 0);
        setXp(userProfile.cohéroPoints || 0);
    }
  }, [userProfile]);

  useEffect(() => {
    setIsNavbarHidden(gameState !== 'path');
    return () => setIsNavbarHidden(false);
  }, [gameState, setIsNavbarHidden]);

  const handleStartNode = async (node: any) => {
    if (node.type === 'end') return;
    
    setSelectedNode(node);
    setGameState('lesson');
    setIsGenerating(true);
    setCurrentIdx(0);
    setLessonScore(0);
    setHearts(5);
    setIsAnswered(false);
    setSelectedAnswer(null);

    try {
        console.log("[LawPathGame] Starter lektion for:", node.title, "LawID:", node.lawId);
        const res = await generateQuizAction({
            topic: node.title,
            numQuestions: 5,
            difficulty: 'medium',
            lawId: node.lawId,
            profession: userProfile?.profession || 'socialrådgiver'
        });
        
        console.log("[LawPathGame] Modtog quiz data:", res);

        if (!res?.data || !res.data.questions || res.data.questions.length === 0) {
            throw new Error("AI'en returnerede ingen spørgsmål. Prøv et andet emne eller forsøg igen.");
        }

        setQuizData(res.data);
    } catch (e: any) {
        console.error("[LawPathGame] Fejl ved start af lektion:", e);
        toast({ 
            title: "Fejl", 
            description: e.message || "Kunne ikke starte lektionen. Prøv igen senere.", 
            variant: "destructive" 
        });
        setGameState('path');
    } finally {
        setIsGenerating(false);
    }
  };

  const currentQuestion = quizData?.questions[currentIdx];

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    
    const isCorrect = idx === currentQuestion.correctOptionIndex;
    setSelectedAnswer(idx);
    setIsAnswered(true);

    if (isCorrect) {
        setLessonScore(s => s + 1);
    } else {
        setHearts(h => Math.max(0, h - 1));
    }
  };

  const handleNext = () => {
    if (hearts <= 0) {
        setGameState('path');
        toast({ title: "Lektion stoppet", description: "Du løb tør for hjerter. Prøv igen senere!", variant: "destructive" });
        return;
    }

    if (currentIdx < quizData.questions.length - 1) {
        setCurrentIdx(i => i + 1);
        setIsAnswered(false);
        setSelectedAnswer(null);
    } else {
        handleFinishLesson();
    }
  };

  const handleFinishLesson = async () => {
    setGameState('finished');
    if (user && firestore) {
        const pointsToAdd = lessonScore * 20;
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            cohéroPoints: increment(pointsToAdd),
            lastLawPortalUsage: serverTimestamp()
        });
        await refetchUserProfile();
    }
  };

  if (gameState === 'lesson') {
    return (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center">
            {/* Header: Progress & Hearts */}
            <div className="w-full max-w-2xl px-6 py-8 flex items-center gap-6">
                <button onClick={() => setGameState('path')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIdx + (isAnswered ? 1 : 0)) / (quizData?.questions.length || 5)) * 100}%` }}
                        className="h-full bg-emerald-500"
                    />
                </div>
                <div className="flex items-center gap-2 text-rose-500 font-black">
                    <Heart className="w-6 h-6 fill-current" />
                    <span>{hearts}</span>
                </div>
            </div>

            <div className="flex-1 w-full max-w-2xl px-6 flex flex-col justify-center gap-12 pb-20">
                {isGenerating ? (
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Forbereder spørgsmål...</p>
                    </div>
                ) : (
                    <>
                        <motion.div 
                            key={currentIdx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <h2 className="text-2xl font-black text-slate-900 serif leading-tight">
                                {currentQuestion?.question}
                            </h2>
                            <div className="grid gap-3">
                                {currentQuestion?.options.map((opt: string, i: number) => {
                                    const isCorrect = i === currentQuestion.correctOptionIndex;
                                    const isSelected = i === selectedAnswer;
                                    
                                    let borderClass = 'border-slate-200 shadow-[0_4px_0_0_rgba(226,232,240,1)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(226,232,240,1)]';
                                    let bgClass = 'bg-white';
                                    
                                    if (isAnswered) {
                                        if (isCorrect) {
                                            borderClass = 'border-emerald-500 shadow-[0_4px_0_0_rgba(16,185,129,1)]';
                                            bgClass = 'bg-emerald-50 text-emerald-700';
                                        } else if (isSelected) {
                                            borderClass = 'border-rose-500 shadow-[0_4px_0_0_rgba(244,63,94,1)]';
                                            bgClass = 'bg-rose-50 text-rose-700';
                                        } else {
                                            bgClass = 'opacity-40';
                                        }
                                    }

                                    return (
                                        <button
                                            key={i}
                                            disabled={isAnswered}
                                            onClick={() => handleAnswer(i)}
                                            className={`w-full p-5 rounded-2xl border-2 text-left font-bold text-base transition-all ${borderClass} ${bgClass}`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {isAnswered && (
                            <motion.div 
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`fixed bottom-0 left-0 right-0 p-8 flex items-center justify-center ${selectedAnswer === currentQuestion.correctOptionIndex ? 'bg-emerald-100' : 'bg-rose-100'}`}
                            >
                                <div className="max-w-2xl w-full flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedAnswer === currentQuestion.correctOptionIndex ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            {selectedAnswer === currentQuestion.correctOptionIndex ? <CheckCircle2 /> : <AlertTriangle />}
                                        </div>
                                        <div>
                                            <p className={`font-black uppercase text-sm ${selectedAnswer === currentQuestion.correctOptionIndex ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {selectedAnswer === currentQuestion.correctOptionIndex ? 'Fantastisk!' : 'Ikke helt...'}
                                            </p>
                                            <p className="text-xs font-medium text-slate-600 line-clamp-1">{currentQuestion.explanation}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleNext}
                                        className={`h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] ${selectedAnswer === currentQuestion.correctOptionIndex ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'} text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)]`}
                                    >
                                        Fortsæt
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
  }

  if (gameState === 'finished') {
    return (
        <div className="fixed inset-0 bg-[#FDFCF8] z-[200] flex flex-col items-center justify-center p-6 text-center space-y-12">
            <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="w-32 h-32 bg-amber-400 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3"
            >
                <TrophyIcon className="w-16 h-16 text-white" />
            </motion.div>
            <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 serif">Lektion Gennemført!</h2>
                <p className="text-slate-500 font-medium">Du har optjent {lessonScore * 20} Cohero Points og mestret {selectedNode?.title}.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">XP OPTJENT</p>
                    <p className="text-2xl font-black text-amber-500">+{lessonScore * 20}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">DOMINANS</p>
                    <p className="text-2xl font-black text-emerald-500">100%</p>
                </div>
            </div>

            <Button 
                onClick={() => setGameState('path')}
                className="w-full max-w-sm h-16 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-2xl active:scale-95"
            >
                Vend tilbage til stien
            </Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-60 overflow-y-auto">
      {/* Top Stats Bar */}
      <div className="sticky top-0 z-50 bg-[#FDFCF8]/90 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
               >
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              </button>
              <div className="hidden sm:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lov-Stien</p>
                  <p className="text-xs font-bold text-slate-900">Niveau: Juridisk Aspirant</p>
              </div>
           </div>
           <div className="flex items-center gap-6 sm:gap-8">
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
                <Zap className="w-4 h-4 text-amber-500 fill-current" />
                <span className="text-sm font-black text-amber-950">{streak}</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                <Star className="w-4 h-4 text-blue-500 fill-current" />
                <span className="text-sm font-black text-blue-950">{xp}</span>
              </div>
              <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 shadow-sm">
                <Heart className={`w-4 h-4 text-rose-500 ${hearts === 0 ? 'opacity-20' : 'fill-current'}`} />
                <span className="text-sm font-black text-rose-950">{hearts}</span>
              </div>
           </div>
        </div>
      </div>

      {/* The Game Path */}
      <div className="max-w-2xl mx-auto pt-16 px-6 flex flex-col items-center">
        
        {/* Judge Owl Mascot Intro */}
        <div className="flex items-center gap-6 mb-20 bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-100/50 w-full">
             <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center relative shadow-2xl shadow-emerald-500/20 shrink-0">
                 <Bird className="w-10 h-10 text-white" />
                 <div className="absolute -top-2 -right-2 bg-amber-950 text-white p-2 rounded-xl shadow-xl border-2 border-white">
                    <Gavel className="w-3.5 h-3.5 text-amber-400" />
                 </div>
             </div>
             <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Juridisk Mentor</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                 </div>
                 <p className="text-sm font-bold text-emerald-950 leading-relaxed italic">
                    "Velkommen til stien, kollega! Jeg er Dommer-Uglen, din guide til paragrafferne. Er du klar til at mestre Juraen?"
                 </p>
             </div>
        </div>

        {/* The Nodes */}
        <div className="relative space-y-4 flex flex-col items-center w-full px-4">
            {/* SVG Connector Line */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-3 bg-slate-100 -z-10 rounded-full shadow-inner" />

            {LAW_NODES.map((node, idx) => {
                const isMilestone = node.type === 'milestone';
                const isBig = node.type === 'start' || node.type === 'end';
                
                // Zig-zag offset
                const offset = idx % 2 === 0 ? '-40px' : '40px';

                return (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        key={node.id}
                        style={{ marginLeft: (isMilestone || isBig) ? 0 : offset }}
                        className="flex flex-col items-center gap-4 py-10"
                    >
                        {isMilestone ? (
                            <div className="bg-white p-8 md:p-10 rounded-[3rem] border-2 border-slate-100 shadow-2xl max-w-xs text-center space-y-6 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000">
                                    {node.icon}
                                </div>
                                <div className={`w-20 h-20 ${node.color} rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl ring-8 ring-white group-hover:rotate-12 transition-transform`}>
                                    {node.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 serif tracking-tight mb-2">{node.title}</h3>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{node.description}</p>
                                </div>
                                <div className="pt-2">
                                     <div className="flex items-center justify-center gap-2 mb-4">
                                         {[1,2,3].map(i => <Star key={i} className="w-4 h-4 text-amber-200 fill-current" />)}
                                     </div>
                                     <Button className="w-full h-12 bg-amber-950 text-amber-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-amber-950/20 active:scale-95 group">
                                         Lås op <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                     </Button>
                                </div>
                            </div>
                        ) : isBig ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className={`w-28 h-28 ${node.color} rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl relative border-[6px] border-white group cursor-pointer hover:scale-110 transition-transform`}>
                                    {node.icon}
                                    <div className="absolute -inset-4 bg-emerald-400/10 rounded-full blur-2xl -z-10 group-hover:bg-emerald-400/20 transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-1">{node.type === 'start' ? 'START' : 'SLUT'}</p>
                                    <h4 className="text-lg font-black text-slate-900 serif">{node.title}</h4>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleStartNode(node)}
                                className={`w-24 h-24 ${node.color} rounded-full flex items-center justify-center text-white shadow-[0_10px_0_0_rgba(0,0,0,0.1)] active:translate-y-[4px] active:shadow-[0_6px_0_0_rgba(0,0,0,0.1)] transition-all hover:scale-110 relative group border-4 border-white`}
                            >
                                {node.icon}
                                
                                {/* Level Bubble Tooltip */}
                                <div className="absolute top-1/2 -right-4 translate-x-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 pointer-events-none z-20">
                                    <div className="bg-white px-6 py-4 rounded-[1.5rem] shadow-2xl border border-slate-100 w-48 relative">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">LEKTION</p>
                                        <p className="text-sm font-black text-slate-900 leading-snug">{node.title}</p>
                                        <div className="mt-3 flex items-center gap-1.5">
                                            <Star className="w-3 h-3 text-amber-400 fill-current" />
                                            <span className="text-[10px] font-bold text-slate-400">Giver +100 XP</span>
                                        </div>
                                        {/* Tooltip Corner */}
                                        <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white" />
                                    </div>
                                </div>

                                {/* Completed Checkmark (Mock) */}
                                {idx < 2 && (
                                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg border border-slate-50">
                                        <div className="bg-emerald-500 text-white p-1.5 rounded-full">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        )}
                    </motion.div>
                );
            })}
        </div>
      </div>

      {/* Floating Action Button for Daily Challenge */}
      <div className="fixed bottom-12 left-0 right-0 p-6 z-40 flex justify-center">
          <Button className="w-full max-w-sm h-20 rounded-[2.5rem] bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-4 active:scale-95 group border-2 border-white/10 ring-8 ring-amber-950/5">
             <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                <Target className="w-6 h-6" />
             </div>
             <div className="text-left flex-1">
                 <p className="text-[10px] font-black text-amber-400 group-hover:text-white transition-colors">DAGENS UDFORDRING</p>
                 <p className="text-lg font-black serif-premium">Retssikkerhed</p>
             </div>
             <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </Button>
      </div>
    </div>
  );
}
