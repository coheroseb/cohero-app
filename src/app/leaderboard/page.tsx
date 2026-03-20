'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Loader2, Crown, Trophy, Award } from 'lucide-react';
import { useApp } from '@/app/provider';

interface LeaderboardEntry {
    id: string;
    username: string;
    cohéroPoints: number;
}

function LeaderboardPageContent() {
    const { user } = useApp();
    const firestore = useFirestore();

    const leaderboardQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'leaderboard'), orderBy('cohéroPoints', 'desc'), limit(10)) : null,
        [firestore]
    );

    const { data: leaderboard, isLoading, error } = useCollection<LeaderboardEntry>(leaderboardQuery);

    const getRankColor = (rank: number) => {
        if (rank === 0) return 'text-amber-400';
        if (rank === 1) return 'text-slate-400';
        if (rank === 2) return 'text-amber-700';
        return 'text-slate-500';
    };

    const getRankIcon = (rank: number) => {
        if (rank === 0) return <Crown className="w-5 h-5" />;
        if (rank === 1) return <Trophy className="w-5 h-5" />;
        if (rank === 2) return <Award className="w-5 h-5" />;
        return <span className="font-bold text-xs w-5 text-center">{rank + 1}</span>;
    };

    return (
        <div className="bg-[#FDFCF8] min-h-screen">
            <header className="bg-white border-b border-amber-100/50">
                <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif">
                                Leaderboard
                            </h1>
                            <p className="text-base text-slate-500">
                                Se hvem der er mest aktiv og optjener flest Cohéro Points.
                            </p>
                        </div>
                    </div>
                </div>
            </header>
            
            <main className="max-w-2xl mx-auto p-4 md:p-8">
                <div className="bg-white p-8 rounded-[2rem] border border-amber-100/60 shadow-sm">
                    {isLoading && (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        </div>
                    )}
                    {error && (
                        <p className="text-red-500 text-center">Kunne ikke hente leaderboard: {error.message}</p>
                    )}
                    {!isLoading && leaderboard && (
                        <ul className="space-y-4">
                            {leaderboard.map((entry, index) => (
                                <li key={entry.id} className={`p-4 rounded-xl flex items-center gap-4 transition-all ${entry.id === user?.uid ? 'bg-amber-100/70 border-2 border-dashed border-amber-300' : 'bg-slate-50/70'}`}>
                                    <div className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center ${getRankColor(index)}`}>
                                        {getRankIcon(index)}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-amber-950">{entry.username}</p>
                                        <p className="text-xs text-slate-500">Rank #{index + 1}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-lg font-black text-amber-700 serif text-right">
                                            {entry.cohéroPoints.toLocaleString('da-DK')}
                                            <span className="text-xs font-sans text-amber-700/70 uppercase ml-1">CP</span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
};

const LeaderboardPage = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#FDFCF8]">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-semibold">Indlæser...</p>
            </div>
        );
    }

    return <LeaderboardPageContent />;
};


export default LeaderboardPage;
