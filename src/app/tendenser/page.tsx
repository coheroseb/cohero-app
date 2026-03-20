'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TrendingUp, Info, Loader2, PlayCircle, FileText, Scale, DraftingCompass, BookOpen, Wand2, BrainCircuit, Network, Lightbulb, HelpCircle, Presentation } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, DocumentData } from 'firebase/firestore';

// Define types for trends
interface TrendItem {
  name: string;
  count: number;
}

const TrendCard = ({ title, icon, data, emptyText }: { title: string, icon: React.ReactNode, data: TrendItem[], emptyText: string }) => {
    // Sort data descending by count and take top 5
    const sortedData = useMemo(() => data.sort((a, b) => b.count - a.count).slice(0, 5), [data]);

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-amber-100/60 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
                <h2 className="text-xl font-bold text-amber-950 serif">{title}</h2>
            </div>
            {sortedData.length > 0 ? (
                <ul className="space-y-4">
                    {sortedData.map((item, index) => (
                        <li key={item.name} className="flex items-center justify-between gap-4">
                            <span className="text-sm font-bold text-amber-900">{index + 1}. {item.name}</span>
                            <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{item.count}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-400 text-center italic py-4">{emptyText}</p>
            )}
        </div>
    );
};


function TendenserPageContent() {
    const firestore = useFirestore();
    const activitiesQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'userActivities'), orderBy('createdAt', 'desc'), limit(500)) : null,
        [firestore]
    );

    const { data: activities, isLoading, error } = useCollection<DocumentData>(activitiesQuery);
    
    const trends = useMemo(() => {
        if (!activities) {
            return {
                toolUsage: [],
                concepts: [],
                laws: []
            };
        }

        const toolUsage: { [key: string]: number } = {
            'Case-træner': 0,
            'Journal-træner': 0,
            'Refleksionslog': 0,
            'Begrebsguide': 0,
            'Eksamens-Arkitekten': 0,
            'Quiz-byggeren': 0,
            'Seminar-Arkitekten': 0,
            'Lovportalen': 0,
            'Fagligt Mycelium': 0,
        };

        const concepts: { [key: string]: number } = {};
        const laws: { [key: string]: number } = {};

        const conceptRegex = /slog begrebet "([^"]+)" op/;
        const lawRegex = /slog § \S+ i (.+?) op/;

        for (const activity of activities) {
            const text = activity.actionText || '';

            // Tool Usage
            if (text.includes('Case-træner')) toolUsage['Case-træner']++;
            if (text.includes('Journal-træner')) toolUsage['Journal-træner']++;
            if (text.includes('Eksamens-Arkitekten')) toolUsage['Eksamens-Arkitekten']++;
            if (text.includes('Lovportalen')) toolUsage['Lovportalen']++;
            if (text.includes('Begrebsguiden')) toolUsage['Begrebsguide']++;
            if (text.includes('Refleksionsloggen')) toolUsage['Refleksionslog']++;
            if (text.includes('Quiz-byggeren')) toolUsage['Quiz-byggeren']++;
            if (text.includes('Seminar-Arkitekten')) toolUsage['Seminar-Arkitekten']++;
            if (text.includes('faglige mycelium')) toolUsage['Fagligt Mycelium']++;

            // Concept Trends
            const conceptMatch = text.match(conceptRegex);
            if (conceptMatch && conceptMatch[1]) {
                const concept = conceptMatch[1];
                concepts[concept] = (concepts[concept] || 0) + 1;
            }

            // Law Trends
            const lawMatch = text.match(lawRegex);
            if (lawMatch && lawMatch[1]) {
                const law = lawMatch[1];
                laws[law] = (laws[law] || 0) + 1;
            }
        }
        
        const toSortedArray = (obj: { [key: string]: number }): TrendItem[] => {
            return Object.entries(obj).map(([name, count]) => ({ name, count }));
        };

        return {
            toolUsage: toSortedArray(toolUsage),
            concepts: toSortedArray(concepts),
            laws: toSortedArray(laws),
        };

    }, [activities]);

    return (
        <div className="bg-[#FDFCF8] min-h-screen">
            <header className="bg-white border-b border-amber-100/50">
                <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
                        Faglige Tendenser
                    </h1>
                    <p className="text-base text-slate-500 max-w-3xl">
                        Se hvilke emner, værktøjer og lovgivninger der trender blandt dine medstuderende på tværs af landet lige nu.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-8">
                {isLoading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-amber-500"/>
                    </div>
                )}
                {error && <p className="text-red-500 text-center">Kunne ikke hente data til tendenser.</p>}

                {!isLoading && !error && (
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <TrendCard 
                            title="Populære Værktøjer"
                            icon={<PlayCircle/>}
                            data={trends.toolUsage}
                            emptyText="Ingen værktøjsbrug endnu."
                        />
                         <TrendCard 
                            title="Varme Begreber & Modeller"
                            icon={<Wand2/>}
                            data={trends.concepts}
                            emptyText="Ingen begrebsopslag endnu."
                        />
                         <TrendCard 
                            title="Relevante Love"
                            icon={<Scale/>}
                            data={trends.laws}
                            emptyText="Ingen lovopslag endnu."
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

export default function TendenserPage() {
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
  
  return <TendenserPageContent />;
}
