'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, writeBatch, increment, query, where, DocumentData, getDocs } from 'firebase/firestore';
import { SEMESTER_OPTIONS } from '@/lib/constants';
import { generateExamBlueprintAction, suggestExamTopicAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ExamBlueprint, ExamArchitectInput } from '@/ai/flows/types';
import WorkspaceModal from '@/components/exam-architect/WorkspaceModal';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Compass, 
  ArrowLeft, 
  Sparkles, 
  Layout, 
  Link as LinkIcon, 
  BookOpen, 
  PencilRuler,
  ChevronRight,
  Layers,
  Zap,
  Loader2,
  Lightbulb,
  Save,
  Maximize,
  Book,
  FileText,
  Target,
  Info,
  DraftingCompass,
  Trophy,
  History,
  CheckCircle,
  AlertCircle,
  Presentation,
  RotateCcw
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Construction Stage Indicator
// ---------------------------------------------------------------------------
const StageIndicator = ({ currentStage }: { currentStage: number }) => {
  const stages = [
    { id: 1, label: 'Fundament', icon: DraftingCompass },
    { id: 2, label: 'Arkitektur', icon: Layout },
    { id: 3, label: 'Ingeniørarbejde', icon: Layers },
    { id: 4, label: 'Færdiggørelse', icon: Trophy }
  ];

  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      {stages.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
              currentStage >= s.id ? 'bg-slate-900 text-amber-400 shadow-slate-900/20' : 'bg-white text-slate-300 border border-slate-100'
            }`}>
              <s.icon className="w-5 h-5" />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              currentStage >= s.id ? 'text-slate-900' : 'text-slate-300'
            }`}>{s.label}</span>
          </div>
          {i < stages.length - 1 && (
            <div className={`w-12 h-[2px] mb-6 transition-colors duration-500 ${
              currentStage > s.id ? 'bg-slate-900' : 'bg-slate-100'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const ExamArchitectPageContent: React.FC = () => {
  const { user, userProfile, refetchUserProfile, isUserLoading, usageLimits } = useApp();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [topic, setTopic] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [semester, setSemester] = useState('');
  const [type, setType] = useState('Semesteropgave');
  const [characterCount, setCharacterCount] = useState('');
  const [institution, setInstitution] = useState('');
  const [includeSeminars, setIncludeSeminars] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blueprint, setBlueprint] = useState<ExamBlueprint | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [fetchingCurriculum, setFetchingCurriculum] = useState(false);
  const [availableModules, setAvailableModules] = useState<{id: string, name: string}[]>([]);
  
  const isPremiumUser = useMemo(() => {
    if (userProfile?.role === 'admin') return true;
    return userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Institutionspakken'].includes(userProfile.membership);
  }, [userProfile]);

  const seminarsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'seminars')
    );
  }, [user, firestore]);
  const { data: seminars } = useCollection<DocumentData>(seminarsQuery);
  const categories = useMemo(() => {
    if (!seminars) return [];
    return Array.from(new Set(seminars.map(s => s.category).filter(Boolean))) as string[];
  }, [seminars]);

  const handleSuggest = async () => {
    if (!selectedCategory || !seminars) return;
    setIsSuggesting(true);
    try {
      const filtered = seminars.filter(s => s.category === selectedCategory);
      const context = filtered.map(s => `Seminar: ${s.overallTitle}\n${s.slides?.map((sl: any) => `Slide ${sl.slideNumber}: ${sl.summary}`).join('\n')}`).join('\n\n---\n\n');
      
      const result = await suggestExamTopicAction({ 
        semester, 
        seminarContext: context,
        profession: userProfile?.profession 
      });
      if (result?.data) {
        setTopic(result.data.suggestedTopic);
        setProblemStatement(result.data.suggestedProblemStatement);
        toast({ title: 'Magi fra arkivet! ✨', description: 'Systemet har nu foreslået et emne og problemformulering ud fra dine gemte slides.' });
      }
    } catch {
      toast({ title: 'Hov!', description: 'Noget gik galt under magien. Sørg for at du har premium for at bruge denne funktion.', variant: 'destructive' });
    } finally {
      setIsSuggesting(false);
    }
  };
  const hasSeminars = useMemo(() => seminars && seminars.length > 0, [seminars]);
  
  const isFormValid = useMemo(() => topic.trim() !== '', [topic]);

  useEffect(() => {
    if (!searchParams) return;
    const topicFromUrl = searchParams.get('topic');
    const summaryFromUrl = searchParams.get('summary');
    if (topicFromUrl) setTopic(decodeURIComponent(topicFromUrl || ''));
    if (summaryFromUrl) setProblemStatement(`Med udgangspunkt i sagen "${decodeURIComponent(topicFromUrl || '')}", vil jeg undersøge: ${decodeURIComponent(summaryFromUrl || '')}`);
    if (topicFromUrl || summaryFromUrl) router.replace('/exam-architect', { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    if (userProfile) {
      setSemester(userProfile.semester || '1. semester');
      setInstitution(userProfile.institution || '');
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchCurriculum = async () => {
      // Priority 1: Use modules from the user's custom uploaded curriculum
      if (userProfile?.customCurriculum?.modules && Array.isArray(userProfile.customCurriculum.modules)) {
        const mods = userProfile.customCurriculum.modules.map((m: any) => ({
          id: m.id || m.semester?.toString() || '',
          name: m.name || `${m.semester}. semester`
        }));
        setAvailableModules(mods);
        return;
      }

      // Priority 2: Use modules from the institutional curriculum
      if (!institution || !userProfile?.profession || !firestore) {
        setAvailableModules([]);
        return;
      }

      setFetchingCurriculum(true);
      try {
        const curriculumsRef = collection(firestore, 'curriculums');
        const q = query(
          curriculumsRef,
          where('institution', '==', institution),
          where('profession', '==', userProfile.profession)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const curriculum = querySnapshot.docs[0].data();
          if (curriculum.modules && Array.isArray(curriculum.modules)) {
            const mods = curriculum.modules.map((m: any) => ({
              id: m.id || m.semester?.toString() || '',
              name: m.name || `${m.semester}. semester`
            }));
            setAvailableModules(mods);
          } else {
            setAvailableModules([]);
          }
        } else {
          setAvailableModules([]);
        }
      } catch (err) {
        console.error("Error fetching curriculum for exam architect:", err);
        setAvailableModules([]);
      } finally {
        setFetchingCurriculum(false);
      }
    };

    fetchCurriculum();
  }, [institution, userProfile?.profession, firestore, userProfile?.customCurriculum]);

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/');
  }, [user, isUserLoading, router]);

  const handleSave = async (blueprintToSave: ExamBlueprint | null, closeModal: boolean = false) => {
    if (!blueprintToSave || !user || !firestore) return;
    setIsSaving(true);
    try {
        await addDoc(collection(firestore, 'users', user.uid, 'blueprints'), { ...blueprintToSave, topic, problemStatement, createdAt: serverTimestamp() });
        toast({ title: "Byggeplan gemt!", description: "Find den under 'Mine Byggeplaner'." });
        if (closeModal) setIsWorkspaceOpen(false);
    } catch {
        toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke gemme din byggeplan." });
    } finally {
        setIsSaving(false);
    }
  };

  const [stage, setStage] = useState(1);

  const handleGenerate = async () => {
    if (!isFormValid || !user || !userProfile || !firestore) return;
    setIsGenerating(true);
    setBlueprint(null);
    setLimitError(null);

    // Limit check
    const currentTier = userProfile.membership || 'Kollega';
    const effectiveTier = ['Kollega', 'Group Pro'].includes(currentTier) ? 'Kollega' : 'Kollega+';
    const tierLimits = (usageLimits && usageLimits[effectiveTier]) ? usageLimits[effectiveTier] : { architect: 1 };
    const lim = tierLimits.architect === -1 ? Infinity : (tierLimits.architect ?? 1);

    if (['Kollega', 'Group Pro'].includes(currentTier)) {
      const lastUsage = userProfile.lastExamArchitectUsage?.toDate();
      const now = new Date();
      const isNewMonth = !lastUsage || lastUsage.getMonth() !== now.getMonth() || lastUsage.getFullYear() !== now.getFullYear();
      const count = isNewMonth ? 0 : (userProfile.monthlyExamArchitectCount || 0);
      if (count >= lim) {
        setLimitError(`Du har brugt din månedlige grænse (${lim} stk.). Opgrader til Kollega+ for ubegrænset adgang.`);
        setIsGenerating(false);
        return;
      }
    }
    
    let seminarContext = '';
    if (isPremiumUser && includeSeminars && hasSeminars && seminars) {
        seminarContext = seminars.map(seminar => `Seminar: ${seminar.overallTitle}\n${seminar.slides?.map((s: any) => `Slide ${s.slideNumber}: ${s.summary}`).join('\n')}`).join('\n\n---\n\n');
    }

    try {
      const input: Omit<ExamArchitectInput, 'lawContext'> = { 
        topic, 
        problemStatement, 
        semester, 
        assignmentType: type, 
        characterCount: characterCount || undefined,
        seminarContext: seminarContext || undefined,
        profession: userProfile?.profession
      };
      const response = await generateExamBlueprintAction(input);
      setBlueprint(response.data);
      setStage(2); // Jump to architecture stage after generation
      
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', user.uid);
      const userUpdates: {[key: string]: any} = { lastExamArchitectUsage: serverTimestamp() };
      if (['Kollega', 'Group Pro'].includes(currentTier)) {
        const lastUsage = userProfile.lastExamArchitectUsage?.toDate();
        if (!lastUsage || lastUsage.getMonth() !== new Date().getMonth() || lastUsage.getFullYear() !== new Date().getFullYear()) {
          userUpdates.monthlyExamArchitectCount = 1;
        } else {
          userUpdates.monthlyExamArchitectCount = increment(1);
        }
      }
      if (response.usage) {
        const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
        const pointsToAdd = Math.round(totalTokens * 0.05);
        if (pointsToAdd > 0) userUpdates.cohéroPoints = increment(pointsToAdd);
        batch.set(doc(collection(firestore, 'users', user.uid, 'tokenUsage')), { flowName: 'examArchitectFlow', ...response.usage, totalTokens, createdAt: serverTimestamp() });
      }
      if (Object.keys(userUpdates).length > 0) batch.update(userRef, userUpdates);
      await batch.commit();
      await refetchUserProfile();
    } catch {
      toast({ title: "Fejl", description: "Der opstod en fejl under generering. Prøv igen.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isUserLoading || !user) return <AuthLoadingScreen />;

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-indigo-100 relative overflow-hidden">
      
      {/* HEADER */}
      <header className="h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/portal" className="p-3 bg-white text-slate-900 rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl shadow-slate-900/10">
              <DraftingCompass className="w-5 h-5" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Design Studio</p>
               <h1 className="text-xl font-black text-slate-900 serif tracking-tight">Eksamens-Arkitekten</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <Link href="/mine-byggeplaner" className="px-5 py-2.5 bg-slate-50 text-slate-500 rounded-2xl border border-slate-200 hover:bg-white hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 group">
              <History className="w-4 h-4 group-hover:rotate-[-12deg] transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Arkiv</span>
           </Link>
           <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20 group cursor-default">
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline tracking-[0.2em]">Structural Intelligence</span>
           </div>
        </div>
      </header>

      <main className="grow flex flex-col items-center pt-12 pb-32 px-6 overflow-y-auto">
        <div className="max-w-5xl w-full">
          
          <StageIndicator currentStage={stage} />

          <AnimatePresence mode="wait">
            {stage === 1 && (
               <motion.div 
                 key="stage1"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="grid lg:grid-cols-12 gap-8"
               >
                 <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-full blur-3xl -mr-24 -mt-24" />
                       <div className="relative z-10 space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                                <Target className="w-6 h-6" />
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-slate-900 serif tracking-tight">Projektets Fundament</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rammer & Emne</p>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Emne / Arbejdstitel</label>
                                <Input 
                                  placeholder="F.eks. Kommunalbestyrelsens ansvar ift. anbragte børn..." 
                                  value={topic}
                                  onChange={(e) => setTopic(e.target.value)}
                                  className="h-16 bg-slate-50 border-slate-100 rounded-2xl text-lg font-black focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm px-6"
                                />
                             </div>

                             <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Problemformulering (Udkast)</label>
                                <Textarea 
                                  value={problemStatement}
                                  onChange={(e) => setProblemStatement(e.target.value)}
                                  placeholder="Hvad er det centrale spørgsmål du gerne vil undersøge?..."
                                  className="w-full h-44 bg-slate-50 border-slate-100 rounded-[2rem] focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-base font-medium resize-none shadow-sm leading-relaxed px-6 py-5"
                                />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Opgavetype</label>
                                  <select 
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer px-6"
                                  >
                                    <option>Semesteropgave</option>
                                    <option>Bachelorprojekt</option>
                                    <option>Case-besvarelse</option>
                                  </select>
                                </div>
                                <div className="space-y-3">
                                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Semester</label>
                                  <select 
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    disabled={fetchingCurriculum}
                                    className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer px-6"
                                  >
                                     <option value="" disabled>
                                        {fetchingCurriculum ? 'Henter moduler...' : 'Vælg semester/modul...'}
                                     </option>
                                     {availableModules.length > 0 ? (
                                        availableModules.map(mod => (
                                            <option key={mod.id} value={mod.id}>{mod.name}</option>
                                        ))
                                     ) : (
                                        SEMESTER_OPTIONS.map(sem => (
                                            <option key={sem} value={`${sem}. semester`}>{sem}. semester</option>
                                        ))
                                     )}
                                   </select>
                                 </div>
                              </div>

                              <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Ønsket antal anslag (valgfrit)</label>
                                 <div className="relative">
                                     <PencilRuler className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                     <Input 
                                       placeholder="F.eks. 24.000 anslag..." 
                                       value={characterCount}
                                       onChange={(e) => setCharacterCount(e.target.value)}
                                       className="h-16 bg-slate-50 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm pl-14"
                                     />
                                 </div>
                              </div>
                           </div>

                          <Button 
                            onClick={handleGenerate}
                            disabled={!isFormValid || isGenerating}
                            className="w-full h-20 bg-slate-900 border-b-4 border-slate-700 hover:bg-slate-800 text-white rounded-[2.5rem] font-black group shadow-xl shadow-slate-900/10 transition-all active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-5 text-lg tracking-tight"
                          >
                            {isGenerating ? <Loader2 className="w-8 h-8 animate-spin text-amber-400" /> : <DraftingCompass className="w-8 h-8 text-amber-400 group-hover:rotate-12 transition-transform duration-500" />}
                            {isGenerating ? 'TEGNER BYGGEPLAN...' : 'START PROJEKTERING'}
                          </Button>
                       </div>
                </div>
                    </div>

                 <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-all duration-1000" />
                       <div className="relative z-10 space-y-6">
                          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                             <Lightbulb className="w-7 h-7 text-amber-400" />
                          </div>
                          <div className="space-y-2">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Arkitektens Råd</h4>
                             <p className="text-xl font-bold italic text-indigo-50 leading-relaxed serif">
                                "Et stærkt fundament kræver en klar vinkel. Definér dit hovedspørgsmål, før vi bygger strukturen."
                             </p>
                          </div>
                          
                          <div className="pt-8 space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Integrerede fordele</p>
                             <div className="space-y-3">
                                {[
                                  "Automatisk strukturanalyse",
                                  "Teoretisk stilladsforslag",
                                  "Rød tråd sikring",
                                  "Eksport til Microsoft Word"
                                ].map((benefit, i) => (
                                  <div key={i} className="flex items-center gap-3 text-xs font-bold text-indigo-100/60">
                                    <div className="w-5 h-5 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-[10px]">✓</div>
                                    {benefit}
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>

                    {isPremiumUser && categories.length > 0 && (
                      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                         <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                               <Presentation className="w-5 h-5" />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Magi fra Arkivet</h4>
                         </div>
                         <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed">Vælg en kategori for at lade arkitekten foreslå et emne ud fra dine gemte seminarer.</p>
                         <div className="flex gap-2">
                            <select 
                              value={selectedCategory || ''}
                              onChange={e => setSelectedCategory(e.target.value || null)}
                              className="flex-1 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                            >
                              <option value="">Vælg Kategori...</option>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {selectedCategory && (
                              <Button onClick={handleSuggest} disabled={isSuggesting} className="h-12 px-5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/10">
                                {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4" />}
                              </Button>
                            )}
                         </div>
                      </div>
                    )}
                 </div>
               </motion.div>
            )}

            {stage >= 2 && blueprint && (
               <motion.div 
                 key="stage2plus"
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="space-y-8"
               >
                 {/* Blueprint View (Stages 2-4 integrated here) */}
                 <section className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden relative">
                   <div className="p-12 border-b border-slate-50">
                     <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                             <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">{type}</span>
                             <span className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 tracking-[0.2em]">{semester}</span>
                           </div>
                           <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight serif">{blueprint.title}</h2>
                        </div>
                        <div className="flex gap-4 shrink-0">
                           <Button onClick={() => handleSave(blueprint)} disabled={isSaving} className="h-16 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-slate-900/20 transition-all active:scale-95 group">
                             {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Save className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />}
                             Gem Tegning
                           </Button>
                           <Button onClick={() => setIsWorkspaceOpen(true)} className="h-16 px-10 rounded-2xl border-2 border-indigo-100 bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95">
                              <Maximize className="w-5 h-5 mr-3" /> Fuldt Overblik
                           </Button>
                        </div>
                     </div>

                     <div className="grid lg:grid-cols-2 gap-8">
                        <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 relative group overflow-hidden">
                           <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-200/20 rounded-full blur-[60px] -mr-24 -mt-24 group-hover:bg-indigo-200/40 transition-all duration-1000"></div>
                           <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-8 relative z-10">
                              <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm"><Target className="w-4 h-4" /></div>
                              Problemformulering
                           </h4>
                           <p className="text-2xl font-black text-slate-900 leading-snug mb-8 relative z-10 serif">{blueprint.draftProblemStatement}</p>
                           <div className="flex items-start gap-4 p-6 bg-white rounded-[2rem] border border-indigo-100/50 relative z-10 shadow-sm">
                              <div className="w-6 h-6 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0 mt-1"><Sparkles className="w-3 h-3" /></div>
                              <p className="text-sm font-bold text-slate-500 italic leading-relaxed">"{blueprint.problemStatementTip}"</p>
                           </div>
                        </div>
                        <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 relative group overflow-hidden">
                           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] -ml-32 -mb-32 group-hover:bg-indigo-600/30 transition-all duration-1000"></div>
                           <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8 relative z-10">
                              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10"><Layers className="w-4 h-4 text-white" /></div>
                              Arkitektur & Rød Tråd
                           </h4>
                           <p className="text-2xl font-bold leading-snug mb-8 relative z-10 tracking-tight">{blueprint.researchStrategy}</p>
                           <div className="p-6 bg-white/5 backdrop-blur-md rounded-[2rem] text-sm font-bold text-indigo-100/80 leading-relaxed border border-white/10 relative z-10 italic">
                              {blueprint.redThreadAdvice}
                           </div>
                        </div>
                     </div>
                   </div>

                   {/* Sections (Stage 3) */}
                   <div className="p-12 space-y-8 bg-[#F8FAFC]/50">
                      <div className="flex items-center justify-between px-4">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Byggemoduler (Afsnitsstruktur)</h3>
                         <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Teoretisk fokus</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Juridisk fokus</span>
                            </div>
                         </div>
                      </div>
                      <div className="grid gap-6">
                        {blueprint.sections.map((section, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i} 
                            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row group hover:border-indigo-200 hover:shadow-xl transition-all duration-500 overflow-hidden"
                          >
                             <div className="w-full md:w-40 bg-slate-50 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-100 group-hover:bg-slate-900 group-hover:border-slate-900 transition-all duration-500">
                                <span className="text-4xl font-black text-slate-900 group-hover:text-amber-400 leading-none serif">{section.weight}</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 text-slate-400 group-hover:text-slate-500">Vægt</span>
                                {section.wordCountEstimate && (
                                  <div className="mt-6 px-4 py-2 bg-white rounded-xl text-[9px] font-black text-slate-900 border border-slate-200 uppercase tracking-widest shadow-sm group-hover:bg-slate-800 group-hover:text-white group-hover:border-slate-700">
                                    {section.wordCountEstimate}
                                  </div>
                                )}
                             </div>
                             <div className="flex-1 p-10">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                   <h4 className="font-black text-slate-900 text-2xl serif tracking-tight">{i+1}. {section.title}</h4>
                                   <div className="flex gap-2">
                                      {section.theoryLink && (
                                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">{section.theoryLink}</span>
                                      )}
                                      {section.legalFocus && (
                                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">⚖️ {section.legalFocus}</span>
                                      )}
                                   </div>
                                </div>
                                <p className="text-base text-slate-600 leading-relaxed font-medium">{section.focus}</p>
                             </div>
                          </motion.div>
                        ))}
                      </div>
                   </div>

                   {/* FINISHING (Stage 4) */}
                   <div className="p-12 grid lg:grid-cols-12 gap-12 bg-white">
                      <div className="lg:col-span-8 space-y-10">
                         <div className="space-y-6">
                            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">
                                <BookOpen className="w-5 h-5 text-indigo-500" /> Teoretisk Stillads
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                {blueprint.suggestedTheories.map((theory, j) => (
                                  <div key={j} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between h-full group/theory hover:bg-white hover:border-indigo-200 hover:shadow-2xl transition-all duration-500">
                                     <div>
                                        <h5 className="font-black text-slate-900 mb-4 text-lg serif tracking-tight">{theory.name}</h5>
                                        <p className="text-sm text-slate-500 leading-relaxed mb-6 italic font-medium">"{theory.why}"</p>
                                     </div>
                                     {theory.bookReference && (
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                                           <Book className="w-4 h-4" />
                                           <span className="truncate">{theory.bookReference}</span>
                                        </div>
                                     )}
                                  </div>
                                ))}
                            </div>
                         </div>
                      </div>

                      <div className="lg:col-span-4">
                         {blueprint.checklist && (
                            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-[0_40px_100px_rgba(15,23,42,0.1)] relative overflow-hidden h-full">
                               <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -mr-24 -mt-24" />
                               <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-10 relative z-10">
                                   <CheckCircle className="w-5 h-5" /> Kvalitetstjek
                               </h3>
                               <ul className="space-y-8 relative z-10">
                                 {blueprint.checklist.map((item, k) => (
                                   <li key={k} className="flex gap-5 items-start group/check">
                                     <div className="mt-1 w-7 h-7 rounded-xl border-2 border-slate-700 flex items-center justify-center shrink-0 group-hover/check:border-emerald-500 group-hover/check:bg-emerald-500 transition-all duration-500 shadow-lg">
                                        <CheckCircle className="w-4 h-4 text-slate-700 group-hover/check:text-white" />
                                     </div>
                                     <p className="text-sm font-bold text-slate-300 group-hover/check:text-white transition-colors leading-relaxed pt-0.5">{item}</p>
                                   </li>
                                 ))}
                               </ul>
                               
                               <div className="mt-16 p-8 bg-white/5 rounded-[2rem] border border-white/10 relative z-10">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2"><Trophy className="w-3 h-3" /> Arkitektens Master-Tip</p>
                                  <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
                                     At følge denne tjekliste sikrer den røde tråd og det højeste faglige niveau i din endelige besvarelse.
                                  </p>
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                 </section>

                 <div className="flex justify-center pt-8">
                    <button 
                      onClick={() => setStage(1)}
                      className="flex items-center gap-3 px-8 py-4 bg-white text-slate-400 hover:text-rose-600 rounded-2xl border border-slate-200 hover:border-rose-100 transition-all shadow-sm font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 group"
                    >
                       <RotateCcw className="w-4 h-4 group-hover:rotate-[-90deg] transition-transform duration-500" />
                       Start ny projektering
                    </button>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
       {isWorkspaceOpen && blueprint && (
        <WorkspaceModal
          isOpen={isWorkspaceOpen}
          onClose={() => setIsWorkspaceOpen(false)}
          blueprint={blueprint}
          caseDescription={topic}
          onSave={(bp) => handleSave(bp, true)}
        />
      )}
      {/* PREMIUM TEASER OVERLAY FOR FREE TIER */}
      {limitError && (
          <div className="absolute inset-0 z-[100] bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-8">
              <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-indigo-100 p-10 text-center space-y-8 relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                      <Sparkles className="w-32 h-32" />
                  </div>
                  
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-indigo-100/50 relative z-10">
                      <DraftingCompass className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                      <h2 className="text-3xl font-black text-slate-900 serif tracking-tight">Kollega+ Eksklusivt</h2>
                      <p className="text-slate-500 leading-relaxed italic text-sm">
                          Få AI-arkitekten til at tegne din akademiske struktur og sikre den røde tråd i dine opgaver.
                      </p>
                  </div>

                  <div className="space-y-4 text-left relative z-10 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                      {[
                          "Ubegrænsede byggeplaner",
                          "Akademisk problemformulering",
                          "Teoretisk stillads & tjekliste",
                          "Inkludering af egne seminarer"
                      ].map((feat, i) => (
                          <div key={i} className="flex items-center gap-3 text-[12px] font-bold text-slate-700">
                              <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</div>
                              {feat}
                          </div>
                      ))}
                  </div>

                  <div className="space-y-4 relative z-10">
                      <Button onClick={() => router.push('/upgrade')} className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl active:scale-95 text-[12px]">
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
    </TooltipProvider>
  );
};

export default function ExamArchitectPage() {
    return (
        <Suspense fallback={<AuthLoadingScreen />}>
            <ExamArchitectPageContent />
        </Suspense>
    );
}
