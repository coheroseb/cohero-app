
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
  Target,
  Info,
  RefreshCw,
  Tag,
  ArrowRight,
  LayoutDashboard
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
    const subjectId = (params?.subjectId as string) || '';
    
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
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-indigo-100 pb-20">
            <header className="bg-white border-b border-amber-100 px-8 py-6 sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-900 transition-all group shrink-0 shadow-sm border border-slate-100">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-0.5">
                            <div className="p-1.5 bg-indigo-600 rounded-lg shadow-md shadow-indigo-100">
                                <BarChart3 className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-900/50">Emne-udforskning</span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-amber-950 serif tracking-tight">{subjectName}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/star-indsigt">
                        <Button variant="outline" className="rounded-2xl border-amber-100 text-amber-950 px-6 h-11 hover:bg-amber-50 transition-all font-bold group text-xs font-sans">
                            <LayoutDashboard className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Oversigt
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-amber-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tilgængelige tabeller</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        {tables.length} {tables.length === 1 ? 'Tabel' : 'Tabeller'} fundet
                    </span>
                </div>

                {error ? (
                    <div className="py-24 text-center bg-rose-50/50 rounded-[4rem] border border-dashed border-rose-200 animate-ink">
                        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner mb-6">
                            <Info className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-rose-950 serif">Hov! Der opstod en fejl</h3>
                        <p className="text-rose-600/70 font-medium max-w-sm mx-auto mt-2 italic">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="mt-8 rounded-2xl border-rose-200 text-rose-950 h-12 px-8 font-black uppercase text-xs tracking-widest">Prøv igen</Button>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <TableSkeleton key={i} />)
                        ) : tables.map((table, index) => (
                            <Link 
                                key={table.TableID} 
                                href={`/star-indsigt/table/${table.TableID}`}
                                className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Decorative Accent */}
                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-indigo-700 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex flex-col lg:flex-row justify-between gap-10">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="text-[10px] font-black uppercase text-white bg-amber-950 px-3 py-1 rounded-lg border border-amber-900 shadow-sm">ID: {table.TableID}</span>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Opdateret: {table.LatestUpdate}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                                <Clock className="w-3.5 h-3.5 text-amber-500" /> Næste: {table.NextUpdate}
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-2xl md:text-3xl font-bold text-amber-950 serif group-hover:text-indigo-900 transition-colors leading-tight">{table.TableName}</h3>
                                        
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {table.Measurements?.map(m => (
                                                <div key={m.ID} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter text-indigo-900/40 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/50 group-hover:border-indigo-200 group-hover:text-indigo-900 transition-all">
                                                    <Tag className="w-3 h-3" />
                                                    {m.Name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex lg:flex-col items-center justify-between lg:justify-center gap-6 lg:border-l lg:border-amber-50 lg:pl-10">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-12">
                                            <TableIcon className="w-8 h-8" />
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-900 border-b-2 border-indigo-100 pb-1 group-hover:border-indigo-600 transition-all">
                                            Konfigurér data <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
