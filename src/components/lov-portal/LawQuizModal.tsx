'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Sparkles, Loader2, Trophy, ChevronRight, RotateCcw, 
  BrainCircuit, CheckCircle2, AlertTriangle, Zap, ArrowRight, 
  Info, List, ChevronDown, Target, Activity, ShieldCheck, 
  Star, Timer, HelpCircle, BookOpen, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateQuizAction, saveQuizResultAction } from '@/app/actions';
import { useApp } from '@/app/provider';
import type { QuizData } from '@/ai/flows/types';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from "@/components/ui/progress";

interface Chapter {
  nummer: string;
  titel: string;
  paragraffer: {
    nummer: string;
    tekst: string;
  }[];
}

interface LawQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  lawId: string;
  lawTitle: string;
  chapters?: Chapter[];
}

type Difficulty = 'easy' | 'medium' | 'hard';
type QuizMode = 'fact' | 'case';

const LawQuizModal: React.FC<LawQuizModalProps> = ({ isOpen, onClose, lawId, lawTitle, chapters = [] }) => {
  const { user, userProfile, setIsNavbarHidden } = useApp();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<'setup' | 'generating' | 'playing' | 'results'>('setup');
  
  useEffect(() => {
    if (isOpen) {
        setIsNavbarHidden(true);
    } else {
        setIsNavbarHidden(false);
    }
    return () => setIsNavbarHidden(false);
  }, [isOpen, setIsNavbarHidden]);

  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | 'all'>('all');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [quizMode, setQuizMode] = useState<QuizMode>('fact');
  
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(false);

  const currentQuestion = useMemo(() => quizData?.questions[currentQuestionIndex], [quizData, currentQuestionIndex]);
  const progressPercent = useMemo(() => quizData ? ((currentQuestionIndex) / quizData.questions.length) * 100 : 0, [currentQuestionIndex, quizData]);

  const handleStartQuiz = async () => {
    setIsGenerating(true);
    setGameState('generating');
    setError(null);
    setShowReview(false);

    let contextText = '';
    let finalTopic = lawTitle;

    if (selectedChapterIdx !== 'all' && chapters[selectedChapterIdx]) {
        const chapter = chapters[selectedChapterIdx];
        finalTopic = `${lawTitle} (${chapter.nummer} ${chapter.titel})`;
        contextText = `Dette er teksten fra ${chapter.nummer} ${chapter.titel}:\n\n` + 
            chapter.paragraffer.map(p => `${p.nummer} ${p.tekst}`).join('\n\n');
    }

    const topicSuffix = quizMode === 'case' ? " (Fokusér på virkelige cases og dilemmaer)" : " (Fokusér på juridiske detaljer og fakta)";

    try {
      const response = await generateQuizAction({ 
        topic: finalTopic + topicSuffix, 
        numQuestions: 5,
        difficulty,
        lawId: selectedChapterIdx === 'all' ? lawId : undefined,
        contextText: contextText || undefined
      });
      
      setQuizData(response.data);
      setGameState('playing');
      setCurrentQuestionIndex(0);
      setScore(0);
      setUserResults([]);
    } catch (err) {
      console.error(err);
      setError("Kunne ikke generere quiz. Prøv igen.");
      setGameState('setup');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswered || !currentQuestion) return;
    
    const correctIndex = currentQuestion.correctOptionIndex;
    const isCorrect = index === correctIndex;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (isCorrect) {
        setScore(s => s + 1);
    }
    
    setUserResults(prev => [...prev, {
        question: currentQuestion.question,
        isCorrect,
        chosenIndex: index,
        correctIndex: correctIndex,
        explanation: currentQuestion.explanation
    }]);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setGameState('results');
      if (user) {
          const finalTopic = selectedChapterIdx === 'all' 
            ? lawTitle 
            : `${lawTitle}: ${chapters[selectedChapterIdx as number].nummer}`;

          await saveQuizResultAction({
              userId: user.uid,
              result: {
                  id: crypto.randomUUID(),
                  lawId,
                  lawTitle,
                  topic: `${finalTopic} (${difficulty === 'easy' ? 'Begynder' : difficulty === 'hard' ? 'Ekspert' : 'Øvet'})`,
                  score,
                  totalQuestions: quizData?.questions.length || 5,
                  results: userResults
              }
          });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="absolute inset-0 bg-amber-950/80 backdrop-blur-xl" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-[#FDFCF8] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
      >
        {/* HEADER */}
        <div className="p-6 sm:p-8 bg-white/50 backdrop-blur-md border-b border-amber-100/50 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-950 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/20 rotate-3">
                    <BrainCircuit className="w-7 h-7" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-amber-950 serif tracking-tight">Faglig Test 2.0</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">AI-Drevet Vidensboard</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all shrink-0 active:scale-95 group">
                <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative">
            <AnimatePresence mode="wait">
                {/* SETUP STATE */}
                {gameState === 'setup' && (
                    <motion.div 
                        key="setup"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-10 py-4"
                    >
                        <div className="text-center space-y-4">
                            <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner text-amber-700 animate-ink">
                                <GraduationCap className="w-12 h-12" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-amber-950 serif-premium mb-2">{lawTitle}</h3>
                                <p className="text-slate-500 max-w-md mx-auto text-sm font-medium italic">
                                    Finjustér din test for at maksimere dit læringsudbytte.
                                </p>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8">
                            {/* FOCUS SELECTION */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/60 px-2 flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5" /> Fokusområde
                                </label>
                                <div className="relative group">
                                    <select 
                                        value={selectedChapterIdx} 
                                        onChange={(e) => setSelectedChapterIdx(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                        className="w-full h-14 pl-5 pr-10 bg-white border border-amber-100 rounded-2xl text-sm font-bold text-amber-950 appearance-none focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all cursor-pointer shadow-sm"
                                    >
                                        <option value="all">Hele loven (Anbefalet)</option>
                                        {chapters.map((c, i) => (
                                            <option key={i} value={i}>{c.nummer} {c.titel}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-300 pointer-events-none group-hover:text-amber-950 transition-colors" />
                                </div>
                            </div>

                            {/* DIFFICULTY */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/60 px-2 flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5" /> Niveau
                                </label>
                                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level)}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${difficulty === level ? 'bg-white text-amber-950 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {level === 'easy' ? 'Begynder' : level === 'medium' ? 'Øvet' : 'Ekspert'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* MODE SELECTION */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/60 px-2 flex items-center gap-2">
                                <BrainCircuit className="w-3.5 h-3.5" /> Test-Mode
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setQuizMode('fact')}
                                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${quizMode === 'fact' ? 'bg-amber-50 border-amber-950 shadow-xl' : 'bg-white border-amber-50 hover:border-amber-200'}`}
                                >
                                    <BookOpen className={`w-6 h-6 ${quizMode === 'fact' ? 'text-amber-950' : 'text-slate-300'}`} />
                                    <div className="text-center">
                                        <p className="text-xs font-black uppercase tracking-wider text-amber-950">Fakta & Jura</p>
                                        <p className="text-[9px] text-slate-400 mt-1">Rent fokus på lovteksten</p>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => setQuizMode('case')}
                                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${quizMode === 'case' ? 'bg-amber-50 border-amber-950 shadow-xl' : 'bg-white border-amber-50 hover:border-amber-200'}`}
                                >
                                    <ShieldCheck className={`w-6 h-6 ${quizMode === 'case' ? 'text-amber-950' : 'text-slate-300'}`} />
                                    <div className="text-center">
                                        <p className="text-xs font-black uppercase tracking-wider text-amber-950">Case-Baseret</p>
                                        <p className="text-[9px] text-slate-400 mt-1">Dilemmaer fra praksis</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {error && <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-rose-600 font-bold text-xs bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center gap-3"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</motion.p>}
                        
                        <Button 
                            onClick={handleStartQuiz} 
                            size="lg" 
                            className="h-20 px-12 rounded-[2.5rem] bg-amber-950 hover:bg-black text-amber-400 shadow-2xl shadow-amber-950/30 active:scale-95 group w-full text-lg font-black serif-premium"
                        >
                            Start Test <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                        </Button>
                    </motion.div>
                )}

                {/* GENERATING STATE */}
                {gameState === 'generating' && (
                    <motion.div 
                        key="generating"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-32 text-center space-y-12"
                    >
                        <div className="relative">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="w-32 h-32 border-4 border-amber-100 border-t-amber-950 rounded-full mx-auto"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-amber-950 animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-xl font-bold text-amber-950 serif">Bygger din personlige test...</p>
                            <p className="text-xs text-slate-400 font-medium italic">Gemini analyserer {selectedChapterIdx === 'all' ? 'hele loven' : 'det valgte kapitel'} for mønstre.</p>
                        </div>
                    </motion.div>
                )}

                {/* PLAYING STATE */}
                {gameState === 'playing' && quizData && currentQuestion && (
                    <motion.div 
                        key="playing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                    >
                        {/* PROGRESS BOX */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
                                    <p className="text-sm font-bold text-amber-950">Spørgsmål {currentQuestionIndex + 1} / {quizData.questions.length}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Rigtige</p>
                                    <p className="text-sm font-black text-emerald-600">{score}</p>
                                </div>
                            </div>
                            <div className="h-2 bg-amber-50 rounded-full overflow-hidden border border-amber-100">
                                <motion.div 
                                    className="h-full bg-amber-950" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-amber-50 rounded-[3rem] border border-amber-100/50 shadow-inner">
                            <h3 className="text-2xl font-black text-amber-950 serif-premium text-center leading-tight">
                                {currentQuestion.question}
                            </h3>
                        </div>

                        <div className="grid gap-4">
                            {currentQuestion.options.map((opt, idx) => {
                                const isCorrect = idx === currentQuestion.correctOptionIndex;
                                const isSelected = idx === selectedAnswer;
                                
                                let statusClass = "bg-white border-amber-100 hover:border-amber-950 hover:shadow-lg";
                                if (isAnswered) {
                                    if (isCorrect) {
                                        statusClass = "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-lg scale-[1.02] z-10";
                                    } else if (isSelected) {
                                        statusClass = "bg-rose-50 border-rose-500 text-rose-950 opacity-80 scale-95";
                                    } else {
                                        statusClass = "bg-white border-transparent text-slate-300 grayscale opacity-40";
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        disabled={isAnswered}
                                        onClick={() => handleAnswerSelect(idx)}
                                        className={`w-full p-6 rounded-[2rem] border-2 text-left flex items-center gap-6 transition-all duration-500 ${statusClass} group`}
                                    >
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border-2 transition-all ${isAnswered && isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-400 border-slate-200 group-hover:bg-amber-950 group-hover:text-white group-hover:border-amber-950'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="flex-1 font-bold text-base leading-snug">{opt}</span>
                                        {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                                        {isAnswered && isSelected && !isCorrect && <X className="w-6 h-6 text-rose-600" />}
                                    </button>
                                );
                            })}
                        </div>

                        {isAnswered && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="space-y-8"
                            >
                                <div className="p-8 bg-white rounded-[3rem] border border-amber-100 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform">
                                        <BrainCircuit className="w-24 h-24" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-4 text-amber-950">
                                        <div className="p-2 bg-amber-50 rounded-lg"><Info className="w-5 h-5 text-amber-700" /></div>
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Faglig Dybdeforklaring</span>
                                    </div>
                                    <p className="text-sm text-slate-700 italic font-medium leading-relaxed relative z-10">
                                        {currentQuestion.explanation}
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleNextQuestion} 
                                    className="w-full h-16 rounded-[2rem] bg-amber-950 text-amber-400 shadow-xl shadow-amber-950/20 text-lg font-black serif-premium group"
                                >
                                    {currentQuestionIndex < (quizData?.questions.length || 0) - 1 ? 'Næste Udfordring' : 'Se Samlet Resultat'}
                                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* RESULTS STATE */}
                {gameState === 'results' && (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-12 py-4"
                    >
                        <div className="text-center space-y-6">
                            <div className="relative inline-block scale-110">
                                <div className="w-32 h-32 bg-amber-950 rounded-[3.5rem] flex items-center justify-center mx-auto shadow-2xl text-amber-400">
                                    <Trophy className="w-16 h-16" />
                                </div>
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -inset-4 bg-amber-400/20 rounded-full blur-xl -z-10"
                                />
                                <div className="absolute -top-3 -right-3 bg-emerald-500 text-white p-2.5 rounded-2xl shadow-xl shadow-emerald-950/20">
                                    <Star className="w-6 h-6 fill-current" />
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-4xl font-black text-amber-950 serif-premium mb-2">Test gennemført!</h3>
                                <p className="text-slate-500 font-medium italic max-w-sm mx-auto">
                                    {score === 5 ? 'Fejlfrit! Du har fuldstændig styr på dette område.' : score >= 3 ? 'Godt gået! Du har et solidt fundament.' : 'Fin start. Fortsæt træningen for at mestre stoffet.'}
                                </p>
                            </div>
                        </div>

                        {/* RESULTS GRID */}
                        <div className="grid grid-cols-2 gap-6 px-4">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-xl text-center space-y-2 group hover:scale-105 transition-all">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Præcision</p>
                                <p className="text-5xl font-black text-amber-950 serif-premium">{(score / 5 * 100).toFixed(0)}%</p>
                                <div className="h-1.5 w-12 bg-amber-100 mx-auto rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-950" style={{ width: `${(score/5*100)}%` }} />
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-xl text-center space-y-2 group hover:scale-105 transition-all">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rigtige svar</p>
                                <p className="text-5xl font-black text-amber-950 serif-premium">{score}<span className="text-xl text-slate-200">/5</span></p>
                                <div className="flex justify-center gap-1">
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} className={`w-2 h-2 rounded-full ${i <= score ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* REVIEW SECTION */}
                        <div className="space-y-4">
                             <Button 
                                variant="ghost" 
                                onClick={() => setShowReview(!showReview)}
                                className="w-full h-12 rounded-2xl text-slate-400 hover:text-amber-950 flex items-center justify-between px-6 bg-slate-50/50"
                            >
                                <div className="flex items-center gap-3">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Gennemgå besvarelser</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showReview ? 'rotate-180' : ''}`} />
                            </Button>

                            <AnimatePresence>
                                {showReview && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-4"
                                    >
                                        {(userResults || []).map((res, i) => (
                                            <div key={i} className="bg-white p-6 rounded-3xl border border-amber-100 space-y-4 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${res.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {res.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                    </div>
                                                    <p className="text-sm font-bold text-amber-950 leading-tight">{res.question}</p>
                                                </div>
                                                <div className="pl-11 border-l-2 border-amber-50 space-y-3">
                                                    <p className="text-xs text-slate-500 font-medium italic">"{res.explanation}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="outline" onClick={handleStartQuiz} className="flex-1 h-16 rounded-[2rem] border-2 border-amber-100 hover:bg-amber-50 hover:border-amber-950/20 text-amber-950 font-black tracking-widest text-[10px] uppercase">
                                <RotateCcw className="w-4 h-4 mr-2" /> Start Ny Test
                            </Button>
                            <Button onClick={onClose} className="flex-1 h-16 rounded-[2rem] bg-amber-950 text-amber-400 font-black tracking-widest text-[10px] uppercase shadow-xl shadow-amber-950/20">
                                Afslut Modul
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LawQuizModal;
