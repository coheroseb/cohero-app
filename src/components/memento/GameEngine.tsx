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
  Sparkle,
  Target,
  History,
  TrendingUp,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

// --- TYPES ---
export type CardType = 'theorist' | 'concept' | 'paragraph' | 'content' | 'case' | 'tool' | 'dilemma' | 'principle';

export interface CardData {
  id: number;
  type: CardType;
  content: string;
  matchId: string;
}

export interface GamePair {
  itemA: string;
  itemB: string;
  difficulty: number;
}

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  lightColor: string;
  accentColor: string;
  pairs: GamePair[];
  cardAType: CardType;
  cardBType: CardType;
}

interface GameEngineProps {
  gameDef: GameDefinition;
  level: number;
  onGameEnd: (score: number, success: boolean) => void;
}

// --- HELPER FUNCTIONS ---
const shuffleArray = (array: any[]) => {
  return [...array].sort(() => Math.random() - 0.5);
};

const PremiumGlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] ${className}`}>
        {children}
    </div>
);

const GameCardComponent = ({ card, isFlipped, isMatched, onClick, colorGradient }: { card: CardData, isFlipped: boolean, isMatched: boolean, onClick: () => void, colorGradient: string }) => {
  return (
    <motion.div 
      className="relative w-full h-32 sm:h-40 md:h-48 cursor-pointer perspective-1000 group"
      onClick={onClick}
      whileHover={{ scale: isFlipped || isMatched ? 1 : 1.05, rotateZ: isFlipped || isMatched ? 0 : 1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ 
            rotateY: isFlipped || isMatched ? 180 : 0,
            x: !isFlipped && !isMatched ? [0, -2, 2, -2, 2, 0] : 0 
        }}
        transition={{ 
            rotateY: { type: 'spring', stiffness: 260, damping: 20 },
            x: { duration: 0.4, ease: "easeInOut", repeat: 0 }
        }}
      >
        {/* Front of Card */}
        <div className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 text-center rounded-[2rem] border-2 bg-white shadow-xl border-amber-50 hover:border-emerald-200 transition-colors`}>
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:bg-emerald-50 transition-colors duration-500">
            <Sparkle className="w-8 h-8 text-amber-300 group-hover:text-emerald-300 group-hover:rotate-45 transition-transform duration-700" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-900/10">Memento</span>
        </div>

        {/* Back of Card */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 text-center rounded-[2rem] border-2 shadow-2xl overflow-hidden ${isMatched ? 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-900/10' : 'bg-white border-white/10'}`}>
          {!isMatched && (
              <div className={`absolute inset-0 bg-gradient-to-br ${colorGradient} opacity-5`} />
          )}
          
          <div className="absolute top-4 left-4">
             <span className={`text-[8px] font-black uppercase tracking-widest opacity-30 ${isMatched ? 'text-emerald-500' : ''}`}>{card.type}</span>
          </div>

          <p className={`text-sm md:text-base font-bold leading-relaxed serif italic relative z-10 ${isMatched ? 'text-emerald-950' : 'text-slate-700'}`}>
            {card.content}
          </p>

          <AnimatePresence>
            {isMatched && (
                <motion.div 
                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                className="absolute bottom-4 right-4 w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20"
                >
                <CheckCircle className="w-5 h-5" />
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const GameEngine: React.FC<GameEngineProps> = ({ gameDef, level, onGameEnd }) => {
    const { toast } = useToast();
    
    const numPairs = useMemo(() => {
        // Reduced max pairs to 6 to ensure intuitiveness and better overview
        return Math.min(level + 3, 6, gameDef.pairs.length);
    }, [level, gameDef]);
    
    const gameData = useMemo(() => {
        // Pick difficulty based on level
        const maxDiff = level < 2 ? 1 : level < 5 ? 2 : 3;
        const minDiff = level < 3 ? 1 : 2;

        const availablePairs = gameDef.pairs.filter(p => p.difficulty >= minDiff && p.difficulty <= maxDiff);
        
        let finalPool = [...availablePairs];
        // If not enough cards in the desired difficulty range, fallback to any available
        if (finalPool.length < numPairs) {
            const fillers = gameDef.pairs.filter(p => !finalPool.find(fp => fp.itemA === p.itemA));
            finalPool = [...finalPool, ...fillers];
        }

        const selectedPairs = shuffleArray(finalPool).slice(0, numPairs);

        const cards: CardData[] = selectedPairs.flatMap((pair, index) => {
            const matchId = `match-${index}`;
            return [
                { id: index * 2, type: gameDef.cardAType, content: pair.itemA, matchId },
                { id: index * 2 + 1, type: gameDef.cardBType, content: pair.itemB, matchId },
            ];
        });
        return shuffleArray(cards);
    }, [gameDef, numPairs, level]);

    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedIds, setMatchedIds] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [startTime] = useState(Date.now());
    const [combo, setCombo] = useState(0);
    const [misses, setMisses] = useState(0);

    useEffect(() => {
        const uniqueMatchedCount = new Set(matchedIds).size;
        const allMatched = uniqueMatchedCount === numPairs;
        if (allMatched && numPairs > 0) {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            const timeBonus = Math.max(0, 100 - timeSpent);
            const finalScore = score + timeBonus;
            
            const timer = setTimeout(() => onGameEnd(finalScore, true), 1200);
            return () => clearTimeout(timer);
        }
    }, [matchedIds, numPairs, onGameEnd, score, startTime]);

    useEffect(() => {
        if (flippedIndices.length === 2) {
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = gameData[firstIndex];
            const secondCard = gameData[secondIndex];

            if (firstCard.matchId === secondCard.matchId) {
                setMatchedIds(prev => {
                    if (prev.includes(firstCard.matchId)) return prev;
                    return [...prev, firstCard.matchId];
                });
                const comboBonus = combo * 10;
                setScore(prev => prev + 20 + comboBonus);
                setCombo(prev => prev + 1);
                setFlippedIndices([]);
                
                toast({ 
                    title: combo > 0 ? `Perfekt! x${combo+1} streak` : "Match fundet!", 
                    description: "Din hukommelse er knivskarp." 
                });
            } else {
                setMisses(prev => prev + 1);
                const timer = setTimeout(() => {
                    setFlippedIndices([]);
                    setCombo(0);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [flippedIndices, gameData, combo, toast]);

    const handleCardClick = (index: number) => {
        if (flippedIndices.length < 2 && !flippedIndices.includes(index) && !matchedIds.includes(gameData[index].matchId)) {
            setFlippedIndices(prev => [...prev, index]);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <motion.div 
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-12 sticky top-6 z-[60]"
            >
                <PremiumGlassCard className="p-6 md:p-8 flex items-center justify-between border-emerald-950/5 shadow-2xl shadow-emerald-950/5">
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gameDef.color} flex items-center justify-center text-white shadow-lg`}>
                          {React.cloneElement(gameDef.icon as React.ReactElement, { className: 'w-7 h-7' })}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-amber-950 serif tracking-tight">{gameDef.title}</h2>
                          <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Level {level + 1}</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">
                                {new Set(matchedIds).size} ud af {numPairs} par
                              </span>
                          </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-10">
                        {combo > 1 && (
                            <motion.div 
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="hidden md:flex flex-col items-center"
                            >
                                <div className="flex items-center gap-1 text-emerald-500">
                                    <Flame className="w-5 h-5 fill-current" />
                                    <span className="text-xl font-black italic">x{combo}</span>
                                </div>
                                <span className="text-[8px] font-black uppercase text-emerald-400 tracking-tighter">Streak Bonus</span>
                            </motion.div>
                        )}
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Point</p>
                            <p className="text-4xl font-black text-emerald-950 serif leading-none">{score}</p>
                        </div>
                        <div className="hidden sm:block">
                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-50" />
                                    <circle 
                                        cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" 
                                        strokeDasharray={251.2} 
                                        strokeDashoffset={251.2 - (251.2 * (new Set(matchedIds).size / numPairs))} 
                                        className={`text-emerald-500 transition-all duration-1000 ease-out`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-black text-amber-950 serif">{Math.round((new Set(matchedIds).size / numPairs) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </PremiumGlassCard>
            </motion.div>

            <motion.div 
              layout
              className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-40 min-h-[600px]"
            >
                <AnimatePresence>
                  {gameData.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <GameCardComponent
                            card={card}
                            isFlipped={flippedIndices.includes(index)}
                            isMatched={matchedIds.includes(card.matchId)}
                            onClick={() => handleCardClick(index)}
                            colorGradient={gameDef.color}
                        />
                      </motion.div>
                  ))}
                </AnimatePresence>
            </motion.div>
            
            {/* Visual HUD Tips */}
            <div className="fixed bottom-10 left-10 hidden xl:block z-50">
                <PremiumGlassCard className="p-6 flex items-center gap-4 border-emerald-950/5">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Husk</p>
                        <p className="text-xs font-bold text-amber-950 italic">"Gå efter de teoretikere du kender først."</p>
                    </div>
                </PremiumGlassCard>
            </div>
        </div>
    );
};

export const GameOverScreen = ({ score, success, onRestart, onMenu, isSaving }: { score: number, success: boolean, onRestart: () => void, onMenu: () => void, isSaving: boolean }) => {
    return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative max-w-2xl mx-auto"
        >
            <PremiumGlassCard className="p-10 md:p-20 text-center overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-500" />
                
                <motion.div 
                    animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="w-32 h-32 bg-emerald-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner group"
                >
                  <Trophy className="w-14 h-14 text-emerald-500 group-hover:scale-110 transition-transform" />
                </motion.div>
                
                <h2 className="text-5xl font-black text-amber-950 serif mb-4 tracking-tight">Fantastisk fokus!</h2>
                <p className="text-lg text-slate-400 mb-12 italic font-medium">Du har mestret dette emne og styrket din viden.</p>
                
                <div className="grid grid-cols-2 gap-8 mb-16">
                    <div className="bg-white/50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-inner">
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3">Cohéro Points</p>
                        <p className="text-5xl font-black text-amber-950 serif leading-none">+{score}</p>
                    </div>
                    <div className="bg-emerald-950 p-8 rounded-[2.5rem] text-white shadow-2xl">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Videns-Level</p>
                        <p className="text-5xl font-black serif leading-none">Op!</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                    <Button 
                        onClick={onRestart} 
                        disabled={isSaving}
                        className="flex-1 h-20 rounded-[2rem] bg-emerald-950 text-white font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl shadow-emerald-900/20"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <RotateCcw className="w-5 h-5 mr-3" />}
                        {isSaving ? 'Gemmer...' : 'Spil Igen'}
                    </Button>
                    <Button 
                        onClick={onMenu} 
                        variant="outline"
                        className="flex-1 h-20 rounded-[2rem] border-emerald-100 font-black uppercase text-xs tracking-widest text-emerald-900 bg-white"
                    >
                        Menu
                    </Button>
                </div>
            </PremiumGlassCard>
            
            <div className="absolute -z-10 -top-20 inset-x-0 flex justify-center opacity-30">
                <Sparkles className="w-40 h-40 text-emerald-200 animate-pulse" />
            </div>
        </motion.div>
    );
};
