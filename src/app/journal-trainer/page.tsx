'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Scale, 
  Briefcase,
  Clock,
  ArrowLeft, 
  Send, 
  Sparkles, 
  Loader2, 
  ChevronDown,
  BookCopy,
  RotateCcw,
  Zap,
  Bookmark,
  MessageSquare,
  Wand2,
  Gavel,
  Users,
  CheckCircle2,
  ShieldCheck,
  X,
  History,
  Target,
  BookOpen,
  BookMarked,
  ChevronRight,
  Trophy,
  Pencil
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc, writeBatch, getDoc, serverTimestamp, increment, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { generateJournalScenarioAction, getJournalFeedbackAction, reviseJournalEntryAction } from '@/app/actions';
import type { JournalScenarioData, FeedbackData } from '@/ai/flows/types';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

const socialWorkTopics = [
    "Børn og unge (omsorgssvigt, anbringelse)",
    "Voksne med handicap (støtte og botilbud)",
    "Psykiatri (socialpsykiatrisk støtte)",
    "Misbrug (alkohol- og stofbehandling)",
    "Beskæftigelse (sygedagpenge, ressourceforløb)",
    "Integration (flygtninge, familiesammenføring)",
    "Kriminalitetstruede unge",
    "Ældre (hjemmepleje, demens)",
];

