'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, writeBatch, increment, query, where, DocumentData } from 'firebase/firestore';
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [semester, setSemester] = useState('');
  const [type, setType] = useState('Semesteropgave');
  const [institution, setInstitution] = useState('');
  const [includeSeminars, setIncludeSeminars] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blueprint, setBlueprint] = useState<ExamBlueprint | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  
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
    if (!isUserLoading && !user) router.replace('/');
  }, [user, isUserLoading, router]);

  const handleGenerate = async () => {
    if (!isFormValid || !user || !userProfile || !firestore) return;
    setIsGenerating(true);
    setBlueprint(null);
    setLimitError(null);

    // Limit check
    if (userProfile.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership)) {
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
      const input: Omit<ExamArchitectInput, 'lawContext'> = { 
        topic, 
        problemStatement, 
        semester, 
        assignmentType: type, 
        seminarContext: seminarContext || undefined,
        profession: userProfile?.profession
      };
      const response = await generateExamBlueprintAction(input);
      setBlueprint(response.data);
      
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', user.uid);
      const userUpdates: {[key: string]: any} = { lastExamArchitectUsage: serverTimestamp() };
      if (userProfile.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership)) {
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col selection:bg-indigo-100 relative overflow-hidden">
      {/* Structural Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
      
      {/* HEADER */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-indigo-50 px-6 py-4 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="p-2.5 bg-slate-50 text-slate-500 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Architectural Studio v2.0</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Eksamens-Arkitekten</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Link href="/mine-byggeplaner" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all hidden sm:flex items-center gap-2">
                <History className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Arkiv</span>
             </Link>
             <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
             <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 group cursor-default">
                <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Structural Intelligence</span>
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
            
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between ml-1">
                    <label htmlFor="topic" className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Emne / Arbejdstitel</label>
                    {isPremiumUser && categories.length > 0 && !selectedCategory && (
                       <span className="text-[8px] font-bold text-indigo-400 uppercase animate-pulse">Brug magi fra Arkivet →</span>
                    )}
                  </div>
                  
                  {isPremiumUser && (
                    <div className="flex flex-col gap-2 animate-in slide-in-from-top-1 duration-500">
                      {categories.length > 0 ? (
                        <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter flex items-center gap-1">
                              <Presentation className="w-3 h-3" /> Genvej fra seminarer
                            </span>
                            {selectedCategory && (
                              <button onClick={() => setSelectedCategory(null)} className="text-[8px] font-black text-slate-400 hover:text-rose-500 uppercase">Nulstil</button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <select 
                              value={selectedCategory || ''}
                              onChange={e => setSelectedCategory(e.target.value || null)}
                              className="flex-1 h-9 px-3 bg-white border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer shadow-sm"
                            >
                              <option value="">Vælg Kategori...</option>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {selectedCategory && (
                              <Button 
                                size="sm" 
                                onClick={handleSuggest} 
                                disabled={isSuggesting}
                                className="h-9 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shrink-0"
                              >
                                {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Zap className="w-3 h-3" />}
                                Udfyld automatisk
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[9px] font-medium text-slate-400 bg-slate-50/50 px-4 py-3 rounded-2xl border border-slate-100 italic flex items-start gap-3">
                           <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                           <span>Giv dine seminarer en kategori for at få AI-arkitekten til selv at foreslå emne og problemformulering her.</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Input 
                    id="topic"
                    placeholder="F.eks. Kommunalbestyrelsens ansvar ift. anbragte børn..." 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                  />
                </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Problemformulering (Udkast)</label>
                <Textarea 
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Hvad er det centrale spørgsmål du gerne vil undersøge?..."
                  className="w-full h-36 bg-slate-50 border-slate-100 rounded-2xl focus:ring-indigo-500/5 focus:border-indigo-200 focus:bg-white transition-all text-sm font-medium resize-none shadow-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Semester</label>
                  <select 
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full h-12 bg-slate-50 border-slate-100 rounded-xl text-xs font-black uppercase tracking-wider focus:ring-indigo-500/10 focus:border-indigo-200 transition-all appearance-none cursor-pointer px-4"
                  >
                    {[1,2,3,4,5,6,7].map(s => <option key={s} value={`${s}. semester`}>{s}. semester</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Opgavetype</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-12 bg-slate-50 border-slate-100 rounded-xl text-xs font-black uppercase tracking-wider focus:ring-indigo-500/10 focus:border-indigo-200 transition-all appearance-none cursor-pointer px-4"
                  >
                    <option>Semesteropgave</option>
                    <option>Bachelorprojekt</option>
                    <option>Case-besvarelse</option>
                    <option>Andet</option>
                  </select>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100/50 flex items-center justify-between group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all duration-500 ${includeSeminars ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 rotate-6' : 'bg-white text-slate-400 active:scale-95 shadow-sm'}`}>
                    <Presentation className="w-5 h-5" />
                  </div>
                  <div>
                    <label htmlFor="incl-sem" className={`text-xs font-black uppercase tracking-wider block cursor-pointer transition-colors ${(!isPremiumUser || !hasSeminars) ? 'text-slate-300' : 'text-slate-700'}`}>Inkludér Arkiv</label>
                    <p className="text-[9px] text-indigo-400/70 font-bold uppercase tracking-tighter">Brug egne analyser som kontekst</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="incl-sem"
                  checked={includeSeminars}
                  onChange={(e) => setIncludeSeminars(e.target.checked)}
                  disabled={!isPremiumUser || !hasSeminars}
                  className="w-6 h-6 rounded-lg border-indigo-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
                />
              </div>


                <Button 
                  onClick={handleGenerate}
                  disabled={!isFormValid || isGenerating}
                  className="w-full h-16 bg-slate-900 border-b-4 border-slate-700 hover:bg-slate-800 text-white rounded-[2rem] font-black group shadow-xl shadow-slate-900/10 transition-all active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4 flex items-center justify-center gap-4 text-sm"
                >
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin text-indigo-400" /> : <DraftingCompass className="w-6 h-6 text-indigo-400 group-hover:rotate-12 transition-transform duration-500" />}
                  TEGN BYGGEPLAN
                </Button>
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
              <div className="h-full min-h-[600px] bg-white rounded-[3rem] border border-indigo-50 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] opacity-[0.02] [background-size:24px_24px]"></div>
                <div className="relative">
                  <div className="w-32 h-32 border-[6px] border-indigo-50/50 border-t-indigo-600 rounded-full animate-spin mb-10 shadow-inner"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <DraftingCompass className="w-10 h-10 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Arkitekten tegner...</h3>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] animate-pulse">Analyserer juridisk tyngde</p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Beregner afsnitsvægtning</p>
                </div>
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
                <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none">
                     <DraftingCompass className="w-48 h-48 rotate-12" />
                  </div>
                  
                  <div className="p-8 md:p-12 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">{type}</span>
                            <span className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 font-mono tracking-tighter">{semester}</span>
                          </div>
                          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-2xl">{blueprint.title}</h2>
                       </div>
                       <div className="flex gap-3 shrink-0">
                          <Button onClick={() => handleSave(blueprint)} disabled={isSaving} className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 transition-all active:scale-95 group">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Save className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />}
                            Gem Tegning
                          </Button>
                          <Button onClick={() => setIsWorkspaceOpen(true)} className="h-14 px-8 rounded-2xl border-2 border-indigo-100 bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest transition-all">
                             <Maximize className="w-4 h-4 mr-3" /> Fuldt Overblik
                          </Button>
                       </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-200/50 transition-all duration-700"></div>
                          <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 relative z-10">
                             <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center"><Target className="w-3.5 h-3.5" /></div>
                             Den Akademiske Problemformulering
                          </h4>
                          <p className="text-lg font-black text-slate-800 leading-snug mb-6 relative z-10">{blueprint.draftProblemStatement}</p>
                          <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-indigo-100/50 relative z-10">
                             <div className="w-5 h-5 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0 mt-0.5"><Sparkles className="w-2.5 h-2.5" /></div>
                             <p className="text-[11px] font-bold text-slate-500 italic leading-relaxed">"{blueprint.problemStatementTip}"</p>
                          </div>
                       </div>
                       <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/30 relative group overflow-hidden">
                          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24 group-hover:bg-white/20 transition-all duration-700"></div>
                          <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-6 relative z-10">
                             <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center"><Layers className="w-3.5 h-3.5 text-white" /></div>
                             Analyse-arkitektur & Fremgangsmåde
                          </h4>
                          <p className="text-lg font-bold leading-snug mb-8 relative z-10">{blueprint.researchStrategy}</p>
                          <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl text-[11px] font-bold text-indigo-50 leading-relaxed border border-white/10 relative z-10">
                             <span className="text-white font-black uppercase tracking-widest block mb-2 opacity-50 text-[9px]">Arkitektens Master-Tip</span>
                             {blueprint.redThreadAdvice}
                          </div>
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
                         <div className="w-full md:w-32 bg-slate-50 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300">
                            <span className="text-2xl font-black text-slate-900 group-hover:text-white leading-none">{section.weight}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest mt-1.5 text-slate-400 group-hover:text-indigo-200">Vægt</span>
                            {section.wordCountEstimate && (
                              <span className="mt-4 px-2 py-1 bg-white/10 rounded-lg text-[8px] font-black text-slate-400 group-hover:text-white border border-slate-200 group-hover:border-white/20 uppercase tracking-tighter">
                                {section.wordCountEstimate}
                              </span>
                            )}
                         </div>
                         <div className="flex-1 p-6 sm:p-8">
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                               <h4 className="font-black text-slate-900 text-lg">{i+1}. {section.title}</h4>
                               <div className="flex gap-2">
                                  {section.theoryLink && (
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-indigo-100">{section.theoryLink}</span>
                                  )}
                                  {section.legalFocus && (
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-emerald-100">⚖️ {section.legalFocus}</span>
                                  )}
                               </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-0">{section.focus}</p>
                         </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Theoretical Scaffolding */}
                <div className="grid md:grid-cols-12 gap-8">
                  <section className="md:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10">
                    <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">
                        <BookOpen className="w-4 h-4" /> Teoretisk Stillads
                    </h3>
                    <div className="grid md:grid-cols-2 gap-5">
                        {blueprint.suggestedTheories.map((theory, j) => (
                          <div key={j} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between h-full group/theory hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all">
                             <div>
                                <h5 className="font-black text-slate-900 mb-3 text-sm">{theory.name}</h5>
                                <p className="text-xs text-slate-500 leading-relaxed mb-4 italic">"{theory.why}"</p>
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

                  {/* Checklist */}
                  {blueprint.checklist && (
                    <section className="md:col-span-4 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group/checklist">
                      <div className="absolute inset-0 bg-[#4f46e5] opacity-5 [mask-image:radial-gradient(circle_at_center,white,transparent)]"></div>
                      <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl -mb-24 -mr-24 group-hover/checklist:bg-indigo-600/30 transition-all duration-700"></div>
                      
                      <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-10 relative z-10 ml-1">
                          <CheckCircle className="w-4 h-4" /> Kvalitetstjek
                      </h3>
                      <ul className="space-y-6 relative z-10">
                        {blueprint.checklist.map((item, k) => (
                          <li key={k} className="flex gap-5 items-start group/check">
                            <div className="mt-1 w-6 h-6 rounded-xl border-2 border-slate-700 flex items-center justify-center shrink-0 group-hover/check:border-indigo-500 group-hover/check:bg-indigo-500 transition-all duration-300 shadow-sm">
                               <CheckCircle className="w-3.5 h-3.5 text-slate-700 group-hover/check:text-white" />
                            </div>
                            <p className="text-xs font-bold text-slate-300 group-hover/check:text-white transition-colors leading-relaxed pt-0.5">{item}</p>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-12 p-5 bg-white/5 rounded-2xl border border-white/10 relative z-10">
                         <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Pro-Tip</p>
                         <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">At følge arkitektens tjekliste sikrer at din opgave lever op til de højeste akademiske krav på tværs af semestre.</p>
                      </div>
                    </section>
                  )}
                </div>
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
