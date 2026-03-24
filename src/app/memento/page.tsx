'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Brain, 
  Scale, 
  Users, 
  CheckSquare, 
  Heart,
  Shield,
  BookOpen,
  CloudRain,
  Sun,
  MessageSquare,
  Zap
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { GameLobby } from '@/components/memento/GameLobby';
import { GameEngine, GameOverScreen } from '@/components/memento/GameEngine';
import { SentenceEngine } from '@/components/memento/SentenceGame';
import { DialogueEngine } from '@/components/memento/DialogueEngine';
import { FlashMatchEngine } from '@/components/memento/FlashMatchEngine';

// --- GAME DATA ---

export const gameDataSets = {
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
      { itemA: 'Zygmunt Bauman', itemB: 'Flydende modernitet & Individualisering', difficulty: 2 },
      { itemA: 'Bruno Latour', itemB: 'Aktør-netværksteori (ANT)', difficulty: 2 },
      { itemA: 'Niklas Luhmann', itemB: 'Autopoiesis & Sociale systemer', difficulty: 3 },
      { itemA: 'Judith Butler', itemB: 'Performativitet & Køn', difficulty: 3 },
      { itemA: 'Hartmut Rosa', itemB: 'Resonans & Acceleration', difficulty: 3 },
      { itemA: 'Nancy Fraser', itemB: 'Anerkendelse & Omfordeling', difficulty: 3 },
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
      { itemA: 'Forvaltningsloven § 22', itemB: 'Begrundelse for en skriftlig afgørelse', difficulty: 2 },
      { itemA: 'Barnets Lov § 18', itemB: 'Børnefaglig undersøgelse (tidl. § 50)', difficulty: 2 },
      { itemA: 'Barnets Lov § 47', itemB: 'Anbringelse uden for hjemmet uden samtykke', difficulty: 3 },
      { itemA: 'Barnets Lov § 133', itemB: 'Underretningspligt for fagpersoner ved bekymring', difficulty: 3 },
      { itemA: 'Retssikkerhedsloven § 10', itemB: 'Myndighedens pligt til at oplyse sagen (Official-princippet)', difficulty: 3 },
      { itemA: 'Forvaltningsloven § 24', itemB: 'Indholdet af en begrundelse', difficulty: 3 },
    ],
    cardAType: 'paragraph' as const,
    cardBType: 'content' as const,
  },
  ethics: {
    id: 'ethics',
    title: 'Etik-Eksperten',
    description: 'Match etiske dilemmaer med faglige principper.',
    icon: <Heart className="w-6 h-6" />,
    color: 'from-rose-500 to-pink-600',
    lightColor: 'bg-rose-50',
    accentColor: 'text-rose-600',
    pairs: [
        { itemA: 'Respekt for borgerens egne valg og livsførelse.', itemB: 'Selvbestemmelse', difficulty: 1 },
        { itemA: 'At handle til borgerens bedste, selv når de er modvillige.', itemB: 'Omsorgspligt', difficulty: 1 },
        { itemA: 'Beskyttelse af borgerens private oplysninger.', itemB: 'Tavshedspligt', difficulty: 1 },
        { itemA: 'Lige adgang til ressourcer uanset baggrund.', itemB: 'Social Retfærdighed', difficulty: 2 },
        { itemA: 'Bevidsthed om magtforholdet mellem sagsbehandler og borger.', itemB: 'Magtbalancen', difficulty: 2 },
        { itemA: 'At handle uden fordomme og personlige præferencer.', itemB: 'Objektivitet', difficulty: 2 },
        { itemA: 'Når tavshedspligt må vige for at beskytte barnet.', itemB: 'Skærpet underretningspligt', difficulty: 3 },
        { itemA: 'At tale på vegne af en borger, der ikke selv kan.', itemB: 'Advokaturrollen', difficulty: 3 },
        { itemA: 'Sikre at borgeren har forstået konsekvenserne af et valg.', itemB: 'Informeret samtykke', difficulty: 3 },
    ],
    cardAType: 'dilemma' as const,
    cardBType: 'principle' as const,
  },
  method: {
    id: 'method',
    title: 'Metode-Matchet',
    description: 'Match cases med rette metodiske redskab.',
    icon: <CheckSquare className="w-6 h-6" />,
    color: 'from-amber-500 to-orange-600',
    lightColor: 'bg-amber-50',
    accentColor: 'text-amber-600',
    pairs: [
      { itemA: 'Systematisk afdækning af et barns behov.', itemB: 'ICS-trekanten', difficulty: 1 },
      { itemA: 'Udredning af voksens funktionsevne til støtte.', itemB: 'Voksenudredningsmetoden (VUM)', difficulty: 1 },
      { itemA: 'Borger er ambivalent ift. ændring af misbrug.', itemB: 'Den Motiverende Samtale (MI)', difficulty: 1 },
      { itemA: 'Hjælpe en borger med at identificere og opnå personlige mål.', itemB: 'Recovery-modellen', difficulty: 1 },
      { itemA: 'Kortlægning af en families relationer og mønstre.', itemB: 'Genogram / Netværkskort', difficulty: 2 },
      { itemA: 'Borger med komplekse problemer har brug for én samlet plan.', itemB: 'Helhedsorienteret Plan', difficulty: 2 },
      { itemA: 'Fokus på familiens egne ressourcer og løsninger.', itemB: 'Løsningsfokuseret tilgang (SFT)', difficulty: 2 },
      { itemA: 'Støtte til ung i en kritisk overgangsfase.', itemB: 'CTI (Critical Time Intervention)', difficulty: 3 },
      { itemA: 'Analyse af magt og sprogbrug i en sag.', itemB: 'Diskursanalyse', difficulty: 3 },
      { itemA: 'At styrke borgerens tro på egne evner til handling.', itemB: 'Empowerment', difficulty: 3 },
    ],
    cardAType: 'case' as const,
    cardBType: 'tool' as const,
  },
  conceptbuilder: {
    id: 'conceptbuilder',
    title: 'Begrebs-Byggeren',
    description: 'Byg præcise definitioner ved at samle ord i den rette rækkefølge.',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-violet-500 to-fuchsia-600',
    lightColor: 'bg-violet-50',
    accentColor: 'text-violet-600',
    pairs: [
        { itemA: 'Habitus', itemB: 'Summen af vores erfaringer og måder at handle på i verden', difficulty: 1 },
        { itemA: 'Social Kapital', itemB: 'Værdien af de relationer og netværk vi indgår i', difficulty: 1 },
        { itemA: 'Symbolsk vold', itemB: 'Når dominerende grupper påtvinger andre deres verdensbillede', difficulty: 2 },
        { itemA: 'Kulturel Kapital', itemB: 'Viden og dannelse der giver anerkendelse i samfundet', difficulty: 2 },
        { itemA: 'Partshøring', itemB: 'Borgerens ret til at udtale sig om sagens faktiske grundlag', difficulty: 3 },
        { itemA: 'Retssikkerhed', itemB: 'Borgerens beskyttelse mod vilkårlige afgørelser fra myndigheder', difficulty: 3 },
    ]
  },
  dialogue: {
    id: 'dialogue',
    title: 'Samtale-Simulatoren',
    description: 'Find den rette faglige respons til borgerens udsagn.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'from-amber-600 to-orange-700',
    lightColor: 'bg-amber-50',
    accentColor: 'text-amber-700',
    rounds: [
        {
            difficulty: 1,
            scenario: "Du sidder med en ung mand, der er bange for at miste sin bolig pga. ubetalt husleje.",
            clientQuote: "Jeg ved slet ikke, hvad jeg skal gøre hvis de smider mig ud. Jeg har ingen andre steder at gå hen.",
            options: [
                { text: "Du er bekymret for din boligsituation og føler dig magtesløs.", isCorrect: true, feedback: "Korrekt! En empatisk spejling viser, at du lytter og forstår borgerens følelser uden at dømme." },
                { text: "Du skal bare finde en ny lejlighed med det samme.", isCorrect: false, feedback: "Forkert. Gode råd for tidligt kan blokere for borgerens egen motivation og føles som et pres." },
            ]
        },
        {
            difficulty: 1,
            scenario: "En enlig mor er frustreret over kommunens krav om dokumentation.",
            clientQuote: "I vil have så meget papirarbejde! Det føles som om, I slet ikke stoler på det, jeg siger.",
            options: [
                { text: "Det er lovens krav, og vi kan ikke gøre noget ved det.", isCorrect: false, feedback: "Forkert. Denne respons virker bureaukratisk og afvisende over for borgerens frustration." },
                { text: "Det føles som en mistillidserklæring, når vi beder om så meget dokumentation.", isCorrect: true, feedback: "Korrekt! At spejle følelsen af mistillid åbner op for en dialog om samarbejdet." },
            ]
        },
        {
            difficulty: 2,
            scenario: "En borger med misbrug er tøvende over for at starte i behandling.",
            clientQuote: "Jeg ved godt det er slemt, men stofferne hjælper mig med at slappe af i hovedet.",
            options: [
                { text: "Du ser både fordele og ulemper ved at stoppe dit forbrug.", isCorrect: true, feedback: "Korrekt! At anerkende ambivalensen er et kerneelement i Den Motiverende Samtale (MI)." },
                { text: "Hvis du ikke stopper nu, ødelægger du dit liv helt.", isCorrect: false, feedback: "Forkert. Skræmmekampagner øger ofte modstanden hos borgeren." },
            ]
        },
        {
            difficulty: 3,
            scenario: "En ung kvinde i efterværn føler sig svigtet af sin tidligere plejefamilie.",
            clientQuote: "De sagde de elskede mig, men så snart pengene stoppede, gad de ikke se mig mere.",
            options: [
                { text: "Det gør ondt at føle, at jeres relation var bundet op på økonomi fremfor kærlighed.", isCorrect: true, feedback: "Korrekt! En dyb spejling af svigtet og den økonomiske dimension hjælper med at bearbejde oplevelsen." },
                { text: "Måske har de bare travlt med deres egne liv nu?", isCorrect: false, feedback: "Forkert. Dette bagatelliserer borgerens følelse af svigt og forsvarer plejefamilien." },
            ]
        }
    ]
  },
  flashmatch: {
    id: 'flashmatch',
    title: 'Match-Madness',
    description: 'Hurtig-matching: Er det sandt eller falsk?',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-sky-500 to-blue-600',
    lightColor: 'bg-sky-50',
    accentColor: 'text-sky-600',
    questions: [
        { text: "Forvaltningsloven gælder for al offentlig forvaltning.", isTrue: true, difficulty: 1 },
        { text: "Børn over 12 år har altid ret til at klage over en afgørelse.", isTrue: true, difficulty: 1 },
        { text: "Serviceloven § 85 bruges kun til børn.", isTrue: false, difficulty: 1 },
        { text: "Underretningspligten gælder kun hvis man er 100% sikker.", isTrue: false, difficulty: 2 },
        { text: "Official-princippet betyder at kommunen skal oplyse sagen.", isTrue: true, difficulty: 2 },
        { text: "Bourdieu mener, at kapital kun handler om penge.", isTrue: false, difficulty: 2 },
        { text: "En sagsbehandler har altid tavshedspligt i sociale sager.", isTrue: true, difficulty: 3 },
        { text: "Partshøring kan udelades hvis det er til skade for barnet.", isTrue: true, difficulty: 3 },
        { text: "Habitus ændrer sig lynhurtigt fra dag til dag.", isTrue: false, difficulty: 3 },
    ]
  }
};

