'use client';

import React, { useEffect, useMemo } from 'react';
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
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface SavedArticle {
  id: string;
  articleId: string;
  title: string;
  description: string;
  url: string;
  publicationDate: string;
  savedAt: { toDate: () => Date };
}

export default function MineGemteArtiklerPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const savedArticlesQuery = useMemoFirebase(() => (
        user && firestore ? query(collection(firestore, 'users', user.uid, 'savedViveArticles'), orderBy('savedAt', 'desc')) : null
    ), [user, firestore]);
    const { data: articles, isLoading } = useCollection<SavedArticle>(savedArticlesQuery);
    
    const handleUnsave = async (id: string) => {
        if (!user || !firestore) return;
        try {
            await deleteDoc(doc(firestore, 'users', user.uid, 'savedViveArticles', id));
            toast({ title: "Artikel fjernet" });
        } catch (error) {
            console.error("Error unsaving article:", error);
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke fjerne artiklen." });
        }
    };

    if (isUserLoading || isLoading) {
        return <AuthLoadingScreen />;
    }

    return (
        <div className="bg-[#FDFCF8] min-h-screen">
            <header className="bg-white border-b border-amber-100 pt-20 pb-16 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <Link href="/portal" className="w-14 h-14 bg-white border border-amber-100 rounded-2xl flex items-center justify-center hover:bg-amber-50 transition-all group">
                            <ArrowLeft className="w-6 h-6 text-amber-950 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <History className="w-4 h-4 text-cyan-700" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Videns-Arkiv</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-amber-950 serif tracking-tighter">Mine Gemte Artikler</h1>
                        </div>
                    </div>
                    <Link href="/vive-indsigt">
                        <Button variant="outline" className="rounded-xl border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                            Find flere i VIVE Indsigt
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {!articles || articles.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-200">
                        <Bookmark className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">Du har ingen gemte artikler endnu.</p>
                        <p className="text-sm text-slate-400 mt-2">Gå til <Link href="/vive-indsigt" className="underline font-semibold text-cyan-700">VIVE Indsigt</Link> for at udforske forskningen.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map(article => (
                            <div 
                                key={article.id} 
                                className="group bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all flex flex-col h-full relative overflow-hidden animate-fade-in-up"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50/50 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                                
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <Calendar className="w-3 h-3" />
                                            {article.publicationDate ? new Date(article.publicationDate).toLocaleDateString('da-DK', { year: 'numeric', month: 'short' }) : 'Ukendt dato'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleUnsave(article.id)}
                                                className="p-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all border border-amber-100"
                                                title="Fjern fra gemte"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-all">
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-amber-950 serif leading-tight group-hover:text-cyan-900 transition-colors mb-4 line-clamp-3">
                                        {article.title}
                                    </h3>
                                    
                                    <p className="text-sm text-slate-500 leading-relaxed mb-8 line-clamp-4 flex-grow">
                                        {article.description}
                                    </p>

                                    <div className="pt-6 border-t border-amber-50 flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-700/60">
                                            <Building className="w-3.5 h-3.5" />
                                            Velfærd
                                        </div>
                                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-900 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                                            Læs artikel <ArrowUpRight className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
