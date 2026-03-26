'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Trophy, ChevronRight, RotateCcw, BrainCircuit, CheckCircle2, AlertTriangle, Zap, ArrowRight, Info, List, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateQuizAction, saveQuizResultAction } from '@/app/actions';
import { useApp } from '@/app/provider';
import type { QuizData } from '@/ai/flows/types';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

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

const LawQuizModal: React.FC<LawQuizModalProps> = ({ isOpen, onClose, lawId, lawTitle, chapters = [] }) => {
  const { user, userProfile } = useApp();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<'setup' | 'generating' | 'playing' | 'results'>('setup');
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | 'all'>('all');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userResults, setUserResults] = useState<any[]>([]);

  const handleStartQuiz = async () => {
    setIsGenerating(true);
    setGameState('generating');
    setError(null);

    let contextText = '';
    let finalTopic = lawTitle;

    if (selectedChapterIdx !== 'all' && chapters[selectedChapterIdx]) {
        const chapter = chapters[selectedChapterIdx];
        finalTopic = `${lawTitle} (${chapter.nummer} ${chapter.titel})`;
        contextText = `Dette er teksten fra ${chapter.nummer} ${chapter.titel}:\n\n` + 
            chapter.paragraffer.map(p => `${p.nummer} ${p.tekst}`).join('\n\n');
    }

    try {
      const response = await generateQuizAction({ 
        topic: finalTopic, 
        numQuestions: 5,
        lawId: selectedChapterIdx === 'all' ? lawId : undefined, // Only use full law context if no specific chapter
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
    if (isAnswered || !quizData) return;
    
    const correctIndex = quizData.questions[currentQuestionIndex].correctOptionIndex;
    const isCorrect = index === correctIndex;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (isCorrect) setScore(s => s + 1);
    
    setUserResults(prev => [...prev, {
        question: quizData.questions[currentQuestionIndex].question,
        isCorrect,
        chosenIndex: index,
        correctIndex: correctIndex
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
                  lawId,
                  lawTitle,
                  topic: finalTopic,
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-amber-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-[#FDFCF8] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        <div className="p-6 border-b border-amber-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
                    <BrainCircuit className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-amber-950 serif">Faglig Test</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-amber-50 rounded-xl transition-colors shrink-0">
                <X className="w-6 h-6 text-amber-900" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {gameState === 'setup' && (
                <div className="text-center py-4 space-y-8 animate-ink">
                    <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner text-amber-200">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-amber-950 serif mb-2">{lawTitle}</h3>
                        <p className="text-slate-500 max-w-md mx-auto text-sm italic">
                            Vælg om du vil testes i hele loven eller et specifikt kapitel.
                        </p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto text-left">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/40 px-2 flex items-center gap-2">
                            <List className="w-3 h-3" /> Vælg Fokusområde
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

                    {error && <p className="text-rose-600 font-bold text-sm bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>}
                    
                    <Button onClick={handleStartQuiz} size="lg" className="h-16 px-12 rounded-2xl shadow-xl shadow-amber-950/10 active:scale-95 group w-full max-w-md mx-auto">
                        Start Test <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}

            {gameState === 'generating' && (
                <div className="py-20 text-center space-y-6">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-amber-950/20 mx-auto" />
                        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-amber-950 animate-pulse" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-900/40 animate-pulse">Bygger din test...</p>
                </div>
            )}

            {gameState === 'playing' && quizData && (
                <div className="space-y-10 animate-ink">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Spørgsmål {currentQuestionIndex + 1} af {quizData.questions.length}</span>
                        <div className="flex gap-1">
                            {quizData.questions.map((_, i) => (
                                <div key={i} className={`w-6 h-1.5 rounded-full ${i === currentQuestionIndex ? 'bg-amber-950' : i < currentQuestionIndex ? 'bg-emerald-500' : 'bg-amber-100'}`} />
                            ))}
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-amber-950 serif text-center leading-tight">
                        {quizData.questions[currentQuestionIndex].question}
                    </h3>

                    <div className="grid gap-3">
                        {quizData.questions[currentQuestionIndex].options.map((opt, idx) => {
                            let statusClass = "bg-white border-amber-100 hover:border-amber-950";
                            if (isAnswered) {
                                if (idx === quizData.questions[currentQuestionIndex].correctOptionIndex) {
                                    statusClass = "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-lg";
                                } else if (idx === selectedAnswer) {
                                    statusClass = "bg-rose-50 border-rose-500 text-rose-950 opacity-70";
                                } else {
                                    statusClass = "bg-white border-amber-50 text-slate-300";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    disabled={isAnswered}
                                    onClick={() => handleAnswerSelect(idx)}
                                    className={`w-full p-5 rounded-2xl border-2 text-left flex items-start gap-4 transition-all duration-300 ${statusClass}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border-2 border-current ${isAnswered && idx === quizData.questions[currentQuestionIndex].correctOptionIndex ? 'bg-emerald-500 text-white border-emerald-500' : ''}`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="flex-1 font-medium leading-relaxed">{opt}</span>
                                </button>
                            );
                        })}
                    </div>

                    {isAnswered && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-amber-50 rounded-3xl border border-amber-100 shadow-inner">
                            <div className="flex items-center gap-2 mb-3 text-amber-950">
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Faglig Forklaring</span>
                            </div>
                            <p className="text-sm text-slate-700 italic leading-relaxed">
                                {quizData.questions[currentQuestionIndex].explanation}
                            </p>
                            <Button onClick={handleNextQuestion} className="w-full mt-8 h-12 shadow-lg shadow-amber-950/10 rounded-xl">
                                {currentQuestionIndex < (quizData?.questions.length || 0) - 1 ? 'Næste spørgsmål' : 'Se Resultat'}
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </motion.div>
                    )}
                </div>
            )}

            {gameState === 'results' && (
                <div className="text-center py-10 space-y-10 animate-ink">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 bg-amber-50 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner text-amber-500">
                            <Trophy className="w-16 h-16 animate-bounce" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-3xl font-bold text-amber-950 serif mb-2">Mesterligt klaret!</h3>
                        <p className="text-slate-500 italic">Din besvarelse er arkiveret i dit fremskridts-dashboard.</p>
                    </div>

                    <div className="bg-amber-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-2">Din Score</p>
                        <div className="text-7xl font-black serif leading-none">{score}<span className="text-2xl text-amber-100/30">/5</span></div>
                        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                            <div className="text-left">
                                <p className="text-[8px] font-black uppercase text-amber-400">Præcision</p>
                                <p className="text-xl font-bold">{(score / 5 * 100).toFixed(0)}%</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black uppercase text-amber-400">Status</p>
                                <p className="text-xl font-bold text-emerald-400">Gemt</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 max-w-sm mx-auto">
                        <Button variant="outline" onClick={handleStartQuiz} className="flex-1 h-14 rounded-2xl">
                            <RotateCcw className="w-4 h-4 mr-2" /> Prøv igen
                        </Button>
                        <Button onClick={onClose} className="flex-1 h-14 rounded-2xl">
                            Afslut
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LawQuizModal;
