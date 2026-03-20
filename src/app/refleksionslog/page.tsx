
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Brain, ArrowLeft, Sparkles, MessageSquare, PenTool, ShieldCheck, Lightbulb, ChevronRight, HelpCircle, Zap, BookOpen, Send, Loader2, Bookmark, RotateCcw } from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, writeBatch, serverTimestamp, increment, collection, query, orderBy, addDoc, getDoc } from 'firebase/firestore';
import { getSocraticReflection as getSocraticReflectionAction } from '@/ai/flows/sokratisk-refleksion/flow';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

interface SourceReference {
    bookTitle: string;
    chapter?: string;
}
interface Terminology {
    term: string;
    description: string;
    source?: SourceReference;
}

function ReflectionLogPageContent() {
    const { user, userProfile, refetchUserProfile } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [logEntry, setLogEntry] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);
    const [terminology, setTerminology] = useState<Terminology[]>([]);
    const [showReflection, setShowReflection] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [limitError, setLimitError] = useState<string | null>(null);

    const booksQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'books')) : null, [firestore]);
    const { data: booksData } = useCollection(booksQuery);

    const handleReflect = async () => {
        if (!user || !firestore || !logEntry.trim() || !userProfile || isProcessing) return;

        if (userProfile.membership === 'Kollega') {
            const getWeek = (d: Date) => {
                const date = new Date(d.getTime());
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                const week1 = new Date(date.getFullYear(), 0, 4);
                return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
            };

            const lastUsage = userProfile.lastSocraticReflectionUsage?.toDate();
            const now = new Date();
            let weeklyCount = userProfile.weeklySocraticReflectionCount || 0;

            if (lastUsage && (getWeek(lastUsage) !== getWeek(now) || lastUsage.getFullYear() !== now.getFullYear())) {
                weeklyCount = 0;
            }

            if (weeklyCount >= 1) {
                setLimitError('Du har brugt dit ugentlige forsøg i Refleksionsloggen. Opgrader til Kollega+ for ubegrænset brug.');
                return;
            }
        }

        setIsProcessing(true);
        setShowReflection(false);
        setQuestions([]);
        setTerminology([]);
        setError(null);
        setLimitError(null);

        try {
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

            const response = await getSocraticReflectionAction({
                history: [{ role: 'user', content: logEntry }],
                books: books,
            });

            setQuestions(response.data.questions);
            setTerminology(response.data.terminology as Terminology[]);
            setShowReflection(true);

            const batch = writeBatch(firestore);
            const userRef = doc(firestore, 'users', user.uid);
            
            const activityRef = doc(collection(firestore, 'userActivities'));
            batch.set(activityRef, {
                userId: user.uid,
                userName: userProfile.username || user.displayName || 'Anonym bruger',
                actionText: 'brugte Refleksionsloggen til at få sparring.',
                createdAt: serverTimestamp(),
            });

            const userUpdates: {[key: string]: any} = {
                lastSocraticReflectionUsage: serverTimestamp()
            };

            if (userProfile.membership === 'Kollega') {
                const getWeek = (d: Date) => {
                    const date = new Date(d.getTime());
                    date.setHours(0, 0, 0, 0);
                    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
                    const week1 = new Date(date.getFullYear(), 0, 4);
                    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
                };
                const lastUsage = userProfile.lastSocraticReflectionUsage?.toDate();
                if (!lastUsage || getWeek(lastUsage) !== getWeek(new Date()) || lastUsage.getFullYear() !== new Date().getFullYear()) {
                    userUpdates.weeklySocraticReflectionCount = 1;
                } else {
                    userUpdates.weeklySocraticReflectionCount = increment(1);
                }
            }


            if (response.usage) {
                const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
                const pointsToAdd = Math.round(totalTokens * 0.05);

                if (pointsToAdd > 0) {
                    userUpdates.cohéroPoints = increment(pointsToAdd);
                }

                const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
                batch.set(tokenUsageRef, { flowName: 'socraticFlow', ...response.usage, totalTokens, createdAt: serverTimestamp() });
            }
            
            if (Object.keys(userUpdates).length > 0) {
                batch.update(userRef, userUpdates);
            }

            await batch.commit();
            await refetchUserProfile();

        } catch (error) {
            console.error("AI Reflection failed:", error);
            setError("Der skete en fejl under refleksionen. Prøv venligst igen.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSaveReflection = async () => {
        if (!user || !firestore || !logEntry || !questions || !terminology) return;
        setIsSaving(true);
        try {
          const reflectionsCol = collection(firestore, 'users', user.uid, 'reflections');
          await addDoc(reflectionsCol, {
            text: logEntry,
            questions,
            terminology,
            createdAt: serverTimestamp(),
          });
          toast({
            title: "Refleksion gemt",
            description: "Din refleksion er blevet gemt i din logbog.",
          });
        } catch (error) {
          console.error("Error saving reflection:", error);
          toast({
            variant: "destructive",
            title: "Fejl",
            description: "Kunne ikke gemme din refleksion. Prøv igen.",
          });
        } finally {
          setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF8] flex flex-col">
            <header className="bg-white border-b border-amber-100 px-6 py-6 sticky top-[108px] z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/portal" className="p-2 hover:bg-amber-50 rounded-xl transition-colors text-amber-900">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-amber-950 serif">Ny Refleksion</h1>
                            <p className="text-xs text-slate-500">Skriv dine tanker og få AI-sparring</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/min-logbog">
                            <Button variant="outline">
                                Min Logbog
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto w-full px-6 py-10 grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-6 space-y-8">
                    <section className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm relative overflow-hidden h-fit">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
                                <PenTool className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-amber-950 serif">Hvad fylder hos dig?</h3>
                        </div>
                        
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Beskriv en situation fra din dag, din praktik eller en case, der har sat tanker i gang. Det kan være alt fra en svær borgerkontakt til en følelse af magtesløshed.
                        </p>

                        <div className="space-y-6">
                            <textarea 
                                value={logEntry}
                                onChange={(e) => setLogEntry(e.target.value)}
                                placeholder="Eks: Jeg sad i dag med en sag, hvor jeg følte at systemet spændte ben for borgeren. Jeg blev følelsesmæssigt ramt af deres magtesløshed..."
                                className="w-full h-64 p-6 bg-[#FDFCF8] border border-amber-100 rounded-[2rem] focus:ring-2 focus:ring-amber-900 focus:outline-none transition-all text-sm leading-relaxed placeholder:italic"
                            />
                            <button 
                                onClick={handleReflect}
                                disabled={logEntry.length < 20 || isProcessing}
                                className="w-full py-4 bg-amber-950 text-white rounded-2xl font-bold shadow-xl shadow-amber-900/10 hover:bg-amber-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Reflekterer...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-5 h-5" />
                                        Start Professionel Refleksion
                                    </>
                                )}
                            </button>
                            {limitError && (
                                <div className="bg-amber-50 border-2 border-dashed border-amber-200 text-amber-950 p-4 rounded-xl text-center">
                                    <h3 className="font-bold text-sm mb-1">Grænse nået</h3>
                                    <p className="text-xs">{limitError}</p>
                                    <Link href="/upgrade" className="font-bold underline text-xs mt-2 inline-block">Opgrader for ubegrænset brug</Link>
                                </div>
                            )}
                            {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
                        </div>
                    </section>
                    <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-4">
                        <ShieldCheck className="w-8 h-8 text-amber-700 flex-shrink-0" />
                        <div>
                            <h4 className="text-xs font-black uppercase text-amber-900 mb-2 tracking-widest">Et sikkert rum</h4>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Refleksionsloggen er dit private rum. AI'en gemmer ikke dine data til træning, og dens formål er udelukkende at agere din "kritiske ven" i din dannelsesproces.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-6">
                    {!showReflection && !isProcessing && (
                        <div className="h-full min-h-[500px] border-2 border-dashed border-amber-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-4">
                           <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-200">
                              <MessageSquare className="w-10 h-10" />
                           </div>
                           <h3 className="text-xl font-bold text-amber-900/40 serif">Din Refleksionspartner</h3>
                           <p className="text-sm text-slate-400 max-w-xs">Skriv om din oplevelse til venstre for at få hjælp til at bearbejde den fagligt.</p>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="h-full min-h-[500px] bg-white rounded-[3rem] border border-amber-100 flex flex-col items-center justify-center p-12 text-center">
                           <div className="relative mb-8">
                              <div className="w-24 h-24 border-4 border-amber-50 border-t-amber-950 rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-amber-950 animate-pulse" />
                              </div>
                           </div>
                           <p className="text-lg font-bold text-amber-950 serif">Slår resonans-strenge an...</p>
                           <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest animate-pulse">Forbinder oplevelse med teori</p>
                        </div>
                    )}

                    {showReflection && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="bg-white rounded-[3rem] border border-amber-100 shadow-xl overflow-hidden">
                                <div className="bg-amber-950 p-6 flex items-center gap-3 text-white">
                                   <HelpCircle className="w-5 h-5 text-amber-400" />
                                   <span className="font-bold">Spørgsmål til eftertanke</span>
                                </div>
                                
                                <div className="p-8 space-y-6">
                                  {questions.map((q, i) => (
                                    <div key={i} className="flex gap-4 group">
                                      <div className="w-6 h-6 rounded-full bg-amber-50 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-amber-700">
                                        {i + 1}
                                      </div>
                                      <p className="text-sm text-amber-950 font-medium leading-relaxed italic">
                                        "{q}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm">
                                <h4 className="text-[10px] font-black uppercase text-amber-900 mb-6 flex items-center gap-2 tracking-widest">
                                  <BookOpen className="w-4 h-4" />
                                  Sæt professionelle ord på
                                </h4>
                                <div className="grid gap-4">
                                  {terminology.map((t, i) => (
                                    <div key={i} className="p-5 bg-[#FDFCF8] border border-amber-100 rounded-2xl group cursor-help transition-all hover:border-amber-950/20">
                                      <h5 className="font-bold text-amber-950 mb-1 group-hover:text-amber-700 transition-colors">{t.term}</h5>
                                      <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                                      {t.source && <p className="text-xs mt-2 pt-2 border-t border-dashed border-amber-200 text-slate-400">
                                            <strong>Læs mere i:</strong> <em>{t.source.bookTitle}</em> {t.source.chapter && `- ${t.source.chapter}`}
                                        </p>}
                                    </div>
                                  ))}
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-8 border-t border-amber-100/60 flex flex-col sm:flex-row gap-4">
                                <Button onClick={handleSaveReflection} className="w-full sm:flex-1" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bookmark className="w-4 h-4 mr-2" />}
                                    {isSaving ? 'Gemmer...' : 'Gem i min logbog'}
                                </Button>
                                <Button variant="outline" className="w-full sm:flex-1" onClick={() => { setShowReflection(false); setLogEntry(''); }}>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Skriv ny refleksion
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const ReflectionLogPage = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace(`/?callbackUrl=${encodeURIComponent(pathname)}`);
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#FDFCF8]">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-semibold">Indlæser...</p>
            </div>
        );
    }

    return <ReflectionLogPageContent />;
};

export default ReflectionLogPage;
