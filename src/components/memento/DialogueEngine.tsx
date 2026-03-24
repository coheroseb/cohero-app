'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare,
  Volume2,
  CheckCircle, 
  XCircle,
  Brain,
  Sparkles,
  ChevronRight,
  Heart,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DialogueRound {
    scenario: string;
    clientQuote: string;
    difficulty?: number;
    options: {
        text: string;
        isCorrect: boolean;
        feedback: string;
    }[];
}

export interface DialogueEngineProps {
  rounds: DialogueRound[];
  level: number;
  onGameEnd: (score: number, success: boolean) => void;
  color: string;
}

const PremiumGlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] ${className}`}>
        {children}
    </div>
);

export const DialogueEngine: React.FC<DialogueEngineProps> = ({ rounds: allRounds, level, onGameEnd, color }) => {
    
    // Filter rounds based on level
    const rounds = useMemo(() => {
        const maxDiff = level < 3 ? 1 : level < 7 ? 2 : 3;
        const eligible = allRounds.filter(r => (r.difficulty || 1) <= maxDiff);
        return eligible.length > 0 ? eligible : allRounds;
    }, [allRounds, level]);

    const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [isRoundFinished, setIsRoundFinished] = useState(false);

    const currentRound = rounds[currentRoundIdx];

    const handleOptionSelect = (idx: number) => {
        if (isRoundFinished) return;
        setSelectedOption(idx);
        setIsRoundFinished(true);

        if (rounds[currentRoundIdx].options[idx].isCorrect) {
            setScore(prev => prev + 100);
        }

        setTimeout(() => {
            if (currentRoundIdx < rounds.length - 1) {
                // Wait for user to read feedback before next round
                // We'll show a "Næste" button instead of auto-advance
            } else if (rounds[currentRoundIdx].options[idx].isCorrect) {
                 // onGameEnd(score + 100, true); // Handled by button
            }
        }, 1000);
    };

    const handleNext = () => {
        if (currentRoundIdx < rounds.length - 1) {
            setCurrentRoundIdx(prev => prev + 1);
            setSelectedOption(null);
            setIsRoundFinished(false);
        } else {
            onGameEnd(score, true);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pb-20">
            {/* Header */}
            <div className="mb-12 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
                        <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-amber-950 serif">Samtale-Simulatoren</h2>
                        <div className="flex gap-1">
                            {[...Array(rounds.length)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-8 h-1.5 rounded-full transition-all duration-500 ${i < currentRoundIdx ? 'bg-emerald-500' : i === currentRoundIdx ? 'bg-amber-400 w-12' : 'bg-slate-200'}`} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                    <p className="text-3xl font-black text-emerald-950 serif">{score}</p>
                </div>
            </div>

            {/* Scenario Card */}
            <motion.div 
                key={currentRoundIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <PremiumGlassCard className="p-10 border-amber-950/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Brain className="w-24 h-24" />
                    </div>
                    <div className="space-y-6 relative z-10 text-center">
                        <div className="px-5 py-1.5 bg-amber-950/5 rounded-full inline-block">
                             <span className="text-[10px] font-black uppercase tracking-widest text-amber-900/60">Scenarie</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-950 leading-snug max-w-2xl mx-auto italic">
                            "{currentRound.scenario}"
                        </p>
                    </div>
                </PremiumGlassCard>

                {/* Audio/Quote Card */}
                <div className="flex justify-center -mt-12 relative z-20">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-amber-950 p-8 rounded-[3rem] shadow-2xl max-w-md w-full border border-white/10"
                    >
                        <div className="flex items-start gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                                <Volume2 className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60">Borgeren siger:</p>
                                <p className="text-lg font-black text-white leading-relaxed font-serif">
                                    "{currentRound.clientQuote}"
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Options */}
                <div className="grid gap-4 mt-8">
                    {currentRound.options.map((option, i) => {
                        const isSelected = selectedOption === i;
                        const showCorrect = isRoundFinished && option.isCorrect;
                        const showWrong = isRoundFinished && isSelected && !option.isCorrect;

                        return (
                            <motion.button
                                key={i}
                                disabled={isRoundFinished}
                                onClick={() => handleOptionSelect(i)}
                                whileHover={!isRoundFinished ? { scale: 1.01, x: 10 } : {}}
                                className={`p-6 rounded-[2rem] border-2 text-left transition-all duration-300 flex items-center gap-6 
                                    ${isSelected ? 'shadow-xl' : 'shadow-sm'}
                                    ${showCorrect ? 'bg-emerald-50 border-emerald-500' : 
                                      showWrong ? 'bg-rose-50 border-rose-500' : 
                                      isSelected ? 'bg-white border-amber-950' : 'bg-white border-transparent hover:border-amber-100'}
                                `}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 
                                    ${showCorrect ? 'bg-emerald-500 text-white' : 
                                      showWrong ? 'bg-rose-500 text-white' : 
                                      isSelected ? 'bg-amber-900 text-white' : 'bg-slate-50 text-slate-300'}
                                `}>
                                    {showCorrect ? <CheckCircle className="w-6 h-6" /> : 
                                     showWrong ? <XCircle className="w-6 h-6" /> : 
                                     <span className="text-sm font-black italic">{String.fromCharCode(65 + i)}</span>}
                                </div>
                                <div className="flex-grow">
                                    <p className={`text-lg font-bold ${isSelected || showCorrect || showWrong ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {option.text}
                                    </p>
                                    {isRoundFinished && isSelected && (
                                        <motion.p 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className={`text-sm mt-2 italic font-medium ${option.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}
                                        >
                                            {option.feedback}
                                        </motion.p>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Action Bar */}
                <AnimatePresence>
                    {isRoundFinished && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center pt-8"
                        >
                            <Button 
                                onClick={handleNext}
                                size="lg"
                                className={`h-20 px-12 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl gap-3
                                    ${currentRound.options[selectedOption!].isCorrect ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-950 hover:bg-amber-900'}
                                `}
                            >
                                {currentRoundIdx < rounds.length - 1 ? (
                                    <>Næste Scenarie <ChevronRight className="w-5 h-5" /></>
                                ) : (
                                    <>Afslut Simulation <Sparkles className="w-5 h-5 text-amber-400" /></>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
