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
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';

// --- GAME DATA ---

const gameDataSets = {
  theorist: {
    title: 'Teori-Tinder',
    description: 'Match teoretikere med deres kernebegreber.',
    icon: <Users className="w-5 h-5" />,
    color: 'blue',
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
    title: 'Paragraf-Partneren',
    description: 'Match paragraffer med deres indhold.',
    icon: <Scale className="w-5 h-5" />,
    color: 'emerald',
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
    title: 'Metode-Matchet',
    description: 'Match cases med rette metodiske redskab.',
    icon: <CheckSquare className="w-5 h-5" />,
    color: 'rose',
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

const GameCardComponent = ({ card, isFlipped, isMatched, onClick }: { card: CardData, isFlipped: boolean, isMatched: boolean, onClick: () => void }) => {
  const cardStyles: { [key in CardType]: string } = {
    theorist: 'bg-blue-50 text-blue-900 border-blue-200',
    concept: 'bg-purple-50 text-purple-900 border-purple-200',
    paragraph: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    content: 'bg-teal-50 text-teal-900 border-teal-200',
    case: 'bg-rose-50 text-rose-900 border-rose-200',
    tool: 'bg-cyan-50 text-cyan-900 border-cyan-200',
  };

  return (
    <motion.div 
      className="relative w-full h-40 sm:h-48 md:h-64 cursor-pointer perspective-1000 group"
      onClick={onClick}
      whileHover={{ scale: isFlipped || isMatched ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="w-full h-full relative transition-all duration-500 preserve-3d"
        animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Front of Card */}
        <div className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center p-4 sm:p-6 text-center rounded-[1.5rem] sm:rounded-[2.5rem] border-2 bg-white shadow-sm border-amber-100/50 group-hover:border-amber-200 transition-colors`}>
          <div className="w-10 h-10 sm:w-16 sm:h-16 bg-amber-50 rounded-[1rem] sm:rounded-[1.5rem] flex items-center justify-center mb-3 sm:mb-4 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-amber-300" />
          </div>
          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/20">Memento</p>
        </div>

        {/* Back of Card */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-4 sm:p-8 text-center rounded-[1.5rem] sm:rounded-[2.5rem] border-2 shadow-2xl ${isMatched ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : cardStyles[card.type]}`}>
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
             <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest opacity-30">{card.type}</span>
          </div>
          <p className="text-xs sm:text-sm md:text-base font-bold leading-relaxed serif italic line-clamp-6 sm:line-clamp-none">
            {card.content}
          </p>
          {isMatched && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const MementoGame = ({ gameType, level, onGameEnd }: { gameType: GameType, level: number, onGameEnd: (score: number, success: boolean) => void }) => {
    const gameDef = gameDataSets[gameType];
    
    const numPairs = useMemo(() => {
        return Math.min(level + 3, 8, gameDef.pairs.length);
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

    useEffect(() => {
        const allMatched = matchedIds.length === numPairs;
        if (allMatched) {
            const timer = setTimeout(() => onGameEnd(score, true), 1000);
            return () => clearTimeout(timer);
        }
    }, [onGameEnd, score, matchedIds.length, numPairs]);

    useEffect(() => {
        if (flippedIndices.length === 2) {
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = gameData[firstIndex];
            const secondCard = gameData[secondIndex];

            if (firstCard.matchId === secondCard.matchId) {
                setMatchedIds(prev => [...prev, firstCard.matchId]);
                setScore(prev => prev + 10);
                setFlippedIndices([]);
            } else {
                const timer = setTimeout(() => setFlippedIndices([]), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [flippedIndices, gameData]);

    const handleCardClick = (index: number) => {
        if (flippedIndices.length < 2 && !flippedIndices.includes(index) && !matchedIds.includes(gameData[index].matchId)) {
            setFlippedIndices(prev => [...prev, index]);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-between items-center bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-amber-100 shadow-sm mb-8 sm:mb-12 sticky top-4 z-20"
            >
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-2.5 sm:p-3 rounded-xl bg-amber-50 text-amber-700`}>
                      {React.cloneElement(gameDef.icon as React.ReactElement, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-amber-950 serif text-sm sm:text-xl leading-none truncate">{gameDef.title}</h2>
                      <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Level {level + 1}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                     <div className="text-right">
                        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Score</p>
                        <p className="text-lg sm:text-2xl font-black text-amber-950 serif leading-none">{score}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                        <p className={`text-lg sm:text-2xl font-black text-amber-950 serif leading-none`}>{matchedIds.length}/{numPairs}</p>
                    </div>
                </div>
            </motion.div>

            <motion.div 
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 pb-20 px-2"
            >
                <AnimatePresence>
                  {gameData.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <GameCardComponent
                            card={card}
                            isFlipped={flippedIndices.includes(index)}
                            isMatched={matchedIds.includes(card.matchId)}
                            onClick={() => handleCardClick(index)}
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] border border-amber-100 shadow-2xl max-w-md mx-auto text-center relative overflow-hidden mt-10"
        >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200"></div>
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-inner">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-950 serif mb-2">
              Mesterligt!
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mb-8 sm:mb-10 italic">
              Din faglige hukommelse er knivskarp.
            </p>
            
            <div className="bg-amber-50/50 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-amber-100 mb-8 sm:mb-10">
                <p className="text-[8px] sm:text-[10px] font-black text-amber-800 uppercase tracking-[0.2em] mb-2">Optjente Point</p>
                <p className="text-5xl sm:text-6xl font-black text-amber-950 serif mb-1">{score}</p>
                <p className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-widest">Cohéro Points</p>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
                <button 
                  onClick={onRestart} 
                  disabled={isSaving}
                  className="w-full py-4 sm:py-5 bg-amber-950 text-white rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    {isSaving ? 'Gemmer...' : 'Spil igen'}
                </button>
                <button 
                  onClick={onMenu} 
                  className="w-full py-4 sm:py-5 bg-white text-amber-950 border border-amber-100 rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em] hover:bg-amber-50 transition-all"
                >
                    Tilbage til menu
                </button>
            </div>
        </motion.div>
    );
};

const GameSelectionCard = ({ icon, title, description, level, color, onSelect }: { icon: React.ReactNode, title: string, description: string, level: number, color: string, onSelect: () => void }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-white p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-amber-100 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500 h-full cursor-pointer overflow-hidden relative"
      onClick={onSelect}
    >
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 shadow-inner ${colorClasses[color]}`}>
            {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 sm:w-7 sm:h-7' })}
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-amber-950 serif mb-3 sm:mb-4 group-hover:text-amber-700 transition-colors">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed italic flex-grow mb-8">{description}</p>
        
        <div className="mt-auto pt-6 sm:pt-8 border-t border-amber-50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Nuværende Niveau</span>
              <span className="text-xs sm:text-sm font-bold text-amber-900">Level {level + 1}</span>
            </div>
            <div className="w-10 h-10 rounded-full border border-amber-100 flex items-center justify-center group-hover:bg-amber-950 group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
            </div>
        </div>
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
        <div className="animate-fade-in-up bg-[#FDFCF8] min-h-screen selection:bg-amber-100 overflow-x-hidden">
            <AnimatePresence mode="wait">
                {gameState === 'selection' && (
                    <div key="selection">
                        {/* 1. SMART COMMAND HEADER */}
                        <header className="bg-white border-b border-amber-100 px-4 sm:px-6 py-10 md:py-16 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-amber-50 rounded-full blur-[80px] md:blur-[120px] -mr-16 md:-mr-32 -mt-16 md:-mt-32 opacity-50 pointer-events-none"></div>
                            
                            <div className="max-w-7xl mx-auto relative z-10">
                                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-10 mb-10 md:mb-16">
                                    <div className="text-center lg:text-left">
                                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                                            <span className="px-3 md:px-4 py-1.5 bg-amber-950 text-amber-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg border border-white/10">
                                                Memento
                                            </span>
                                            <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                                <Flame className="w-3 md:w-3.5 h-3 md:h-3.5 fill-current" /> {userProfile?.dailyChallengeStreak || 0} Dages dannelse
                                            </div>
                                        </div>
                                        <h1 className="text-4xl md:text-7xl font-bold text-amber-950 serif leading-none tracking-tighter">
                                            Hvad husker du <span className="text-amber-700 italic">i dag?</span>
                                        </h1>
                                        <p className="text-base md:text-xl text-slate-500 mt-4 md:mt-6 italic font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                            Træn din faglige hukommelse gennem interaktive huskespil. Match teoretikere, paragraffer og metoder.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 sm:gap-4 bg-white/50 backdrop-blur-sm p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] border border-amber-100/50 shadow-inner">
                                        <div className="text-center px-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Score</p>
                                            <p className="text-2xl font-black text-amber-950 serif">{userProfile?.cohéroPoints || 0}</p>
                                        </div>
                                        <div className="w-[1px] h-8 bg-amber-100"></div>
                                        <div className="text-center px-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Level</p>
                                            <p className="text-2xl font-black text-amber-950 serif">
                                                {Math.floor((userProfile?.cohéroPoints || 0) / 1000) + 1}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                    <Button variant="outline" className="rounded-xl border-amber-100 gap-2 font-bold h-12">
                                        <TrendingUp className="w-4 h-4" /> Leaderboard
                                    </Button>
                                    <Button variant="outline" className="rounded-xl border-amber-100 gap-2 font-bold h-12">
                                        <History className="w-4 h-4" /> Mine Stats
                                    </Button>
                                </div>
                            </div>
                        </header>

                        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
                            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
                                <div className="lg:col-span-8 space-y-16">
                                    {/* Daily Challenge Highlight */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 px-2">
                                            <div className="p-2.5 bg-amber-50 rounded-xl shadow-inner">
                                                <Target className="w-5 h-5 text-amber-700" />
                                            </div>
                                            <h2 className="text-xl font-bold text-amber-950 serif">Dagens Prioritet</h2>
                                        </div>

                                        <div 
                                            onClick={() => !hasPlayedDailyChallenge && handleSelectGame(dailyChallengeGameType)}
                                            className="bg-amber-950 p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-all duration-500"
                                        >
                                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                                                <div className="flex-1 space-y-6 text-center md:text-left">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-amber-950 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                                                        <Sparkles className="w-3.5 h-3.5" /> Dagens Udfordring
                                                    </div>
                                                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold serif leading-tight">
                                                        Hold din <span className="text-amber-400 italic">dannelses-streak</span> i live
                                                    </h3>
                                                    <p className="text-amber-100/60 text-base md:text-lg leading-relaxed italic max-w-lg mx-auto md:mx-0">
                                                        {hasPlayedDailyChallenge 
                                                            ? "Flot arbejde! Du har gennemført dagens udfordring og sikret din streak."
                                                            : `Gennemfør ${gameDataSets[dailyChallengeGameType].title} for at optjene bonuspoint.`
                                                        }
                                                    </p>
                                                    <Button size="lg" disabled={hasPlayedDailyChallenge} className="bg-white text-amber-950 hover:bg-amber-100 shadow-xl shadow-black/10 w-full sm:w-auto disabled:bg-emerald-500 disabled:text-white">
                                                        {hasPlayedDailyChallenge ? <><CheckCircle className="w-4 h-4 mr-2" /> Allerede klaret</> : <><Zap className="w-4 h-4 mr-2" /> Start udfordring</>}
                                                    </Button>
                                                </div>
                                                <div className="w-full md:w-64 h-56 md:h-64 bg-white/5 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 p-8 flex flex-col justify-center items-center text-center">
                                                    <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-amber-950 mb-4 shadow-xl">
                                                        <Flame className="w-8 h-8 fill-current" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-2">Din Streak</p>
                                                    <p className="text-2xl font-bold text-amber-50">{userProfile?.dailyChallengeStreak || 0} Dage</p>
                                                </div>
                                            </div>
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>
                                        </div>
                                    </section>

                                    {/* Game Categories */}
                                    <section>
                                        <div className="flex items-center gap-3 border-b border-amber-100 pb-6 mb-8 px-2">
                                            <div className="p-2.5 bg-white border border-amber-100 rounded-2xl shadow-sm">
                                                <Layers className="w-5 h-5 text-amber-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-bold text-amber-950 serif">Discipliner</h3>
                                                <p className="text-xs sm:text-sm text-slate-400 font-medium">Vælg et fokusområde for din træning</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <GameSelectionCard 
                                                icon={<Users />}
                                                title="Teori-Tinder"
                                                description="Match centrale teoretikere med deres kernebegreber for at skabe en stærk forbindelse mellem teori og afsender."
                                                onSelect={() => handleSelectGame('theorist')}
                                                level={userProfile?.mementoLevels?.theorist || 0}
                                                color="blue"
                                            />
                                            <GameSelectionCard 
                                                icon={<Scale />}
                                                title="Paragraf-Partneren"
                                                description="Træn din evne til hurtigt at navigere i lovgivningen ved at matche paragraffer med deres indhold."
                                                onSelect={() => handleSelectGame('paragraph')}
                                                level={userProfile?.mementoLevels?.paragraph || 0}
                                                color="emerald"
                                            />
                                            <GameSelectionCard 
                                                icon={<CheckSquare />}
                                                title="Metode-Matchet"
                                                description="Omsæt teori til praksis. Læs en kort case-beskrivelse og find det rette metodiske redskab."
                                                onSelect={() => handleSelectGame('method')}
                                                level={userProfile?.mementoLevels?.method || 0}
                                                color="rose"
                                            />
                                        </div>
                                    </section>
                                </div>

                                {/* Aside - Stats & Info */}
                                <aside className="lg:col-span-4 space-y-10">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm relative overflow-hidden group">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dannelsesstatus</h3>
                                            <Award className="w-5 h-5 text-amber-700/30" />
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-amber-950">Level</p>
                                                <p className="text-lg font-black text-amber-700">{Math.floor((userProfile?.cohéroPoints || 0) / 1000) + 1}</p>
                                            </div>
                                            <div className="h-2 w-full bg-amber-50 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-amber-500" 
                                                    style={{ width: `${((userProfile?.cohéroPoints || 0) % 1000) / 10}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 text-center italic">
                                                {1000 - ((userProfile?.cohéroPoints || 0) % 1000)} CP til næste level
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-amber-950 p-8 rounded-[2.5rem] text-white shadow-xl">
                                        <h3 className="text-lg font-bold serif mb-4">Hvorfor Memento?</h3>
                                        <p className="text-amber-100/60 text-sm leading-relaxed mb-6 italic">
                                            "Gentagelse er dannelsens moder. Gennem leg styrker du din evne til at bringe faglig viden i spil i pressede situationer."
                                        </p>
                                        <ul className="space-y-4">
                                            <li className="flex items-center gap-3 text-xs font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                Hurtig genkaldelse
                                            </li>
                                            <li className="flex items-center gap-3 text-xs font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                Præcis paragrafbrug
                                            </li>
                                            <li className="flex items-center gap-3 text-xs font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                Teoretisk rygdækning
                                            </li>
                                        </ul>
                                    </div>
                                </aside>
                            </div>
                        </main>
                    </div>
                )}

                {gameState === 'playing' && (
                    <motion.div 
                        key="playing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-10"
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="py-20"
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

            {/* 3. FOOTER INFO */}
            <footer className="bg-white border-t border-amber-100 px-6 sm:px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-950">Optjen CP</span>
                        </div>
                        <div className="h-4 w-[1px] bg-amber-100" />
                        <div className="flex items-center gap-3 text-slate-300">
                            <Star className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Dannelse v4.0</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">System Status: Optimal</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default function MementoPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <MementoPageContent user={user} />;
}
