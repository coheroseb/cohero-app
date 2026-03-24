'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  CheckCircle, 
  Flame, 
  RotateCcw, 
  Trophy, 
  Loader2,
  Brain,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

// --- TYPES ---

export interface SentenceGameProps {
  gameDef: {
    id: string;
    title: string;
    color: string;
    pairs: { itemA: string; itemB: string; difficulty?: number }[];
  };
  level: number;
  onGameEnd: (score: number, success: boolean) => void;
}

const PremiumGlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] ${className}`}>
        {children}
    </div>
);

export const SentenceEngine: React.FC<SentenceGameProps> = ({ gameDef, level, onGameEnd }) => {
    const { toast } = useToast();
    
    // Choose 3 concepts for this round
    const rounds = useMemo(() => {
        // Choose difficulty based on level
        const maxDiff = level < 3 ? 1 : level < 7 ? 2 : 3;
        const eligiblePairs = gameDef.pairs.filter(p => (p.difficulty || 1) <= maxDiff);

        const shuffled = [...eligiblePairs].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3).map(pair => {
            // Remove punctuation and split into words
            const cleanSentence = pair.itemB.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            const words = cleanSentence.split(' ').filter(w => w.length > 0);
            return {
                term: pair.itemA,
                fullSentence: pair.itemB,
                shuffledWords: [...words].sort(() => Math.random() - 0.5),
                correctOrder: words
            };
        });
    }, [gameDef]);

    const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
    const [selectedWordIndices, setSelectedWordIndices] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [isWrong, setIsWrong] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const currentRound = rounds[currentRoundIdx];

    const handleWordClick = (word: string, poolIdx: number) => {
        if (isCorrect || isWrong) return;
        
        const nextWordIdx = selectedWordIndices.length;
        const expectedWord = currentRound.correctOrder[nextWordIdx];

        if (word === expectedWord) {
            const newSelected = [...selectedWordIndices, poolIdx];
            setSelectedWordIndices(newSelected);
            
            // Check if sentence is complete
            if (newSelected.length === currentRound.correctOrder.length) {
                setIsCorrect(true);
                setScore(prev => prev + 50);
                
                setTimeout(() => {
                    if (currentRoundIdx < rounds.length - 1) {
                        setCurrentRoundIdx(prev => prev + 1);
                        setSelectedWordIndices([]);
                        setIsCorrect(false);
                    } else {
                        onGameEnd(score + 50, true);
                    }
                }, 1500);
            }
        } else {
            setIsWrong(true);
            setMistakes(prev => prev + 1);
            setTimeout(() => setIsWrong(false), 800);
        }
    };

    const handleRemoveWord = () => {
        if (selectedWordIndices.length > 0 && !isCorrect) {
            setSelectedWordIndices(prev => prev.slice(0, -1));
        }
    };

    const selectedWords = selectedWordIndices.map(idx => currentRound.shuffledWords[idx]);

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pb-20">
            {/* Header Info */}
            <div className="mb-12 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gameDef.color} flex items-center justify-center text-white shadow-lg`}>
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-amber-950 serif">Begrebs-Byggeren</h2>
                        <div className="flex items-center gap-2">
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
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                    <p className="text-3xl font-black text-emerald-950 serif">{score}</p>
                </div>
            </div>

            {/* Main Stage */}
            <motion.div 
                key={currentRoundIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-10"
            >
                {/* Term and Instruction */}
                <div className="text-center space-y-4">
                    <motion.div 
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="inline-block px-10 py-4 bg-white/80 backdrop-blur-md border-2 border-amber-100 rounded-[2rem] shadow-xl shadow-amber-900/5"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1">Definer Begrebet</span>
                        <h3 className={`text-4xl font-black serif bg-gradient-to-br ${gameDef.color} bg-clip-text text-transparent`}>{currentRound.term}</h3>
                    </motion.div>
                </div>

                {/* Sentence Construction Area */}
                <div className={`min-h-[160px] p-8 rounded-[3rem] border-4 border-dashed transition-all duration-300 relative ${isWrong ? 'border-rose-200 bg-rose-50/30' : isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-white/40'}`}>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <AnimatePresence mode="popLayout">
                            {selectedWords.map((word, i) => (
                                <motion.div
                                    key={`${word}-${i}`}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="px-5 py-3 bg-white rounded-2xl shadow-md border border-slate-100 text-lg font-bold text-slate-700"
                                >
                                    {word}
                                </motion.div>
                            ))}
                            {selectedWords.length === 0 && (
                                <motion.p 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 0.3 }} 
                                    className="text-lg font-medium italic text-slate-400 py-3"
                                >
                                    Tryk på ordene for at bygge definitionen...
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {isCorrect && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-emerald-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Perfekt Matchet!
                            </motion.div>
                        )}
                        {isWrong && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-rose-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
                            >
                                <AlertCircle className="w-4 h-4" />
                                Prøv igen
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Word Pool */}
                <div className="space-y-6">
                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300">Ord-pujlen</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {currentRound.shuffledWords.map((word, i) => {
                            const isAlreadyPlaced = selectedWordIndices.includes(i);

                            return (
                                <motion.button
                                    key={`${word}-${i}`}
                                    disabled={isAlreadyPlaced || isCorrect}
                                    onClick={() => handleWordClick(word, i)}
                                    whileHover={{ scale: isAlreadyPlaced ? 1 : 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-6 py-4 rounded-[1.5rem] font-bold text-lg transition-all duration-300 shadow-sm
                                        ${isAlreadyPlaced 
                                            ? 'bg-slate-50 text-transparent border-transparent shadow-none cursor-default' 
                                            : 'bg-white border-b-4 border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                                        }`}
                                >
                                    {word}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Backspace Button */}
                <div className="flex justify-center pt-6">
                    <Button
                        variant="ghost"
                        onClick={handleRemoveWord}
                        className="text-slate-400 hover:text-rose-500 transition-colors uppercase text-[10px] font-black tracking-widest gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Slet seneste ord
                    </Button>
                </div>
            </motion.div>

            {/* Duolingo-style Footer Tip */}
            <div className="fixed bottom-10 inset-x-0 px-6 pointer-events-none">
                <div className="max-w-xl mx-auto">
                    <div className="bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-[2.5rem] p-6 shadow-2xl flex items-center gap-6 pointer-events-auto">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Sparkles className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Studietip</p>
                            <p className="text-sm font-bold text-emerald-950 italic">"Læs hele definitionen højt for dig selv for at styrke hukommelsen."</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
