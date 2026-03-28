
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Bookmark, 
  Trash2, 
  Loader2, 
  Building,
  FileText,
  Calendar,
  ExternalLink,
  History,
  BookOpen,
  ArrowUpRight,
  Search,
  Sparkles,
  Quote,
  Copy,
  Check,
  X,
  Plus
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedArticle {
  id: string;
  articleId: string;
  title: string;
  description: string;
  url: string;
  publicationDate: string;
  apa?: string;
  savedAt: { toDate: () => Date };
}

export default function MineGemteArtiklerPage() {
    const { user, isUserLoading, userProfile } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const savedArticlesQuery = useMemoFirebase(() => (
        user && firestore ? query(collection(firestore, 'users', user.uid, 'savedViveArticles'), orderBy('savedAt', 'desc')) : null
    ), [user, firestore]);
    
    const { data: articles, isLoading } = useCollection<SavedArticle>(savedArticlesQuery);
    
    // Motor: Instant Local Filter
    const filteredArticles = useMemo(() => {
        if (!articles) return [];
        if (!searchQuery.trim()) return articles;
        const q = searchQuery.toLowerCase();
        return articles.filter(a => 
            a.title.toLowerCase().includes(q) || 
            a.description.toLowerCase().includes(q)
        );
    }, [articles, searchQuery]);

    const handleUnsave = async (id: string) => {
        if (!user || !firestore) return;
        try {
            await deleteDoc(doc(firestore, 'users', user.uid, 'savedViveArticles', id));
            toast({ title: "Artikel fjernet fra din samling" });
        } catch (error) {
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke fjerne artiklen." });
        }
    };

    const handleCopyApa = (e: React.MouseEvent, id: string, apa: string) => {
        e.preventDefault(); e.stopPropagation();
        const plainText = apa.replace(/<[^>]*>?/gm, '');
        navigator.clipboard.writeText(plainText);
        setCopiedId(id);
        toast({ title: "Reference kopieret" });
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (isUserLoading || isLoading) {
        return <AuthLoadingScreen />;
    }

    return (
        <div className="bg-[#FDFCF8] min-h-screen pb-40 selection:bg-cyan-100">
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
                .serif-premium { font-family: 'Playfair Display', serif; }
            ` }} />
            
            {/* SEARCH & NAV HEADER */}
            <header className="bg-white/80 backdrop-blur-2xl border-b border-amber-100 sticky top-0 z-50 px-8 py-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/portal" className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all group shadow-sm">
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="h-10 w-[1px] bg-slate-100 hidden sm:block"></div>
                        <div className="hidden sm:block">
                            <h2 className="text-sm font-black text-slate-900 tracking-tight leading-none">Mit Videns-Arkiv</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{filteredArticles.length} Gemte Rapporter</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl relative group w-full">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                             <Search className="w-4 h-4 transition-colors group-focus-within:text-cyan-600" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Søg i dine gemte artikler..."
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/5 focus:bg-white focus:outline-none transition-all text-sm font-bold shadow-inner"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900"><X className="w-4 h-4" /></button>
                        )}
                    </div>

                    <Link href="/vive-indsigt">
                        <Button className="h-12 px-6 bg-slate-900 text-white rounded-2xl font-bold border-none shadow-xl shadow-slate-900/10 hover:bg-cyan-600 transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Udforsk Mere
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 pt-20">
                {/* HERO SECTION */}
                <div className="mb-20 space-y-4">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center"><History className="w-5 h-5" /></div>
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600">Personligt Bibliotek</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 serif-premium tracking-tight leading-none">
                        Dine Gemte <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Indsigter</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
                        Her finder du den vigtigste viden, du har udvalgt fra VIVE og på tværs af platformen.
                    </p>
                </div>

                {!articles || articles.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-8"><Bookmark className="w-10 h-10" /></div>
                        <h3 className="text-2xl font-bold text-slate-900 serif-premium">Din samling er tom</h3>
                        <p className="text-lg text-slate-400 mt-3 max-w-sm mx-auto font-medium">Brug VIVE Indsigt til at finde relevant forskning til dine opgaver.</p>
                        <Link href="/vive-indsigt" className="mt-10 inline-block px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Start søgning</Link>
                    </motion.div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <AnimatePresence mode="popLayout">
                            {filteredArticles.map((article, idx) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    key={article.id} 
                                    className="group bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)] hover:border-cyan-200 transition-all duration-700 flex flex-col h-full relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] translate-x-12 -translate-y-12 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700 ease-out"></div>
                                    
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {article.publicationDate ? new Date(article.publicationDate).toLocaleDateString('da-DK', { year: 'numeric', month: 'short' }) : 'Ukendt'}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => handleUnsave(article.id)}
                                                    className="w-12 h-12 bg-white border border-rose-50 text-rose-300 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-90 shadow-sm"
                                                    title="Fjern fra gemte"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                                <a href={article.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-all active:scale-90 shadow-sm">
                                                    <ExternalLink className="w-5 h-5" />
                                                </a>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-slate-900 serif-premium leading-[1.25] group-hover:text-cyan-950 transition-colors mb-6 line-clamp-3">
                                            {article.title}
                                        </h3>
                                        
                                        <p className="text-[15px] text-slate-500 leading-relaxed mb-10 line-clamp-5 flex-grow font-medium leading-[1.6] italic">
                                            &quot;{article.description}&quot;
                                        </p>

                                        {article.apa && (
                                            <div className="mb-10 p-6 bg-slate-50/80 rounded-3xl border border-slate-100 group/apa relative overflow-hidden">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                        <Quote className="w-3 h-3 text-cyan-600" /> APA Reference
                                                    </div>
                                                    <button 
                                                        onClick={(e) => handleCopyApa(e, article.id, article.apa!)}
                                                        className="text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-950 px-3 py-1.5 bg-white border border-slate-200 rounded-lg transition-all active:scale-95 shadow-sm"
                                                    >
                                                        {copiedId === article.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                                <div 
                                                    className="text-[11px] text-slate-500 leading-relaxed italic pr-2 font-serif"
                                                    dangerouslySetInnerHTML={{ __html: article.apa }}
                                                />
                                            </div>
                                        )}

                                        <div className="pt-8 border-t border-slate-50 flex items-center justify-between mt-auto">
                                            <Link 
                                                href={`/vive-indsigt?analyze=${article.articleId}`}
                                                className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-600 hover:text-cyan-950 transition-all font-sans"
                                            >
                                                <Sparkles className="w-4 h-4" /> AI Analyse
                                            </Link>
                                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-all group-hover:translate-x-2">
                                                Læs <ArrowUpRight className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            <footer className="fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-full flex items-center gap-4 shadow-2xl z-50">
                <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Synkroniseret med VIVE Arkivet</span>
            </footer>
        </div>
    );
}
