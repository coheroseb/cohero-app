
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart2, CheckCircle, Brain, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

interface Dilemma {
    id: string;
    weekNumber: number;
    title: string;
    question: string;
    options: { id: 'A' | 'B' | 'C'; text: string }[];
    createdAt: { toDate: () => Date };
    isReleased: boolean;
}

interface DilemmaVote {
    choiceId: 'A' | 'B' | 'C';
    justification: string;
}

interface DilemmaAnalysis {
    voteDistribution: { A: number, B: number, C: number };
    analysis: string;
}

const DilemmaVoting = ({ dilemma, onVote, userVote, isVoting }: { dilemma: Dilemma, onVote: (choiceId: 'A' | 'B' | 'C', justification: string) => void, userVote: DilemmaVote | null, isVoting: boolean }) => {
    const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | null>(userVote?.choiceId || null);
    const [justification, setJustification] = useState(userVote?.justification || '');

    if (userVote) {
        return (
            <div className="bg-emerald-50 text-center p-8 rounded-2xl border border-emerald-200">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4"/>
                <h3 className="text-xl font-bold text-emerald-900">Tak for din stemme!</h3>
                <p className="text-sm text-emerald-800">Resultatet bliver frigivet på onsdag.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                {dilemma.options.map(option => (
                    <button key={option.id} onClick={() => setSelectedOption(option.id)} className={`w-full p-4 rounded-xl border-2 text-left flex items-start gap-4 transition-all ${selectedOption === option.id ? 'bg-amber-100 border-amber-300' : 'bg-white hover:bg-amber-50'}`}>
                        <div className="w-6 h-6 flex-shrink-0 rounded-md flex items-center justify-center font-bold text-xs border-2 border-current mt-1">{option.id}</div>
                        <span className="flex-1">{option.text}</span>
                    </button>
                ))}
            </div>
            {selectedOption && (
                <div className="space-y-4 animate-fade-in-up">
                    <textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Skriv en kort faglig begrundelse for dit valg..." className="w-full h-24 p-4 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900" />
                    <Button onClick={() => onVote(selectedOption, justification)} disabled={!justification.trim() || isVoting} className="w-full">
                        {isVoting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                        {isVoting ? 'Stemmer...' : 'Afgiv Stemme'}
                    </Button>
                </div>
            )}
        </div>
    )
};

const DilemmaResults = ({ dilemma, analysis, userVote }: { dilemma: Dilemma, analysis: DilemmaAnalysis, userVote: DilemmaVote | null }) => {
    const totalVotes = analysis.voteDistribution.A + analysis.voteDistribution.B + analysis.voteDistribution.C;
    
    const getPercentage = (count: number) => totalVotes > 0 ? (count / totalVotes) * 100 : 0;

    return (
        <div className="space-y-8">
            <div>
                <h3 className="font-bold text-amber-950 mb-4">Sådan stemte dine medstuderende:</h3>
                <div className="space-y-4">
                    {dilemma.options.map(option => {
                        const count = analysis.voteDistribution[option.id];
                        const percentage = getPercentage(count);
                        return (
                             <div key={option.id} className={`p-4 rounded-xl border-2 ${userVote?.choiceId === option.id ? 'bg-amber-50 border-amber-300' : 'bg-white'}`}>
                                <div className="flex justify-between items-center text-sm font-bold text-amber-950 mb-2">
                                    <span>{option.id}: {option.text}</span>
                                    <span>{percentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-amber-100 rounded-full h-4">
                                    <div className="bg-amber-400 h-4 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <div className="prose prose-sm max-w-none text-slate-700 bg-white p-6 rounded-xl border" dangerouslySetInnerHTML={{ __html: analysis.analysis }} />
        </div>
    )
};


function UgensDilemmaPageContent() {
    const { user } = useApp();
    const firestore = useFirestore();
    const [isVoting, setIsVoting] = useState(false);
    
    // Get the most recent dilemma
    const dilemmaQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'dilemmas'), orderBy('createdAt', 'desc'), limit(1)) : null, [firestore]);
    const { data: dilemmas, isLoading: dilemmaLoading } = useCollection<Dilemma>(dilemmaQuery);
    const dilemma = dilemmas?.[0];
    
    // Get the user's vote for this dilemma
    const voteRef = useMemoFirebase(() => (dilemma && user) ? doc(firestore, 'dilemmas', dilemma.id, 'votes', user.uid) : null, [dilemma, user]);
    const { data: userVote, isLoading: voteLoading } = useDoc<DilemmaVote>(voteRef);

    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
      if (!dilemma) return;

      const today = new Date();
      const dilemmaDate = dilemma.createdAt.toDate();
      const dilemmaDay = dilemmaDate.getDay(); // 0=Sun, 1=Mon...
      
      // Find Monday of the dilemma's week
      const monday = new Date(dilemmaDate);
      monday.setDate(dilemmaDate.getDate() - (dilemmaDay === 0 ? 6 : dilemmaDay - 1));
      monday.setHours(0, 0, 0, 0);

      // Find Wednesday of the same week
      const wednesday = new Date(monday);
      wednesday.setDate(monday.getDate() + 2);
      
      setShowResults(today >= wednesday && dilemma.isReleased);
    }, [dilemma]);

    // Get the analysis if it exists and should be shown
    const analysisRef = useMemoFirebase(() => (dilemma && showResults) ? doc(firestore, 'dilemmaResults', dilemma.id) : null, [dilemma, showResults]);
    const { data: analysis, isLoading: analysisLoading } = useDoc<DilemmaAnalysis>(analysisRef);

    const handleVote = async (choiceId: 'A' | 'B' | 'C', justification: string) => {
        if (!dilemma || !user || !firestore || !voteRef) return;
        setIsVoting(true);
        try {
            await setDoc(voteRef, {
                dilemmaId: dilemma.id,
                userId: user.uid,
                choiceId,
                justification,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error submitting vote:", error);
        } finally {
            setIsVoting(false);
        }
    };
    
    const isLoading = dilemmaLoading || voteLoading;

    return (
        <div className="bg-[#FDFCF8] min-h-screen">
            <header className="bg-white border-b border-amber-100/50">
                <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex items-center gap-4">
                    <Link href="/portal" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif">
                        Ugens Dilemma
                      </h1>
                      <p className="text-base text-slate-500">
                        {dilemma ? `Uge ${dilemma.weekNumber}: ${dilemma.title}` : 'Træn dit faglige skøn'}
                      </p>
                    </div>
                </div>
            </header>
            <main className="max-w-3xl mx-auto p-4 md:p-8">
                {isLoading && (
                     <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-amber-500"/>
                    </div>
                )}
                {!isLoading && dilemma && (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold text-center text-amber-950 serif">{dilemma.question}</h2>
                        {showResults ? (
                            analysisLoading ? (
                                <div className="text-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                    <p className="mt-4 text-slate-500">Henter analyse af resultater...</p>
                                </div>
                            ) : analysis ? (
                                <DilemmaResults dilemma={dilemma} analysis={analysis} userVote={userVote} />
                            ) : (
                                <div className="text-center py-20 text-slate-500">Analysen er ikke klar endnu. Kom tilbage senere.</div>
                            )
                        ) : (
                            <DilemmaVoting dilemma={dilemma} onVote={handleVote} userVote={userVote} isVoting={isVoting}/>
                        )}
                    </div>
                )}
                {!isLoading && !dilemma && (
                     <div className="text-center py-20">
                        <p className="text-slate-500">Der er intet aktivt dilemma i denne uge.</p>
                     </div>
                )}
            </main>
        </div>
    );
}

export default function UgensDilemmaPage() {
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

    return <UgensDilemmaPageContent />;
}
