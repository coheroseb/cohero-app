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

const PersonaCard = ({ icon, title, color, feedback, score, subtitle }: { icon: React.ReactNode, title: string, color: string, feedback: string, score: number, subtitle: string }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500 animate-ink">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        {icon}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${color}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-amber-950 serif">{title}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{subtitle}</p>
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

const CaseTrainerPageContent: React.FC = () => {
  const { user, userProfile, refetchUserProfile } = useApp();
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
    
    setIsGenerating(true);
    setError(null);
    setLimitError(null);

    try {
      const response = await generateNewCase({ topic: selectedTopic });
      
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

  const handleSelectChoice = async (choice: {id: string, text: string}) => {
    if (isSubmitting || isAnalyzing || !activeCase || !activeCaseRef || !user || !firestore) return;
    setIsSubmitting(true);

    const currentDilemma = activeCase.dilemmas[currentDilemmaIndex];
    const newChoices = [...userChoices, { dilemma: currentDilemma.dilemma, choice: choice.text }];
    
    try {
      const consResponse = await getCaseConsequenceAction({
        scenario: activeCase.scenario,
        dilemma: currentDilemma.dilemma,
        chosenActionText: choice.text
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
            assessment: 'Brugeren valgte handlinger baseret på dilemmaer.',
            goals: 'At navigere i casen.',
            actionPlan: newChoices.map(c => c.choice).join(' -> ')
        });
        updates.finalFeedback = feedback.data;
      }

      updateDoc(activeCaseRef, updates)
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
  const showDilemma = !isCaseLoading && activeCase && !finalFeedback && activeCase.dilemmas && activeCase.dilemmas.length > currentDilemmaIndex;
  const showFeedback = !isCaseLoading && activeCase && finalFeedback;

  if (isCaseLoading) {
      return (
        <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 selection:bg-amber-100 overflow-x-hidden">
      
      {/* SIDEBAR (THE DOSSIER) */}
      <aside className="w-full lg:w-80 bg-white border-r border-amber-100 flex flex-col sticky top-0 lg:h-screen z-30 shadow-sm overflow-y-auto custom-scrollbar">
        <div className="p-8 flex items-center gap-4 border-b border-amber-50 bg-[#FDFCF8]/50">
            <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-lg shrink-0">
                <Zap className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-amber-950 serif tracking-tight">Case-træner</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Dannelsesrejse</p>
            </div>
        </div>

        <div className="flex-1 p-6 space-y-10">
            {activeCase ? (
                <div className="space-y-10 animate-ink">
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Aktiv Sagsmappe</h3>
                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 shadow-inner">
                            <span className="text-[8px] font-black uppercase text-amber-700 bg-white px-2 py-0.5 rounded border mb-2 inline-block">{activeCase.topic}</span>
                            <h4 className="font-bold text-amber-950 text-sm leading-tight">{activeCase.title}</h4>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Fremdrift</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-1 px-1">
                                <span className="text-[10px] font-bold text-amber-900">{showFeedback ? '100%' : Math.round((currentDilemmaIndex / activeCase.dilemmas.length) * 100)}% Gennemført</span>
                                <span className="text-[10px] font-black text-slate-300 uppercase">{currentDilemmaIndex}/{activeCase.dilemmas.length} Dilemmaer</span>
                            </div>
                            <div className="w-full h-2 bg-amber-50 rounded-full overflow-hidden border border-amber-100 shadow-inner">
                                <div 
                                    className="h-full bg-amber-950 transition-all duration-1000 ease-out" 
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
                                    <p className="text-[11px] text-amber-950 font-medium leading-relaxed line-clamp-2 italic">"{uc.choice}"</p>
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
            <div className="p-6 border-t border-amber-50">
                <Button variant="ghost" onClick={handleEndExercise} className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl h-12">
                    <X className="w-4 h-4 mr-2" /> Afslut Case
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
                <h2 className="font-bold text-amber-950 serif">{activeCase ? activeCase.title : 'Ny Træning'}</h2>
            </div>
            {activeCase && (
                <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Live Simulering</p>
                </div>
            )}
        </header>

        <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-5xl mx-auto w-full">
            <AnimatePresence mode="wait">
                {showStartScreen ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-12">
                        <div className="relative">
                            <div className="w-32 h-32 bg-amber-50 rounded-[3rem] flex items-center justify-center text-amber-200 shadow-inner group transition-transform hover:rotate-6">
                                <BookMarked className="w-16 h-16 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white border border-amber-100 rounded-2xl flex items-center justify-center shadow-lg">
                                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold text-amber-950 serif">Klar til at teste dit skøn?</h2>
                            <p className="text-slate-500 leading-relaxed italic text-lg">
                                Vælg et fagligt område for at generere et realistisk scenarie med komplekse dilemmaer.
                            </p>
                        </div>

                        <div className="w-full space-y-6">
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

                            <button 
                                onClick={handleGenerateCase}
                                disabled={!selectedTopic || isGenerating}
                                className="w-full py-6 bg-amber-950 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-amber-950/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                            >
                                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-amber-400" />}
                                Generér Sagsmappe
                            </button>
                            {limitError && (
                                <div className="bg-amber-50 border-2 border-dashed border-amber-200 text-amber-950 p-6 rounded-2xl animate-shake">
                                    <h3 className="font-bold text-sm mb-1 flex items-center justify-center gap-2"><Lock className="w-4 h-4"/> Grænse nået</h3>
                                    <p className="text-xs mb-4">{limitError}</p>
                                    <Link href="/upgrade" className="bg-amber-950 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Opgrader</Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : showDilemma ? (
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
                                <div className="bg-slate-50/50 p-8 rounded-3xl border-l-4 border-amber-950 mb-12 italic text-lg text-slate-700 leading-relaxed shadow-inner">
                                    <p><span className="font-black not-italic text-amber-950 uppercase text-[10px] block mb-3 tracking-[0.2em]">Indledende Observation:</span> {activeCase.initialObservation}</p>
                                </div>
                                <div className="prose prose-amber prose-lg max-w-none text-slate-700 leading-[1.8] serif italic" dangerouslySetInnerHTML={{ __html: activeCase.scenario }} />
                            </div>
                        </section>

                        {/* ACTIVE DILEMMA */}
                        <section className="bg-amber-50/50 p-10 rounded-[3rem] border-2 border-dashed border-amber-200 relative group animate-float-spine">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-amber-950 text-white rounded-2xl flex items-center justify-center shadow-lg"><Target className="w-6 h-6" /></div>
                                <h3 className="text-2xl font-bold text-amber-950 serif">Hvad er din næste handling?</h3>
                            </div>
                            
                            <div className="grid gap-4">
                                {activeCase.dilemmas[currentDilemmaIndex].choices.map((choice: any) => (
                                    <button 
                                        key={choice.id} 
                                        onClick={() => handleSelectChoice(choice)}
                                        disabled={isSubmitting}
                                        className="bg-white p-8 rounded-3xl border border-amber-100 hover:border-amber-950 hover:shadow-2xl transition-all text-left flex items-start gap-6 group/choice disabled:opacity-50 active:scale-[0.99]"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-950 font-black serif text-lg group-hover/choice:bg-amber-950 group-hover/choice:text-white transition-colors shrink-0">
                                            {choice.id}
                                        </div>
                                        <span className="flex-1 text-lg text-amber-950 font-bold leading-snug pt-1">{choice.text}</span>
                                        <ChevronRight className="w-6 h-6 text-amber-200 group-hover/choice:translate-x-2 group-hover/choice:text-amber-950 transition-all self-center shrink-0" />
                                    </button>
                                ))}
                            </div>
                            {isSubmitting && (
                                <div className="absolute inset-0 bg-[#FDFCF8]/60 backdrop-blur-sm rounded-[3rem] flex flex-col items-center justify-center space-y-6 z-10 animate-ink">
                                    <div className="relative">
                                        <Loader2 className="w-16 h-16 animate-spin text-amber-950/20" />
                                        <Zap className="absolute inset-0 m-auto w-6 h-6 text-amber-950 animate-pulse" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40">Beregner konsekvenser...</p>
                                </div>
                            )}
                        </section>
                    </motion.div>
                ) : showFeedback ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 pb-32 animate-ink">
                        <div className="text-center max-w-2xl mx-auto space-y-6">
                            <div className="w-24 h-24 bg-amber-950 rounded-[2.5rem] flex items-center justify-center text-amber-400 mx-auto shadow-2xl relative">
                               <Trophy className="w-12 h-12 animate-bounce" />
                               <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-4 border-white"><CheckCircle2 className="w-6 h-6"/></div>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-amber-950 serif">Supervision Modtaget</h2>
                            <p className="text-slate-500 italic text-lg leading-relaxed">Dine kolleger har evalueret din samlede indsats og det faglige skøn, du har udvist gennem casen.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <PersonaCard 
                                icon={<Scale className="w-6 h-6"/>} 
                                title="Marianne" 
                                description="Juridisk sagsbehandler"
                                subtitle="Juridisk Validitet"
                                color="bg-blue-50 text-blue-700" 
                                feedback={finalFeedback.juridisk.feedback} 
                                score={finalFeedback.juridisk.score} 
                            />
                            <PersonaCard 
                                icon={<Briefcase className="w-6 h-6"/>} 
                                title="Erik" 
                                description="Erfaren Socialrådgiver"
                                subtitle="Faglig Praksis"
                                color="bg-amber-50 text-amber-700" 
                                feedback={finalFeedback.erfaren.feedback} 
                                score={finalFeedback.erfaren.score} 
                            />
                            <PersonaCard 
                                icon={<Clock className="w-6 h-6"/>} 
                                title="Lars" 
                                description="Afdelingsleder"
                                subtitle="Klarhed & Effekt"
                                color="bg-rose-50 text-rose-700" 
                                feedback={finalFeedback.travl.feedback} 
                                score={finalFeedback.travl.score} 
                            />
                        </div>

                        <div className="p-12 md:p-16 bg-amber-950 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group max-w-4xl mx-auto">
                           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                              <div className="flex-1 space-y-6">
                                 <h4 className="text-3xl font-bold serif">Case Arkiveret</h4>
                                 <p className="text-amber-100/60 leading-relaxed text-lg italic">
                                   Du har gennemført træningen og optjent <strong>150 CP</strong>. Din faglige dannelse er vokset med denne erfaring.
                                 </p>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                                 <button 
                                    onClick={() => handleEndExercise()}
                                    className="px-10 py-5 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                 >
                                    <RotateCcw className="w-4 h-4" /> Nyt Scenarie
                                 </button>
                                 <button 
                                    onClick={handleArchiveCase}
                                    disabled={isSaving}
                                    className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                 >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Bookmark className="w-4 h-4" />}
                                    Gem Resultat
                                 </button>
                              </div>
                           </div>
                           <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const CaseTrainerPage: React.FC = () => {
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

    return <CaseTrainerPageContent />;
};

export default CaseTrainerPage;
