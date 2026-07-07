'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  AlertTriangle,
  X,
  Target,
  Zap,
  Gavel,
  ShieldCheck,
  ChevronRight,
  Bookmark,
  MessageSquare,
  Trophy,
  History,
  Layout,
  Library,
  BookMarked,
  BookOpen,
  Lock
} from 'lucide-react';
import { generateNewCase, getCaseConsequenceAction, getCaseFeedbackAction } from '@/app/actions';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, increment, collection, addDoc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import PageHeader from '@/components/PageHeader';
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

const pedagogicalTopics = [
    "Daginstitutioner (0-6 år)",
    "Skole- og fritidspædagogik",
    "Specialpædagogik (handicap, autisme)",
    "Socialpædagogisk støtte (botilbud, § 85)",
    "Udsatte børn og unge (døgninstitutioner)",
    "Ældrepædagogik og demensomsorg",
    "Kultur- og fritidspædagogik",
    "Neuropsykologisk pædagogik",
];

const PersonaCard = ({ icon, title, color, feedback, score, subtitle }: { icon: React.ReactNode, title: string, color: string, feedback: string, score: number, subtitle: string }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[var(--shadow-sm)] relative overflow-hidden group hover:border-slate-300 transition-all duration-300">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        {icon}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="prose prose-sm text-slate-600 leading-relaxed font-medium italic border-l-2 border-indigo-100 pl-4 mb-2" dangerouslySetInnerHTML={{ __html: feedback }} />
        <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Faglig vurdering</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-2 h-4 rounded-sm ${i <= Math.ceil(score/2) ? color.split(' ')[1] : 'bg-slate-100'}`} />
              ))}
            </div>
          </div>
          <span className="text-xl font-black text-slate-800">{score}<span className="text-xs text-slate-400 font-medium">/10</span></span>
        </div>
      </div>
    </div>
);

const CaseTrainerPageContent: React.FC = () => {
  const { user, userProfile, refetchUserProfile, usageLimits } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedTopic, setSelectedTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [pendingChoice, setPendingChoice] = useState<{id: string, text: string} | null>(null);
  const [justification, setJustification] = useState('');
  const [showConsequence, setShowConsequence] = useState(false);

  // Persistent Firestore State
  const activeCaseRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'cases', 'active') : null, [user, firestore]);
  const { data: activeCaseData, isLoading: isCaseLoading } = useDoc<any>(activeCaseRef);

  // Derived state
  const activeCase = activeCaseData?.caseContent;
  const currentDilemmaIndex = activeCaseData?.currentDilemmaIndex || 0;
  const userChoices = activeCaseData?.userChoices || [];
  const consequences = activeCaseData?.consequences || [];
  const finalFeedback = activeCaseData?.finalFeedback || null;

  const handleGenerateCase = async () => {
    if (!selectedTopic || isGenerating || !user || !firestore || !userProfile || !activeCaseRef) return;
    
    // Limit Check
    const currentTier = userProfile?.membership || 'Kollega';
    const effectiveTier = ['Kollega', 'Group Pro'].includes(currentTier) ? 'Kollega' : 'Kollega+';
    const tierLimits = (usageLimits && usageLimits[effectiveTier]) ? usageLimits[effectiveTier] : { cases: 1 };
    const casesLimit = tierLimits.cases === -1 ? Infinity : (tierLimits.cases ?? 1);

    const lastUsage = userProfile.lastCaseTrainerUsage?.toDate();
    const now = new Date();
    const isNewDay = !lastUsage || lastUsage.toDateString() !== now.toDateString();
    const count = isNewDay ? 0 : (userProfile.dailyCaseTrainerCount || 0);

    if (count >= casesLimit) {
      setLimitError(`Du har brugt dine ${casesLimit} daglige forsøg i Case-træneren. Opgrader til Kollega+ for fri adgang.`);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setLimitError(null);

    try {
      const response = await generateNewCase({ topic: selectedTopic, profession: userProfile?.profession });
      
      const newCaseData = {
        topic: selectedTopic,
        caseContent: response.caseData,
        currentDilemmaIndex: 0,
        userChoices: [],
        consequences: [],
        finalFeedback: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      setDoc(activeCaseRef, newCaseData)
        .catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: activeCaseRef.path,
            operation: 'write',
            requestResourceData: newCaseData
          }));
        });

      const userRef = doc(firestore, 'users', user.uid);
      updateDoc(userRef, {
        lastCaseTrainerUsage: serverTimestamp(),
        dailyCaseTrainerCount: increment(1)
      }).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: { dailyCaseTrainerCount: 'increment' }
          }));
      });

      await refetchUserProfile();
    } catch (err) {
      console.error(err);
      setError("Kunne ikke generere case. Prøv igen.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectChoice = async () => {
    if (!pendingChoice || isSubmitting || isAnalyzing || !activeCase || !activeCaseRef || !user || !firestore) return;
    setIsSubmitting(true);

    const currentDilemma = activeCase.dilemmas[currentDilemmaIndex];
    const newChoices = [...userChoices, { 
        dilemma: currentDilemma.dilemma, 
        choice: pendingChoice.text,
        justification: justification 
    }];
    
    try {
      const consResponse = await getCaseConsequenceAction({
        scenario: activeCase.scenario,
        dilemma: currentDilemma.dilemma,
        chosenActionText: pendingChoice.text,
        chosenActionJustification: justification
      });
      
      const newConsequences = [...consequences, consResponse.data];
      const nextIndex = currentDilemmaIndex + 1;
      const isFinished = nextIndex >= activeCase.dilemmas.length;

      const updates: any = {
        userChoices: newChoices,
        consequences: newConsequences,
        currentDilemmaIndex: nextIndex,
        updatedAt: serverTimestamp(),
      };

      if (isFinished) {
        setIsAnalyzing(true);
        const feedback = await getCaseFeedbackAction({
            topic: activeCase.topic,
            scenario: activeCase.scenario,
            initialObservation: activeCase.initialObservation,
            assessment: 'Brugeren valgte handlinger og begrundelser baseret på dilemmaer.',
            goals: 'At navigere i casen med fagligt skøn.',
            actionPlan: newChoices.map(c => `VALG: ${c.choice}\nBEGRUNDELSE: ${c.justification || 'Ingen'}`).join('\n\n---\n\n'),
            profession: userProfile?.profession
        });
        updates.finalFeedback = feedback.data;
      }

      updateDoc(activeCaseRef, updates)
        .then(() => {
            setShowConsequence(true);
        })
        .catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: activeCaseRef.path,
            operation: 'update',
            requestResourceData: updates
          }));
        });

    } catch (err) {
      setError("Fejl ved valg. Prøv igen.");
    } finally {
      setIsSubmitting(false);
      setIsAnalyzing(false);
      setPendingChoice(null);
      setJustification('');
    }
  };

  const handleArchiveCase = async () => {
    if (!user || !firestore || !activeCaseData || !activeCaseRef) return;
    setIsSaving(true);
    try {
        const finishedCasesCol = collection(firestore, 'users', user.uid, 'cases');
        const batch = writeBatch(firestore);
        
        // Add to history
        const newCaseRef = doc(finishedCasesCol);
        batch.set(newCaseRef, {
            ...activeCaseData,
            savedAt: serverTimestamp(),
        });

        // Remove active state
        batch.delete(activeCaseRef);

        await batch.commit();
        toast({ title: "Case gemt i dit arkiv!" });
    } catch (err) {
        console.error("Error archiving case:", err);
        toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke gemme casen." });
    } finally {
        setIsSaving(false);
    }
  };

  const handleEndExercise = () => {
    if (!activeCaseRef || !window.confirm('Er du sikker på du vil afslutte? Din nuværende fremdrift vil blive slettet.')) return;
    deleteDoc(activeCaseRef)
        .catch(err => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: activeCaseRef.path,
                operation: 'delete'
            }));
        });
  };

  const showStartScreen = !isCaseLoading && !activeCase;
  const showDilemma = !isCaseLoading && activeCase && !finalFeedback && !showConsequence && activeCase.dilemmas && activeCase.dilemmas.length > currentDilemmaIndex;
  const showFeedback = !isCaseLoading && activeCase && finalFeedback;
  const showConsequenceScreen = !isCaseLoading && activeCase && showConsequence && !finalFeedback;

  if (isCaseLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col lg:flex-row text-slate-900 selection:bg-indigo-100 overflow-x-hidden">
      
      {/* SIDEBAR (THE DOSSIER) */}
      <aside className="w-full lg:w-80 bg-white border-r border-slate-200/60 flex flex-col sticky top-0 lg:h-screen z-30 shadow-sm overflow-y-auto no-scrollbar">
        <div className="p-6 flex items-center gap-4 border-b border-slate-200/60 bg-slate-50/50">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <FileText className="w-5 h-5" />
            </div>
            <div>
                <h1 className="text-base font-bold text-slate-800 tracking-tight">Træningsmappe</h1>
                <p className="label-2xs text-slate-400 uppercase tracking-widest">Sagsdossier</p>
            </div>
        </div>

        <div className="flex-1 p-6 space-y-10">
            {activeCase ? (
                <div className="space-y-10 animate-ink">
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Aktiv Sagsmappe</h3>
                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/60 shadow-inner">
                            <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50 mb-2 inline-block">{activeCase.topic}</span>
                            <h4 className="font-bold text-slate-800 text-sm leading-tight">{activeCase.title}</h4>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Fremdrift</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-1 px-1">
                                <span className="text-[10px] font-bold text-indigo-600">{showFeedback ? '100%' : Math.round((currentDilemmaIndex / activeCase.dilemmas.length) * 100)}% Gennemført</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase">{currentDilemmaIndex}/{activeCase.dilemmas.length} Dilemmaer</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-600 transition-all duration-1000 ease-out" 
                                    style={{ width: `${showFeedback ? 100 : (currentDilemmaIndex / activeCase.dilemmas.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2 flex items-center gap-2">
                            <History className="w-3.5 h-3.5" /> Sags-Log
                        </h3>
                        <div className="space-y-3">
                            {userChoices.length === 0 && <p className="text-[10px] text-slate-400 italic px-2">Tag dit første valg for at starte loggen.</p>}
                            {userChoices.map((uc, i) => (
                                <div key={i} className="p-4 bg-white border border-amber-50 rounded-xl shadow-sm relative group">
                                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-500 rounded-full"></div>
                                    <p className="text-[9px] font-bold text-amber-700 uppercase mb-1">Valg {i+1}</p>
                                    <p className="text-[11px] text-amber-950 font-medium leading-relaxed italic mb-1">"{uc.choice}"</p>
                                    {uc.justification && (
                                        <p className="text-[9px] text-slate-400 line-clamp-1">Begrundelse: {uc.justification}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20 grayscale scale-90">
                    <BookMarked className="w-16 h-16 text-slate-300 mb-6" />
                    <p className="text-xs font-black uppercase tracking-widest">Ingen aktiv sag</p>
                </div>
            )}
        </div>

        {activeCase && (
            <div className="p-6 border-t border-slate-200/60">
                <Button variant="ghost" onClick={handleEndExercise} className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl h-12">
                    <X className="w-4 h-4 mr-2" /> Afslut Case
                </Button>
            </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] md:h-screen overflow-y-auto custom-scrollbar bg-slate-50/60">
        <div className="shrink-0 bg-white border-b border-slate-200/60 px-8 py-4 z-20 sticky top-0">
          <PageHeader
            title="Case-træner"
            subtitle={activeCase ? activeCase.title : "Træn dit faglige skøn i realistiske, komplekse dilemmer."}
            icon={<Zap className="w-5 h-5" />}
            iconColor="bg-indigo-50 text-indigo-600"
            className="mb-0"
            backHref="/portal"
            actions={activeCase && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Live Simulering</p>
              </div>
            )}
          />
        </div>

        <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-5xl mx-auto w-full">
            <AnimatePresence mode="wait">
                {showStartScreen ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-8 py-12">
                        <div className="relative">
                            <div className="w-24 h-24 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-[var(--shadow-sm)] group transition-transform hover:rotate-6">
                                <BookMarked className="w-10 h-10 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-slate-200/60 rounded-xl flex items-center justify-center shadow-md">
                                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-slate-800">Klar til at teste dit skøn?</h2>
                            <p className="text-slate-500 leading-relaxed italic text-base">
                                Vælg et fagligt område for at generere et realistisk scenarie med komplekse dilemmaer.
                            </p>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="relative group">
                                <select 
                                    value={selectedTopic} 
                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                    className="w-full h-14 px-6 bg-white border border-slate-200/60 rounded-xl appearance-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all text-sm font-bold text-slate-800 shadow-sm cursor-pointer"
                                >
                                    <option value="" disabled>Vælg sagsområde...</option>
                                    {(userProfile?.profession === 'Pædagog' ? pedagogicalTopics : socialWorkTopics).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-800 transition-colors" />
                            </div>

                            <button 
                                onClick={handleGenerateCase}
                                disabled={!selectedTopic || isGenerating}
                                className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] shadow-md hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-indigo-400" />}
                                Generér Sagsmappe
                            </button>

                        </div>
                    </motion.div>
                ) : showDilemma ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-32">
                        {/* THE SCENARIO CARD */}
                        <section className="bg-white p-8 rounded-xl border border-slate-200/60 shadow-[var(--shadow-sm)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                                <FileText className="w-96 h-96 -rotate-12 text-slate-300" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6 text-slate-400">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Beskrivelse af hændelsen</span>
                                </div>
                                <div className="bg-slate-50/50 p-6 rounded-lg border-l-4 border-indigo-600 mb-8 italic text-base text-slate-700 leading-relaxed shadow-inner">
                                    <p><span className="font-black not-italic text-slate-800 uppercase text-[10px] block mb-2 tracking-wider">Indledende Observation:</span> {activeCase.initialObservation}</p>
                                </div>
                                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: activeCase.scenario }} />
                            </div>
                        </section>

                        {/* ACTIVE DILEMMA */}
                        <section className="bg-slate-50/50 p-8 rounded-xl border border-slate-200/60 relative group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md"><Target className="w-5 h-5" /></div>
                                <h3 className="text-xl font-bold text-slate-800">Hvad er din næste handling?</h3>
                            </div>
                            
                            <div className="grid gap-3">
                                {activeCase.dilemmas[currentDilemmaIndex].choices.map((choice: any) => (
                                    <button 
                                        key={choice.id} 
                                        onClick={() => setPendingChoice(choice)}
                                        disabled={isSubmitting}
                                        className={`bg-white p-5 rounded-lg border transition-all text-left flex items-start gap-4 group/choice disabled:opacity-50 active:scale-[0.99] ${pendingChoice?.id === choice.id ? 'border-indigo-600 ring-4 ring-indigo-500/10 shadow-[var(--shadow-sm)]' : 'border-slate-200 hover:border-slate-350 hover:shadow-sm'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center font-black text-sm transition-colors shrink-0 ${pendingChoice?.id === choice.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200/60 text-slate-700 group-hover/choice:bg-indigo-600 group-hover/choice:text-white'}`}>
                                            {choice.id}
                                        </div>
                                        <span className="flex-1 text-sm text-slate-800 font-bold leading-normal pt-1.5">{choice.text}</span>
                                        <ChevronRight className={`w-4 h-4 transition-all self-center shrink-0 ${pendingChoice?.id === choice.id ? 'translate-x-1 text-indigo-600' : 'text-slate-300 group-hover/choice:translate-x-1 group-hover/choice:text-slate-500'}`} />
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence>
                                {pendingChoice && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }} 
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-6 space-y-4 pt-6 border-t border-slate-200/60 overflow-hidden"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Faglig Begrundelse (Valgfrit, men anbefales)</label>
                                                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">
                                                    <Sparkles className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                                                    <span className="text-[8px] font-bold text-indigo-700 uppercase">Giver bedre feedback</span>
                                                </div>
                                            </div>
                                            <textarea 
                                                value={justification}
                                                onChange={(e) => setJustification(e.target.value)}
                                                placeholder="Hvorfor vælger du denne handling? Skriv kort din faglige overvejelse her..."
                                                className="w-full h-24 p-4 bg-white border border-slate-200/60 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all text-xs text-slate-600 italic resize-none shadow-inner"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setPendingChoice(null)}
                                                className="px-6 h-11 rounded-xl border-slate-200 text-slate-400 hover:text-slate-900 text-xs"
                                            >
                                                Annuller
                                            </Button>
                                            <button 
                                                onClick={handleSelectChoice}
                                                disabled={isSubmitting}
                                                className="flex-1 h-11 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                                Bekræft mit valg
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {isSubmitting && (
                                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center space-y-4 z-10">
                                    <div className="relative">
                                        <Loader2 className="w-12 h-12 animate-spin text-slate-300" />
                                        <Zap className="absolute inset-0 m-auto w-5 h-5 text-indigo-600 animate-pulse" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Beregner konsekvenser...</p>
                                </div>
                            )}
                        </section>
                    </motion.div>
                ) : showConsequenceScreen ? (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-32">
                        <section className="bg-white p-8 rounded-xl border border-slate-200/60 shadow-[var(--shadow-sm)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.015] text-indigo-500 pointer-events-none">
                                <CheckCircle2 className="w-64 h-64" />
                            </div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-0.5">Konsekvens af dit valg</h3>
                                        <p className="text-xl font-bold text-slate-800">Hvad skete der?</p>
                                    </div>
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200/60 italic text-slate-600 leading-relaxed text-sm shadow-inner" dangerouslySetInnerHTML={{ __html: consequences[currentDilemmaIndex - 1]?.consequence }} />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-slate-200/60"></div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Faglig Refleksion</span>
                                        <div className="h-px flex-1 bg-slate-200/60"></div>
                                    </div>
                                    <div className="p-6 bg-indigo-50/30 rounded-lg border border-indigo-100 relative group">
                                        <div className="absolute -left-[1px] top-6 w-[3px] h-6 bg-indigo-500 rounded-r-full"></div>
                                        <p className="text-slate-600 leading-relaxed italic text-xs font-medium">
                                            {consequences[currentDilemmaIndex - 1]?.reflection}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button 
                                        onClick={() => setShowConsequence(false)}
                                        className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        Fortsæt til Næste Dilemma
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                ) : showFeedback ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-32">
                        <div className="text-center max-w-2xl mx-auto space-y-4 py-6">
                            <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-md relative">
                               <Trophy className="w-10 h-10" />
                               <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full shadow-md"><CheckCircle2 className="w-4 h-4"/></div>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800">Supervision Modtaget</h2>
                            <p className="text-slate-500 italic text-base leading-relaxed">Dine kolleger har evalueret din samlede indsats og det faglige skøn, du har udvist gennem casen.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <PersonaCard 
                                icon={<Scale className="w-6 h-6"/>} 
                                title="Marianne" 
                                subtitle="Juridisk Validitet"
                                color="bg-blue-50 text-blue-700" 
                                feedback={finalFeedback.juridisk.feedback} 
                                score={finalFeedback.juridisk.score} 
                            />
                            <PersonaCard 
                                icon={<Briefcase className="w-6 h-6"/>} 
                                title="Erik" 
                                subtitle="Faglig Praksis"
                                color="bg-amber-50 text-amber-700" 
                                feedback={finalFeedback.erfaren.feedback} 
                                score={finalFeedback.erfaren.score} 
                            />
                            <PersonaCard 
                                icon={<Clock className="w-6 h-6"/>} 
                                title="Lars" 
                                subtitle="Klarhed & Effekt"
                                color="bg-rose-50 text-rose-700" 
                                feedback={finalFeedback.travl.feedback} 
                                score={finalFeedback.travl.score} 
                            />
                        </div>

                        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-xl relative overflow-hidden group max-w-4xl mx-auto">
                           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                              <div className="flex-1 space-y-3">
                                 <h4 className="text-2xl font-bold">Case Arkiveret</h4>
                                 <p className="text-slate-300 leading-relaxed text-sm italic">
                                    Du har gennemført træningen og optjent <strong className="text-indigo-400">150 CP</strong>. Din faglige dannelse er vokset med denne erfaring.
                                 </p>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                                 <button 
                                    onClick={() => handleEndExercise()}
                                    className="px-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                 >
                                    <RotateCcw className="w-3.5 h-3.5" /> Nyt Scenarie
                                 </button>
                                 <button 
                                    onClick={handleArchiveCase}
                                    disabled={isSaving}
                                    className="px-6 py-3.5 bg-white/10 text-white border border-white/15 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                 >
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Bookmark className="w-3.5 h-3.5" />}
                                    Gem Resultat
                                 </button>
                              </div>
                           </div>
                           <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
      </main>
      {/* PREMIUM TEASER OVERLAY FOR FREE TIER */}
      {limitError && (
          <div className="absolute inset-0 z-[100] bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-8">
              <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200/60 p-8 text-center space-y-6 relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                      <Sparkles className="w-32 h-32" />
                  </div>
                  
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto border border-indigo-100 relative z-10">
                      <BookOpen className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-2 relative z-10">
                      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Kollega+ Eksklusivt</h2>
                      <p className="text-slate-500 leading-relaxed italic text-sm">
                          Træn dit faglige skøn i komplekse sager med realistiske konsekvenser og supervision.
                      </p>
                  </div>

                  <div className="space-y-3 text-left relative z-10 bg-slate-50/50 p-5 rounded-lg border border-slate-200/60">
                      {[
                          "Ubegrænsede træningscases",
                          "Realistiske konsekvens-loops",
                          "Faglig supervision fra 3 personaer",
                          "Gem resultater i dit arkiv"
                      ].map((feat, i) => (
                          <div key={i} className="flex items-center gap-3 text-[11px] font-bold text-slate-700">
                              <div className="w-4 h-4 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</div>
                              {feat}
                          </div>
                      ))}
                  </div>

                  <div className="space-y-3 relative z-10">
                      <Button onClick={() => router.push('/upgrade')} className="w-full h-12 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-md active:scale-95 text-[11px]">
                          Opgrader til Kollega+
                      </Button>
                      <button onClick={() => setLimitError(null)} className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em] w-full">
                          Måske senere
                      </button>
                  </div>
              </motion.div>
          </div>
      )}
    </div>
  );
};

const CaseTrainerPage: React.FC = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace(`/?callbackUrl=${encodeURIComponent(pathname || '')}`);
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <CaseTrainerPageContent />;
};

export default CaseTrainerPage;
