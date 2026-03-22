'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Brain, 
  Scale, 
  Users, 
  CheckSquare, 
  Clock, 
  X, 
  Star, 
  CheckCircle, 
  RotateCcw, 
  Award, 
  Trophy, 
  Sparkles, 
  Loader2,
  ChevronLeft,
  Zap,
  Target,
  Flame,
  ChevronDown,
  Layout,
  Search,
  Filter,
  Layers,
  Sparkle,
  History,
  TrendingUp,
  Bookmark,
  ChevronRight,
  ArrowUpRight,
  Activity,
  Lightbulb,
  MousePointer2,
  Timer,
  Medal,
  Dna
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

// --- GAME DATA ---

const gameDataSets = {
  theorist: {
    id: 'theorist',
    title: 'Teori-Tinder',
    description: 'Match teoretikere med deres kernebegreber.',
    icon: <Users className="w-6 h-6" />,
    color: 'from-blue-500 to-indigo-600',
    lightColor: 'bg-blue-50',
    accentColor: 'text-blue-600',
    pairs: [
      { itemA: 'Pierre Bourdieu', itemB: 'Habitus, Kapital & Felter', difficulty: 1 },
      { itemA: 'Erving Goffman', itemB: 'Dramaturgisk analyse & Stigma', difficulty: 1 },
      { itemA: 'Axel Honneth', itemB: 'Anerkendelsessfærer', difficulty: 1 },
      { itemA: 'Michel Foucault', itemB: 'Magt/viden & Diskurs', difficulty: 1 },
      { itemA: 'Jürgen Habermas', itemB: 'Systemverden & Livsverden', difficulty: 2 },
      { itemA: 'Anthony Giddens', itemB: 'Struktureringsteori & Aftraditionalisering', difficulty: 2 },
      { itemA: 'Niklas Luhmann', itemB: 'Autopoiesis & Sociale systemer', difficulty: 3 },
      { itemA: 'Judith Butler', itemB: 'Performativitet & Køn', difficulty: 3 },
    ],
    cardAType: 'theorist' as const,
    cardBType: 'concept' as const,
  },
  paragraph: {
    id: 'paragraph',
    title: 'Paragraf-Partneren',
    description: 'Match paragraffer med deres indhold.',
    icon: <Scale className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-600',
    lightColor: 'bg-emerald-50',
    accentColor: 'text-emerald-600',
    pairs: [
      { itemA: 'Forvaltningsloven § 7', itemB: 'Myndigheders pligt til at yde vejledning og bistand', difficulty: 1 },
      { itemA: 'Forvaltningsloven § 19', itemB: 'Partshøring før en afgørelse træffes', difficulty: 1 },
      { itemA: 'Barnets Lov § 5', itemB: 'Barnets ret til inddragelse og medbestemmelse', difficulty: 1 },
      { itemA: 'Barnets Lov § 32', itemB: 'Støttende indsatser i hjemmet eller nærmiljøet', difficulty: 1 },
      { itemA: 'Serviceloven § 85', itemB: 'Socialpædagogisk bistand til voksne', difficulty: 2 },
      { itemA: 'Serviceloven § 110', itemB: 'Midlertidigt ophold på herberger og forsorgshjem', difficulty: 2 },
      { itemA: 'Barnets Lov § 47', itemB: 'Anbringelse uden for hjemmet uden samtykke', difficulty: 3 },
      { itemA: 'Barnets Lov § 133', itemB: 'Underretningspligt for fagpersoner ved bekymring', difficulty: 3 },
    ],
    cardAType: 'paragraph' as const,
    cardBType: 'content' as const,
  },
  method: {
    id: 'method',
    title: 'Metode-Matchet',
    description: 'Match cases med rette metodiske redskab.',
    icon: <CheckSquare className="w-6 h-6" />,
    color: 'from-rose-500 to-orange-600',
    lightColor: 'bg-rose-50',
    accentColor: 'text-rose-600',
    pairs: [
      { itemA: 'Systematisk afdækning af et barns behov.', itemB: 'ICS-trekanten', difficulty: 1 },
      { itemA: 'Udredning af voksens funktionsevne til støtte.', itemB: 'Voksenudredningsmetoden (VUM)', difficulty: 1 },
      { itemA: 'Borger er ambivalent ift. ændring af misbrug.', itemB: 'Den Motiverende Samtale (MI)', difficulty: 1 },
      { itemA: 'Hjælpe en borger med at identificere og opnå personlige mål.', itemB: 'Recovery-modellen', difficulty: 1 },
      { itemA: 'Kortlægning af en families relationer og mønstre.', itemB: 'Genogram / Netværkskort', difficulty: 2 },
      { itemA: 'Borger med komplekse problemer har brug for én samlet plan.', itemB: 'Helhedsorienteret Plan', difficulty: 2 },
      { itemA: 'Støtte til ung i en kritisk overgangsfase.', itemB: 'CTI (Critical Time Intervention)', difficulty: 3 },
      { itemA: 'Analyse af magt og sprogbrug i en sag.', itemB: 'Diskursanalyse', difficulty: 3 },
    ],
    cardAType: 'case' as const,
    cardBType: 'tool' as const,
  }
};

