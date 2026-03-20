

'use client';
import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
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
  Info
} from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
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
  
  const isFormValid = useMemo(() => {
    return topic.trim() !== '';
  }, [topic]);

  useEffect(() => {
    const topicFromUrl = searchParams.get('topic');
    const summaryFromUrl = searchParams.get('summary');

    if (topicFromUrl) {
      setTopic(decodeURIComponent(topicFromUrl));
    }
    if (summaryFromUrl) {
      setProblemStatement(`Med udgangspunkt i sagen "${decodeURIComponent(topicFromUrl || '')}", vil jeg undersøge: ${decodeURIComponent(summaryFromUrl)}`);
    }

    if (topicFromUrl || summaryFromUrl) {
      router.replace('/exam-architect', { scroll: false });
    }
  }, [searchParams, router]);


  useEffect(() => {
    if (userProfile) {
      setSemester(userProfile.semester || '1. semester');
      setInstitution(userProfile.institution || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const handleGenerate = async () => {
    if (!isFormValid || !user || !userProfile || !firestore) return;
    setIsGenerating(true);
    setBlueprint(null);
    setError(null);
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
        seminarContext = seminars.map(seminar => {
            const title = seminar.overallTitle || seminar.title || 'Ukendt Seminar';
            const slidesSummary = seminar.slides?.map((slide: any) => 
                `Slide ${slide.slideNumber} (${slide.slideTitle || 'Uden titel'}): ${slide.summary || ''}`
            ).join('\n');
            return `Seminar: ${title}\n${slidesSummary || 'Intet indhold.'}`;
        }).join('\n\n---\n\n');
    }

    try {
      const input: Omit<ExamArchitectInput, 'lawContext'> = {
        topic,
        problemStatement,
        semester,
        assignmentType: type,
        institution,
        seminarContext: seminarContext || undefined,
      };
      
      const response = await generateExamBlueprintAction(input);
      setBlueprint(response.data);
      
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', user.uid);
      
      // Update usage count
      const userUpdates: {[key: string]: any} = { lastExamArchitectUsage: serverTimestamp() };
      if (userProfile.membership === 'Kollega') {
        const lastUsage = userProfile.lastExamArchitectUsage?.toDate();
        if (!lastUsage || lastUsage.getMonth() !== new Date().getMonth() || lastUsage.getFullYear() !== new Date().getFullYear()) {
          userUpdates.monthlyExamArchitectCount = 1;
        } else {
          userUpdates.monthlyExamArchitectCount = increment(1);
        }
      }
      
      // Update token/point count
      if (response.usage) {
        const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
        const pointsToAdd = Math.round(totalTokens * 0.05);
        if (pointsToAdd > 0) {
            userUpdates.cohéroPoints = increment(pointsToAdd);
        }
        const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
        batch.set(tokenUsageRef, { flowName: 'examArchitectFlow', ...response.usage, totalTokens, createdAt: serverTimestamp() });
      }

      if (Object.keys(userUpdates).length > 0) {
        batch.update(userRef, userUpdates);
      }
      await batch.commit();
      await refetchUserProfile();

    } catch (err: any) {
      console.error("Architect Error:", err);
      setError("Der opstod en fejl under generering. Prøv igen.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (blueprintToSave: ExamBlueprint | null, closeModal: boolean = false) => {
    if (!blueprintToSave || !user || !firestore) return;
    setIsSaving(true);
    try {
        const blueprintsColRef = collection(firestore, 'users', user.uid, 'blueprints');
        
        const dataToSave = {
          ...blueprintToSave,
          topic: topic, // User input topic
          problemStatement: problemStatement, // User input problem statement
          createdAt: serverTimestamp(),
        };

        await addDoc(blueprintsColRef, dataToSave);

        toast({
            title: "Byggeplan gemt!",
            description: "Du kan finde den igen under 'Mine Byggeplaner'.",
        });
        if (closeModal) {
            setIsWorkspaceOpen(false);
        }
    } catch (error) {
        console.error("Error saving blueprint:", error);
        toast({
            variant: "destructive",
            title: "Fejl",
            description: "Kunne ikke gemme din byggeplan. Prøv igen.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  if (isUserLoading || !user) {
    return <AuthLoadingScreen />;
  }

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col selection:bg-amber-100">
      
      {/* HEADER: THE DRAFTING BAR */}
      <header className="bg-white border-b border-amber-100 px-6 py-6 sticky top-24 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <PencilRuler className="w-4 h-4 text-amber-700" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/50">Akademisk Konstruktion</span>
              </div>
              <h1 className="text-2xl font-bold text-amber-950 serif">Eksamens-Arkitekten</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Link href="/mine-byggeplaner" className="hidden md:flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-amber-950 transition-colors">
                <Layers className="w-4 h-4" />
                Mine byggeplaner
             </Link>
             <div className="h-8 w-[1px] bg-amber-100 hidden md:block"></div>
             <div className="flex items-center gap-2 px-4 py-2 bg-amber-900 text-white rounded-xl shadow-lg">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Struktur-AI Aktiv</span>
             </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-6 py-12 grid lg:grid-cols-12 gap-12">
        
        {/* LEFT: THE INPUT DESK */}
        <aside className="lg:col-span-5 space-y-8">
          <section className="bg-white p-8 md:p-10 rounded-[3rem] border border-amber-100 shadow-sm relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 -z-10"></div>
            <h3 className="text-lg font-bold text-amber-950 serif mb-8 flex items-center gap-2">
              <Book className="w-5 h-5 text-amber-700" />
              Projektets Rammer
            </h3>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="topic" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Opgavens Emne / Arbejdstitel *</label>
                <Input 
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="F.eks: Barnets Lov og inddragelse..."
                  className="w-full p-5 bg-[#FDFCF8] border border-amber-100 rounded-2xl focus:ring-2 focus:ring-amber-950 focus:outline-none transition-all text-sm font-medium shadow-inner"
                  required
                />
              </div>

              <div>
                <label htmlFor="problemStatement" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Problemformulering (Udkast)</label>
                <Textarea 
                  id="problemStatement"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Hvad er det centrale spørgsmål du vil besvare?..."
                  className="w-full h-32 p-5 bg-[#FDFCF8] border border-amber-100 rounded-2xl focus:ring-2 focus:ring-amber-950 focus:outline-none transition-all text-sm leading-relaxed shadow-inner resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="semester" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Semester</label>
                  <select 
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-4 bg-[#FDFCF8] border border-amber-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-950 h-14"
                  >
                    {[1,2,3,4,5,6,7].map(s => <option key={s} value={`${s}. semester`}>{s}. semester</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Opgavetype</label>
                  <select 
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-4 bg-[#FDFCF8] border border-amber-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-950 h-14"
                  >
                    <option>Semesteropgave</option>
                    <option>Bachelorprojekt</option>
                    <option>Case-besvarelse</option>
                    <option>Andet</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="includeSeminars"
                        checked={includeSeminars}
                        onChange={(e) => setIncludeSeminars(e.target.checked)}
                        disabled={!isPremiumUser || !hasSeminars}
                        className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <label 
                        htmlFor="includeSeminars" 
                        className={`text-sm font-bold ${(!isPremiumUser || !hasSeminars) ? 'text-slate-400 cursor-not-allowed' : 'text-amber-950'}`}
                      >
                        Inddrag mine gemte seminarer
                      </label>
                    </div>
                  </TooltipTrigger>
                  {!isPremiumUser ? (
                    <TooltipContent>
                      <p>Dette er en Kollega+ funktion.</p>
                      <Link href="/upgrade" className='font-bold text-amber-600 hover:underline'>Opgrader for at bruge den.</Link>
                    </TooltipContent>
                  ) : !hasSeminars ? (
                    <TooltipContent>
                      <p>Du har ingen gemte seminar-analyser endnu for dette semester.</p>
                    </TooltipContent>
                  ) : null}
                </Tooltip>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={!isFormValid || isGenerating || !!limitError}
                className="w-full py-5 bg-amber-950 text-white rounded-3xl font-bold shadow-xl shadow-amber-950/20 hover:bg-amber-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Tegn Byggeplan
              </Button>
               {limitError && (
                    <div className="bg-amber-50 border-2 border-dashed border-amber-200 text-amber-950 p-4 rounded-xl text-center">
                        <h3 className="font-bold text-sm mb-1">Grænse nået</h3>
                        <p className="text-xs">{limitError}</p>
                        <Link href="/upgrade" className="font-bold underline text-xs mt-2 inline-block">Opgrader for ubegrænset adgang</Link>
                    </div>
                )}
            </div>
          </section>

          <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-start gap-4 shadow-inner">
            <Lightbulb className="w-8 h-8 text-amber-700 flex-shrink-0" />
            <div>
              <h4 className="text-[10px] font-black uppercase text-amber-900 mb-2 tracking-widest">Arkitektens Råd</h4>
              <p className="text-xs text-amber-800 leading-relaxed italic">
                "En god byggeplan starter med en solid problemformulering. Hvis dine afsnit ikke støtter dit hovedspørgsmål, vælter huset til eksamen."
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT: THE BLUEPRINT AREA */}
        <main className="lg:col-span-7">
           {!blueprint && !isGenerating && (
             <div className="h-full min-h-[600px] border-2 border-dashed border-amber-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-opacity-5">
                <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-200">
                   <Layout className="w-12 h-12" />
                </div>
                <div>
                   <h3 className="text-2xl font-bold text-amber-900/40 serif">Blueprint-område</h3>
                   <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">Udfyld projektrammerne til venstre for at se din akademiske byggeplan tage form.</p>
                </div>
                <div className="flex gap-2">
                   {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-amber-100 rounded-full"></div>)}
                </div>
             </div>
           )}

           {isGenerating && (
             <div className="h-full min-h-[600px] bg-white rounded-[3rem] border border-amber-100 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10 pointer-events-none"></div>
                <div className="relative mb-10">
                   <div className="w-32 h-32 border-4 border-amber-50 border-t-amber-950 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Compass className="w-10 h-10 text-amber-950 animate-pulse" />
                   </div>
                </div>
                <h3 className="text-2xl font-bold text-amber-950 serif">Arkitekten tegner...</h3>
                <p className="text-xs text-slate-400 mt-4 uppercase tracking-[0.2em] animate-pulse">Beregner afsnitsvægtning og rød tråd</p>
             </div>
           )}

           {blueprint && (
             <div className="space-y-10 animate-fade-in-up">
                
                {/* Header Card: Project Identity */}
                <section className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <FileText className="w-32 h-32" />
                   </div>
                   <div className="flex justify-between items-start mb-10">
                      <div>
                         <h2 className="text-3xl font-bold text-amber-950 serif mb-2">{blueprint.title}</h2>
                         <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">{type} • {semester}</p>
                      </div>
                      <div className="flex gap-2">
                         <Button onClick={() => handleSave(blueprint)} variant="default" size="sm" className="group" disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2"/>}
                            {isSaving ? 'Gemmer...' : 'Gem Byggeplan'}
                         </Button>
                         <Button onClick={() => setIsWorkspaceOpen(true)} variant="outline" size="sm" className="group">
                          <Maximize className="w-4 h-4 mr-2"/> Åbn i arbejdsrum
                         </Button>
                      </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                         <h4 className="text-[10px] font-black uppercase text-amber-900 mb-3 tracking-widest flex items-center gap-2">
                            <Target className="w-4 h-4" /> PF-Optimering
                         </h4>
                         <p className="text-sm text-amber-800 leading-relaxed italic">"{blueprint.problemStatementTip}"</p>
                      </div>
                      <div className="p-6 bg-indigo-950 text-white rounded-2xl shadow-xl relative overflow-hidden group">
                         <h4 className="text-[10px] font-black uppercase text-amber-400 mb-3 tracking-widest flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" /> Den Røde Tråd
                         </h4>
                         <p className="text-sm text-amber-50 leading-relaxed font-medium">
                            {blueprint.redThreadAdvice}
                         </p>
                         <div className="absolute bottom-0 right-0 w-12 h-12 bg-white/5 rounded-full blur-xl -mr-6 -mb-6"></div>
                      </div>
                   </div>
                </section>

                {/* The Construction List (Blueprint Sections) */}
                <section className="space-y-6 relative">
                   {/* Vertical Red Thread Visualization */}
                   <div className="absolute left-10 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-950 via-amber-700 to-transparent -z-10 shadow-[0_0_15px_rgba(69,26,3,0.1)]"></div>
                   
                   {blueprint.sections.map((section, i) => (
                     <div key={i} className="bg-white rounded-[2.5rem] border border-amber-100 shadow-sm overflow-hidden flex flex-col md:flex-row h-full group hover:shadow-xl transition-all">
                        <div className="w-full md:w-32 flex flex-col items-center justify-center p-8 text-center border-b md:border-b-0 md:border-r border-amber-50 bg-amber-50/30 group-hover:bg-amber-950 group-hover:text-white transition-colors">
                           <span className="text-2xl font-black serif leading-none">{section.weight}</span>
                           <span className="text-[9px] font-black uppercase tracking-widest mt-2 opacity-50">Vægt</span>
                        </div>
                        <div className="flex-1 p-8">
                           <div className="flex justify-between items-start mb-4">
                              <h4 className="text-xl font-bold text-amber-950 serif">{i+1}. {section.title}</h4>
                              <span className="text-[10px] font-black uppercase text-amber-400 px-3 py-1 bg-amber-50 rounded-lg group-hover:bg-amber-900 transition-colors">Byggemodul {i+1}</span>
                           </div>
                           <p className="text-sm text-slate-600 leading-relaxed mb-6">
                              {section.focus}
                           </p>
                           {section.theoryLink && (
                             <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                                <span className="text-[11px] font-bold text-slate-500 italic">Kobling: {section.theoryLink}</span>
                             </div>
                           )}
                        </div>
                     </div>
                   ))}
                </section>

                {/* Theoretical Scaffolding */}
                <section className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm relative group overflow-hidden">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-5"></div>
                   <h3 className="text-xs font-black uppercase text-amber-900 mb-8 tracking-widest flex items-center gap-2 relative z-10">
                      <Layers className="w-4 h-4" /> Teoretisk Stillads
                   </h3>
                   <div className="grid md:grid-cols-2 gap-6 relative z-10">
                      {blueprint.suggestedTheories.map((theory, j) => (
                        <div key={j} className="p-6 bg-[#FDFCF8] border border-amber-100 rounded-3xl hover:border-amber-950 transition-all flex flex-col justify-between group/theory shadow-sm">
                           <div>
                              <h5 className="font-bold text-amber-950 mb-3 group-hover/theory:text-amber-700 transition-colors">{theory.name}</h5>
                              <p className="text-xs text-slate-500 leading-relaxed">{theory.why}</p>
                           </div>
                            {theory.bookReference && (
                                <Link href="/pensum" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-amber-900 group-hover/theory:translate-x-1 transition-transform">
                                   Se i pensum <ChevronRight className="w-3 h-3" />
                                </Link>
                           )}
                        </div>
                      ))}
                   </div>
                </section>
             </div>
           )}
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
