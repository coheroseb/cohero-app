'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  RotateCcw,
  Zap,
  BookOpen,
  BookMarked,
  Trash2,
  Target,
  History,
  ShieldCheck,
  CheckCircle2,
  Wand2,
  LineChart
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  writeBatch, 
  collection, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { generateRawCaseSourcesAction, journalSynthesisFeedbackAction, reviseJournalEntryAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

import { socialWorkTopics } from './data/topics';
import { GlassCard, HistoryItem, SourceViewer, FeedbackItemCard } from './components/JournalComponents';

const JournalTrainerPageContent: React.FC = () => {
  const router = useRouter();
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();

  const activeScenarioRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'journalScenarios', 'active') : null, [user, firestore]);
  const { data: activeScenario, isLoading: isScenarioLoading } = useDoc<any>(activeScenarioRef);
  
  const [history, setHistory] = useState<any[]>([]);
  const [journalContent, setJournalContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [revisedEntry, setRevisedEntry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'current' | 'history'>('current');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const showStartScreen = !isScenarioLoading && !activeScenario;
  const showEditor = !isScenarioLoading && activeScenario && !activeScenario.feedback;
  const showFeedbackView = !isScenarioLoading && activeScenario && activeScenario.feedback;

  useEffect(() => {
    if (!activeScenario) {
      setJournalContent('');
      setError(null);
      setRevisedEntry(null);
      setSelectedTopic('');
      setSelectedSourceId(null);
    } else {
        if(activeScenario.journalEntry) {
            setJournalContent(activeScenario.journalEntry);
        }
        if(activeScenario.sources && activeScenario.sources.length > 0 && !selectedSourceId) {
            setSelectedSourceId(activeScenario.sources[0].id);
        }
    }
  }, [activeScenario]);

  // Fetch history
  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(
        collection(firestore, 'users', user.uid, 'journalScenarios'), 
        orderBy('savedAt', 'desc'), 
        limit(15)
    );
    return onSnapshot(q, (snapshot) => {
        const histories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(histories);
    }, (err) => {
        console.error('[JournalTrainer] history listener error:', err);
    });
  }, [user, firestore]);

  const handleStartTraining = async () => {
    if (!selectedTopic || isGenerating || !user || !firestore || !userProfile || !activeScenarioRef) return;
    
    // Limit Check for Free Tier / Group Pro
    if (userProfile.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership)) {
        const lastUsage = userProfile.lastJournalTrainerUsage?.toDate();
        const now = new Date();
        const isNewDay = !lastUsage || lastUsage.toDateString() !== now.toDateString();
        const count = isNewDay ? 0 : (userProfile.dailyJournalTrainerCount || 0);
        
        if (count >= 1) {
            setError("Du har brugt dit daglige forsøg i Journal-træneren. Opgrader til Kollega+ for fri adgang.");
            return;
        }
    }
    
    setIsGenerating(true);
    setError(null);

    const userRef = doc(firestore, 'users', user.uid);
    try {
        const response = await generateRawCaseSourcesAction({ topic: selectedTopic });
        const scenarioData = {
            ...response.data,
            topic: selectedTopic,
        };

        const batch = writeBatch(firestore);
        const userUpdates: {[key: string]: any} = { 
            lastJournalTrainerUsage: serverTimestamp(), 
            dailyJournalTrainerCount: increment(1) 
        };
        
        if(response.usage) {
             const totalTokens = (response.usage.inputTokens || 0) + (response.usage.outputTokens || 0);
             const pointsToAdd = Math.round(totalTokens * 0.05);
             if (pointsToAdd > 0) userUpdates.cohéroPoints = increment(pointsToAdd);
             
             const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
             batch.set(tokenUsageRef, { flowName: 'generateRawCaseSources', ...response.usage, totalTokens, createdAt: serverTimestamp(), userId: user.uid, userName: userProfile.username || user.displayName || 'Anonym' });
        }
        batch.update(userRef, userUpdates);
        
        const fullScenarioData = {
            ...scenarioData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            journalEntry: '',
            feedback: null,
        };

        batch.set(activeScenarioRef, fullScenarioData);
        await batch.commit();
        await refetchUserProfile();
        toast({ title: "Sagsmappe klar!", description: "Din indbakke er opdateret med nye informationer." });
    } catch (err: any) {
        console.error("Error starting training:", err);
        setError("Kunne ikke starte træningen. Prøv igen.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGetFeedback = async () => {
    if (journalContent.length < 50 || isSubmitting || !activeScenario || !user || !firestore || !userProfile || !activeScenarioRef) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
        const response = await journalSynthesisFeedbackAction({
            topic: activeScenario.topic,
            sources: activeScenario.sources,
            journalEntry: journalContent,
        });

        const batch = writeBatch(firestore);
        batch.update(activeScenarioRef, {
            journalEntry: journalContent,
            feedback: response.data,
            updatedAt: serverTimestamp(),
        });

        if (response.usage) {
            const totalTokens = (response.usage.inputTokens || 0) + (response.usage.outputTokens || 0);
            const pointsToAdd = Math.round(totalTokens * 0.05);
            if(pointsToAdd > 0) {
                 batch.update(doc(firestore, 'users', user.uid), { cohéroPoints: increment(pointsToAdd) });
            }
            const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
            batch.set(tokenUsageRef, { flowName: 'journalSynthesisFeedback', ...response.usage, totalTokens, createdAt: serverTimestamp(), userId: user.uid, userName: userProfile.username || user.displayName || 'Anonym' });
        }
        
        await batch.commit();
        await refetchUserProfile();
        toast({ title: "Vurdering færdig!", description: "Se feedback på din objektivitet og syntese." });

    } catch (err: any) {
        console.error("Error getting feedback:", err);
        setError("Kunne ikke hente feedback. Prøv venligst igen.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRevise = async () => {
    if (!activeScenario?.feedback || !activeScenario.journalEntry || isRevising || !user || !firestore) return;
    
    setIsRevising(true);
    setRevisedEntry(null);
    setError(null);
    
    try {
      const response = await reviseJournalEntryAction({
        journalEntry: activeScenario.journalEntry,
        feedback: JSON.stringify(activeScenario.feedback),
      });
      setRevisedEntry(response.data.revisedJournalEntry);

      if(response.usage) {
          const totalTokens = (response.usage.inputTokens || 0) + (response.usage.outputTokens || 0);
          const pointsToAdd = Math.round(totalTokens * 0.05);
          if (pointsToAdd > 0) {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { cohéroPoints: increment(pointsToAdd) });
            await refetchUserProfile();
          }
      }
    } catch (err) {
      console.error(err);
      setError('Kunne ikke generere en revideret version. Prøv igen.');
    } finally {
      setIsRevising(false);
    }
  };
  
  const handleSaveAndFinish = async () => {
    if (!user || !firestore || !activeScenario || !activeScenarioRef) return;
    try {
        const finishedScenariosCol = collection(firestore, 'users', user.uid, 'journalScenarios');
        const batch = writeBatch(firestore);
        
        batch.set(doc(finishedScenariosCol), {
            ...activeScenario,
            savedAt: serverTimestamp(),
        });
        
        batch.delete(activeScenarioRef);
        
        await batch.commit();
        toast({ title: "Øvelse Gemt!", description: "Godt gået! Din sag er lagt i arkivet." });
    } catch (error) {
        console.error("Error saving and finishing:", error);
        toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke gemme din øvelse. Prøv igen.' });
    }
  };
    
  const handleEndExercise = () => {
    if (!activeScenarioRef || !window.confirm('Er du sikker på du vil afslutte? Dine noter vil blive slettet permanent.')) return;
    deleteDoc(activeScenarioRef).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: activeScenarioRef.path, operation: 'delete' }));
    });
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firestore || !window.confirm('Vil du fjerne denne sag fra arkivet?')) return;
    try {
        await deleteDoc(doc(firestore, 'users', user.uid, 'journalScenarios', id));
        toast({ title: "Fjernet", description: "Arkivet er opdateret." });
    } catch (err) {
        console.error(err);
    }
  };

  const loadFromHistory = (exercise: any) => {
    if (activeScenario && !window.confirm('Du har en aktiv sag kørende. Vil du overskrive den med denne fra arkivet?')) return;
    if (!user || !firestore || !activeScenarioRef) return;
    setDoc(activeScenarioRef, { ...exercise, savedAt: null, updatedAt: serverTimestamp() })
        .then(() => {
            toast({ title: "Sag hentet", description: "Du kan læse den gemte feedback igen." });
            setSidebarTab('current');
        });
  };

  const charCount = journalContent.length;
  const wordCount = journalContent.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col lg:flex-row text-slate-900 selection:bg-amber-100 overflow-x-hidden relative">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-amber-200 rounded-full blur-[120px]" />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] bg-rose-200 rounded-full blur-[100px]" />
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[60%] left-[40%] w-[20vw] h-[20vw] bg-blue-200 rounded-full blur-[80px]" />
      </div>

      {/* SIDEBAR */}
      <aside className="w-full lg:w-[400px] bg-white/40 backdrop-blur-3xl border-r border-amber-950/5 flex flex-col sticky top-0 lg:h-screen z-50 shadow-2xl shadow-amber-950/5 overflow-hidden">
        <div className="p-10 flex items-center gap-5 border-b border-amber-950/5 bg-white/50 shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-900 to-amber-950 rounded-[1.5rem] flex items-center justify-center text-amber-400 shadow-2xl ring-4 ring-amber-950/5 rotate-3 transition-transform hover:rotate-0 duration-500">
                <FileText className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-amber-950 tracking-tight leading-none mb-1">Journal-træner</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Faglig Syntese</p>
            </div>
        </div>

        <div className="flex px-10 pt-8 shrink-0">
            <button onClick={() => setSidebarTab('current')} className={`flex-1 flex items-center justify-center gap-3 pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${sidebarTab === 'current' ? 'border-amber-950 text-amber-950' : 'border-transparent text-slate-300 hover:text-slate-500'}`}>
                <Target className="w-4 h-4" /> Aktiv sag
            </button>
            <button onClick={() => setSidebarTab('history')} className={`flex-1 flex items-center justify-center gap-3 pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${sidebarTab === 'history' ? 'border-amber-950 text-amber-950' : 'border-transparent text-slate-300 hover:text-slate-500'}`}>
                <History className="w-4 h-4" /> Arkiv ({history.length})
            </button>
        </div>

        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
                {sidebarTab === 'current' ? (
                    <motion.div key="current" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-12">
                        {activeScenario ? (
                            <div className="space-y-12">
                                <section>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-5 px-2">Nuværende Sag</h3>
                                    <GlassCard className="p-8 border-amber-100/30 bg-white/80 shadow-inner group">
                                        <div className="flex items-center justify-between mb-5">
                                            <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-100/50 px-4 py-1.5 rounded-full border border-amber-950/5 shadow-sm">{activeScenario.topic}</span>
                                            {activeScenario.feedback && <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-sm" />}
                                        </div>
                                        <h4 className="text-xl font-black text-amber-950 leading-tight tracking-tight">{activeScenario.title}</h4>
                                        <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">{activeScenario.description}</p>
                                    </GlassCard>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-5 px-2">Indbakke ({activeScenario.sources?.length || 0})</h3>
                                    <div className="space-y-3">
                                        {activeScenario.sources?.map((source: any) => (
                                            <div 
                                                key={source.id}
                                                onClick={() => setSelectedSourceId(source.id)}
                                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedSourceId === source.id ? 'bg-amber-50 border-amber-200' : 'bg-white/50 border-transparent hover:bg-white'}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-amber-950 truncate">{source.title}</span>
                                                    <span className="text-[9px] text-slate-400">{source.type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="pt-8">
                                    <Button variant="outline" onClick={handleEndExercise} className="w-full border-rose-50 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-[1.5rem] h-16 font-black uppercase text-[10px] tracking-widest group bg-white/20 transition-all shadow-sm">
                                        <Trash2 className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" /> Afslut og fjern sag
                                    </Button>
                                </section>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-8 py-24">
                                <div className="w-28 h-28 bg-gradient-to-br from-amber-50/50 to-white rounded-[3rem] border border-amber-50 flex items-center justify-center text-amber-100 shadow-inner overflow-hidden relative group">
                                    <BookMarked className="w-14 h-14 group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">Venter på sag</p>
                                    <p className="text-[11px] text-slate-400/60 leading-relaxed italic px-6 font-medium">Overblikket vil blive vist her, når du starter en ny sag.</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="history" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                        {history.length > 0 ? (
                            history.map(item => (
                                <HistoryItem key={item.id} scenario={item} onClick={() => loadFromHistory(item)} onDelete={handleDeleteHistory} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 text-center opacity-20 grayscale saturate-0 space-y-6">
                                <History className="w-16 h-16 text-slate-300" />
                                <p className="text-[11px] font-black uppercase tracking-widest">Tomt arkiv</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative z-10">
        <header className="h-24 bg-white/60 backdrop-blur-2xl border-b border-amber-950/5 px-10 flex items-center justify-between sticky top-0 z-[60] transition-all">
            <div className="flex items-center gap-8">
                <button onClick={() => router.back()} className="group w-12 h-12 bg-white border border-amber-950/5 text-amber-950 rounded-2xl hover:bg-amber-950 hover:text-white transition-all active:scale-90 flex items-center justify-center shadow-sm">
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="h-8 w-px bg-amber-950/10 hidden md:block"></div>
                <div className="hidden md:block">
                    <h2 className="text-xl font-black text-amber-950 tracking-tight truncate max-w-[200px] lg:max-w-xl">
                        {activeScenario ? activeScenario.title : 'Ny Træningssession'}
                    </h2>
                </div>
            </div>
            
            <div className="flex items-center gap-5">
                {showEditor && (
                    <Button 
                        onClick={handleGetFeedback}
                        disabled={wordCount < 10 || isSubmitting}
                        className={`h-14 px-10 rounded-2xl shadow-2xl transition-all font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-4 ${wordCount >= 10 ? 'bg-amber-950 text-white shadow-amber-900/40 hover:scale-105 active:scale-95' : 'bg-slate-50 text-slate-300 shadow-none'}`}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-amber-400" />}
                        {isSubmitting ? 'Analyserer...' : 'Vurder mit notat'}
                    </Button>
                )}
                {showFeedbackView && (
                    <div className="flex items-center gap-3">
                        <Button onClick={() => { if(window.confirm('Vil du nulstille sessionen og starte forfra?')) updateDoc(activeScenarioRef!, { feedback: null, journalEntry: '' }); }} variant="outline" className="bg-white/50 border-amber-950/10 rounded-2xl h-14">
                            <RotateCcw className="w-4 h-4 mr-3" /> Start forfra
                        </Button>
                        <Button onClick={handleSaveAndFinish} className="bg-amber-950 text-white hover:bg-amber-900 rounded-2xl h-14 px-8 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-amber-900/20">
                            Gem i arkiv
                        </Button>
                    </div>
                )}
            </div>
        </header>

        <div className="flex-1 p-8 md:p-12 lg:p-16 xl:p-20 max-w-[1600px] mx-auto w-full">
            <AnimatePresence mode="wait">
                {showStartScreen ? (
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="min-h-full flex flex-col items-center justify-center py-12">
                        <div className="mb-16 relative">
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="w-48 h-48 bg-gradient-to-br from-white to-amber-50 rounded-[4rem] border border-white shadow-2xl flex items-center justify-center text-amber-900/20 relative z-10">
                                <BookOpen className="w-24 h-24" />
                            </motion.div>
                            <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-950 rounded-[2.5rem] flex items-center justify-center shadow-2xl z-20 border-[6px] border-[#FAFAF7]">
                                <Sparkles className="w-10 h-10 text-amber-400" />
                            </motion.div>
                        </div>
                        
                        <div className="text-center space-y-8 mb-20 max-w-3xl px-6">
                            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-amber-950 tracking-tight leading-[1.1]">Den Dynamiske Sagsmappe</h2>
                            <p className="text-slate-400 leading-relaxed italic text-xl lg:text-2xl font-medium max-w-2xl mx-auto">
                                Træn din faglighed ved at samle trådene. Vælg et sagsområde og modtag korrespondance, du skal syntetisere til et professionelt notat.
                            </p>
                        </div>

                        <div className="w-full space-y-16">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                                {socialWorkTopics.map((topic, i) => (
                                    <motion.button
                                        key={topic.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedTopic(topic.name)}
                                        className={`group p-8 rounded-[3rem] border-2 flex flex-col items-center text-center gap-5 transition-all duration-500 ${selectedTopic === topic.name ? 'border-amber-950 bg-white shadow-2xl scale-105' : 'border-transparent bg-white/40 hover:border-amber-100 hover:bg-white hover:scale-102 shadow-sm'}`}
                                    >
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 transition-all duration-500 ${selectedTopic === topic.name ? 'bg-amber-950 text-white shadow-xl' : `bg-gradient-to-br ${topic.color} text-white shadow-lg group-hover:rotate-6`}`}>
                                            {topic.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-black text-amber-950 leading-tight uppercase tracking-widest">{topic.name}</h4>
                                            <p className="text-[10px] text-slate-400 mt-2 font-medium px-4">{topic.sub}</p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            <div className="pt-10 flex flex-col items-center">
                                <Button 
                                    onClick={handleStartTraining}
                                    disabled={!selectedTopic || isGenerating}
                                    className={`w-full max-w-md h-24 rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] shadow-[0_30px_60px_-15px_rgba(69,26,3,0.3)] transition-all flex items-center justify-center gap-5 ${selectedTopic ? 'bg-amber-950 text-white hover:scale-105 active:scale-95' : 'bg-slate-50 text-slate-200 border border-slate-100'}`}
                                >
                                    {isGenerating ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className={`w-8 h-8 ${selectedTopic ? 'text-amber-400' : ''}`} />}
                                    {isGenerating ? 'Opretter sag...' : 'Start Sagsmappe'}
                                </Button>
                                {error && <p className="text-sm text-rose-500 font-bold mt-10 bg-rose-50 px-10 py-5 rounded-[2rem] border border-rose-100 shadow-xl">{error}</p>}
                            </div>
                        </div>
                    </motion.div>
                ) : (showEditor || showFeedbackView) && activeScenario ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                        
                        <div className="grid lg:grid-cols-[400px_1fr] xl:grid-cols-[500px_1fr] gap-12 items-start">
                            {/* LEFT: THE INBOX / RAW DATA */}
                            <motion.section 
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black text-amber-950 tracking-tight">Indbakken</h3>
                                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">{activeScenario.sources?.length} nye elementer</span>
                                </div>
                                <div className="space-y-4">
                                    {activeScenario.sources?.map((source: any) => (
                                        <SourceViewer 
                                            key={source.id} 
                                            source={source} 
                                            isActive={selectedSourceId === source.id}
                                            onClick={() => setSelectedSourceId(source.id)} 
                                        />
                                    ))}
                                </div>
                                <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl mt-8">
                                    <p className="text-xs text-blue-800 leading-relaxed font-medium italic">
                                        Din opgave: Læs disse kilder og skriv et fagligt forsvarligt notat. Filtrer de subjektive udsagn fra, og hold dig til sagens kernefakta.
                                    </p>
                                </div>
                            </motion.section>

                            {/* RIGHT: THE EDITOR OR FEEDBACK */}
                            <div className="space-y-12">
                                <GlassCard className="p-10 border-amber-950/10 min-h-[600px] flex flex-col shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                                        <FileText className="w-64 h-64 -rotate-12 translate-x-1/4" />
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-950 flex items-center justify-center text-amber-400 shadow-xl rotate-3">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-amber-950 tracking-tight">Dit Journalnotat</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syntese og Vurdering</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-black ${wordCount > 10 ? 'text-emerald-900' : 'text-amber-950'}`}>{wordCount} <span className="text-[10px] text-slate-300 uppercase block font-sans tracking-[0.2em] font-black">Ord</span></div>
                                            </div>
                                        </div>
                                        
                                        <textarea 
                                            value={journalContent}
                                            onChange={(e) => setJournalContent(e.target.value)}
                                            readOnly={showFeedbackView}
                                            placeholder="Start dit faglige notat her... Fokuser på det objektive, inddrag lovgivning og afslut gerne med en handleplan."
                                            className={`w-full flex-1 bg-transparent border-none focus:ring-0 text-amber-950 font-medium text-lg leading-[2] resize-none placeholder:text-slate-300 placeholder:italic p-4 rounded-xl transition-all ${showFeedbackView ? 'opacity-80' : 'hover:bg-amber-50/30'}`}
                                        />

                                        {showEditor && (
                                            <div className="pt-6 mt-auto">
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sagsmappen gemmes lokalt
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>

                                {showFeedbackView && activeScenario.feedback && (
                                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        
                                        {/* Score Banner */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-2xl border-4 border-white shadow-lg">
                                                    {activeScenario.feedback.overallScore}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Helhedsindtryk</p>
                                                    <p className="text-sm font-bold text-slate-700 mt-1">Samlet vurdering</p>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 font-black text-2xl border-4 border-white shadow-lg">
                                                    {activeScenario.feedback.objectivityScore}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objektivitet</p>
                                                    <p className="text-sm font-bold text-slate-700 mt-1">Sproglig neutralitet</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* General Feedback */}
                                        <div className="bg-white rounded-[2rem] p-8 lg:p-12 border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <LineChart className="w-6 h-6 text-amber-500" />
                                                <h4 className="text-xl font-black text-slate-800">Feedback på dit notat</h4>
                                            </div>
                                            <div className="prose prose-sm text-slate-600 leading-[2] font-medium" dangerouslySetInnerHTML={{ __html: activeScenario.feedback.generalFeedback }} />
                                        </div>

                                        {/* Specific Improvements */}
                                        {activeScenario.feedback.improvements && activeScenario.feedback.improvements.length > 0 && (
                                            <div className="space-y-6 pt-6">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Anbefalede Omskrivninger</h4>
                                                <div className="space-y-4">
                                                    {activeScenario.feedback.improvements.map((item: any, idx: number) => (
                                                        <FeedbackItemCard key={idx} item={item} index={idx} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* REVISION BUTTON (Guldnotatet) */}
                                        <div className="pt-12">
                                            <div className="bg-gradient-to-br from-amber-900 to-amber-950 p-12 rounded-[3xl] text-white shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] -mr-[200px] -mt-[200px] pointer-events-none" />
                                                <div className="relative z-10 space-y-8">
                                                    <div>
                                                        <h4 className="text-3xl font-black mb-3">Se Guldnotatet</h4>
                                                        <p className="text-amber-200/80 font-medium">Lad AI'en omskrive dit notat ved at integrere feedbacken til et fejlfrit stykke faglig dokumentation.</p>
                                                    </div>
                                                    <Button 
                                                        onClick={handleRevise}
                                                        disabled={isRevising || !!revisedEntry}
                                                        className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-4 ${revisedEntry ? 'bg-white/10 text-white' : 'bg-amber-400 text-amber-950 hover:bg-white hover:scale-102'}`}
                                                    >
                                                        {isRevising ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
                                                        {isRevising ? 'Skaber det perfekte notat...' : revisedEntry ? 'Omskrevet' : 'Generér Guldnotat'}
                                                    </Button>
                                                </div>
                                                
                                                {revisedEntry && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 pt-8 border-t border-white/10 relative z-10">
                                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                                                            <div className="prose prose-invert max-w-none text-amber-50 leading-[2] font-serif" dangerouslySetInnerHTML={{ __html: revisedEntry }} />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                    </motion.div>
                                )}
                            </div>
                        </div>

                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const JournalTrainerPage: React.FC = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace(`/?callbackUrl=${encodeURIComponent(pathname || '')}`);
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

    return <JournalTrainerPageContent />;
};

export default JournalTrainerPage;
