'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Search, 
    BookOpen, 
    Book,
    Loader2,
    HelpCircle,
    Star,
    GraduationCap,
    Info,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    PlayCircle,
    XCircle,
    AlertCircle,
    Circle
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface TocItem {
    title: string;
    pageNumber: string;
}

interface BookItem {
    id: string;
    title: string;
    author: string;
    year?: string;
    publisher?: string;
    isbn?: string;
    toc?: TocItem[];
}

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);

export default function PensumPage() {
    const { user, openAuthPage } = useApp();
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = useState('');
    
    // Pensum-tracker state
    const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
    const [progressMap, setProgressMap] = useState<Record<string, Record<number, string>>>({});
    const [isProgressLoading, setIsProgressLoading] = useState(true);

    const booksQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'books'), orderBy('title', 'asc')) : null), [firestore]);
    const { data: books, isLoading: booksLoading } = useCollection<BookItem>(booksQuery);

    // Subscribe to user's tracked book progress in real-time
    useEffect(() => {
        if (!firestore || !user) {
            setProgressMap({});
            setIsProgressLoading(false);
            return;
        }

        setIsProgressLoading(true);
        const q = collection(firestore, 'users', user.uid, 'pensum');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newProgressMap: Record<string, Record<number, string>> = {};
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.progress) {
                    newProgressMap[docSnap.id] = data.progress;
                }
            });
            setProgressMap(newProgressMap);
            setIsProgressLoading(false);
        }, (error) => {
            console.error("Error fetching pensum progress:", error);
            setIsProgressLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user]);

    const filteredBooks = useMemo(() => {
        if (!books) return [];
        return books.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.author.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [books, searchQuery]);
    
    const formatAuthors = (authorString: string): string => {
        if (!authorString) return '';
        return authorString.split(';').map(name => name.trim()).join(', ');
    };

    const handleStatusChange = async (bookId: string, chapterIndex: number, newStatus: string) => {
        if (!user) {
            openAuthPage?.('signin');
            return;
        }
        
        if (!firestore) return;

        // Get current book progress
        const currentBookProgress = { ...(progressMap[bookId] || {}) };
        
        // Update locally (optimistic update)
        const updatedProgress = {
            ...currentBookProgress,
            [chapterIndex]: newStatus
        };
        
        setProgressMap(prev => ({
            ...prev,
            [bookId]: updatedProgress
        }));

        try {
            const bookRef = doc(firestore, 'users', user.uid, 'pensum', bookId);
            await setDoc(bookRef, {
                progress: updatedProgress,
                updatedAt: new Date()
            }, { merge: true });
        } catch (error) {
            console.error("Fejl ved gemning af pensum progress:", error);
            // Rollback state on error
            setProgressMap(prev => ({
                ...prev,
                [bookId]: currentBookProgress
            }));
        }
    };

    const STATUS_OPTIONS = [
        { value: 'unread', label: 'Ikke læst', color: 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50' },
        { value: 'reading', label: 'Læser', color: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' },
        { value: 'read', label: 'Læst', color: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
        { value: 'difficult', label: 'Svært', color: 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100' }
    ];

    const renderProgressBar = (book: BookItem) => {
        const total = book.toc?.length || 0;
        if (total === 0) return null;
        
        const bookProgress = progressMap[book.id] || {};
        const readCount = Object.values(bookProgress).filter(status => status === 'read').length;
        const percent = Math.round((readCount / total) * 100);

        return (
            <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>{readCount} af {total} læst</span>
                    <span className="text-amber-600">{percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500 rounded-full"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-amber-500/10 selection:text-amber-600">
            {/* HEADER */}
            <header className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100/30 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-50/30 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <Reveal>
                        <Link href={user ? "/portal" : "/"} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all mb-8">
                            <ArrowLeft className="w-3 h-3" /> Tilbage til portalen
                        </Link>
                    </Reveal>
                    
                    <Reveal delay={0.1}>
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-amber-900 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-900/20">
                                <BookOpen className="w-10 h-10" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-950 tracking-[-0.03em] serif">
                            Pensum & <br /> <span className="text-amber-600 italic">Anbefalinger</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mt-10">
                            Udforsk vores kuraterede liste over faglitteratur til socialrådgiver-studiet. Find inspiration og stil spørgsmål til litteraturen via AI'en.
                        </p>
                    </Reveal>

                    <Reveal delay={0.2}>
                        <div className="max-w-xl mx-auto mt-12 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-rose-500/20 rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                            <div className="relative flex items-center bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 p-2 overflow-hidden hover:border-amber-200 transition-all">
                                <div className="pl-6 pr-4">
                                    <Search className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Søg i titler, forfattere eller emner..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 py-4 bg-transparent focus:outline-none font-bold text-slate-900 placeholder:text-slate-300 text-base"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500"
                                    >
                                        Ryd
                                    </button>
                                )}
                            </div>
                        </div>
                    </Reveal>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 pb-40">
                {/* AI DISCLAIMER */}
                <Reveal delay={0.3}>
                    <div className="mb-16 bg-amber-50 rounded-[2.5rem] p-10 border border-amber-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform">
                            <Star className="w-40 h-40 text-amber-900" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                                <Info className="w-6 h-6" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-amber-950 uppercase tracking-widest text-[13px]">Vigtigt om AI og Kilder</h3>
                                <p className="text-amber-900/70 text-sm font-medium leading-relaxed max-w-3xl">
                                    Grundet regler om ophavsret kender Cohéros AI <span className="text-amber-950 font-black">ikke</span> det fulde indhold af bøgerne. AI'ens viden er baseret på metadata som indholdsfortegnelser og stikordsregistre. 
                                    <br /><br />
                                    Cohéro kan derfor <span className="text-rose-600 font-black">aldrig citere direkte</span> fra en bog. Platformen guider dig til relevant litteratur, men du skal altid selv slå op i de originale kilder.
                                </p>
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* BOOK LIST */}
                <div className="space-y-6">
                    {booksLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Indlæser bibliotek...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredBooks.map((book, index) => {
                                const isExpanded = expandedBookId === book.id;
                                return (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={book.id} 
                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                        className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-amber-900/5 transition-all flex flex-col"
                                    >
                                        <div 
                                            onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                                            className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer select-none"
                                        >
                                            <div className="flex items-start gap-6 flex-1 min-w-0">
                                                <div className="w-16 h-20 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                                                    <Book className="w-8 h-8 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                                </div>
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-amber-950 transition-colors">
                                                        {book.title}
                                                    </h3>
                                                    <p className="text-slate-400 font-medium text-sm">
                                                        <span className="text-amber-600/60 font-black uppercase tracking-widest text-[10px] mr-2">Forfatter:</span>
                                                        {formatAuthors(book.author)}
                                                        {book.year && <span className="ml-2 text-slate-300">• {book.year}</span>}
                                                    </p>
                                                    {/* Mobile progress bar */}
                                                    {book.toc && book.toc.length > 0 && user && (
                                                        <div className="md:hidden mt-3">
                                                            {renderProgressBar(book)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-6 shrink-0 justify-between md:justify-start">
                                                {/* Desktop progress bar */}
                                                {book.toc && book.toc.length > 0 && user && (
                                                    <div className="hidden md:block w-48 shrink-0">
                                                        {renderProgressBar(book)}
                                                    </div>
                                                )}
                                                <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-amber-50 text-slate-400 group-hover:text-amber-600 flex items-center justify-center transition-colors">
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    {book.toc && book.toc.length > 0 ? (
                                                        <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                                                            {/* Guest login banner */}
                                                            {!user && (
                                                                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-amber-600 shrink-0 shadow-sm border border-amber-100/30">
                                                                            <Info className="w-4 h-4" />
                                                                        </div>
                                                                        <p className="text-xs font-semibold text-amber-950">
                                                                            Log ind for at gemme din læse-status og tracke dit pensum.
                                                                        </p>
                                                                    </div>
                                                                    <Button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openAuthPage?.('signin');
                                                                        }}
                                                                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs px-4 py-2 font-bold h-auto shadow-sm self-start sm:self-auto shrink-0"
                                                                    >
                                                                        Log ind
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                                                Indholdsfortegnelse ({book.toc.length} kapitler)
                                                            </h4>
                                                            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {book.toc.map((chapter, idx) => {
                                                                    const currentStatus = (user && progressMap[book.id]?.[idx]) || 'unread';
                                                                    return (
                                                                        <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                            <div className="flex items-start gap-3 min-w-0">
                                                                                <span className="text-xs font-bold text-slate-300 select-none pt-0.5 shrink-0">
                                                                                    {(idx + 1).toString().padStart(2, '0')}
                                                                                </span>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                                                                        {chapter.title}
                                                                                    </p>
                                                                                    {chapter.pageNumber && (
                                                                                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                                                                            Side {chapter.pageNumber}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="flex flex-wrap gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                                {STATUS_OPTIONS.map((opt) => {
                                                                                    const isSelected = currentStatus === opt.value;
                                                                                    return (
                                                                                        <button
                                                                                            key={opt.value}
                                                                                            onClick={() => handleStatusChange(book.id, idx, opt.value)}
                                                                                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 ${
                                                                                                isSelected 
                                                                                                    ? `${opt.color} shadow-sm scale-[1.02] border-transparent font-black` 
                                                                                                    : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-white hover:text-slate-600'
                                                                                            }`}
                                                                                        >
                                                                                            {isSelected && (
                                                                                                <>
                                                                                                    {opt.value === 'read' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                                                                                    {opt.value === 'reading' && <PlayCircle className="w-3 h-3 text-amber-600" />}
                                                                                                    {opt.value === 'difficult' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                                                                                                    {opt.value === 'unread' && <Circle className="w-3 h-3 text-slate-400" />}
                                                                                                </>
                                                                                            )}
                                                                                            {opt.label}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-8 pt-8 border-t border-slate-100 text-center py-8">
                                                            <p className="text-slate-400 text-xs font-semibold">Indholdsfortegnelse er ikke tilgængelig for denne bog.</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}

                    {!booksLoading && filteredBooks.length === 0 && (
                        <Reveal>
                            <div className="py-32 text-center bg-white rounded-[4rem] border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                    <Search className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Ingen resultater</h3>
                                <p className="text-slate-400 font-medium">Vi fandt ikke nogen bøger, der matchede "{searchQuery}"</p>
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="mt-8 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-950 underline underline-offset-8"
                                >
                                    Vis alle bøger
                                </button>
                            </div>
                        </Reveal>
                    )}
                </div>

                {/* BOTTOM CTA */}
                <Reveal delay={0.5}>
                    <div className="mt-20 p-12 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px]" />
                        <div className="space-y-4 text-center md:text-left">
                            <div className="flex justify-center md:justify-start">
                                <GraduationCap className="w-10 h-10 text-amber-400" />
                            </div>
                            <h2 className="text-3xl font-extrabold serif italic">Mangler vi en bog?</h2>
                            <p className="text-slate-400 font-medium max-w-sm">
                                Vi udvider løbende vores bibliotek. Send os besked hvis der er litteratur vi mangler på listen.
                            </p>
                        </div>
                        <a href="mailto:kontakt@cohero.dk" className="px-10 py-5 bg-white text-slate-950 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shadow-2xl">
                            Send forslag
                        </a>
                    </div>
                </Reveal>
            </main>

            {/* FOOTER BADGE */}
            <footer className="fixed bottom-0 left-0 right-0 p-8 z-[90] pointer-events-none flex justify-center">
                <div className="px-6 py-2 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center gap-3">
                    <div className="flex -space-x-1 items-end h-3">
                        <div className="w-0.5 h-full bg-amber-400 rounded-full" />
                        <div className="w-0.5 h-4 bg-amber-500 rounded-full" />
                        <div className="w-0.5 h-full bg-amber-600 rounded-full" />
                    </div>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">Litteratur Arkiv</span>
                </div>
            </footer>
        </div>
    );
}
