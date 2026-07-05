'use client';

import React, { useState, useMemo } from 'react';
import { 
    Flame, 
    Heart, 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    Trophy, 
    Sparkles, 
    HelpCircle, 
    Volume2, 
    Award,
    RefreshCw,
    BrainCircuit,
    Layers,
    BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';

// --- Question Schema ---
interface Question {
    id: number;
    theorist: string;
    type: 'multiple-choice' | 'match';
    questionText: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

const QUESTIONS: Question[] = [
    {
        id: 1,
        theorist: 'Bourdieu',
        type: 'multiple-choice',
        questionText: 'En studerende har opnået et stort netværk af indflydelsesrige kontakter og venner under sit studie. Hvilken kapitalform beskriver Bourdieu dette som?',
        options: [
            'Økonomisk kapital (Penge, ejendomme og fysiske værdier)',
            'Kulturel kapital (Uddannelse, sprog og akademiske titler)',
            'Socialt kapital (Relationer, netværk og sociale forbindelser)',
            'Symbolsk kapital (Anerkendelse, prestige og personlig status)'
        ],
        correctIndex: 2,
        explanation: 'Social kapital handler om de ressourcer, man får adgang til gennem sit netværk, sine relationer og medlemskab af grupper.'
    },
    {
        id: 2,
        theorist: 'Bourdieu',
        type: 'multiple-choice',
        questionText: 'Hvad forstår Bourdieu ved begrebet "Habitus"?',
        options: [
            'De midlertidige holdninger, man bevidst vælger at have i en diskussion',
            'Indlejrede, kropslige vaner, erfaringer og ubevidste adfærdsmønstre',
            'Det fysiske rum eller de institutioner, som man befinder sig i',
            'Den samlede sum af de penge, man ejer'
        ],
        correctIndex: 1,
        explanation: 'Habitus er de kropslige og mentale adfærdsmønstre, værdier og normer, vi ubevidst har taget til os gennem vores opvækst og baggrund.'
    },
    {
        id: 3,
        theorist: 'Foucault',
        type: 'multiple-choice',
        questionText: 'Foucault bruger arkitekturen "Panoptikon" som et billede på en særlig magtform. Hvilken?',
        options: [
            'Den voldelige, fysiske undertrykkelse fra militæret',
            'Den usynlige, disciplinerende magt, hvor borgeren overvåger og regulerer sig selv',
            'Den demokratiske magt, der udøves gennem frie valg',
            'Den økonomiske magt, som de rige har over de fattige'
        ],
        correctIndex: 1,
        explanation: 'Panoptikon-modellen beskriver, hvordan konstant (eller potentiel) overvågning fører til, at individer internaliserer magten og begynder at kontrollere og disciplinere sig selv.'
    },
    {
        id: 4,
        theorist: 'Foucault',
        type: 'multiple-choice',
        questionText: 'Hvad beskriver Foucault med begrebet "Biomagt"?',
        options: [
            'Magt over biologiske våben og økologiske katastrofer',
            'Magt, der udøves gennem regulering og kontrol af hele befolkningens kroppe, sundhed og reproduktion',
            'Den styrke, som naturens biologiske kræfter udøver på mennesket',
            'Magten til at give dødsstraf til forbrydere'
        ],
        correctIndex: 1,
        explanation: 'Biomagt (eller biopolitik) refererer til statens og systemets kontrol over befolkningen som biologiske væsener – herunder sundhed, fødselstal, hygiejne og dødelighed.'
    },
    {
        id: 5,
        theorist: 'Luhmann',
        type: 'multiple-choice',
        questionText: 'Ifølge Luhmanns systemteori, hvad består det sociale samfundssystem grundlæggende af?',
        options: [
            'De konkrete mennesker, der bor i samfundet',
            'De fysiske bygninger, love og veje',
            'Kommunikationer (og ikke de enkelte individer selv)',
            'De politiske beslutninger og partier'
        ],
        correctIndex: 2,
        explanation: 'For Luhmann er sociale systemer autopoietiske (selvskabende) systemer af kommunikation. Individer hører til i systemets omgivelser (psykiske systemer) og ikke inde i selve det sociale system.'
    },
    {
        id: 6,
        theorist: 'Luhmann',
        type: 'multiple-choice',
        questionText: 'Hvad forstår Luhmann ved, at et system er "Autopoietisk"?',
        options: [
            'At det styres automatisk af robotter og computere',
            'At det er selvskabende og selvopretholdende ved at producere sine egne elementer',
            'At det er fuldstændig åbent og lader sig styre af sine omgivelser',
            'At det bryder sammen så snart det møder modstand'
        ],
        correctIndex: 1,
        explanation: 'Autopoiese betyder selvskabelse (fra græsk: auto = selv, poiesis = skabelse). Det beskriver systemer, der opretholder sig selv ved hele tiden at producere nye kommunikationer ud fra tidligere kommunikationer.'
    }
];

export default function DailyChallengePage() {
    const { user, userProfile, setHasPlayedDailyChallenge } = useApp();
    const firestore = useFirestore();
    const router = useRouter();

    // Game state
    const [gameState, setGameState] = useState<'welcome' | 'playing' | 'completed' | 'gameover'>('welcome');
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [hearts, setHearts] = useState(3);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Filter and shuffle questions (select 5 questions for this round)
    const gameQuestions = useMemo(() => {
        // Simple seeded/shuffled selection of 5 questions
        return QUESTIONS.slice(0, 5);
    }, []);

    const currentQuestion = gameQuestions[currentQIndex];

    const handleStartGame = () => {
        triggerHapticFeedback(ImpactStyle.Medium);
        setGameState('playing');
        setCurrentQIndex(0);
        setHearts(3);
        setScore(0);
        setSelectedOption(null);
        setHasAnswered(false);
    };

    const handleOptionSelect = (idx: number) => {
        if (hasAnswered) return;
        triggerHapticFeedback(ImpactStyle.Light);
        setSelectedOption(idx);
    };

    const handleCheckAnswer = () => {
        if (selectedOption === null || hasAnswered) return;

        const correct = selectedOption === currentQuestion.correctIndex;
        setIsCorrect(correct);
        setHasAnswered(true);

        if (correct) {
            triggerHapticFeedback(ImpactStyle.Heavy);
            setScore(prev => prev + 1);
        } else {
            triggerHapticFeedback(ImpactStyle.Medium);
            setHearts(prev => {
                const updated = prev - 1;
                if (updated === 0) {
                    setTimeout(() => setGameState('gameover'), 1500);
                }
                return updated;
            });
        }
    };

    const handleNextQuestion = () => {
        setSelectedOption(null);
        setHasAnswered(false);

        if (currentQIndex + 1 < gameQuestions.length) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            // Completed game successfully!
            setGameState('completed');
            triggerConfetti();
        }
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
        });
    };

    const handleCompleteChallenge = async () => {
        if (!user || !firestore) {
            router.push('/portal');
            return;
        }

        setIsLoadingSave(true);
        try {
            // Reward: 25 Cohéro Points, increment daily streak
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                cohéroPoints: increment(25),
                dailyChallengeStreak: increment(1)
            });

            setHasPlayedDailyChallenge(true);
            router.push('/portal');
        } catch (err) {
            console.error("Failed to save challenge progress:", err);
            router.push('/portal');
        } finally {
            setIsLoadingSave(false);
        }
    };

    const [isLoadingSave, setIsLoadingSave] = useState(false);

    return (
        <div className="min-h-screen bg-background text-slate-900 pb-20 relative overflow-hidden font-sans">
            {/* Header / Nav */}
            <div className="max-w-4xl mx-auto px-6 pt-8 flex items-center justify-between relative z-10">
                <Link href="/portal" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-xs uppercase tracking-wider bg-white px-5 py-3 rounded-full border border-slate-100 shadow-sm">
                    <ArrowLeft className="w-4 h-4" /> Tilbage
                </Link>
                {gameState === 'playing' && (
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map(h => (
                            <Heart 
                                key={h} 
                                className={`w-6 h-6 transition-all duration-300 ${
                                    hearts >= h 
                                    ? 'text-rose-500 fill-rose-500 scale-110' 
                                    : 'text-slate-200 fill-transparent scale-90'
                                }`} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="max-w-2xl mx-auto px-6 pt-16 relative z-10 flex flex-col justify-center min-h-[70vh]">
                <AnimatePresence mode="wait">
                    
                    {/* 1. WELCOME SCREEN */}
                    {gameState === 'welcome' && (
                        <motion.div 
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-[3rem] p-10 md:p-12 text-center border border-slate-100 shadow-[0_30px_70px_rgba(0,0,0,0.04)] space-y-8"
                        >
                            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                <Flame className="w-10 h-10 fill-current animate-pulse" />
                            </div>
                            <div className="space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Daglig udfordring</span>
                                <h1 className="text-4xl font-black text-slate-900 serif tracking-tight">Dagens teoretiker-spil</h1>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto">
                                    Velkommen til dagens akademiske udfordring! Her dyster du i forståelsen af socialrådgiver-studiets største sværvægtere: <strong>Bourdieu, Foucault og Luhmann</strong>.
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 text-left max-w-sm mx-auto">
                                <Award className="w-8 h-8 text-amber-500 shrink-0" />
                                <div className="text-xs">
                                    <p className="font-black text-slate-900">Gennemfør & vind belønning</p>
                                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mt-0.5">+25 Cohéro Points • +1 Streak dag</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleStartGame}
                                className="w-full h-16 bg-slate-950 text-white hover:bg-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-slate-950/20 active:scale-98 transition-all"
                            >
                                Start Spillet <ArrowRight className="w-4 h-4 text-amber-400" />
                            </button>
                        </motion.div>
                    )}

                    {/* 2. PLAYING SCREEN (DUOLINGO-LIKE) */}
                    {gameState === 'playing' && currentQuestion && (
                        <motion.div 
                            key="playing"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="space-y-8 w-full"
                        >
                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Opgave {currentQIndex + 1} af {gameQuestions.length}</span>
                                    <span className="text-indigo-600 font-black">{currentQuestion.theorist}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-indigo-600 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((currentQIndex + 1) / gameQuestions.length) * 100}%` }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </div>
                            </div>

                            {/* Question Card */}
                            <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-6">
                                <h3 className="text-xl font-black text-slate-900 leading-snug">
                                    {currentQuestion.questionText}
                                </h3>

                                {/* Options grid */}
                                <div className="grid grid-cols-1 gap-3.5">
                                    {currentQuestion.options.map((opt, i) => {
                                        const isSelected = selectedOption === i;
                                        let borderClass = isSelected ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700';
                                        
                                        if (hasAnswered) {
                                            if (i === currentQuestion.correctIndex) {
                                                borderClass = 'border-emerald-500 bg-emerald-50 text-emerald-950';
                                            } else if (isSelected) {
                                                borderClass = 'border-rose-500 bg-rose-50 text-rose-950';
                                            } else {
                                                borderClass = 'border-slate-100 bg-slate-50/30 text-slate-300 opacity-60';
                                            }
                                        }

                                        return (
                                            <button
                                                key={i}
                                                disabled={hasAnswered}
                                                onClick={() => handleOptionSelect(i)}
                                                className={`p-5 rounded-2xl border text-left font-semibold text-sm transition-all duration-300 flex items-start gap-4 ${borderClass} ${!hasAnswered ? 'active:scale-[0.99]' : ''}`}
                                            >
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                                    isSelected ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-400'
                                                }`}>
                                                    {['A', 'B', 'C', 'D'][i]}
                                                </div>
                                                <span className="leading-snug">{opt}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bottom action bar */}
                            <div className="flex gap-4">
                                {!hasAnswered ? (
                                    <button
                                        onClick={handleCheckAnswer}
                                        disabled={selectedOption === null}
                                        className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                                            selectedOption === null 
                                            ? 'bg-slate-100 text-slate-300 shadow-none' 
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/10'
                                        }`}
                                    >
                                        Svar & Tjek
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNextQuestion}
                                        className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs bg-slate-950 hover:bg-slate-900 text-white flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-950/10"
                                    >
                                        Næste opgave <ArrowRight className="w-4 h-4 text-amber-400" />
                                    </button>
                                )}
                            </div>

                            {/* Sliding feedback panel (Duolingo Style!) */}
                            <AnimatePresence>
                                {hasAnswered && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 100 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 100 }}
                                        className={`p-6 rounded-[2.5rem] border ${
                                            isCorrect 
                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-950' 
                                            : 'bg-rose-50 border-rose-100 text-rose-950'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {isCorrect ? (
                                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                                            )}
                                            <div className="space-y-1">
                                                <p className="font-black text-sm">{isCorrect ? 'Super flot besvaret! 🎉' : 'Hov, ikke helt rigtigt... 😢'}</p>
                                                <p className="text-xs font-semibold leading-relaxed opacity-90">{currentQuestion.explanation}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* 3. GAME OVER SCREEN */}
                    {gameState === 'gameover' && (
                        <motion.div 
                            key="gameover"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[3rem] p-10 md:p-12 text-center border border-rose-100 shadow-[0_30px_70px_rgba(244,63,94,0.04)] space-y-8"
                        >
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                <XCircle className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Prøv igen</span>
                                <h1 className="text-3xl font-black text-slate-900 serif tracking-tight">Du tabte alle dine liv</h1>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                                    Det var desværre tæt på! Men bare rolig – teorier som Bourdieu og Luhmann er svære, og det kræver øvelse at blive mester. Prøv igen med det samme!
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={handleStartGame}
                                    className="w-full h-16 bg-slate-950 text-white hover:bg-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all"
                                >
                                    <RefreshCw className="w-4 h-4 text-amber-400" /> Prøv Igen
                                </button>
                                <Link href="/portal" className="w-full h-16 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center text-slate-600 transition-all">
                                    Måske senere
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* 4. COMPLETED SCREEN */}
                    {gameState === 'completed' && (
                        <motion.div 
                            key="completed"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[3rem] p-10 md:p-12 text-center border border-slate-100 shadow-[0_30px_70px_rgba(0,0,0,0.04)] space-y-8"
                        >
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                <Trophy className="w-10 h-10 animate-bounce" />
                            </div>
                            <div className="space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Udfordring gennemført!</span>
                                <h1 className="text-4xl font-black text-slate-900 serif tracking-tight">Tillykke! 🏆</h1>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                                    Du har besvaret alle opgaver i dagens teoretiker-spil korrekt! Du har vist stor forståelse for de faglige begreber.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl text-center space-y-1">
                                    <Flame className="w-6 h-6 text-amber-500 fill-amber-500 mx-auto" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Streak opdateret</p>
                                    <p className="text-2xl font-black text-amber-700 serif mt-1">+{userProfile?.dailyChallengeStreak ? userProfile.dailyChallengeStreak + 1 : 1} dag</p>
                                </div>
                                <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-center space-y-1">
                                    <Award className="w-6 h-6 text-indigo-600 mx-auto" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Vundet point</p>
                                    <p className="text-2xl font-black text-indigo-700 serif mt-1">+25 point</p>
                                </div>
                            </div>

                            <button 
                                onClick={handleCompleteChallenge}
                                disabled={isLoadingSave}
                                className="w-full h-16 bg-slate-950 text-white hover:bg-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all"
                            >
                                {isLoadingSave ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>Indløs Belønning <CheckCircle2 className="w-4 h-4 text-emerald-400" /></>
                                )}
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
            
            {/* Embedded styles */}
            <style jsx>{`
                .serif { font-family: 'Playfair Display', serif; }
            `}</style>
        </div>
    );
}

// ArrowRight backup
function ArrowRight({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
        </svg>
    );
}