// --- TYPES ---
export type GameType = keyof typeof gameDataSets;

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
                    bonusPoints = newStreak > 1 ? 75 * (newStreak) : 50; // Increased bonus for fun
                    
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
        <div className="bg-[#FAF9F6] min-h-screen selection:bg-emerald-100 overflow-x-hidden relative">
            
            {/* Background Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-emerald-100/30 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-blue-100/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] right-[10%] w-[25vw] h-[25vw] bg-amber-100/20 rounded-full blur-[100px]" />
            </div>

            <AnimatePresence mode="wait">
                {gameState === 'selection' && (
                    <GameLobby 
                        userProfile={userProfile}
                        hasPlayedDailyChallenge={hasPlayedDailyChallenge || false}
                        dailyChallengeGameType={dailyChallengeGameType as GameType}
                        onSelectGame={handleSelectGame}
                    />
                )}

                {gameState === 'playing' && selectedGame && (
                    <div className="py-12 md:py-20 relative z-10">
                        {selectedGame === 'conceptbuilder' ? (
                            <SentenceEngine 
                                gameDef={gameDataSets[selectedGame]} 
                                level={selectedGameLevel} 
                                onGameEnd={handleGameEnd} 
                            />
                        ) : selectedGame === 'dialogue' ? (
                            <DialogueEngine 
                                rounds={gameDataSets[selectedGame].rounds} 
                                level={selectedGameLevel} 
                                onGameEnd={handleGameEnd}
                                color={gameDataSets[selectedGame].color}
                            />
                        ) : selectedGame === 'flashmatch' ? (
                            <FlashMatchEngine 
                                questions={gameDataSets[selectedGame].questions} 
                                level={selectedGameLevel}
                                onGameEnd={handleGameEnd}
                                color={gameDataSets[selectedGame].color}
                            />
                        ) : (
                            <GameEngine 
                                gameDef={gameDataSets[selectedGame]} 
                                level={selectedGameLevel} 
                                onGameEnd={handleGameEnd} 
                            />
                        )}
                    </div>
                )}

                {gameState === 'finished' && gameResult && (
                    <div className="py-24 relative z-10">
                        <GameOverScreen 
                            score={gameResult.score} 
                            success={gameResult.success} 
                            onRestart={handleRestart} 
                            onMenu={handleMenu} 
                            isSaving={isSaving} 
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Premium Footer */}
            <footer className="relative z-10 border-t border-emerald-950/5 bg-white/40 backdrop-blur-3xl px-10 py-10 mt-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3">
                            <Brain className="w-5 h-5 text-emerald-500" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-950">Memento Learning Engine</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 px-6 py-3 bg-white/50 rounded-full border border-emerald-950/5 shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em]">Faglig Selvtillid: Maksimal</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default function MementoPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace(`/?callbackUrl=${encodeURIComponent(pathname || '/')}`);
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <MementoPageContent user={user} />;
}