const PersonaCard = ({ icon, title, color, feedback, score, description }: { icon: React.ReactNode, title: string, color: string, feedback: string, score: number, description: string }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500 animate-ink">
    <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`}>
      {icon}
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${color}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-amber-950 serif">{title}</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{description}</p>
        </div>
      </div>
      <div className="prose prose-sm text-slate-600 leading-relaxed font-medium italic border-l-2 border-amber-100 pl-6 mb-2" dangerouslySetInnerHTML={{ __html: feedback }} />
      <div className="flex items-center justify-between pt-8 mt-8 border-t border-amber-50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-300">Faglig vurdering</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`w-2 h-4 rounded-sm ${i <= Math.ceil(score/2) ? color.split(' ')[1] : 'bg-slate-50'}`} />
            ))}
          </div>
        </div>
        <span className="text-2xl font-black text-amber-950 serif">{score}<span className="text-sm text-slate-300">/10</span></span>
      </div>
    </div>
  </div>
);

const JournalTrainerPageContent: React.FC = () => {
  const router = useRouter();
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();

  const activeScenarioRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'journalScenarios', 'active') : null, [user, firestore]);
  const { data: activeScenario, isLoading: isScenarioLoading } = useDoc<any>(activeScenarioRef);
  
  const [journalContent, setJournalContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [customScenario, setCustomScenario] = useState('');
  const [customObservation, setCustomObservation] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [revisedEntry, setRevisedEntry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  const showStartScreen = !isScenarioLoading && !activeScenario;
  const showEditor = !isScenarioLoading && activeScenario && !activeScenario.feedback;
  const showFeedbackView = !isScenarioLoading && activeScenario && activeScenario.feedback;

  useEffect(() => {
    if (!activeScenario) {
      setJournalContent('');
      setError(null);
      setLimitError(null);
      setRevisedEntry(null);
      setSelectedTopic('');
      setCustomScenario('');
      setCustomObservation('');
    } else {
        if(activeScenario.journalEntry) {
            setJournalContent(activeScenario.journalEntry);
        }
    }
  }, [activeScenario]);

  const handleStartTraining = async () => {
    if (!selectedTopic || isGenerating || !user || !firestore || !userProfile || !activeScenarioRef) return;
    
    setIsGenerating(true);
    setError(null);
    setLimitError(null);

    const userRef = doc(firestore, 'users', user.uid);
    try {
        let scenarioData: Partial<JournalScenarioData> & { topic: string };

        if (isFreeMode) {
            if (!customScenario.trim() || !customObservation.trim()) {
                setError("Udfyld venligst både observation og situation.");
                setIsGenerating(false);
                return;
            }
            scenarioData = {
                title: 'Frit notat',
                topic: selectedTopic,
                scenario: customScenario.trim(),
                initialObservation: customObservation.trim()
            };
        } else {
            const response = await generateJournalScenarioAction({ topic: selectedTopic });
            scenarioData = {
                ...response.data,
                topic: selectedTopic,
            };

            // Point and usage updates only for AI generation
            const batch = writeBatch(firestore);
            const userUpdates: {[key: string]: any} = { 
                lastJournalTrainerUsage: serverTimestamp(), 
                dailyJournalTrainerCount: increment(1) 
            };
            
            if(response.usage) {
                 const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
                 const pointsToAdd = Math.round(totalTokens * 0.05);
                 if (pointsToAdd > 0) userUpdates.cohéroPoints = increment(pointsToAdd);
                 
                 const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
                 batch.set(tokenUsageRef, { flowName: 'generateJournalScenario', ...response.usage, totalTokens, createdAt: serverTimestamp(), userId: user.uid, userName: userProfile.username || user.displayName || 'Anonym' });
            }
            batch.update(userRef, userUpdates);
            await batch.commit();
        }
        
        const fullScenarioData = {
            ...scenarioData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            journalEntry: '',
            feedback: null,
        };

        await setDoc(activeScenarioRef, fullScenarioData);
        await refetchUserProfile();
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
        const response = await getJournalFeedbackAction({
            topic: activeScenario.topic,
            scenario: activeScenario.scenario,
            initialObservation: activeScenario.initialObservation,
            journalEntry: journalContent,
        });

        const batch = writeBatch(firestore);
        batch.update(activeScenarioRef, {
            journalEntry: journalContent,
            feedback: response.data,
            updatedAt: serverTimestamp(),
        });

        if (response.usage) {
            const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
            const pointsToAdd = Math.round(totalTokens * 0.05);
            if(pointsToAdd > 0) {
                 batch.update(doc(firestore, 'users', user.uid), { cohéroPoints: increment(pointsToAdd) });
            }
            const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
            batch.set(tokenUsageRef, { flowName: 'getJournalFeedback', ...response.usage, totalTokens, createdAt: serverTimestamp(), userId: user.uid, userName: userProfile.username || user.displayName || 'Anonym' });
        }
        
        await batch.commit();
        await refetchUserProfile();

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
        feedback: activeScenario.feedback,
      });
      setRevisedEntry(response.data.revisedJournalEntry);

      if(response.usage) {
          const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
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
    setIsSaving(true);
    try {
        const finishedScenariosCol = collection(firestore, 'users', user.uid, 'journalScenarios');
        const batch = writeBatch(firestore);
        
        batch.set(doc(finishedScenariosCol), {
            ...activeScenario,
            savedAt: serverTimestamp(),
        });
        
        batch.delete(activeScenarioRef);
        
        await batch.commit();
        toast({
            title: "Øvelse Gemt!",
            description: "Du kan finde den igen under 'Min Logbog'.",
        });
    } catch (error) {
        console.error("Error saving and finishing:", error);
        toast({
            variant: 'destructive',
            title: 'Fejl',
            description: 'Kunne ikke gemme din øvelse. Prøv igen.'
        });
    } finally {
        setIsSaving(false);
    }
  };
    
  const handleEndExercise = () => {
    if (!activeScenarioRef || !window.confirm('Er du sikker på du vil afslutte? Dine noter vil blive slettet.')) return;
    deleteDoc(activeScenarioRef)
        .catch(err => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: activeScenarioRef.path,
                operation: 'delete'
            }));
        });
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 selection:bg-amber-100 overflow-x-hidden">
      
      {/* SIDEBAR (THE DOSSIER) */}
      <aside className="w-full lg:w-80 bg-white border-r border-amber-100 flex flex-col sticky top-0 lg:h-screen z-30 shadow-sm overflow-y-auto custom-scrollbar">
        <div className="p-8 flex items-center gap-4 border-b border-amber-50 bg-[#FDFCF8]/50">
            <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-lg shrink-0">
                <FileText className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-amber-950 serif tracking-tight">Journal-træner</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Dokumentation</p>
            </div>
        </div>

        <div className="flex-1 p-6 space-y-10">
            {activeScenario ? (
                <div className="space-y-10 animate-ink">
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Aktiv Sagsmappe</h3>
                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 shadow-inner">
                            <span className="text-[8px] font-black uppercase text-amber-700 bg-white px-2 py-0.5 rounded border mb-2 inline-block">{activeScenario.topic}</span>
                            <h4 className="font-bold text-amber-950 text-sm leading-tight">{activeScenario.title}</h4>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Observationsgrundlag</h3>
                        <div className="p-5 bg-white border border-amber-50 rounded-2xl shadow-sm italic text-xs text-slate-600 leading-relaxed">
                            "{activeScenario.initialObservation}"
                        </div>
                    </section>

                    {activeScenario.feedback && (
                        <section>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2 flex items-center gap-2">
                                <History className="w-3.5 h-3.5" /> Status
                            </h3>
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="text-[11px] font-bold text-emerald-900">Feedback modtaget</span>
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20 grayscale scale-90">
                    <BookMarked className="w-16 h-16 text-slate-300 mb-6" />
                    <p className="text-xs font-black uppercase tracking-widest">Venter på træning</p>
                </div>
            )}
        </div>

        {activeScenario && (
            <div className="p-6 border-t border-amber-50">
                <Button variant="ghost" onClick={handleEndExercise} className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl h-12">
                    <X className="w-4 h-4 mr-2" /> Afslut Træning
                </Button>
            </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-amber-100 px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2.5 bg-amber-50 text-amber-900 rounded-xl hover:bg-amber-100 transition-all active:scale-95">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-amber-100"></div>
                <h2 className="font-bold text-amber-950 serif">{activeScenario ? activeScenario.title : 'Ny Journal-træning'}</h2>
            </div>
            
            {showEditor && (
                <Button 
                    onClick={handleGetFeedback}
                    disabled={journalContent.length < 50 || isSubmitting}
                    className="shadow-lg shadow-amber-950/10"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Sparkles className="w-4 h-4 mr-2 text-amber-400" />}
                    {isSubmitting ? 'Analyserer...' : 'Få kollega-feedback'}
                </Button>
            )}
        </header>

        <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-5xl mx-auto w-full">
            <AnimatePresence mode="wait">
                {showStartScreen ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-12">
                        <div className="relative">
                            <div className="w-32 h-32 bg-amber-50 rounded-[3rem] flex items-center justify-center text-amber-200 shadow-inner group transition-transform hover:rotate-6">
                                <BookCopy className="w-16 h-16 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white border border-amber-100 rounded-2xl flex items-center justify-center shadow-lg">
                                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold text-amber-950 serif">Træn din journalføring</h2>
                            <p className="text-slate-500 leading-relaxed italic text-lg">
                                Vælg en tilstand og kom i gang med din dokumentationspraksis.
                            </p>
                        </div>

                        <div className="w-full space-y-8">
                            <div className="inline-flex p-1.5 bg-white border border-amber-100 rounded-full shadow-sm">
                                <button 
                                    onClick={() => setIsFreeMode(false)}
                                    className={`px-8 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${!isFreeMode ? 'bg-amber-950 text-white shadow-lg' : 'text-slate-400 hover:text-amber-950'}`}
                                >
                                    <Sparkles className="w-4 h-4" /> AI-genereret
                                </button>
                                <button 
                                    onClick={() => setIsFreeMode(true)}
                                    className={`px-8 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${isFreeMode ? 'bg-amber-950 text-white shadow-lg' : 'text-slate-400 hover:text-amber-950'}`}
                                >
                                    <Pencil className="w-4 h-4" /> Skriv selv
                                </button>
                            </div>

                            <div className="grid gap-6 text-left">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 px-4">Sagsområde</label>
                                    <div className="relative group">
                                        <select 
                                            value={selectedTopic} 
                                            onChange={(e) => setSelectedTopic(e.target.value)}
                                            className="w-full h-16 px-8 bg-white border border-amber-100 rounded-3xl appearance-none focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 focus:outline-none transition-all text-base font-bold text-amber-950 shadow-sm cursor-pointer"
                                        >
                                            <option value="" disabled>Vælg sagsområde...</option>
                                            {socialWorkTopics.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-300 pointer-events-none group-hover:text-amber-950 transition-colors" />
                                    </div>
                                </div>

                                {isFreeMode && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 px-4">Indledende Observation</label>
                                            <Input 
                                                value={customObservation}
                                                onChange={(e) => setCustomObservation(e.target.value)}
                                                placeholder="Eks: 'Bekymring fra skolen vedr. barnets trivsel'..."
                                                className="h-16 px-8 rounded-3xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 px-4">Situation (Din tekst/case)</label>
                                            <textarea 
                                                value={customScenario}
                                                onChange={(e) => setCustomScenario(e.target.value)}
                                                placeholder="Beskriv situationen eller indsæt den case du vil træne i her..."
                                                className="w-full h-48 p-8 bg-white border border-amber-100 rounded-[2.5rem] focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 focus:outline-none transition-all text-sm leading-relaxed"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <Button 
                                onClick={handleStartTraining}
                                disabled={!selectedTopic || isGenerating || (isFreeMode && (!customScenario.trim() || !customObservation.trim()))}
                                className="w-full h-16 bg-amber-950 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-amber-950/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2 text-amber-400" />}
                                Start Træning
                            </Button>
                            {error && <p className="text-xs text-rose-600 font-bold text-center animate-shake">{error}</p>}
                        </div>
                    </motion.div>
                ) : (showEditor || showFeedbackView) && activeScenario ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-32">
                        
                        {/* THE SCENARIO CARD */}
                        <section className="bg-white p-8 md:p-16 rounded-[3rem] sm:rounded-[4rem] border border-amber-100 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                                <FileText className="w-96 h-96 -rotate-12" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-10 text-amber-900/40">
                                    <BookOpen className="w-5 h-5" />
                                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Beskrivelse af hændelsen</span>
                                </div>
                                <div className="prose prose-amber prose-lg max-w-none text-slate-700 leading-[1.8] serif italic" dangerouslySetInnerHTML={{ __html: activeScenario.scenario }} />
                            </div>
                        </section>

                        {/* WORKSPACE (EDITOR OR FEEDBACK) */}
                        <AnimatePresence mode="wait">
                            {showEditor ? (
                                <motion.section key="editor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                                    <div className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-inner relative group min-h-[400px]">
                                        <div className="flex items-center justify-between mb-8">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-950/40">Dit Journalnotat</label>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${journalContent.length > 50 ? 'bg-emerald-500' : 'bg-amber-200'}`} />
                                                <span className="text-[10px] font-bold text-slate-300">{journalContent.length} tegn</span>
                                            </div>
                                        </div>
                                        
                                        <textarea 
                                            value={journalContent}
                                            onChange={(e) => setJournalContent(e.target.value)}
                                            placeholder="Skriv dit faglige notat her... Husk at være objektiv og inddrage relevante lovparagraffer."
                                            className="w-full min-h-[300px] bg-transparent border-none focus:ring-0 text-amber-950 font-medium leading-relaxed resize-none placeholder:text-slate-200 placeholder:italic p-0"
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck className="w-3 h-3" /> Systemet gemmer dine noter automatisk
                                        </p>
                                    </div>
                                    {error && <p className="text-xs text-rose-600 font-bold text-center bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>}
                                </motion.section>
                            ) : (
                                <motion.div key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
                                    <div className="grid md:grid-cols-3 gap-8">
                                        <PersonaCard 
                                            icon={<Scale className="w-6 h-6"/>} 
                                            title="Marianne" 
                                            description="Juristen"
                                            color="bg-blue-50 text-blue-700" 
                                            feedback={activeScenario.feedback.juridisk.feedback} 
                                            score={activeScenario.feedback.juridisk.score} 
                                        />
                                        <PersonaCard 
                                            icon={<Briefcase className="w-6 h-6"/>} 
                                            title="Erik" 
                                            description="Den Erfarne"
                                            color="bg-amber-50 text-amber-700" 
                                            feedback={activeScenario.feedback.erfaren.feedback} 
                                            score={activeScenario.feedback.erfaren.score} 
                                        />
                                        <PersonaCard 
                                            icon={<Clock className="w-6 h-6"/>} 
                                            title="Lars" 
                                            description="Teamlederen"
                                            color="bg-rose-50 text-rose-700" 
                                            feedback={activeScenario.feedback.travl.feedback} 
                                            score={activeScenario.feedback.travl.score} 
                                        />
                                    </div>

                                    {/* GOLD VERSION / REVISION */}
                                    <section className="bg-amber-950 p-12 md:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                                        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-amber-950 shadow-lg group-hover:rotate-6 transition-transform">
                                                        <Sparkles className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="text-2xl font-bold serif">Den Optimale Version</h4>
                                                </div>
                                                <p className="text-amber-100/60 leading-relaxed italic">
                                                    Lad os omskrive dit notat baseret på al feedbacken, så du kan se hvordan en professionel og juridisk stærk journalføring ser ud i denne case.
                                                </p>
                                                <Button 
                                                    onClick={handleRevise}
                                                    disabled={isRevising || !!revisedEntry}
                                                    className="w-full sm:w-auto px-10 py-6 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                                >
                                                    {isRevising ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                                    {isRevising ? 'Skriver perfektion...' : 'Generér Guld-version'}
                                                </Button>
                                            </div>
                                            
                                            {revisedEntry && (
                                                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm animate-ink">
                                                    <div className="flex items-center gap-2 mb-4 text-amber-400">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Revideret Notat</span>
                                                    </div>
                                                    <div className="prose prose-sm prose-invert max-w-none text-amber-50 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: revisedEntry.replace(/\n/g, '<br />') }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                                    </section>

                                    <div className="flex justify-center gap-4">
                                        <Button 
                                            onClick={handleSaveAndFinish}
                                            disabled={isSaving}
                                            variant="outline"
                                            className="px-10 h-14 rounded-2xl border-amber-200 text-amber-950 hover:bg-amber-50"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Bookmark className="w-4 h-4 mr-2" />}
                                            Gem og Afslut
                                        </Button>
                                    </div>
                                    {error && <p className="text-xs text-rose-600 font-bold text-center">{error}</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>
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
            router.replace(`/?callbackUrl=${encodeURIComponent(pathname)}`);
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <JournalTrainerPageContent />;
};

export default JournalTrainerPage;
