

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Network, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  BookOpen, 
  ChevronRight, 
  Loader2, 
  MessageSquare,
  Scale,
  Brain,
  Search,
  CheckCircle2,
  FileText,
  Lightbulb,
  MoreVertical,
  Plus,
  HelpCircle,
  Quote
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { getFagligtMyceliumAction } from '@/app/actions';
import type { PracticeGuide, FagligtMyceliumInput } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function FagligtMyceliumPageContent() {
    const { user, userProfile, refetchUserProfile } = useApp();
    const firestore = useFirestore();

    const [inputText, setInputText] = useState('');
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [result, setResult] = useState<PracticeGuide | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [limitError, setLimitError] = useState<string | null>(null);

    const booksQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'books')) : null, [firestore]);
    const { data: booksData } = useCollection(booksQuery);

    const handleAnalyse = async () => {
        if (!inputText.trim() || isAnalysing || !user || !firestore || !userProfile) return;
        setIsAnalysing(true);
        setResult(null);
        setError(null);
        setLimitError(null);

        const books = booksData?.map(doc => {
            let ragText = doc.RAG || '';
            try {
                const ragJson = JSON.parse(ragText);
                if (Array.isArray(ragJson)) {
                    ragText = ragJson.map(item => `- ${item}`).join('\n');
                } else if (typeof ragJson === 'object') {
                    ragText = JSON.stringify(ragJson, null, 2);
                }
            } catch (e) { /* ignore, it's just a string */ }
            
            return { 
                title: doc.title || '', 
                author: doc.author || '',
                year: doc.year || '',
                RAG: ragText
            };
        }) || [];

        const input: Omit<FagligtMyceliumInput, 'lawContext' | 'ethicsContext'> = {
            userText: inputText,
            books: books
        };

        try {
            const response = await getFagligtMyceliumAction(input);
            setResult(response.data);

            const batch = writeBatch(firestore);
            const userRef = doc(firestore, 'users', user.uid);
            
            const activityRef = doc(collection(firestore, 'userActivities'));
            batch.set(activityRef, {
                userId: user.uid,
                userName: userProfile?.username || user.displayName || 'Anonym bruger',
                actionText: 'dyrkede sit faglige mycelium.',
                createdAt: serverTimestamp()
            });

            if (response.usage) {
                const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
                const pointsToAdd = Math.round(totalTokens * 0.05);

                if (pointsToAdd > 0) {
                    batch.update(userRef, { cohéroPoints: increment(pointsToAdd) });
                }

                const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
                batch.set(tokenUsageRef, { flowName: 'fagligtMyceliumFlow', ...response.usage, totalTokens, createdAt: serverTimestamp(), userId: user.uid, userName: userProfile.username || user.displayName || 'Anonym' });
            }
            
            await batch.commit();
            await refetchUserProfile();

        } catch (error) {
            console.error("Mycelium Analysis Error:", error);
            setError("Der opstod en fejl under analysen. Prøv venligst igen.");
        } finally {
            setIsAnalysing(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-[#FDFCF8] flex flex-col selection:bg-amber-100">
            <header className="bg-white border-b border-amber-100 px-6 py-6 sticky top-28 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center gap-6">
                    <Link href="/portal" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="relative">
                                <Network className="w-4 h-4 text-amber-700" />
                                <span className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20"></span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/50">Pensum-Mapping</span>
                        </div>
                        <h1 className="text-3xl font-bold text-amber-950 serif">Fagligt Mycelium</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto w-full px-6 py-12 grid lg:grid-cols-12 gap-12">
                <aside className="lg:col-span-5 space-y-8 lg:sticky lg:top-48 h-fit">
                    <section className="bg-white p-8 md:p-10 rounded-[3rem] border border-amber-100 shadow-sm relative overflow-hidden h-fit">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 -z-10"></div>
                        <h3 className="text-lg font-bold text-amber-950 serif mb-6 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-amber-700" />
                        Indtast din refleksion
                        </h3>
                        
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                        Skriv en situation fra din praktik, et etisk dilemma eller et udkast til en opgave. Systemet vil automatisk finde trådene til dit pensum.
                        </p>

                        <div className="space-y-6">
                        <Textarea 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Eks: Jeg sidder med en sag hvor forældrene modarbejder barnets behov. Jeg føler mig magtesløs som rådgiver og er usikker på om jeg bruger min myndighed rigtigt..."
                            className="w-full h-80 p-8 bg-[#FDFCF8] border border-amber-100 rounded-[2.5rem] focus:ring-2 focus:ring-amber-950 focus:outline-none transition-all text-sm leading-relaxed placeholder:italic shadow-inner"
                        />

                        <Button 
                            onClick={handleAnalyse}
                            disabled={isAnalysing || inputText.length < 30}
                            className="w-full py-5 bg-amber-950 text-white rounded-3xl font-bold shadow-xl shadow-amber-950/20 hover:bg-amber-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                        >
                            {isAnalysing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            Dyrk forbindelser
                        </Button>
                        {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
                        </div>
                    </section>
                </aside>

                <main className="lg:col-span-7">
                    {!result && !isAnalysing && (
                        <div className="h-full min-h-[600px] border-2 border-dashed border-amber-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-6 bg-white/50">
                            <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-200">
                            <Network className="w-12 h-12" />
                            </div>
                            <div>
                            <h3 className="text-2xl font-bold text-amber-900/40 serif">Klar til mapping</h3>
                            <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">Indtast dine tanker til venstre for at se dit faglige mycelium sprede sig mod pensum.</p>
                            </div>
                        </div>
                    )}

                    {isAnalysing && (
                        <div className="h-full min-h-[600px] bg-white rounded-[3rem] border border-amber-100 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-amber-200 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-300 rounded-full blur-3xl animate-pulse delay-700"></div>
                            </div>
                            <div className="relative mb-10">
                            <div className="w-28 h-28 border-4 border-amber-50 border-t-amber-950 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Network className="w-10 h-10 text-amber-950 animate-pulse" />
                            </div>
                            </div>
                            <h3 className="text-2xl font-bold text-amber-950 serif">Scanner Pensum...</h3>
                            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest animate-pulse">Forbinder refleksion med teori og lov</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="bg-white p-8 rounded-[2rem] border border-amber-100 shadow-sm">
                                <h2 className="text-xl font-bold text-amber-950 serif mb-6">{result.title}</h2>
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-base font-bold text-amber-950 mb-4"><Sparkles className="w-5 h-5 text-amber-600"/> Forbindelser</h3>
                                        <div className="space-y-4">
                                            {result.connections.map((conn, i) => (
                                                <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                                    <blockquote className="border-l-4 border-amber-300 pl-3 italic text-slate-600 mb-3 text-sm">
                                                        "{conn.sourceText}"
                                                    </blockquote>
                                                    <p className="text-sm text-slate-800">
                                                        <span className="font-bold text-amber-900">Kobling:</span> {conn.concept}. {conn.explanation}
                                                    </p>
                                                    {conn.bookReference && (
                                                        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-dashed border-amber-100">
                                                            <BookOpen className="w-3 h-3 inline -mt-0.5 mr-1 text-amber-700" />
                                                            <span className="font-semibold text-amber-800">Læs mere i:</span> <em>{conn.bookReference}</em>
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="flex items-center gap-2 text-base font-bold text-amber-950 mb-4"><HelpCircle className="w-5 h-5 text-amber-600"/> Refleksionsspørgsmål</h3>
                                        <ul className="list-decimal list-outside pl-5 space-y-2 text-sm text-slate-700 font-medium">
                                            {result.reflectionQuestions.map((q, i) => <li key={i}>{q}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

const FagligtMyceliumPage = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#FDFCF8]">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-semibold">Indlæser...</p>
            </div>
        );
    }
    
    return <FagligtMyceliumPageContent/>
}

export default FagligtMyceliumPage;
