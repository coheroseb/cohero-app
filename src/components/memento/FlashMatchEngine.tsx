'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Check, 
  X, 
  RotateCcw, 
  Zap, 
  Flame, 
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FlashMatchQuestion {
    text: string;
    isTrue: boolean;
}

export interface FlashMatchEngineProps {
  questions: FlashMatchQuestion[];
  level: number;
  onGameEnd: (score: number, success: boolean) => void;
  color: string;
}

export const FlashMatchEngine: React.FC<FlashMatchEngineProps> = ({ questions: allQuestions, level, onGameEnd, color }) => {
    // Filter questions based on level
    const questions = useMemo(() => {
        const maxDiff = level < 3 ? 1 : level < 7 ? 2 : 3;
        const eligible = allQuestions.filter(q => ((q as any).difficulty || 1) <= maxDiff);
        return eligible.length > 0 ? eligible : allQuestions;
    }, [allQuestions, level]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [results, setResults] = useState<{index: number, correct: boolean}[]>([]);
    
    // Framer Motion values for swiping
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    const greenBg = useTransform(x, [0, 150], ["rgba(16, 185, 129, 0)", "rgba(16, 185, 129, 0.1)"]);
    const redBg = useTransform(x, [-150, 0], ["rgba(244, 63, 94, 0.1)", "rgba(244, 63, 94, 0)"]);

    const currentQuestion = questions[currentIndex];

    const handleSwipe = (direction: 'left' | 'right') => {
        const isRight = direction === 'right';
        const isCorrect = isRight === currentQuestion.isTrue;

        if (isCorrect) {
            setScore(prev => prev + 100);
        }
        
        setResults(prev => [...prev, { index: currentIndex, correct: isCorrect }]);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            x.set(0); 
        } else {
            onGameEnd(score + (isCorrect ? 100 : 0), true);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto px-6 pb-20 mt-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex gap-1">
                    {questions.map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-6 h-1.5 rounded-full transition-all duration-500 
                                ${i < currentIndex ? (results[i]?.correct ? 'bg-emerald-500' : 'bg-rose-500') : 
                                  i === currentIndex ? 'bg-amber-400 w-10' : 'bg-slate-200'}`} 
                        />
                    ))}
                </div>
                <div className="flex items-center gap-4">
                     <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Score</p>
                         <p className="text-2xl font-black text-emerald-950 serif">{score}</p>
                     </div>
                </div>
            </div>

            {/* Hint */}
            <div className="text-center mb-12 space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Stillingtagen</p>
                 <h2 className="text-xl font-bold text-amber-950">Sandt eller Falsk?</h2>
            </div>

            {/* Card Stack */}
            <div className="relative h-[450px] w-full flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentIndex}
                        style={{ x, rotate, opacity }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.x > 100) handleSwipe('right');
                            else if (info.offset.x < -100) handleSwipe('left');
                        }}
                        className="absolute inset-0 bg-white border border-amber-100 rounded-[3rem] shadow-2xl p-10 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing group overflow-hidden"
                    >
                        {/* Dynamic Background Overlays */}
                        <motion.div style={{ backgroundColor: greenBg }} className="absolute inset-0 pointer-events-none" />
                        <motion.div style={{ backgroundColor: redBg }} className="absolute inset-0 pointer-events-none" />

                        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-10 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                            <Zap className="w-10 h-10 fill-current" />
                        </div>
                        
                        <p className="text-2xl md:text-3xl font-black text-amber-950 serif leading-tight">
                            "{currentQuestion.text}"
                        </p>

                        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center opacity-20 group-hover:opacity-40 transition-opacity">
                            <div className="flex items-center gap-2 text-rose-600 font-bold uppercase text-[10px] tracking-widest">
                                <X className="w-4 h-4" /> Swipe Falsk
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase text-[10px] tracking-widest">
                                Swipe Sandt <Check className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Buttons for Desktop */}
            <div className="mt-12 flex justify-center gap-6">
                <Button 
                    onClick={() => handleSwipe('left')}
                    variant="outline"
                    className="w-20 h-20 rounded-full border-rose-100 hover:bg-rose-500 hover:text-white text-rose-500 shadow-lg transition-all"
                >
                    <X className="w-8 h-8" />
                </Button>
                <Button 
                    onClick={() => handleSwipe('right')}
                    variant="outline"
                    className="w-20 h-20 rounded-full border-emerald-100 hover:bg-emerald-500 hover:text-white text-emerald-500 shadow-lg transition-all"
                >
                    <Check className="w-8 h-8" />
                </Button>
            </div>
            
            <div className="mt-12 text-center">
                 <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/50 backdrop-blur-md rounded-full border border-amber-100/50 shadow-sm">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tempo Bonus Aktiveret</p>
                 </div>
            </div>
        </div>
    );
};
