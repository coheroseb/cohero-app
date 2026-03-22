'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, writeBatch, increment, query, where, DocumentData } from 'firebase/firestore';
import { generateExamBlueprintAction } from '@/app/actions';
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
  Presentation
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Stat Card Component
// ---------------------------------------------------------------------------
const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
  <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm flex items-center gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
      <p className="text-sm font-black text-slate-900 leading-none">{value}</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const ExamArchitectPageContent: React.FC = () => {
  const { user, userProfile, refetchUserProfile, isUserLoading } = useApp();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [topic, setTopic] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [semester, setSemester] = useState('');
  const [type, setType] = useState('Semesteropgave');
  const [institution, setInstitution] = useState('');
  const [includeSeminars, setIncludeSeminars] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blueprint, setBlueprint] = useState<ExamBlueprint | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  
  const isPremiumUser = useMemo(() => userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership), [userProfile]);

  const seminarsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !semester) return null;
    return query(
      collection(firestore, 'users', user.uid, 'seminars'),
      where('semester', '==', semester)
    );
  }, [user, firestore, semester]);
  const { data: seminars } = useCollection<DocumentData>(seminarsQuery);
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
    if (!isUserLoading && !user) router.replace('/');
  }, [user, isUserLoading, router]);

  const handleGenerate = async () => {
    if (!isFormValid || !user || !userProfile || !firestore) return;
    setIsGenerating(true);
    setBlueprint(null);
    setLimitError(null);

    // Limit check
    if (userProfile.membership === 'Kollega') {
      const lastUsage = userProfile.lastExamArchitectUsage?.toDate();
      const now = new Date();
      const isNewMonth = !lastUsage || lastUsage.getMonth() !== now.getMonth() || lastUsage.getFullYear() !== now.getFullYear();
      const count = isNewMonth ? 0 : (userProfile.monthlyExamArchitectCount || 0);
      if (count >= 2) {
        setLimitError('Du har brugt dine 2 månedlige forsøg. Opgrader til Kollega+ for ubegrænset adgang.');
        setIsGenerating(false);
        return;
      }
    }
    
    let seminarContext = '';
    if (isPremiumUser && includeSeminars && hasSeminars && seminars) {
        seminarContext = seminars.map(seminar => `Seminar: ${seminar.overallTitle}\n${seminar.slides?.map((s: any) => `Slide ${s.slideNumber}: ${s.summary}`).join('\n')}`).join('\n\n---\n\n');
    }

    try {
      const input: Omit<ExamArchitectInput, 'lawContext'> = { topic, problemStatement, semester, assignmentType: type, seminarContext: seminarContext || undefined };
      const response = await generateExamBlueprintAction(input);
      setBlueprint(response.data);
      
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', user.uid);
      const userUpdates: {[key: string]: any} = { lastExamArchitectUsage: serverTimestamp() };
      if (userProfile.membership === 'Kollega') {
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

  if (isUserLoading || !user) return <AuthLoadingScreen />;

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-indigo-100 px-6 py-4 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/portal" className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                 <PencilRuler className="w-3.5 h-3.5 text-indigo-500" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Akademisk Byggearkitekt</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900">Eksamens-Arkitekten</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/mine-byggeplaner" className="p-2 text-slate-400 hover:text-slate-900 transition-colors hidden sm:block">
                <History className="w-5 h-5" />
             </Link>
             <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">AI Struktur-Generator</span>
             </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-5 py-8 grid lg:grid-cols-12 gap-8">
        
        {/* LEFT: THE DRAWING BOARD (Input) */}
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 -z-10"></div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <DraftingCompass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-none">Projektets Fundament</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Rammer & Emne</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Emne / Arbejdstitel *</label>
                <Input 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="F.eks: Barnets Lov og inddragelse..."
                  className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Problemformulering (Udkast)</label>
                <Textarea 
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Hvad er det centrale spørgsmål?..."
                  className="w-full h-32 bg-slate-50 border-slate-100 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Semester</label>
                  <select 
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full h-12 bg-slate-50 border-slate-100 rounded-xl text-sm font-bold focus:ring-indigo-500"
                  >
                    {[1,2,3,4,5,6,7].map(s => <option key={s} value={`${s}. semester`}>{s}. semester</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Opgavetype</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-12 bg-slate-50 border-slate-100 rounded-xl text-sm font-bold focus:ring-indigo-500"
                  >
                    <option>Semesteropgave</option>
                    <option>Bachelorprojekt</option>
                    <option>Case-besvarelse</option>
                    <option>Andet</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${includeSeminars ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                    <Presentation className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="incl-sem" className={`text-xs font-bold block cursor-pointer ${(!isPremiumUser || !hasSeminars) ? 'text-slate-300' : 'text-slate-700'}`}>Hent mine seminarer</label>
                    <p className="text-[9px] text-slate-400 font-medium">Brug dine egne analyser som kontekst</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="incl-sem"
                  checked={includeSeminars}
                  onChange={(e) => setIncludeSeminars(e.target.checked)}
                  disabled={!isPremiumUser || !hasSeminars}
                  className="w-5 h-5 rounded-md border-indigo-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>

              {limitError ? (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                  <div className="flex gap-3 mb-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-xs font-bold text-rose-900">{limitError}</p>
                  </div>
                  <Link href="/upgrade" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1 hover:underline">Opgrader nu <ChevronRight className="w-3 h-3"/></Link>
                </div>
              ) : (
                <Button 
                  onClick={handleGenerate}
                  disabled={!isFormValid || isGenerating}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <DraftingCompass className="w-5 h-5" />}
                  Tegn Byggeplan
                </Button>
              )}
            </div>
          </section>

          <div className="bg-indigo-900 rounded-[2rem] p-6 text-white relative overflow-hidden group shadow-xl">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-white/20 transition-all duration-700"></div>
             <div className="flex items-start gap-4 relative z-10">
               <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                 <Lightbulb className="w-5 h-5 text-indigo-200" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Arkitektens Råd</p>
                 <p className="text-xs leading-relaxed italic text-indigo-50 font-medium">"En god arkitekt tegner altid fundamentsplanen før facaden. Strukturér din jura før dine overvejelser."</p>
               </div>
             </div>
          </div>
        </aside>

        {/* RIGHT: THE BLUEPRINT DESK (Visualisation) */}
        <main className="lg:col-span-8">
           {!blueprint && !isGenerating && (
             <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 bg-white/50">
                <div className="w-20 h-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center text-slate-200 mb-6">
                   <Layout className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">Tegnebordet er tomt</h3>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">Udfyld projektets Fundament til venstre for at lade AI-arkitekten tegne din akademiske struktur.</p>
             </div>
           )}

           {isGenerating && (
             <div className="h-full min-h-[500px] bg-white rounded-[3rem] border border-indigo-100 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                <div className="w-24 h-24 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Arkitekten arbejder...</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Beregner afsnitsvægtning og teorikobling</p>
             </div>
           )}

           <AnimatePresence mode="wait">
            {blueprint && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* ID Card */}
                <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 md:p-10 relative">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
                     <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">{type}</span>
                          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{semester}</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{blueprint.title}</h2>
                     </div>
                     <div className="flex gap-3">
                        <Button onClick={() => handleSave(blueprint)} disabled={isSaving} className="h-11 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/10">
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                          Gem
                        </Button>
                        <Button onClick={() => setIsWorkspaceOpen(true)} variant="outline" className="h-11 px-5 rounded-2xl font-bold border-slate-200">
                           <Maximize className="w-4 h-4 mr-2" /> Fokus
                        </Button>
                     </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3">
                           <Target className="w-3.5 h-3.5" /> Problemformulering
                        </h4>
                        <p className="text-sm font-bold text-slate-900 leading-relaxed mb-4">{blueprint.draftProblemStatement}</p>
                        <p className="text-xs italic text-slate-500 border-l-2 border-indigo-200 pl-4">"{blueprint.problemStatementTip}"</p>
                     </div>
                     <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/20">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-3">
                           <Layers className="w-3.5 h-3.5" /> Strategi & Rød Tråd
                        </h4>
                        <p className="text-sm font-medium leading-relaxed mb-4">{blueprint.researchStrategy}</p>
                        <div className="p-3 bg-white/10 rounded-xl text-xs text-indigo-50 font-medium">
                          <span className="text-white font-black">Arkitekt-tip: </span>{blueprint.redThreadAdvice}
                        </div>
                     </div>
                  </div>
                </section>

                {/* Construction Sections */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2">Byggemoduler (Afsnit)</p>
                  <div className="grid md:grid-cols-1 gap-4">
                    {blueprint.sections.map((section, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row group hover:border-indigo-200 transition-all overflow-hidden"
                      >
                         <div className="w-full md:w-24 bg-slate-50 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300">
                            <span className="text-2xl font-black text-slate-900 group-hover:text-white leading-none">{section.weight}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest mt-1.5 text-slate-400 group-hover:text-indigo-200">Vægt</span>
                         </div>
                         <div className="flex-1 p-6 sm:p-8">
                            <div className="flex justify-between items-start mb-3">
                               <h4 className="font-black text-slate-900 text-lg">{i+1}. {section.title}</h4>
                               {section.theoryLink && (
                                 <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-wider">{section.theoryLink}</span>
                               )}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-0">{section.focus}</p>
                         </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Theoretical Scaffolding */}
                <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10">
                   <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">
                      <BookOpen className="w-4 h-4" /> Teoretisk Stillads
                   </h3>
                   <div className="grid md:grid-cols-3 gap-5">
                      {blueprint.suggestedTheories.map((theory, j) => (
                        <div key={j} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between h-full group/theory hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all">
                           <div>
                              <h5 className="font-black text-slate-900 mb-3 text-sm">{theory.name}</h5>
                              <p className="text-xs text-slate-500 leading-relaxed mb-4">{theory.why}</p>
                           </div>
                           {theory.bookReference && (
                              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50/50 p-2 rounded-lg">
                                 <Book className="w-3 h-3" />
                                 <span className="truncate">{theory.bookReference}</span>
                              </div>
                           )}
                        </div>
                      ))}
                   </div>
                </section>
              </motion.div>
            )}
           </AnimatePresence>
        </main>
      </div>

       {isWorkspaceOpen && blueprint && (
        <WorkspaceModal
          isOpen={isWorkspaceOpen}
          onClose={() => setIsWorkspaceOpen(false)}
          blueprint={blueprint}
          caseDescription={topic}
          onSave={(bp) => handleSave(bp, true)}
        />
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
