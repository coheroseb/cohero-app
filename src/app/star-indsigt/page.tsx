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
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-indigo-100 pb-20">
            {/* COMPACT TOP BAR / SEARCH */}
            <header className="bg-white border-b border-amber-100 px-8 py-6 sticky top-0 z-30 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-amber-950 serif">Oversigt</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                        {subjects.length > 0 ? `${subjects.length} Emneområder` : 'Henter emner...'}
                    </p>
                </div>

                <div className="flex-1 max-w-xl mx-12 hidden md:block font-sans">
                    <div className="relative group/search w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/search:text-indigo-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Søg i emner (f.eks. 'Beskæftigelse')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border-none rounded-[2rem] text-sm focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all shadow-sm group-hover/search:shadow-md"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/portal">
                        <Button variant="outline" className="rounded-2xl border-amber-100 text-amber-950 px-6 h-11 hover:bg-amber-50 transition-all font-bold group text-xs">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Portal
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-white rounded-[2.5rem] border border-amber-50 animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="py-24 text-center bg-rose-50/50 rounded-[4rem] border border-dashed border-rose-200 max-w-3xl mx-auto space-y-6">
                        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                            <Database className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-rose-950 serif">Forbindelsen blev afbrudt</h3>
                            <p className="text-rose-600/70 font-medium max-w-sm mx-auto mt-2 italic">{error}</p>
                        </div>
                        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl border-rose-200 text-rose-950 h-12 px-8 font-black uppercase text-xs tracking-widest">Prøv igen</Button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredSubjects.map((subject, index) => (
                            <Link 
                                key={subject.SubjectID} 
                                href={`/star-indsigt/subject/${subject.SubjectID}`}
                                className="bg-white p-10 rounded-[2.5rem] border border-amber-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[220px] animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Hover background effect */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                <div className="space-y-6 relative z-10">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                        <Database className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-indigo-400 transition-colors">Emne #{subject.SubjectID}</span>
                                        <h3 className="text-2xl font-bold text-amber-950 serif group-hover:text-indigo-900 transition-colors mt-1">{subject.SubjectName}</h3>
                                    </div>
                                </div>
                                
                                <div className="pt-6 flex items-center justify-between border-t border-amber-50 relative z-10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900/50 group-hover:text-indigo-900 transition-colors">Udforsk data</span>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-100 group-hover:border-indigo-600">
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                        
                        {filteredSubjects.length === 0 && (
                            <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border border-dashed border-amber-100 space-y-6">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
                                    <Search className="w-10 h-10" />
                                </div>
                                <p className="text-slate-400 font-medium italic text-lg">Vi kunne ikke finde noget emne, der matcher din søgning.</p>
                                <Button variant="ghost" onClick={() => setSearchQuery('')} className="text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl">Nulstil søgning</Button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
