'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookCopy, ChevronDown, Trash2, Loader2, Quote, HelpCircle, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

interface Reflection {
  id: string;
  text: string;
  questions: string[];
  terminology: { term: string; description: string; source?: { bookTitle: string; chapter?: string } }[];
  createdAt: { toDate: () => Date };
}

const ReflectionDetailView = ({ reflection }: { reflection: Reflection }) => {
    return (
        <div className="bg-slate-50/50 p-6 grid md:grid-cols-2 gap-6">
            <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><Quote className="w-4 h-4"/>Din Oprindelige Refleksion</h4>
                <p className='text-sm text-slate-700 italic'>"{reflection.text}"</p>
            </div>
             <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><HelpCircle className="w-4 h-4"/>Spørgsmål til Eftertanke</h4>
                 <ul className="space-y-3">
                  {reflection.questions?.map((q, i) => (
                      <li key={i} className="text-sm text-slate-700">{q}</li>
                  ))}
                </ul>
            </div>
             <div className='p-4 bg-white rounded-xl border space-y-4 md:col-span-2'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><BookOpen className="w-4 h-4"/>Faglige Begreber</h4>
                 <ul className="space-y-3">
                  {reflection.terminology?.map((t, i) => (
                      <li key={i} className="text-sm">
                          <p className="font-semibold text-slate-800">{t.term}</p>
                          <p className="text-xs italic text-slate-500">{t.description}</p>
                          {t.source && <p className="text-xs text-slate-500 mt-1"><strong>Kilde:</strong> <em>{t.source.bookTitle}</em> {t.source.chapter && `- ${t.source.chapter}`}</p>}
                      </li>
                  ))}
                </ul>
            </div>
        </div>
    )
}

const MinLogbogPageContent = () => {
    const { user } = useApp();
    const firestore = useFirestore();

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const reflectionsQuery = useMemoFirebase(
        () => (user && firestore ? query(collection(firestore, 'users', user.uid, 'reflections'), orderBy('createdAt', 'desc')) : null),
        [user, firestore]
    );

    const { data: reflections, isLoading } = useCollection<Reflection>(reflectionsQuery);
    
    const handleDelete = async (id: string) => {
        if (!user || !firestore || !window.confirm('Er du sikker på, du vil slette denne refleksion?')) return;
        
        const docRef = doc(firestore, 'users', user.uid, 'reflections', id);
        try {
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting reflection: ", error);
        }
    };
    
    return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex items-center gap-4">
            <Link href="/portal" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif">
                Min Logbog
              </h1>
              <p className="text-base text-slate-500">
                Oversigt over dine gemte refleksioner og AI-sparring.
              </p>
            </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Link til refleksionslog fjernet */}
        {isLoading && (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        )}

        {!isLoading && (!reflections || reflections.length === 0) && (
             <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-100">
                <BookCopy className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Du har ingen gemte refleksioner endnu.</p>
                <p className="text-sm text-slate-400 mt-2">Dine refleksioner vil blive gemt her, når du bruger vores AI-værktøjer.</p>
             </div>
        )}

        {!isLoading && reflections && reflections.length > 0 && (
            <div className="space-y-4">
                {reflections.map(ref => (
                    <div key={ref.id} className="bg-white rounded-2xl border border-amber-100/60 shadow-sm overflow-hidden">
                        <div className="p-6 flex justify-between items-center cursor-pointer hover:bg-amber-50/30" onClick={() => setExpandedId(prev => prev === ref.id ? null : ref.id)}>
                            <div>
                                <p className="text-sm font-semibold text-amber-900 truncate pr-4">"{ref.text}"</p>
                                <p className="text-xs text-slate-400 mt-1">{ref.createdAt?.toDate().toLocaleDateString('da-DK')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(ref.id); }}>
                                    <Trash2 className="w-4 h-4 text-rose-500"/>
                                </Button>
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === ref.id ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        {expandedId === ref.id && <ReflectionDetailView reflection={ref} />}
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
    )
}

export default function MinLogbogPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <MinLogbogPageContent />;
}