// --- TYPES ---
type CardType = 'theorist' | 'concept' | 'paragraph' | 'content' | 'case' | 'tool';
interface CardData {
  id: number;
  type: CardType;
  content: string;
  matchId: string;
}
type GameType = keyof typeof gameDataSets;

// --- HELPER FUNCTIONS ---
const shuffleArray = (array: any[]) => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENTS ---

const PremiumGlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] ${className}`}>
        {children}
    </div>
);

const GameCardComponent = ({ card, isFlipped, isMatched, onClick, colorGradient }: { card: CardData, isFlipped: boolean, isMatched: boolean, onClick: () => void, colorGradient: string }) => {
  return (
    <motion.div 
      className="relative w-full h-44 sm:h-52 md:h-64 cursor-pointer perspective-1000 group"
      onClick={onClick}
      whileHover={{ scale: isFlipped || isMatched ? 1 : 1.05, rotateZ: isFlipped || isMatched ? 0 : 1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front of Card */}
        <div className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 text-center rounded-[2rem] border-2 bg-white shadow-xl border-amber-50 hover:border-amber-200 transition-colors`}>
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:bg-amber-100 transition-colors duration-500">
            <Sparkle className="w-8 h-8 text-amber-300 group-hover:rotate-45 transition-transform duration-700" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-900/10">Memento</span>
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

          {isMatched && (
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute bottom-4 right-4 w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20"
            >
              <CheckCircle className="w-5 h-5" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const MementoGame = ({ gameType, level, onGameEnd }: { gameType: GameType, level: number, onGameEnd: (score: number, success: boolean) => void }) => {
    const gameDef = gameDataSets[gameType];
    const { toast } = useToast();
    
    const numPairs = useMemo(() => {
        return Math.min(level + 3, 10, gameDef.pairs.length);
    }, [level, gameDef]);
    
    const gameData = useMemo(() => {
        let minDiff = 1;
        let maxDiff = 1;
        
        if (level >= 3 && level <= 5) {
            maxDiff = 2;
        } else if (level > 5) {
            minDiff = 2;
            maxDiff = 3;
        }

        const availablePairs = gameDef.pairs.filter(p => p.difficulty >= minDiff && p.difficulty <= maxDiff);
        
        let finalPool = [...availablePairs];
        if (finalPool.length < numPairs) {
            const fillers = gameDef.pairs.filter(p => p.difficulty < minDiff);
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
    }, [gameType, gameDef, numPairs, level]);

    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedIds, setMatchedIds] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [startTime] = useState(Date.now());
    const [combo, setCombo] = useState(0);

    useEffect(() => {
        const allMatched = matchedIds.length === numPairs;
        if (allMatched) {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            const timeBonus = Math.max(0, 100 - timeSpent);
            const finalScore = score + timeBonus;
            
            const timer = setTimeout(() => onGameEnd(finalScore, true), 1200);
            return () => clearTimeout(timer);
        }
    }, [matchedIds.length, numPairs, onGameEnd, score, startTime]);

    useEffect(() => {
        if (flippedIndices.length === 2) {
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = gameData[firstIndex];
            const secondCard = gameData[secondIndex];

            if (firstCard.matchId === secondCard.matchId) {
                setMatchedIds(prev => [...prev, firstCard.matchId]);
                const comboBonus = combo * 5;
                setScore(prev => prev + 10 + comboBonus);
                setCombo(prev => prev + 1);
                setFlippedIndices([]);
                
                if (combo > 0) {
                    toast({ title: `Combo x${combo+1}!`, description: "Din hukommelse er i fokus." });
                }
            } else {
                const timer = setTimeout(() => {
                    setFlippedIndices([]);
                    setCombo(0);
                }, 1200);
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
                <PremiumGlassCard className="p-6 md:p-8 flex items-center justify-between border-amber-950/5 shadow-2xl shadow-amber-950/5">
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gameDef.color} flex items-center justify-center text-white shadow-lg`}>
                          {React.cloneElement(gameDef.icon as React.ReactElement, { className: 'w-7 h-7' })}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-amber-950 serif tracking-tight">{gameDef.title}</h2>
                          <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Level {level + 1}</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">{matchedIds.length} ud af {numPairs}</span>
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
                                <div className="flex items-center gap-1 text-rose-500">
                                    <Flame className="w-5 h-5 fill-current" />
                                    <span className="text-xl font-black italic">x{combo}</span>
                                </div>
                                <span className="text-[8px] font-black uppercase text-rose-400 tracking-tighter">Streak Bonus</span>
                            </motion.div>
                        )}
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Score</p>
                            <p className="text-4xl font-black text-amber-950 serif leading-none">{score}</p>
                        </div>
                        <div className="hidden sm:block">
                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-50" />
                                    <circle 
                                        cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" 
                                        strokeDasharray={251.2} 
                                        strokeDashoffset={251.2 - (251.2 * (matchedIds.length / numPairs))} 
                                        className={`${gameDef.accentColor} transition-all duration-1000 ease-out`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-black text-amber-950 serif">{Math.round((matchedIds.length / numPairs) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </PremiumGlassCard>
            </motion.div>

            <motion.div 
              layout
              className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-32"
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
        </div>
    );
};

const GameOverScreen = ({ score, success, onRestart, onMenu, isSaving }: { score: number, success: boolean, onRestart: () => void, onMenu: () => void, isSaving: boolean }) => {
    return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative max-w-2xl mx-auto"
        >
            <PremiumGlassCard className="p-10 md:p-20 text-center overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500" />
                
                <motion.div 
                    animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="w-32 h-32 bg-amber-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner group"
                >
                  <Trophy className="w-14 h-14 text-amber-500 group-hover:scale-110 transition-transform" />
                </motion.div>
                
                <h2 className="text-5xl font-black text-amber-950 serif mb-4 tracking-tight">Mesterligt Fokus!</h2>
                <p className="text-lg text-slate-400 mb-12 italic font-medium">Din faglige genkaldelse er nu endnu skarpere.</p>
                
                <div className="grid grid-cols-2 gap-8 mb-16">
                    <div className="bg-white/50 p-8 rounded-[2.5rem] border border-amber-100 shadow-inner">
                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-3">Cohéro Points</p>
                        <p className="text-5xl font-black text-amber-950 serif leading-none">+{score}</p>
                    </div>
                    <div className="bg-amber-950 p-8 rounded-[2.5rem] text-white shadow-2xl">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">Videns-Level</p>
                        <p className="text-5xl font-black serif leading-none">Op!</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                    <Button 
                        onClick={onRestart} 
                        disabled={isSaving}
                        className="flex-1 h-20 rounded-[2rem] bg-amber-950 text-white font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl shadow-amber-900/20"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <RotateCcw className="w-5 h-5 mr-3" />}
                        {isSaving ? 'Gemmer...' : 'Prøv Level Igen'}
                    </Button>
                    <Button 
                        onClick={onMenu} 
                        variant="outline"
                        className="flex-1 h-20 rounded-[2rem] border-amber-100 font-black uppercase text-xs tracking-widest text-amber-900 bg-white"
                    >
                        Tilbage til Menu
                    </Button>
                </div>
            </PremiumGlassCard>
            
            {/* Visual particles simulation */}
            <div className="absolute -z-10 -top-20 inset-x-0 flex justify-center opacity-30">
                <Sparkles className="w-40 h-40 text-amber-200 animate-pulse" />
            </div>
        </motion.div>
    );
};

const GameSelectionCard = ({ icon, title, description, level, colorGradient, accentColor, onSelect }: { icon: React.ReactNode, title: string, description: string, level: number, colorGradient: string, accentColor: string, onSelect: () => void }) => {
  return (
    <motion.div 
      whileHover={{ y: -12, scale: 1.02 }}
      className="group relative h-full"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${colorGradient} opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-700 rounded-[3rem]`} />
        
        <PremiumGlassCard 
            className="p-10 h-full flex flex-col hover:border-amber-200/50 hover:shadow-2xl hover:shadow-amber-950/5 transition-all duration-700 cursor-pointer overflow-hidden"
            onClick={onSelect}
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl bg-gradient-to-br ${colorGradient} text-white group-hover:rotate-6 transition-transform duration-500`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'w-8 h-8' })}
            </div>
            
            <div className="flex-grow">
                <h3 className="text-3xl font-black text-amber-950 serif mb-4 tracking-tight leading-none">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed italic mb-10 group-hover:text-amber-900/60 transition-colors">"{description}"</p>
            </div>
            
            <div className="pt-8 border-t border-amber-50/50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Fremdrift</span>
                  <div className="flex items-center gap-2">
                      <span className={`text-base font-black ${accentColor}`}>Level {level + 1}</span>
                      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                <div className="w-12 h-12 rounded-2xl border-2 border-amber-50 flex items-center justify-center text-slate-300 group-hover:bg-amber-950 group-hover:text-white group-hover:border-amber-950 transition-all duration-500 shadow-sm">
                    <MousePointer2 className="w-5 h-5" />
                </div>
            </div>
        </PremiumGlassCard>
    </motion.div>
  );
};

const MementoPageContent: React.FC<{ user: any }> = ({ user }) => {
    const { userProfile, refetchUserProfile, dailyChallengeGameType, hasPlayedDailyChallenge, setHasPlayedDailyChallenge } = useApp();
    const [gameState, setGameState] = useState<'selection' | 'playing' | 'finished'>('selection');
    const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
    const [selectedGameLevel, setSelectedGameLevel] = useState(0);
    const [gameResult, setGameResult] = useState<{ score: number; success: boolean } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const firestore = useFirestore();

    const handleSelectGame = useCallback((gameType: GameType) => {
        const level = userProfile?.mementoLevels?.[gameType] || 0;
        setSelectedGame(gameType);
        setSelectedGameLevel(level);
        setGameState('playing');
        setGameResult(null);
    }, [userProfile]);
    
    const saveProgress = useCallback(async (score: number, gameType: GameType, wasSuccessful: boolean) => {
        if (!user || !firestore || !userProfile) return;

        setIsSaving(true);
        try {
            const batch = writeBatch(firestore);
            const userRef = doc(firestore, 'users', user.uid);
            
            const isDailyChallenge = gameType === dailyChallengeGameType;
            let bonusPoints = 0;
            let newStreak = userProfile.dailyChallengeStreak || 0;
            let streakUpdate: any = {};
            
            if (isDailyChallenge && wasSuccessful) {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const lastPlayedTimestamp = userProfile.lastDailyChallengeDate;
                const lastPlayedDate = lastPlayedTimestamp ? (lastPlayedTimestamp.toDate ? lastPlayedTimestamp.toDate() : new Date(lastPlayedTimestamp)) : null;
                
                let isSameDay = false;
                if (lastPlayedDate) {
                    const startOfLastPlayedDay = new Date(lastPlayedDate);
                    startOfLastPlayedDay.setHours(0,0,0,0);
                    isSameDay = startOfLastPlayedDay.getTime() === today.getTime();
                }

                if (!isSameDay) {
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    
                    const wasPlayedYesterday = lastPlayedDate && lastPlayedDate.getTime() >= yesterday.getTime() && lastPlayedDate.getTime() < today.getTime();

                    newStreak = wasPlayedYesterday ? newStreak + 1 : 1;
                    bonusPoints = newStreak > 1 ? 50 * (newStreak -1) : 25;
                    
                    streakUpdate = {
                        dailyChallengeStreak: newStreak,
                        lastDailyChallengeDate: serverTimestamp(),
                    };
                }
            }

            const totalPointsToAdd = score + bonusPoints;

            const userUpdates: {[key: string]: any} = { ...streakUpdate };
            
            if (wasSuccessful) {
                userUpdates[`mementoLevels.${gameType}`] = increment(1);
            }
            
            if (totalPointsToAdd > 0) {
                userUpdates.cohéroPoints = increment(totalPointsToAdd);
            }
            
            if (Object.keys(userUpdates).length > 0) {
              batch.update(userRef, userUpdates);
            }

            await batch.commit();
            await refetchUserProfile();

        } catch (error) {
            console.error("Failed to save game progress:", error);
        } finally {
            setIsSaving(false);
        }
    }, [user, userProfile, dailyChallengeGameType, firestore, refetchUserProfile]);

    const handleGameEnd = useCallback((score: number, success: boolean) => {
        setGameResult({ score, success });
        setGameState('finished');
        if (selectedGame) {
            if (success && selectedGame === dailyChallengeGameType) {
                setHasPlayedDailyChallenge(true);
            }
            saveProgress(score, selectedGame, success);
        }
    }, [selectedGame, saveProgress, dailyChallengeGameType, setHasPlayedDailyChallenge]);

    const handleRestart = useCallback(() => {
        if (selectedGame) {
            handleSelectGame(selectedGame);
        }
    }, [selectedGame, handleSelectGame]);
    
    const handleMenu = useCallback(() => {
        setGameState('selection');
        setSelectedGame(null);
        setGameResult(null);
    }, []);

    return (
        <div className="bg-[#FAF9F6] min-h-screen selection:bg-amber-100 overflow-x-hidden relative">
            
            {/* Background Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-100/30 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-indigo-100/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] right-[10%] w-[25vw] h-[25vw] bg-amber-100/20 rounded-full blur-[100px]" />
            </div>

            <AnimatePresence mode="wait">
                {gameState === 'selection' && (
                    <motion.div 
                        key="selection" 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0, y: -20 }}
                        className="relative z-10"
                    >
                        {/* 1. HERO HEADER */}
                        <header className="px-6 py-20 md:py-32 relative">
                            <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mb-10 px-6 py-2 bg-amber-950 text-amber-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-full shadow-2xl border border-white/10"
                                >
                                    Dannelses-Modul: Memento
                                </motion.div>
                                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-amber-950 serif leading-[0.9] tracking-tighter mb-8 max-w-5xl">
                                    Hvad rører sig i <br /><span className="text-indigo-600 italic">din bevidsthed?</span>
                                </h1>
                                <p className="text-xl md:text-2xl text-slate-400 max-w-2xl italic leading-relaxed font-medium mb-16">
                                    Træn din faglige intuition og genkaldelse gennem interaktive dannelses-spil.
                                </p>

                                <div className="flex flex-wrap items-center justify-center gap-6">
                                    <PremiumGlassCard className="px-10 py-6 flex items-center gap-6 border-amber-950/5">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Dannelses Point</p>
                                            <p className="text-3xl font-black text-amber-950 serif leading-none">{userProfile?.cohéroPoints || 0}</p>
                                        </div>
                                        <div className="w-px h-10 bg-amber-950/5" />
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Nuværende Rank</p>
                                            <div className="flex items-center gap-2">
                                                <Medal className="w-5 h-5 text-amber-500" />
                                                <p className="text-2xl font-black text-amber-950 serif leading-none">{Math.floor((userProfile?.cohéroPoints || 0) / 1000) + 1}</p>
                                            </div>
                                        </div>
                                    </PremiumGlassCard>
                                    
                                    <div className="flex gap-4">
                                        <Button variant="ghost" className="h-16 px-8 rounded-2xl hover:bg-white/50 text-slate-400 hover:text-amber-950 font-bold uppercase text-[10px] tracking-widest transition-all">
                                            <TrendingUp className="w-4 h-4 mr-3" /> Se Stats
                                        </Button>
                                        <Button variant="ghost" className="h-16 px-8 rounded-2xl hover:bg-white/50 text-slate-400 hover:text-amber-950 font-bold uppercase text-[10px] tracking-widest transition-all">
                                            <Bookmark className="w-4 h-4 mr-3" /> Mine Bedrifter
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <main className="max-w-7xl mx-auto px-6 pb-40">
                            <div className="grid lg:grid-cols-12 gap-16 xl:gap-24">
                                <div className="lg:col-span-8 space-y-24">
                                    {/* Daily Challenge - The "Big Action" */}
                                    <section className="relative">
                                        <motion.div 
                                            whileHover={{ scale: 1.01 }}
                                            onClick={() => !hasPlayedDailyChallenge && handleSelectGame(dailyChallengeGameType)}
                                            className="bg-amber-950 p-12 md:p-24 rounded-[4rem] text-white shadow-[0_40px_80px_-20px_rgba(69,26,3,0.3)] relative overflow-hidden group cursor-pointer"
                                        >
                                            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-[150px] -mr-[400px] -mt-[400px] pointer-events-none group-hover:opacity-40 transition-opacity duration-1000" />
                                            
                                            <div className="relative z-10 grid md:grid-cols-[1fr_250px] gap-12 items-center">
                                                <div className="space-y-8">
                                                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                                                        <Sparkles className="w-4 h-4 text-amber-200" /> Dagens Udfordring
                                                    </div>
                                                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-black serif leading-[1.1] tracking-tight transition-transform group-hover:translate-x-2 duration-700">
                                                        Styrk din <span className="text-indigo-400 italic">streak</span> <br />& få dobbelt op
                                                    </h3>
                                                    <p className="text-amber-100/50 text-xl font-medium italic leading-relaxed max-w-xl">
                                                        {hasPlayedDailyChallenge 
                                                            ? "Du hviler på et solidt fundament i dag. Dagens streak er sikret."
                                                            : `Gennemfør ${gameDataSets[dailyChallengeGameType].title} nu for at låse op for dagens visdom.`
                                                        }
                                                    </p>
                                                    <Button disabled={hasPlayedDailyChallenge} size="lg" className="h-20 px-12 rounded-[2rem] bg-indigo-500 text-white hover:bg-white hover:text-indigo-900 border-none font-black uppercase text-xs tracking-widest transition-all disabled:bg-emerald-500">
                                                        {hasPlayedDailyChallenge ? <><CheckCircle className="w-5 h-5 mr-3" /> Gennemført i dag</> : <><Zap className="w-5 h-5 mr-3 text-amber-300" /> Start udfordring</>}
                                                    </Button>
                                                </div>

                                                <div className="bg-white/5 border border-white/10 p-10 rounded-[3.5rem] flex flex-col items-center justify-center text-center backdrop-blur-md relative group-hover:bg-white/10 transition-all duration-700">
                                                    <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center text-amber-950 mb-6 shadow-2xl relative">
                                                        <Flame className="w-10 h-10 fill-current" />
                                                        <div className="absolute inset-0 bg-amber-400 rounded-3xl animate-ping opacity-20" />
                                                    </div>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Dannelses Streak</p>
                                                    <p className="text-4xl font-black serif tracking-tighter">{userProfile?.dailyChallengeStreak || 0} Dage</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </section>

                                    {/* Categories */}
                                    <section className="space-y-12">
                                        <div className="flex items-center justify-between pb-6 border-b border-amber-950/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-amber-100 flex items-center justify-center text-amber-900 shadow-sm">
                                                    <Layers className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-3xl font-black text-amber-950 serif tracking-tight">Vælg Disciplin</h3>
                                                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">Hvad vil du træne i dag?</p>
                                                </div>
                                            </div>
                                            <div className="hidden md:flex items-center gap-2">
                                                <Filter className="w-4 h-4 text-slate-300" />
                                                <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Filtrering</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {Object.values(gameDataSets).map((game) => (
                                                <GameSelectionCard 
                                                    key={game.id}
                                                    icon={game.icon}
                                                    title={game.title}
                                                    description={game.description}
                                                    onSelect={() => handleSelectGame(game.id as GameType)}
                                                    level={userProfile?.mementoLevels?.[game.id as GameType] || 0}
                                                    colorGradient={game.color}
                                                    accentColor={game.accentColor}
                                                />
                                            ))}
                                            <motion.div 
                                                whileHover={{ scale: 1.02 }}
                                                className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center gap-6 opacity-40 group grayscale cursor-not-allowed"
                                            >
                                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-slate-200">
                                                    <PlusCircle className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-400 serif">Flere spil på vej...</h4>
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Nye dannelses-kategorier</p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </section>
                                </div>

                                {/* Sidebar / Global Progress */}
                                <aside className="lg:col-span-4 space-y-12">
                                    <PremiumGlassCard className="p-10 border-amber-950/5 space-y-10">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-900/30">Næste Niveau</h3>
                                            <Activity className="w-5 h-5 text-amber-400" />
                                        </div>
                                        
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="relative w-40 h-40">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="80" cy="80" r="72" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-50" />
                                                    <circle 
                                                        cx="80" cy="80" r="72" fill="transparent" stroke="currentColor" strokeWidth="12" 
                                                        strokeDasharray={452.4} 
                                                        strokeDashoffset={452.4 - (452.4 * (((userProfile?.cohéroPoints || 0) % 1000) / 1000))} 
                                                        className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-4xl font-black text-amber-950 serif">{Math.floor((userProfile?.cohéroPoints || 0) / 1000) + 1}</span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Rank</span>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] font-bold text-amber-900 mb-1">{1000 - ((userProfile?.cohéroPoints || 0) % 1000)} CP tilbage</p>
                                                <p className="text-[10px] text-slate-400 italic">Fortsæt træningen for at stige i grad.</p>
                                            </div>
                                        </div>
                                    </PremiumGlassCard>

                                    <div className="p-10 bg-amber-950 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                                        <Dna className="absolute top-4 right-4 w-12 h-12 text-white/5 group-hover:rotate-12 transition-transform duration-1000" />
                                        <h3 className="text-2xl font-black serif mb-6 tracking-tight">Hvorfor Memento?</h3>
                                        <p className="text-amber-100/60 leading-relaxed italic text-base mb-10">
                                            "Videnskaben viser, at legende genkaldelse styrker dine neurale forbindelser, så du kan handle hurtigere i praksis."
                                        </p>
                                        <div className="space-y-5">
                                            {[
                                                { label: "Styrk intuitiv viden", icon: <Brain className="w-4 h-4" /> },
                                                { label: "Reducer kognitiv belastning", icon: <Timer className="w-4 h-4" /> },
                                                { label: "Faglig rygdækning", icon: <ShieldCheck className="w-4 h-4" /> }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                                                        {item.icon}
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-amber-100">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </main>
                    </motion.div>
                )}

                {gameState === 'playing' && (
                    <motion.div 
                        key="playing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="py-12 md:py-20 relative z-10"
                    >
                        <MementoGame 
                            gameType={selectedGame!} 
                            level={selectedGameLevel} 
                            onGameEnd={handleGameEnd} 
                        />
                    </motion.div>
                )}

                {gameState === 'finished' && gameResult && (
                    <motion.div 
                        key="finished"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-24 relative z-10"
                    >
                        <GameOverScreen 
                            score={gameResult.score} 
                            success={gameResult.success} 
                            onRestart={handleRestart} 
                            onMenu={handleMenu} 
                            isSaving={isSaving} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Footer */}
            <footer className="relative z-10 border-t border-amber-950/5 bg-white/40 backdrop-blur-3xl px-10 py-10 mt-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3">
                            <Brain className="w-5 h-5 text-indigo-500" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-950">Memento v2.0</span>
                        </div>
                        <div className="w-px h-6 bg-amber-100 hidden md:block" />
                        <div className="flex items-center gap-4 text-slate-300">
                            <Medal className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Akademisk Dannelse</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 px-6 py-3 bg-white/50 rounded-full border border-amber-950/5 shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] font-black text-amber-950 uppercase tracking-[0.2em]">Kognitiv Synkronisering: 100%</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Add plus-circle back since I used it but forgot it might not be imported if I just copy-pasted
import { PlusCircle } from 'lucide-react';
// And ShieldCheck
import { ShieldCheck } from 'lucide-react';

export default function MementoPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace(`/?callbackUrl=${encodeURIComponent(pathname)}`);
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <MementoPageContent user={user} />;
}

import { usePathname } from 'next/navigation';
