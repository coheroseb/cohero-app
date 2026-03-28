'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, BrainCircuit, Check, HelpCircle, Loader2, Sparkles, X, 
  Trophy, History, Timer, BarChart3, BookOpen, Quote, 
  ChevronRight, AlertCircle, RefreshCw, Star, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { generateQuizAction, saveQuizResultAction } from '@/app/actions';
import type { QuizData } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { doc, getDoc, writeBatch, serverTimestamp, increment, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import confetti from 'canvas-confetti';

type Difficulty = 'easy' | 'medium' | 'hard';
type SourceType = 'topic' | 'text';

function QuizCreatorPageContent() {
  const [gameState, setGameState] = useState<'setup' | 'generating' | 'playing' | 'results'>('setup');
  const [sourceType, setSourceType] = useState<SourceType>('topic');
  const [topic, setTopic] = useState('');
  const [contextText, setContextText] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [useTimer, setUseTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();

  useEffect(() => {
    if (gameState === 'playing' && useTimer && !isAnswered) {
      setTimeLeft(30); // 30 seconds per question
    }
  }, [gameState, currentQuestionIndex, useTimer, isAnswered]);

  useEffect(() => {
    if (gameState === 'playing' && useTimer && !isAnswered && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isAnswered && gameState === 'playing' && useTimer) {
      handleAnswerSelect(-1); // Auto-fail on timeout
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isAnswered, gameState, useTimer]);

  const handleGenerateQuiz = async () => {
    const inputVal = sourceType === 'topic' ? topic : contextText;
    if (!inputVal.trim() || numQuestions < 3 || isGenerating) return;
    
    setGameState('generating');
    setError(null);
    setLimitError(null);

    if (!user || !firestore || !userProfile) {
        setError("Du er ikke logget ind. Log ind og prøv igen.");
        setGameState('setup');
        return;
    }
    
    setIsGenerating(true);
    const userRef = doc(firestore, 'users', user.uid);
    
    try {
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};
        
        // Limit Check for 'Kollega'
        if (userProfile.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership)) {
            const getWeek = (d: Date) => {
                const date = new Date(d.getTime());
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                const week1 = new Date(date.getFullYear(), 0, 4);
                return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
            };

            const lastUsage = userData.lastQuizCreatorUsage?.toDate();
            const now = new Date();
            let weeklyCount = userData.weeklyQuizCreatorCount || 0;

            if (lastUsage && (getWeek(lastUsage) !== getWeek(now) || lastUsage.getFullYear() !== now.getFullYear())) {
                weeklyCount = 0;
            }
            
            if (weeklyCount >= 3) {
                setLimitError('Du har brugt dine 3 ugentlige forsøg i Quiz-byggeren. Opgrader til Kollega+ for ubegrænset adgang.');
                setGameState('setup');
                setIsGenerating(false);
                return;
            }
        }

        const result = await generateQuizAction({ 
            topic: sourceType === 'topic' ? topic : "Baseret på kildemateriale", 
            numQuestions,
            difficulty,
            contextText: sourceType === 'text' ? contextText : undefined
        });

        if (result.data) {
            setQuizData(result.data);
            setCurrentQuestionIndex(0);
            setScore(0);
            setUserAnswers([]);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setGameState('playing');

            // Update Stats
            const batch = writeBatch(firestore);
            const userUpdates: {[key: string]: any} = {
                lastQuizCreatorUsage: serverTimestamp()
            };

            if (userProfile.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership)) {
                 const getWeek = (d: Date) => {
                    const date = new Date(d.getTime());
                    date.setHours(0, 0, 0, 0);
                    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                    const week1 = new Date(date.getFullYear(), 0, 4);
                    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
                };
                const lastUsage = userData.lastQuizCreatorUsage?.toDate();
                if (!lastUsage || getWeek(lastUsage) !== getWeek(new Date()) || lastUsage.getFullYear() !== new Date().getFullYear()) {
                    userUpdates.weeklyQuizCreatorCount = 1;
                } else {
                    userUpdates.weeklyQuizCreatorCount = increment(1);
                }
            }

            if (result.usage) {
                const totalTokens = result.usage.inputTokens + result.usage.outputTokens;
                const pointsToAdd = Math.round(totalTokens * 0.05);
                const tokenUsageCol = collection(firestore, 'users', user.uid, 'tokenUsage');
                batch.set(doc(tokenUsageCol), { flowName: 'generateQuiz', ...result.usage, totalTokens, createdAt: serverTimestamp() });
                if (pointsToAdd > 0) userUpdates.cohéroPoints = increment(pointsToAdd);
            }

            const activityRef = doc(collection(firestore, 'userActivities'));
            batch.set(activityRef, {
                userId: user.uid,
                userName: userProfile.username || user.displayName || 'Anonym bruger',
                actionText: `oprettede en quiz om "${topic || 'eget materiale'}" med Quiz-byggeren.`,
                createdAt: serverTimestamp(),
            });

            batch.update(userRef, userUpdates);
            await batch.commit();
            await refetchUserProfile();
        }
    } catch (err: any) {
      console.error(err);
      setError('Kunne ikke generere quizzen. Prøv venligst igen.');
      setGameState('setup');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    setUserAnswers(prev => [...prev, index]);

    const isCorrect = index === quizData?.questions[currentQuestionIndex].correctOptionIndex;
    if (isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setGameState('results');

      // Save the quiz result
      if (user && quizData) {
        const results = quizData.questions.map((q, idx) => ({
          question: q.question,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation,
          userAnswerIndex: userAnswers[idx] ?? -1
        }));

        saveQuizResultAction({
          userId: user.uid,
          result: {
            id: crypto.randomUUID(),
            lawId: '', // General quiz doesn't have a lawId
            lawTitle: '',
            topic: topic || "Baseret på kildemateriale",
            score: score,
            totalQuestions: numQuestions,
            results: results
          }
        });
      }

      if (score / numQuestions >= 0.8) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6']
        });
      }
    }
  };

  const handleRestart = () => {
    setGameState('setup');
    setTopic('');
    setContextText('');
    setQuizData(null);
  };
  
  const getButtonClass = (index: number) => {
    if (!isAnswered) {
      return "bg-white border-slate-100 hover:border-amber-200 hover:bg-amber-50 shadow-sm";
    }
    const correctIndex = quizData!.questions[currentQuestionIndex].correctOptionIndex;
    if (index === correctIndex) {
      return "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-lg shadow-emerald-900/10";
    }
    if (index === selectedAnswer && index !== correctIndex) {
      return "bg-rose-50 border-rose-500 text-rose-900 shadow-lg shadow-rose-900/10";
    }
    return "bg-slate-50 border-slate-100 opacity-60 grayscale";
  }

  const renderContent = () => {
    switch (gameState) {
      case 'generating':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-4"
          >
            <div className="relative w-24 h-24 mx-auto mb-8">
               <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
               <div className="relative w-24 h-24 bg-white border border-blue-100 rounded-full flex items-center justify-center shadow-xl">
                 <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
               </div>
            </div>
            <h2 className="text-2xl font-black text-amber-950 uppercase tracking-tighter mb-4">Bygger din opgraderede quiz...</h2>
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 4 }}
                        className="bg-blue-600 h-full"
                    />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI analyserer dit materiale og formulerer spørgsmål</p>
            </div>
          </motion.div>
        );

      case 'playing':
        if (!quizData) return null;
        const question = quizData.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + (isAnswered ? 1 : 0)) / numQuestions) * 100;

        return (
          <div className="max-w-3xl mx-auto w-full px-4 pt-12">
            <div className="mb-12">
                <div className="flex justify-between items-end mb-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spørgsmål {currentQuestionIndex + 1} / {numQuestions}</p>
                        <h3 className="text-xl font-black text-amber-950 uppercase tracking-tighter">I gang med quizzen</h3>
                    </div>
                    {useTimer && (
                        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border-2 transition-all ${timeLeft <= 5 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-white border-slate-100 text-slate-900 shadow-sm'}`}>
                            <Timer className="w-4 h-4" />
                            <span className="font-mono font-bold">{timeLeft}s</span>
                        </div>
                    )}
                </div>
                <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-slate-100 p-0.5">
                    <motion.div 
                        animate={{ width: `${progress}%` }}
                        className="bg-blue-600 h-full rounded-full shadow-lg shadow-blue-500/20"
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                >
                    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-amber-100/60 shadow-xl shadow-amber-900/5">
                        <h2 className="text-2xl md:text-3xl font-bold text-amber-950 mb-10 leading-tight serif">{question.question}</h2>
                        <div className="grid gap-4">
                            {question.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(index)}
                                    disabled={isAnswered}
                                    className={`w-full p-6 md:p-8 rounded-3xl border-2 text-left flex items-start gap-5 transition-all group relative overflow-hidden ${getButtonClass(index)}`}
                                >
                                    <div className={`w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-sm border-2 transition-all group-hover:scale-110
                                        ${isAnswered 
                                            ? index === question.correctOptionIndex ? 'bg-emerald-500 border-emerald-500 text-white' : index === selectedAnswer ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'
                                            : 'bg-slate-50 border-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:border-amber-200 group-hover:text-amber-950'
                                        }`}>
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <span className="flex-1 font-bold text-lg">{option}</span>
                                    {isAnswered && index === question.correctOptionIndex && (
                                        <Check className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                    )}
                                    {isAnswered && index === selectedAnswer && index !== question.correctOptionIndex && (
                                        <X className="w-6 h-6 text-rose-500 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence>
                        {isAnswered && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-amber-100/50 p-8 rounded-[2rem] border border-amber-200/60">
                                    <div className="flex items-center gap-2 mb-3 text-amber-900">
                                        <Sparkles className="w-5 h-5" />
                                        <h4 className="font-black uppercase tracking-widest text-xs">Læringspunkt</h4>
                                    </div>
                                    <p className="text-slate-800 font-medium leading-relaxed">{question.explanation}</p>
                                </div>
                                <Button onClick={handleNextQuestion} className="w-full h-20 rounded-3xl bg-slate-900 text-white hover:bg-black font-black uppercase text-sm tracking-widest shadow-xl shadow-slate-900/20 group">
                                    {currentQuestionIndex < numQuestions - 1 ? 'Gå til næste spørgsmål' : 'Se dine resultater'}
                                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </AnimatePresence>
          </div>
        );

      case 'results':
        const scorePercentage = (score / numQuestions) * 100;
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-xl mx-auto w-full px-4"
          >
            <div className="bg-white p-12 rounded-[3rem] border border-amber-100/60 shadow-2xl shadow-amber-900/10 space-y-8">
                <div className="relative w-32 h-32 mx-auto">
                    <div className={`absolute inset-0 rounded-full opacity-20 animate-pulse ${scorePercentage >= 80 ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
                    <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-50">
                        {scorePercentage >= 80 ? <Trophy className="w-16 h-16 text-amber-500" /> : <RefreshCw className="w-16 h-16 text-blue-500" />}
                    </div>
                </div>

                <div>
                    <h2 className="text-4xl font-black text-amber-950 uppercase tracking-tighter mb-2">Quiz Afsluttet!</h2>
                    <p className="text-slate-500 font-medium">Her er din præstation på niveauet <span className="text-amber-700 font-black">{difficulty === 'easy' ? 'Lektie' : difficulty === 'medium' ? 'Eksamen' : 'Ekspert'}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Korrekt Svaret</p>
                        <p className="text-4xl font-black text-amber-950 serif">{score} / {numQuestions}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Præcision</p>
                        <p className="text-4xl font-black text-amber-950 serif">{Math.round(scorePercentage)}%</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button onClick={handleRestart} className="h-16 rounded-2xl bg-amber-950 text-amber-400 hover:bg-black font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-900/20">
                        <RefreshCw className="w-4 h-4 mr-2" /> Start en ny quiz
                    </Button>
                    <Button onClick={() => setGameState('playing')} variant="ghost" className="h-14 rounded-2xl font-bold text-slate-500">
                        Gennemse mine svar
                    </Button>
                </div>
            </div>
          </motion.div>
        );

      case 'setup':
      default:
        return (
          <div className="max-w-2xl mx-auto w-full px-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-lime-50 text-lime-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-lime-900/5">
                        <BrainCircuit className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-black text-amber-950 uppercase tracking-tighter">Quiz-Arkitekten</h2>
                    <p className="text-slate-500 max-w-md mx-auto font-medium">Test din viden med skræddersyede AI-quizzer baseret på dine egne emner eller materialer.</p>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-amber-100/60 shadow-xl shadow-amber-900/5 space-y-10">
                    <div className="flex bg-slate-50 p-2 rounded-2xl">
                        {(['topic', 'text'] as SourceType[]).map(type => (
                            <button 
                                key={type}
                                onClick={() => setSourceType(type)}
                                className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                    ${sourceType === type ? 'bg-white text-amber-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {type === 'topic' ? <Sparkles className="w-3.5 h-3.5" /> : <Quote className="w-3.5 h-3.5" />}
                                {type === 'topic' ? 'Frit emne' : 'Referencetekst'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        {sourceType === 'topic' ? (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Hvad skal vi teste dig i?</label>
                                <Input
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="F.eks. 'Serviceloven § 85' eller 'Systemisk teori'..."
                                    className="h-16 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white text-lg font-bold"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Indsæt kildemateriale (Hele kapitler, noter m.m.)</label>
                                <Textarea
                                    value={contextText}
                                    onChange={(e) => setContextText(e.target.value)}
                                    placeholder="Indsæt teksten som quizzen skal tage udgangspunkt i her..."
                                    className="h-48 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white resize-none"
                                    required
                                />
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex justify-between">
                                    <span>Sværhedsgrad</span>
                                    <span className="text-amber-700 font-bold">{difficulty === 'easy' ? 'Lektie' : difficulty === 'medium' ? 'Eksamen' : 'Ekspert'}</span>
                                </label>
                                <div className="flex gap-2">
                                    {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                                        <button 
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`flex-1 h-12 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border-2
                                                ${difficulty === d ? 'border-amber-950 bg-amber-950 text-amber-400' : 'border-slate-100 text-slate-400 hover:border-amber-200'}`}
                                        >
                                            {d === 'easy' ? 'Lektie' : d === 'medium' ? 'Eksamen' : 'Ekspert'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex justify-between">
                                    <span>Antal spørgsmål</span>
                                    <span className="text-amber-700 font-bold">{numQuestions}</span>
                                </label>
                                <input
                                  type="range"
                                  min="3"
                                  max="15"
                                  value={numQuestions}
                                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-950 mt-4"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <button 
                                onClick={() => setUseTimer(!useTimer)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all border font-black uppercase text-[10px] tracking-widest
                                    ${useTimer ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                                <Timer className="w-4 h-4" />
                                Brug Timer (30s)
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        {limitError && (
                            <div className="bg-amber-50 border-2 border-dashed border-amber-200 text-amber-950 p-6 rounded-3xl text-center space-y-3">
                                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                                <div className="space-y-1">
                                    <h3 className="font-black uppercase tracking-widest text-xs">Ugentlig grænse nået</h3>
                                    <p className="text-sm font-medium opacity-70">{limitError}</p>
                                </div>
                                <Link href="/upgrade" className="inline-block px-6 py-2 bg-amber-950 text-amber-400 rounded-xl font-black uppercase text-[10px] tracking-tight">Opgrader nu</Link>
                            </div>
                        )}
                        {error && <p className="text-sm font-bold text-red-500 text-center animate-bounce">{error}</p>}
                        
                        <Button 
                            onClick={handleGenerateQuiz}
                            disabled={isGenerating || !!limitError || (sourceType === 'topic' ? !topic.trim() : !contextText.trim())}
                            className="w-full h-20 rounded-[2rem] bg-slate-900 text-white hover:bg-black font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-slate-950/20 active:scale-95 transition-all"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5 mr-3" />}
                            {isGenerating ? 'Genererer Spørgsmål...' : 'Byg Min Quiz'}
                        </Button>
                    </div>
                </div>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col pt-28 pb-32">
        <header className="fixed top-28 left-0 right-0 z-40 px-4 pointer-events-none">
            <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
                <Link href="/portal" className="p-4 bg-white/80 backdrop-blur-md hover:bg-white border border-amber-100 rounded-3xl transition-all text-amber-950 shadow-md shadow-amber-900/5">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
            </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center py-12">
            {renderContent()}
        </main>
    </div>
  );
}

export default function QuizCreatorPage() {
  const { user, isUserLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FDFCF8]">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl border border-amber-50 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Konfigurerer quiz-motor...</p>
      </div>
    );
  }

  return <QuizCreatorPageContent />;
}
