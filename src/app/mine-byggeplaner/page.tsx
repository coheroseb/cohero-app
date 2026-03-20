'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookCopy, ChevronDown, Trash2, Loader2, Target, List, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import type { ExamBlueprint } from '@/ai/flows/types';

interface SavedBlueprint extends ExamBlueprint {
  id: string;
  createdAt: { toDate: () => Date };
  topic: string;
  problemStatement: string; // This is the original draft
}

const BlueprintDetailView = ({ blueprint }: { blueprint: SavedBlueprint }) => {
    return (
        <div className="bg-slate-50/50 p-6 grid md:grid-cols-2 gap-6">
            <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900'>Oprindeligt Oplæg</h4>
                <p className='text-sm text-slate-700 italic'>"{blueprint.problemStatement || 'Ikke angivet'}"</p>
                <h4 className='font-bold text-sm text-amber-900 pt-4 border-t border-dashed'>Tip til Forbedring</h4>
                <p className='text-sm text-slate-700 italic'>"{blueprint.problemStatementTip}"</p>
            </div>
             <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><List className="w-4 h-4"/> Strukturforslag</h4>
                 <ul className="space-y-3">
                  {blueprint.sections?.map((section, i) => (
                      <li key={i} className="border-l-2 border-amber-200 pl-3">
                          <p className="font-bold text-xs">{section.title} <span className="font-normal text-xs text-slate-400">({section.weight})</span></p>
                          <p className="text-xs text-slate-600">{section.focus}</p>
                      </li>
                  ))}
                </ul>
            </div>
             <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><BookOpen className="w-4 h-4"/> Litteraturforslag</h4>
                 <ul className="space-y-3">
                  {blueprint.suggestedTheories?.map((theory, i) => (
                      <li key={i} className="text-sm">
                          <p className="font-semibold text-slate-800">{theory.name}</p>
                          <p className="text-xs italic text-slate-500">Relevans: {theory.why}</p>
                          {theory.bookReference && <p className="text-xs text-slate-500 mt-1"><strong>Kilde:</strong> <em>{theory.bookReference}</em></p>}
                      </li>
                  ))}
                </ul>
            </div>
            <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><Layers className="w-4 h-4"/> Råd om den røde tråd</h4>
                <p className='text-sm text-slate-700'>{blueprint.redThreadAdvice}</p>
            </div>
        </div>
    )
}

const MineByggeplanerPageContent = () => {
    const { user } = useApp();
    const firestore = useFirestore();

    const [expandedBlueprintId, setExpandedBlueprintId] = useState<string | null>(null);

    const blueprintsQuery = useMemoFirebase(
        () => (user && firestore ? query(collection(firestore, 'users', user.uid, 'blueprints'), orderBy('createdAt', 'desc')) : null),
        [user, firestore]
    );

    const { data: blueprints, isLoading } = useCollection<SavedBlueprint>(blueprintsQuery);
    
    const handleDelete = async (id: string) => {
        if (!user || !firestore || !window.confirm('Er du sikker på, du vil slette denne byggeplan?')) return;
        
        const docRef = doc(firestore, 'users', user.uid, 'blueprints', id);
        try {
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting blueprint: ", error);
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
                Mine Byggeplaner
              </h1>
              <p className="text-base text-slate-500">
                Oversigt over dine gemte opgavestrukturer fra Eksamens-Arkitekten.
              </p>
            </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {isLoading && (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        )}

        {!isLoading && (!blueprints || blueprints.length === 0) && (
             <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-100">
                <BookCopy className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Du har ingen gemte byggeplaner endnu.</p>
                <p className="text-sm text-slate-400 mt-2">Gå til <Link href="/exam-architect" className="underline font-semibold text-amber-700">Eksamens-Arkitekten</Link> for at lave din første.</p>
             </div>
        )}

        {!isLoading && blueprints && blueprints.length > 0 && (
            <div className="space-y-4">
                {blueprints.map(bp => (
                    <div key={bp.id} className="bg-white rounded-2xl border border-amber-100/60 shadow-sm overflow-hidden">
                        <div className="p-6 flex justify-between items-center cursor-pointer hover:bg-amber-50/30" onClick={() => setExpandedBlueprintId(prev => prev === bp.id ? null : bp.id)}>
                            <div>
                                <p className="text-xs text-amber-700 font-semibold">{bp.topic}</p>
                                <h3 className="font-bold text-amber-950">{bp.title}</h3>
                                <p className="text-xs text-slate-400 mt-1">{bp.createdAt?.toDate().toLocaleDateString('da-DK')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(bp.id); }}>
                                    <Trash2 className="w-4 h-4 text-rose-500"/>
                                </Button>
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedBlueprintId === bp.id ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        {expandedBlueprintId === bp.id && <BlueprintDetailView blueprint={bp} />}
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
    )
}

export default function MineByggeplaner() {
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

    return <MineByggeplanerPageContent />;
}
