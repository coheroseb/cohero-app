
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronRight, 
  Loader2, 
  Calendar,
  Table as TableIcon,
  BarChart3,
  ChevronLeft,
  ArrowUpRight,
  Clock,
  Layout,
  Target
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { fetchStarTablesAction } from '@/app/actions';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';

interface StarTable {
    TableID: string;
    TableName: string;
    SubjectID: number;
    SubjectName: string;
    LatestUpdate: string;
    NextUpdate: string;
    Measurements: { ID: string; Name: string }[];
}

const TableSkeleton = () => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm animate-pulse h-40">
        <div className="w-24 h-4 bg-slate-100 rounded mb-4"></div>
        <div className="w-2/3 h-6 bg-slate-100 rounded-lg"></div>
    </div>
);

export default function StarSubjectTablesPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const params = useParams();
    const subjectId = params.subjectId as string;
    
    const [tables, setTables] = useState<StarTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
            return;
        }

        const loadTables = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchStarTablesAction(subjectId);
                setTables(data || []);
            } catch (err: any) {
                console.error("Error fetching tables:", err);
                setError("Kunne ikke hente tabeller for dette emne.");
            } finally {
                setIsLoading(false);
            }
        };

        if (user && subjectId) {
            loadTables();
        }
    }, [user, isUserLoading, router, subjectId]);

    const subjectName = useMemo(() => tables[0]?.SubjectName || subjectId, [tables, subjectId]);

    if (isUserLoading) {
        return <AuthLoadingScreen />;
    }

    return (
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-indigo-100">
            <header className="bg-white border-b border-amber-100 px-6 py-10 sticky top-24 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 bg-indigo-50 text-indigo-900 rounded-2xl hover:bg-indigo-100 transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-1.5 bg-indigo-50 rounded-lg">
                                <BarChart3 className="w-4 h-4 text-indigo-700" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/50">Emne: {subjectName}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-amber-950 serif">Statistiske Tabeller</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
                <div className="flex items-center justify-between px-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-950 transition-all uppercase tracking-widest"
                    >
                        <ChevronLeft className="w-4 h-4" /> Tilbage til emner
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{tables.length} tabeller fundet</span>
                </div>

                {error ? (
                    <div className="py-20 text-center bg-rose-50 rounded-[3rem] border border-dashed border-rose-200">
                        <p className="text-rose-600 font-bold">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Prøv igen</Button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <TableSkeleton key={i} />)
                        ) : tables.map((table) => (
                            <Link 
                                key={table.TableID} 
                                href={`/star-indsigt/table/${table.TableID}`}
                                className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group animate-fade-in-up"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">ID: {table.TableID}</span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5" /> Opdateret: {table.LatestUpdate}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold text-amber-950 serif group-hover:text-indigo-900 transition-colors mb-4">{table.TableName}</h3>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {table.Measurements?.map(m => (
                                                <span key={m.ID} className="text-[9px] font-black uppercase tracking-tighter text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{m.Name}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-900 opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-1 self-center">
                                        Se metadata <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {!isLoading && tables.length === 0 && (
                            <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-100">
                                <TableIcon className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                                <p className="text-slate-400 italic">Ingen tabeller fundet for dette emne.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
