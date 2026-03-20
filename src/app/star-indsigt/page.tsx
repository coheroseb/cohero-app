'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  BarChart3, 
  ChevronRight, 
  Loader2, 
  Search,
  Database
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { fetchStarSubjectsAction } from '@/app/actions';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';

interface StarSubject {
    SubjectID: string | number;
    SubjectName: string;
}

export default function StarIndsigtPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    
    const [subjects, setSubjects] = useState<StarSubject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
            return;
        }

        const loadSubjects = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchStarSubjectsAction();
                setSubjects(data || []);
            } catch (err: any) {
                console.error("STAR fetch error:", err);
                setError("Kunne ikke hente data fra STAR. Tjek venligst API-token og systemets konfiguration.");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            loadSubjects();
        }
    }, [user, isUserLoading, router]);

    const filteredSubjects = useMemo(() => {
        if (!subjects) return [];
        if (!searchQuery.trim()) return subjects;
        
        const term = searchQuery.toLowerCase();
        return subjects.filter(s => 
            (s.SubjectName || '').toLowerCase().includes(term)
        );
    }, [subjects, searchQuery]);

    if (isUserLoading) {
        return <AuthLoadingScreen />;
    }

    return (
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-indigo-100">
            <header className="bg-white border-b border-amber-100 px-6 py-10 sticky top-24 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/portal" className="p-3 bg-indigo-50 text-indigo-900 rounded-2xl hover:bg-indigo-100 transition-all group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-1.5 bg-indigo-50 rounded-lg">
                                    <BarChart3 className="w-4 h-4 text-indigo-700" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/50">Data & Statistik</span>
                            </div>
                            <h1 className="text-3xl font-bold text-amber-950 serif">STAR Indsigt</h1>
                        </div>
                    </div>

                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Søg i statistiske emner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-[#FDFCF8] border border-amber-100 rounded-2xl focus:ring-2 focus:ring-indigo-950 focus:outline-none transition-all shadow-inner text-sm font-medium"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    </div>
                ) : error ? (
                    <div className="py-20 text-center bg-rose-50 rounded-[3rem] border border-dashed border-rose-200">
                        <p className="text-rose-600 font-bold">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-xl border-rose-200 text-rose-950">Prøv igen</Button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSubjects.map((subject) => (
                            <Link 
                                key={subject.SubjectID} 
                                href={`/star-indsigt/subject/${subject.SubjectID}`}
                                className="bg-white p-8 rounded-[2rem] border border-amber-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-amber-950 group-hover:text-indigo-900 transition-colors">{subject.SubjectName}</h3>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
                            </Link>
                        ))}
                        {filteredSubjects.length === 0 && (
                            <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-100">
                                <Search className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                                <p className="text-slate-400 italic">Ingen emner fundet.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
