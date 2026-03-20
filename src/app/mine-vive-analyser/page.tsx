
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronDown, 
  Trash2, 
  Loader2, 
  Building,
  FileText,
  Calendar,
  ChevronRight,
  History,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

interface SavedViveAnalysis {
  id: string;
  reportTitle: string;
  reportText: string;
  qaHistory: { question: string; data: any }[];
  createdAt: { toDate: () => Date };
}

const AnalysisDetailView: React.FC<{ analysis: SavedViveAnalysis }> = ({ analysis }) => {
    return (
        <div className="bg-slate-50/50 p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-amber-100 pb-4">
                <FileText className="w-5 h-5 text-cyan-700" />
                <h4 className="font-bold text-amber-950 serif">Spørgsmål & Svar</h4>
            </div>
            <div className="space-y-6">
                {analysis.qaHistory.map((item, i) => (
                    <div key={i} className="space-y-4">
                        <div className="flex justify-end">
                            <div className="bg-cyan-100 text-cyan-900 px-4 py-2 rounded-xl rounded-tr-none text-sm font-bold shadow-sm">
                                {item.question}
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <div className="bg-white border border-amber-100 p-6 rounded-xl rounded-tl-none shadow-sm max-w-[90%]">
                                <div className="prose prose-sm text-slate-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: item.data.answer }} />
                                {item.data.pageReferences && item.data.pageReferences.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-amber-50">
                                        {item.data.pageReferences.map((ref: string, idx: number) => (
                                            <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded border border-amber-100">S. {ref}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function MineViveAnalyserPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [analyses, setAnalyses] = useState<SavedViveAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!user || !firestore) return;
      const q = query(collection(firestore, 'users', user.uid, 'viveAnalyses'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        setAnalyses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedViveAnalysis)));
        setIsLoading(false);
      });
      return () => unsub();
    }, [user, firestore]);
    
    const handleDelete = async (id: string) => {
        if (!user || !firestore || !window.confirm('Er du sikker på, du vil slette denne analyse?')) return;
        
        try {
            await deleteDoc(doc(firestore, 'users', user.uid, 'viveAnalyses', id));
            toast({ title: "Analyse slettet" });
        } catch (error) {
            console.error("Error deleting vive analysis:", error);
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke slette analysen." });
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
                        <Link href="/vive-indsigt" className="w-14 h-14 bg-white border border-amber-100 rounded-2xl flex items-center justify-center hover:bg-amber-50 transition-all group">
                            <ArrowLeft className="w-6 h-6 text-amber-950 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <History className="w-4 h-4 text-cyan-700" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Forsknings-Arkiv</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-amber-950 serif tracking-tighter">Mine VIVE-analyser</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                {analyses.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-200">
                        <Building className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">Du har ingen gemte analyser endnu.</p>
                        <p className="text-sm text-slate-400 mt-2">Gå til <Link href="/vive-indsigt" className="underline font-semibold text-cyan-700">VIVE Indsigt</Link> for at starte en analyse.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {analyses.map(analysis => (
                            <div 
                                key={analysis.id} 
                                className={`bg-white rounded-3xl border transition-all ${expandedId === analysis.id ? 'border-amber-950 shadow-xl' : 'border-amber-100 hover:border-amber-300 shadow-sm'}`}
                            >
                                <div 
                                    className="p-6 flex items-center justify-between cursor-pointer group" 
                                    onClick={() => setExpandedId(prev => prev === analysis.id ? null : analysis.id)}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-cyan-50 text-cyan-700 rounded-xl flex items-center justify-center shadow-inner">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-amber-950 group-hover:text-cyan-700 transition-colors">{analysis.reportTitle}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {analysis.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                                <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">
                                                    {analysis.qaHistory.length} Spørgsmål
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(analysis.id); }}
                                            className="p-3 text-slate-300 hover:text-rose-600 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <div className={`w-10 h-10 rounded-full border border-amber-50 flex items-center justify-center transition-transform duration-300 ${expandedId === analysis.id ? 'rotate-180 bg-amber-950 text-white' : 'text-slate-300 group-hover:text-amber-950'}`}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                                {expandedId === analysis.id && <AnalysisDetailView analysis={analysis} />}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
