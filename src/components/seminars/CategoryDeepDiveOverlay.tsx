'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  X, 
  BrainCircuit, 
  BookOpen, 
  Trophy, 
  Calendar, 
  Target, 
  Zap, 
  ChevronRight,
  TrendingUp,
  Scale,
  Wrench,
  Tags,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  ListChecks,
  FileSearch,
  Globe,
  Search,
  Sparkles,
  Link as LinkIcon,
  FileText,
  FileCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import type { SavedSeminar } from '@/app/mine-seminarer/page'; 
import type { UserProfile, CategoryStudyPlan } from '@/ai/flows/types';
import { researchDiscoveryAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface CategoryDeepDiveProps {
  category: string;
  seminars: any[];
  onClose: () => void;
  onStartMasterQuiz: () => void;
  onOpenSeminar: (seminar: any) => void;
  userProfile?: UserProfile | null;
  onGenerateStudyPlan: () => void;
  onTogglePlanStep: (stepId: string, isChecked: boolean) => void;
  isGeneratingPlan?: boolean;
  onSaveResearch?: (data: any) => void;
}

const CategoryDeepDiveOverlay: React.FC<CategoryDeepDiveProps> = ({ 
  category, 
  seminars, 
  onClose, 
  onStartMasterQuiz,
  onOpenSeminar,
  userProfile,
  onGenerateStudyPlan,
  onTogglePlanStep,
  isGeneratingPlan,
  onSaveResearch
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'timeline' | 'plan' | 'legal' | 'apa' | 'research'>('overview');
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);
  const [selectedApa, setSelectedApa] = useState<string | null>(null);
  const [isGeneratingResearch, setIsGeneratingResearch] = useState(false);
  const [researchResult, setResearchResult] = useState<any | null>(userProfile?.categoryResearch?.[category] || null);
  const [researchLoadingStep, setResearchLoadingStep] = useState(0);

  const researchSteps = [
    { title: "Akademisk Crawling", desc: "Søger efter relevante publikationer på Google Scholar...", icon: <Search className="w-4 h-4" /> },
    { title: "Curriculum Mapping", desc: "Analyserer dine seminarnotater og slides for centrale temaer...", icon: <BookOpen className="w-4 h-4" /> },
    { title: "Hul-identifikation", desc: "Leder efter mangler i den nuværende videnskabelige konsensus...", icon: <Target className="w-4 h-4" /> },
    { title: "Problem-formulering", desc: "Udformer innovative problemstillinger baseret på fund...", icon: <Sparkles className="w-4 h-4" /> },
    { title: "Kilde-validering", desc: "Sikrer at alle links fungerer og kilder er peer-reviewed...", icon: <FileCheck className="w-4 h-4" /> },
  ];

  useEffect(() => {
    let interval: any;
    if (isGeneratingResearch) {
        setResearchLoadingStep(0);
        interval = setInterval(() => {
            setResearchLoadingStep(prev => (prev + 1) % researchSteps.length);
        }, 3500);
    }
    return () => clearInterval(interval);
  }, [isGeneratingResearch]);

  const isKollegaPlus = userProfile?.membership === 'Kollega+';
  const isResearchLocked = !isKollegaPlus;

  // Sync with user profile on mount or category change
  useEffect(() => {
    if (userProfile === undefined) return;
    if (userProfile?.categoryResearch?.[category]) {
        setResearchResult(userProfile.categoryResearch[category]);
    } else {
        setResearchResult(null);
    }
  }, [category, userProfile]);

  // Handle incoming data from profile updates (only if we don't have local result)
  useEffect(() => {
    if (!researchResult && userProfile?.categoryResearch?.[category]) {
        setResearchResult(userProfile.categoryResearch[category]);
    }
  }, [userProfile]);

  const studyPlanData = useMemo(() => {
    return userProfile?.categoryStudyPlans?.[category] || null;
  }, [userProfile, category]);

  // Aggregate Data
  const stats = useMemo(() => {
    const allSlides = seminars.flatMap(s => s.slides || []);
    const concepts = Array.from(new Set(allSlides.flatMap(s => (s.keyConcepts || []).map((c: any) => c.term))));
    const laws = Array.from(new Set(allSlides.flatMap(s => (s.legalFrameworks || []).map((l: any) => l.law))));
    const tools = Array.from(new Set(allSlides.flatMap(s => (s.practicalTools || []).map((t: any) => t.tool))));
    
    // Filter for APA references (containing a year in parentheses)
    const apaRefsList = Array.from(new Set(
        allSlides.flatMap(s => (s.keyConcepts || []).map((c: any) => c.source))
        .filter(s => !!s && /\(\d{4}\)/.test(s))
    ));
    
    // Sort seminars by date
    const sortedSeminars = [...seminars].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return dateA - dateB;
    });

    const totalSteps = studyPlanData?.plan?.steps?.length || 0;
    const completedSteps = studyPlanData?.checkedSteps?.length || 0;
    const progressionPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      slidesCount: allSlides.length,
      conceptsCount: concepts.length,
      lawsCount: laws.length,
      toolsCount: tools.length,
      apaCount: apaRefsList.length,
      concepts,
      laws,
      tools,
      apaRefs: apaRefsList,
      sortedSeminars,
      progression: progressionPercent
    };
  }, [seminars, studyPlanData]);

  // Knowledge Graph Data (Top 8 concepts for the visual)
  const topConcepts = useMemo(() => {
    const counts: Record<string, number> = {};
    seminars.flatMap(s => s.slides || []).flatMap(s => s.keyConcepts || []).forEach((c: any) => {
      counts[c.term] = (counts[c.term] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([term]) => term);
  }, [seminars]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0, pointerEvents: 'none' }}
      className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 lg:p-12 overflow-hidden"
    >
      <div className="absolute top-6 right-6 z-10">
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 shadow-xl border border-white/10">
           <X className="w-6 h-6" />
        </button>
      </div>

      <motion.div 
        initial={{ scale: 0.95, y: 30 }} 
        animate={{ scale: 1, y: 0 }} 
        className="w-full h-full max-w-7xl bg-[#FDFCF8] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 relative"
      >
        {/* Sidebar / Navigation */}
        <div className="flex h-full flex-col md:flex-row">
          <aside className="w-full md:w-80 bg-white border-r border-slate-100 p-8 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 mb-4">
                <Target className="w-3.5 h-3.5" /> Kategori Analyse
              </div>
              <h2 className="text-3xl font-black text-slate-900 serif tracking-tight leading-tight mb-2">{category}</h2>
              <p className="text-sm text-slate-400 font-medium">{seminars.length} Seminarer Arkiveret</p>
            </div>

            <nav className="space-y-2 flex-1">
              {[
                { id: 'overview', label: 'Overblik', icon: <Zap className="w-4 h-4" /> },
                { id: 'knowledge', label: 'Videnskort', icon: <BrainCircuit className="w-4 h-4" /> },
                { id: 'legal', label: 'Jura', icon: <Scale className="w-4 h-4" /> },
                { id: 'apa', label: 'Referencer', icon: <BookOpen className="w-4 h-4" /> },
                { 
                  id: 'research', 
                  label: 'Forskning', 
                  icon: isResearchLocked ? <div className="relative"><Globe className="w-4 h-4" /><div className="absolute -top-1 -right-1 bg-amber-500 w-2 h-2 rounded-full border border-white" /></div> : <Globe className="w-4 h-4" /> 
                },
                { id: 'timeline', label: 'Tidslinje', icon: <Calendar className="w-4 h-4" /> },
                { id: 'plan', label: 'Studieplan', icon: <ClipboardList className="w-4 h-4" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all ${
                    activeTab === tab.id 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </button>
              ))}
            </nav>

            <div className="mt-8 space-y-4 pt-8 border-t border-slate-50">
                <Button 
                    onClick={onStartMasterQuiz}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black shadow-xl shadow-indigo-600/20 group"
                >
                    <Trophy className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    MASTER QUIZ
                </Button>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Studie Progression</p>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.progression}%` }}
                            className="h-full bg-emerald-500 rounded-full"
                        />
                    </div>
                    <p className="text-[11px] font-black text-slate-900">{stats.progression}% gennemført</p>
                </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] pb-24">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                >
                  {/* Panoramic Summary Card */}
                  <section className="relative p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none" />
                    <div className="relative z-10 max-w-2xl">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Panorama Resumé</h3>
                      <p className="text-xl sm:text-2xl font-black serif leading-relaxed mb-6">
                        "Inden for <span className="text-indigo-300">{category}</span> har dine seminarer fokuseret stærkt på samspillet mellem det juridiske grundlag {stats.lawsCount > 0 ? `(bl.a. ${stats.laws[0]})` : ''} og den praktiske metode. Gennemgangen af {seminars.length} seminarer viser en tydelig rød tråd."
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {stats.laws.slice(0, 3).map((l, i) => (
                           <span key={i} className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold border border-white/10">{l}</span>
                        ))}
                        <span className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl text-xs font-bold text-white/40">+{stats.lawsCount - 3} flere</span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-48 h-48" />
                    </div>
                  </section>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                       <h4 className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-900">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Wrench className="w-5 h-5"/></div>
                          Kategoriens Værktøjskasse
                       </h4>
                       <div className="space-y-4">
                          {stats.tools.slice(0, 4).map((tool, i) => (
                            <div 
                                key={i} 
                                onClick={() => setSelectedTool(tool)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                                    selectedTool === tool ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
                                }`}
                            >
                               <span className={`font-bold text-sm ${selectedTool === tool ? 'text-white' : 'text-slate-700'}`}>{tool}</span>
                               <span className={`px-2 py-0.5 text-[9px] font-black rounded-md ${
                                   selectedTool === tool ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                               }`}>METODE</span>
                            </div>
                          ))}
                       </div>

                       <AnimatePresence>
                          {selectedTool && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="p-6 bg-slate-900 text-white rounded-3xl border border-white/10 shadow-2xl space-y-4 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <button onClick={() => setSelectedTool(null)} className="p-2 text-white/40 hover:text-white"><X className="w-5 h-5"/></button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white"><Wrench className="w-5 h-5"/></div>
                                    <div>
                                        <h4 className="font-black text-sm serif">{selectedTool}</h4>
                                        <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Anvendt i {seminars.filter(s => s.slides?.some((sl: any) => sl.practicalTools?.some((t: any) => t.tool === selectedTool))).length} seminarer</p>
                                    </div>
                                </div>
                                <div className="max-h-[150px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                    {seminars
                                        .filter(s => s.slides?.some((sl: any) => sl.practicalTools?.some((t: any) => t.tool === selectedTool)))
                                        .map((s, si) => (
                                            <div key={si} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                <p className="text-[11px] text-white/90 font-medium leading-relaxed">
                                                   {s.slides?.find((sl: any) => sl.practicalTools?.some((t: any) => t.tool === selectedTool))?.practicalTools?.find((t: any) => t.tool === selectedTool)?.description || 'Ingen yderligere forklaring.'}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                                <Button onClick={() => setSelectedTool(null)} className="w-full bg-white text-slate-900 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest">Luk detaljer</Button>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                       <h4 className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-900">
                          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5"/></div>
                          Væsentlige Begreber
                       </h4>
                       <div className="flex flex-wrap gap-2">
                          {stats.concepts.slice(0, 10).map((term, i) => (
                            <span key={i} className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 shadow-sm hover:border-indigo-200 transition-colors cursor-default">
                                {term}
                            </span>
                          ))}
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'knowledge' && (
                <motion.div 
                    key="knowledge"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="h-full flex flex-col"
                >
                  <div className="mb-10 text-center space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 serif">Det faglige Mycelium</h3>
                    <p className="text-sm text-slate-400 font-medium">Visualiserer forbindelserne mellem dine seminarer</p>
                  </div>

                  <div className="flex-1 relative min-h-[400px] flex items-center justify-center">
                    {/* Category Center Bubble */}
                    <div className="relative z-10 w-40 h-40 bg-slate-900 text-white rounded-full flex items-center justify-center text-center p-6 shadow-2xl border-8 border-white">
                        <span className="text-sm font-black serif uppercase leading-tight">{category}</span>
                    </div>

                    {/* Orbiting Concept Bubbles */}
                    {topConcepts.map((term, i) => {
                        const angle = (i / topConcepts.length) * 2 * Math.PI;
                        const radius = typeof window !== 'undefined' && window.innerWidth < 640 ? 140 : 260;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        
                        return (
                            <motion.div
                                key={term}
                                initial={{ x: 0, y: 0, opacity: 0 }}
                                animate={{ x, y, opacity: 1 }}
                                transition={{ delay: i * 0.1, type: 'spring', stiffness: 50 }}
                                className="absolute"
                            >
                                <motion.div 
                                    onClick={() => setSelectedConcept(term)}
                                    animate={{ 
                                        y: [0, 8, 0],
                                        scale: selectedConcept === term ? 1.15 : 1
                                    }}
                                    transition={{ 
                                        y: { duration: 4, repeat: Infinity, delay: i * 0.5 },
                                        scale: { duration: 0.2 }
                                    }}
                                    className={`px-5 py-3 rounded-[1.5rem] shadow-xl text-center min-w-[100px] sm:min-w-[140px] transition-all cursor-pointer border-2 ${
                                        selectedConcept === term 
                                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/20' 
                                            : 'bg-white border-slate-100 text-slate-800 hover:border-indigo-200 shadow-sm'
                                    }`}
                                >
                                    <span className="text-xs font-black truncate block">{term}</span>
                                    <div className="mt-1 flex justify-center gap-1">
                                        <div className={`w-1 h-1 rounded-full ${selectedConcept === term ? 'bg-white' : 'bg-indigo-400'}`} />
                                        <div className={`w-1 h-1 rounded-full ${selectedConcept === term ? 'bg-white/40' : 'bg-indigo-100'}`} />
                                    </div>
                                </motion.div>
                                
                                {/* Connection Line */}
                                <div 
                                    className={`absolute top-1/2 left-1/2 h-px origin-left -z-10 transition-colors ${
                                        selectedConcept === term ? 'bg-indigo-200' : 'bg-slate-100'
                                    }`} 
                                    style={{ 
                                        width: `${radius}px`,
                                        transform: `rotate(${angle + Math.PI}rad)` 
                                    }} 
                                />
                            </motion.div>
                        );
                    })}

                    <AnimatePresence>
                        {selectedConcept && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="absolute -bottom-10 sm:bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-6 sm:p-8 z-50 overflow-hidden"
                            >
                                <button onClick={() => setSelectedConcept(null)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-600"><X className="w-5 h-5"/></button>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Tags className="w-5 h-5"/></div>
                                        <div>
                                            <h4 className="font-black text-slate-900 serif">{selectedConcept}</h4>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Findes i {seminars.filter(s => s.slides?.some((sl: any) => sl.keyConcepts?.some((c: any) => c.term === selectedConcept))).length} seminarer</p>
                                        </div>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto pr-4 custom-scrollbar space-y-3">
                                        {seminars
                                            .filter(s => s.slides?.some((sl: any) => sl.keyConcepts?.some((c: any) => c.term === selectedConcept)))
                                            .map((s, si) => (
                                                <div key={si} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <p className="text-[9px] font-black uppercase text-indigo-500 mb-1">{s.overallTitle}</p>
                                                    <p className="text-[11px] text-slate-600 font-medium italic line-clamp-2">
                                                        "{s.slides?.find((sl: any) => sl.keyConcepts?.some((c: any) => c.term === selectedConcept))?.summary}"
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                    <Button onClick={() => setSelectedConcept(null)} className="w-full bg-slate-900 text-white rounded-xl h-11 text-xs font-black uppercase tracking-widest">Luk detaljer</Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {activeTab === 'legal' && (
                <motion.div 
                    key="legal"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                >
                  <section className="relative p-10 bg-indigo-900 rounded-[3rem] text-white shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-transparent pointer-events-none" />
                    <div className="relative z-10 max-w-2xl">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-4">Juridisk Grundlag</h3>
                      <p className="text-xl sm:text-2xl font-black serif leading-relaxed mb-6">
                        Analyse af <span className="text-white/60">{stats.lawsCount}</span> juridiske rammer og lovgivningsmæssige fundamenter identificeret i dine studier inden for <span className="text-indigo-200">{category}</span>.
                      </p>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            <Scale className="w-5 h-5 text-indigo-300" />
                         </div>
                         <p className="text-xs font-bold text-indigo-100 italic">"Alle kilder er baseret på de seminarmaterialer du har uploadet og bearbejdet."</p>
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Scale className="w-48 h-48" />
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.laws.map((law, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedLaw(law)}
                        className={`group p-8 rounded-[2.5rem] border transition-all cursor-pointer ${
                          selectedLaw === law ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col h-full space-y-6">
                           <div className="flex items-center justify-between">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                selectedLaw === law ? 'bg-white text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                              }`}>
                                 <BookOpen className="w-6 h-6" />
                              </div>
                              <ArrowRight className={`w-4 h-4 transition-transform ${selectedLaw === law ? 'text-white/40 rotate-90' : 'text-slate-200 group-hover:translate-x-1'}`} />
                           </div>
                           <div>
                              <h4 className={`text-lg font-black serif leading-tight ${selectedLaw === law ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'}`}>{law}</h4>
                              <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${selectedLaw === law ? 'text-white/40' : 'text-slate-400'}`}>Lovgrundlag</p>
                           </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {selectedLaw && (
                      <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 space-y-8"
                      >
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center border border-indigo-100">
                                  <Scale className="w-7 h-7" />
                               </div>
                               <div>
                                  <h4 className="text-2xl font-black text-slate-900 serif leading-none">{selectedLaw}</h4>
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">Dybdegående Juridisk Gennemgang</p>
                               </div>
                            </div>
                            <button onClick={() => setSelectedLaw(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-100 transition-all active:scale-95">
                               <X className="w-6 h-6" />
                            </button>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                               <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Lovens Relevans i Kategori</p>
                               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                  <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                     "{selectedLaw} udgør en central brik i forståelsen af {category}. I dit materiale anvendes denne lovmæssige ramme primært til at definere vilkårene for den overordnede metode."
                                  </p>
                               </div>
                            </div>
                             <div className="space-y-4">
                               <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Kontekst fra dine seminarer</p>
                               <div className="max-h-[300px] overflow-y-auto pr-4 custom-scrollbar space-y-4">
                                  {seminars
                                    .filter(s => s.slides?.some((sl: any) => sl.legalFrameworks?.some((l: any) => l.law === selectedLaw)))
                                    .map((s, si) => (
                                      <div key={si} className="p-5 bg-white border border-slate-100 rounded-2xl group/item hover:border-emerald-200 transition-all">
                                         <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">{s.overallTitle}</p>
                                         <div className="flex flex-col gap-3">
                                            {s.slides?.filter((sl: any) => sl.legalFrameworks?.some((l: any) => l.law === selectedLaw)).map((sl: any, sli: number) => {
                                                const lawMatch = sl.legalFrameworks?.find((l: any) => l.law === selectedLaw);
                                                return (
                                                    <div key={sli} className="space-y-2">
                                                        <p className="text-[10px] font-black text-slate-400">Slide {sl.slideNumber}: {sl.slideTitle}</p>
                                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-50">
                                                            <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                                                               "{lawMatch?.relevance || lawMatch?.description || 'Ingen kontekst angivet.'}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                         </div>
                                      </div>
                                    ))}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeTab === 'apa' && (
                <motion.div 
                    key="apa"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                >
                  <section className="relative p-10 bg-emerald-900 rounded-[3rem] text-white shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-transparent pointer-events-none" />
                    <div className="relative z-10 max-w-2xl">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300 mb-4">Referencer (APA)</h3>
                      <p className="text-xl sm:text-2xl font-black serif leading-relaxed mb-6">
                        Din akademiske bibliografi for <span className="text-emerald-200">{category}</span>. Vi har identificeret <span className="text-white/60">{stats.apaCount}</span> APA-henvisninger i dit materiale.
                      </p>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            <BookOpen className="w-5 h-5 text-emerald-300" />
                         </div>
                         <p className="text-xs font-bold text-emerald-100 italic">"Alle henvisninger er udtrukket direkte fra dine studier og sorteret efter APA 7 standard."</p>
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BookOpen className="w-48 h-48" />
                    </div>
                  </section>

                  {stats.apaCount === 0 ? (
                    <div className="py-20 text-center space-y-4 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ingen APA-referencer fundet i dette materiale endnu</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stats.apaRefs.map((ref, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedApa(ref)}
                            className={`group p-8 rounded-[2.5rem] border transition-all cursor-pointer ${
                            selectedApa === ref ? 'bg-emerald-600 border-emerald-400 text-white shadow-2xl' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'
                            }`}
                        >
                            <div className="flex flex-col h-full space-y-6">
                            <div className="flex items-center justify-between">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                    selectedApa === ref ? 'bg-white text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                                }`}>
                                    <FileSearch className="w-6 h-6" />
                                </div>
                                <ArrowRight className={`w-4 h-4 transition-transform ${selectedApa === ref ? 'text-white/40 rotate-90' : 'text-slate-200 group-hover:translate-x-1'}`} />
                            </div>
                            <div>
                                <h4 className={`text-sm font-bold serif leading-relaxed ${selectedApa === ref ? 'text-white' : 'text-slate-900 group-hover:text-emerald-600'}`}>{ref}</h4>
                                <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${selectedApa === ref ? 'text-white/40' : 'text-slate-400'}`}>APA Ref.</p>
                            </div>
                            </div>
                        </motion.div>
                        ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {selectedApa && (
                      <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 space-y-8"
                      >
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center border border-emerald-100">
                                  <BookOpen className="w-7 h-7" />
                               </div>
                               <div>
                                  <h4 className="text-xl font-black text-slate-900 serif leading-relaxed max-w-2xl">{selectedApa}</h4>
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">APA 7 Reference-detaljer</p>
                               </div>
                            </div>
                            <button onClick={() => setSelectedApa(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-100 transition-all active:scale-95">
                               <X className="w-6 h-6" />
                            </button>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                               <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Kildens Betydning</p>
                               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                  <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                     Denne reference er udtrukket som en central kilde for teorierne i dine seminarer. Den bruges her som det akademiske fundament for dine begreber og metoder.
                                  </p>
                               </div>
                               
                               <div className="space-y-3 pt-4">
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Relaterede Begreber</p>
                                  <div className="flex flex-wrap gap-2">
                                     {Array.from(new Set(seminars.flatMap(s => s.slides || []).flatMap(sl => (sl.keyConcepts || []).filter((c: any) => c.source === selectedApa).map((c: any) => c.term)))).map((term, ti) => (
                                       <span key={ti} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100">{term}</span>
                                     ))}
                                  </div>
                               </div>
                            </div>
                            
                            <div className="space-y-4">
                               <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Optræder i følgende seminarer</p>
                               <div className="max-h-[300px] overflow-y-auto pr-4 custom-scrollbar space-y-3">
                                  {seminars
                                    .filter(s => s.slides?.some((sl: any) => sl.keyConcepts?.some((c: any) => c.source === selectedApa)))
                                    .map((s, si) => (
                                      <div key={si} className="p-4 bg-white border border-slate-100 rounded-2xl group/item hover:border-indigo-200 transition-all flex items-center justify-between">
                                         <div>
                                            <p className="text-sm font-black text-slate-900 serif">{s.overallTitle}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{s.slides?.length} slides i alt</p>
                                         </div>
                                         <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:text-indigo-600 transition-colors">
                                            <ChevronRight className="w-4 h-4" />
                                         </div>
                                      </div>
                                    ))}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeTab === 'research' && !isResearchLocked && (
                <motion.div 
                    key="research"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                >
                  {!researchResult && !isGeneratingResearch && (
                    <section className="relative p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />
                      <div className="relative z-10 max-w-2xl">
                          <>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-4">Akademisk Innovation</h3>
                            <p className="text-xl sm:text-2xl font-black serif leading-relaxed mb-8">
                              Dyk ned i den nyeste forskning inden for <span className="text-indigo-200">{category}</span> og udtænk din næste store problemstilling.
                            </p>
                            <Button 
                                onClick={async () => {
                                    setIsGeneratingResearch(true);
                                    try {
                                        // Aggregate seminar context for the AI
                                        const seminarContext = seminars.map(s => {
                                            const slidesText = (s.slides || [])
                                                .map((sl: any) => `- Slide ${sl.slideNumber}: ${sl.summary}`)
                                                .join('\n');
                                            return `SEMINAR: ${s.overallTitle}\nKATEGORI: ${s.category}\nINDHOLD:\n${slidesText}`;
                                        }).join('\n\n---\n\n');

                                        const result = await researchDiscoveryAction({
                                            category,
                                            seminarContext,
                                            profession: userProfile?.profession
                                        });

                                        if (result?.data) {
                                            setResearchResult(result.data);
                                            if (onSaveResearch) onSaveResearch(result.data);
                                            toast({
                                                title: "Forskningsanalyse færdig",
                                                description: "Vi har fundet nye vinkler til din forskning.",
                                            });
                                        } else {
                                            throw new Error("Ingen data modtaget");
                                        }
                                    } catch (error) {
                                        console.error("Research discovery failed:", error);
                                        toast({
                                            title: "Fejl under analyse",
                                            description: "Kunne ikke forbinde til forsknings-motoren.",
                                            variant: "destructive"
                                        });
                                    } finally {
                                        setIsGeneratingResearch(false);
                                    }
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-14 px-8 text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/20 active:scale-95 flex items-center gap-3 group/btn"
                            >
                                <Sparkles className="w-5 h-5 group-hover/btn:animate-pulse" />
                                Start Forskningsanalyse
                            </Button>
                          </>
                      </div>
                      <div className="absolute bottom-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Globe className="w-48 h-48" />
                      </div>
                    </section>
                  )}

                  {isGeneratingResearch && (
                    <div className="py-20 px-10 bg-white rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 to-transparent" />
                        
                        <div className="relative z-10 flex flex-col items-center gap-12">
                            {/* Animated Scanner Hub */}
                            <div className="relative">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="w-32 h-32 rounded-full border-2 border-dashed border-indigo-100 flex items-center justify-center"
                                >
                                    <div className="w-24 h-24 rounded-full border border-indigo-200/50 flex items-center justify-center p-4">
                                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-500/20">
                                            {researchSteps[researchLoadingStep].icon}
                                        </div>
                                    </div>
                                </motion.div>
                                
                                {/* Orbiting Dots */}
                                {[0, 72, 144, 216, 288].map((angle, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute top-1/2 left-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                        animate={{ 
                                            x: 70 * Math.cos(angle * Math.PI / 180),
                                            y: 70 * Math.sin(angle * Math.PI / 180),
                                            opacity: [0.2, 1, 0.2]
                                        }}
                                        transition={{ 
                                            duration: 3, 
                                            repeat: Infinity, 
                                            delay: i * 0.5,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="w-full max-w-sm space-y-8">
                                <div className="text-center space-y-2">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Deep Search i gang</h4>
                                    <div className="h-1 w-24 bg-indigo-100 rounded-full mx-auto overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-indigo-600"
                                            animate={{ x: [-100, 100] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        />
                                    </div>
                                </div>

                                {/* Steps List */}
                                <div className="space-y-4">
                                    {researchSteps.map((step, idx) => {
                                        const isCurrent = idx === researchLoadingStep;
                                        const isPast = idx < researchLoadingStep;
                                        
                                        return (
                                            <motion.div 
                                                key={idx}
                                                initial={false}
                                                animate={{ 
                                                    opacity: isCurrent ? 1 : (isPast ? 0.5 : 0.2),
                                                    scale: isCurrent ? 1.02 : 1
                                                }}
                                                className={`flex items-start gap-4 p-4 rounded-2xl transition-colors ${isCurrent ? 'bg-indigo-50/50 border border-indigo-100 shadow-sm' : ''}`}
                                            >
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${isCurrent ? 'bg-indigo-600 text-white' : (isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400')}`}>
                                                    {isPast ? <FileCheck className="w-3 h-3" /> : idx + 1}
                                                </div>
                                                <div className="text-left">
                                                    <h5 className={`text-[11px] font-black uppercase tracking-wider ${isCurrent ? 'text-indigo-900' : 'text-slate-500'}`}>
                                                        {step.title}
                                                    </h5>
                                                    {isCurrent && (
                                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 animate-pulse">
                                                            {step.desc}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Background Scanning Effect */}
                        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-indigo-50/20 pointer-events-none" />
                    </div>
                  )}

                  {researchResult && (
                    <div className="space-y-16 pb-24">
                        {/* Summary Card */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between px-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">Status Quo</p>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Forskningsmæssigt Overblik</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button 
                                        onClick={async () => {
                                            setIsGeneratingResearch(true);
                                            try {
                                                const seminarContext = seminars.map(s => {
                                                    const slidesText = (s.slides || []).map((sl: any) => `- Slide ${sl.slideNumber}: ${sl.summary}`).join('\n');
                                                    return `SEMINAR: ${s.overallTitle}\nKATEGORI: ${s.category}\nINDHOLD:\n${slidesText}`;
                                                }).join('\n\n---\n\n');
                                                const result = await researchDiscoveryAction({ 
                                                    category, 
                                                    seminarContext,
                                                    profession: userProfile?.profession
                                                });
                                                if (result?.data) {
                                                    setResearchResult(result.data);
                                                    if (onSaveResearch) onSaveResearch(result.data);
                                                    toast({ title: "Analyse genopfrisket", description: "Vi har fundet de nyeste data." });
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                toast({ title: "Fejl", description: "Kunne ikke forbinde til motoren.", variant: "destructive" });
                                            } finally {
                                                setIsGeneratingResearch(false);
                                            }
                                        }}
                                        size="sm" 
                                        variant="outline" 
                                        className="rounded-full border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all font-black uppercase text-[10px] tracking-widest px-4 h-9"
                                    >
                                        <Zap className="w-3.5 h-3.5 mr-2" />
                                        Genopfrisk
                                    </Button>
                                    <div className="px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100 flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Global Indsigt</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 bg-white border border-slate-100 rounded-[4rem] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 text-slate-50 group-hover:text-indigo-50/50 transition-colors pointer-events-none">
                                    <Search className="w-24 h-24" />
                                </div>
                                <div className="max-w-3xl space-y-8 relative z-10">
                                    <p className="text-2xl text-slate-800 leading-relaxed font-medium serif italic">
                                        "{researchResult.stateOfResearch}"
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Hentet Litteratur & Kilder</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {researchResult.existingSources.map((s: any, sj: number) => (
                                                <motion.div 
                                                    key={sj}
                                                    whileHover={{ x: 4 }}
                                                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4 group/kilde"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex flex-shrink-0 items-center justify-center text-slate-400">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="space-y-1 overflow-hidden">
                                                        <p className="text-[11px] font-bold text-slate-600 break-words leading-tight">{s.apa}</p>
                                                        {s.url && (
                                                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-black flex items-center gap-1 hover:underline">
                                                                <LinkIcon className="w-3 h-3" />
                                                                Åben Publikation
                                                            </a>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Innovation Paths */}
                        <section className="space-y-10">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-1 bg-indigo-600 rounded-full" />
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Fremtidige Forskningsstier</h3>
                                    <p className="text-slate-500 text-sm font-medium">Potentiale for nye AI-understøttede opdagelser i materialet</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {researchResult.proposals.map((path: any, pi: number) => (
                                    <motion.div 
                                        key={pi}
                                        whileHover={{ y: -8 }}
                                        className="bg-white border border-slate-100 p-8 rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all space-y-8 flex flex-col h-full relative group"
                                    >
                                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                                            {pi === 0 ? <BrainCircuit className="w-8 h-8" /> : pi === 1 ? <Target className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                                        </div>
                                        
                                        <div className="space-y-4 flex-grow">
                                            <h4 className="text-xl font-black text-slate-900 leading-tight">
                                                {path.title}
                                            </h4>
                                            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group-hover:bg-white transition-colors">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8" />
                                                <p className="text-xs font-bold text-slate-500 italic leading-relaxed relative z-10">
                                                    "{path.problemStatement}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-50 space-y-6">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Key Questions</p>
                                                <ul className="space-y-2">
                                                    {path.questions.map((q: string, qi: number) => (
                                                        <li key={qi} className="text-[11px] text-slate-600 font-medium flex gap-2">
                                                            <span className="text-indigo-300">•</span>
                                                            {q}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest overflow-hidden whitespace-nowrap text-ellipsis max-w-[80px]">
                                                        {path.theory}
                                                    </span>
                                                </div>
                                                <Button 
                                                    onClick={() => {
                                                        const doc = new jsPDF();
                                                        const margin = 20;
                                                        const pageWidth = doc.internal.pageSize.getWidth();
                                                        const pageHeight = doc.internal.pageSize.getHeight();
                                                        let yPos = 20;

                                                        const checkPageBreak = (neededHeight: number) => {
                                                            if (yPos + neededHeight > pageHeight - margin) {
                                                                doc.addPage();
                                                                yPos = 20;
                                                                return true;
                                                            }
                                                            return false;
                                                        };

                                                        // --- PAGE 1: COVER ---
                                                        // Accent Bar
                                                        doc.setFillColor(15, 23, 42); // Indigo/Slate 900
                                                        doc.rect(0, 0, pageWidth, 60, 'F');
                                                        
                                                        doc.setTextColor(255, 255, 255);
                                                        doc.setFont("helvetica", "bold");
                                                        doc.setFontSize(28);
                                                        doc.text("RESEARCH BRIEF", margin, 35);
                                                        
                                                        doc.setFontSize(10);
                                                        doc.setFont("helvetica", "normal");
                                                        doc.text(`COHÉRO INTELLIGENCE HUB | ${new Date().toLocaleDateString('da-DK')}`, margin, 45);

                                                        yPos = 80;
                                                        doc.setTextColor(15, 23, 42);
                                                        doc.setFontSize(18);
                                                        doc.setFont("helvetica", "bold");
                                                        const splitTitle = doc.splitTextToSize(path.title.toUpperCase(), pageWidth - (margin * 2));
                                                        doc.text(splitTitle, margin, yPos);
                                                        yPos += (splitTitle.length * 8) + 10;

                                                        // Metadata Box
                                                        doc.setDrawColor(226, 232, 240); // Slate 200
                                                        doc.line(margin, yPos, pageWidth - margin, yPos);
                                                        yPos += 10;
                                                        
                                                        doc.setFontSize(10);
                                                        doc.setFont("helvetica", "bold");
                                                        doc.text("KATEGORI:", margin, yPos);
                                                        doc.setFont("helvetica", "normal");
                                                        doc.text(category.toUpperCase(), margin + 25, yPos);
                                                        yPos += 6;
                                                        
                                                        doc.setFont("helvetica", "bold");
                                                        doc.text("TEORI:", margin, yPos);
                                                        doc.setFont("helvetica", "normal");
                                                        doc.text(path.theory.toUpperCase(), margin + 25, yPos);
                                                        yPos += 10;
                                                        
                                                        doc.line(margin, yPos, pageWidth - margin, yPos);
                                                        yPos += 20;

                                                        // Section: Problem Statement
                                                        doc.setFontSize(14);
                                                        doc.setFont("helvetica", "bold");
                                                        doc.text("01. PROBLEMSTILLING", margin, yPos);
                                                        yPos += 10;
                                                        
                                                        doc.setFont("helvetica", "oblique");
                                                        doc.setFontSize(11);
                                                        doc.setTextColor(71, 85, 105); // Slate 600
                                                        const splitProblem = doc.splitTextToSize(`"${path.problemStatement}"`, pageWidth - (margin * 2));
                                                        doc.text(splitProblem, margin, yPos);
                                                        yPos += (splitProblem.length * 6) + 20;

                                                        // Section: Research Questions
                                                        checkPageBreak(50);
                                                        doc.setTextColor(15, 23, 42);
                                                        doc.setFontSize(14);
                                                        doc.setFont("helvetica", "bold");
                                                        doc.text("02. FORSKNINGSSPØRGSMÅL", margin, yPos);
                                                        yPos += 10;
                                                        
                                                        doc.setFont("helvetica", "normal");
                                                        doc.setFontSize(10);
                                                        path.questions.forEach((q: string, i: number) => {
                                                            const qText = `${i + 1}. ${q}`;
                                                            const splitQ = doc.splitTextToSize(qText, pageWidth - (margin * 2) - 5);
                                                            checkPageBreak(splitQ.length * 5);
                                                            doc.text(splitQ, margin + 5, yPos);
                                                            yPos += (splitQ.length * 5) + 3;
                                                        });
                                                        yPos += 15;

                                                        // Section: Academic Context
                                                        checkPageBreak(60);
                                                        doc.setFontSize(14);
                                                        doc.setFont("helvetica", "bold");
                                                        doc.text("03. AKADEMISK STATE-OF-RESEARCH", margin, yPos);
                                                        yPos += 10;
                                                        
                                                        doc.setFont("helvetica", "normal");
                                                        doc.setFontSize(10);
                                                        doc.setTextColor(30, 41, 59); // Slate 800
                                                        const splitBackground = doc.splitTextToSize(researchResult.stateOfResearch, pageWidth - (margin * 2));
                                                        // Handle page breaks within long text
                                                        splitBackground.forEach((line: string) => {
                                                            if (checkPageBreak(6)) {
                                                                // If break, reset text color/font just in case
                                                                doc.setFont("helvetica", "normal");
                                                                doc.setFontSize(10);
                                                                doc.setTextColor(30, 41, 59);
                                                            }
                                                            doc.text(line, margin, yPos);
                                                            yPos += 6;
                                                        });
                                                        yPos += 20;

                                                        // Section: Bibliography
                                                        checkPageBreak(40);
                                                        doc.setFontSize(14);
                                                        doc.setFont("helvetica", "bold");
                                                        doc.text("04. LITTERATURLISTE (APA)", margin, yPos);
                                                        yPos += 10;
                                                        
                                                        doc.setFontSize(9);
                                                        doc.setFont("helvetica", "normal");
                                                        doc.setTextColor(100, 116, 139); // Slate 400
                                                        researchResult.existingSources.forEach((s: any) => {
                                                            const sourceText = `${s.apa}${s.url ? ` [LINK: ${s.url}]` : ''}`;
                                                            const splitSource = doc.splitTextToSize(sourceText, pageWidth - (margin * 2) - 5);
                                                            if (checkPageBreak(splitSource.length * 5)) {
                                                                doc.setFontSize(9);
                                                                doc.setTextColor(100, 116, 139);
                                                            }
                                                            doc.text(splitSource, margin + 5, yPos);
                                                            yPos += (splitSource.length * 5) + 2;
                                                        });

                                                        // Footer on every page
                                                        const pageCount = (doc as any).internal.getNumberOfPages();
                                                        for (let i = 1; i <= pageCount; i++) {
                                                            doc.setPage(i);
                                                            doc.setFontSize(8);
                                                            doc.setTextColor(203, 213, 225);
                                                            doc.text("Generated by Cohéro Intelligence - Premium Research Discovery Module", margin, pageHeight - 10);
                                                            doc.text(`Side ${i} af ${pageCount}`, pageWidth - margin - 15, pageHeight - 10);
                                                        }

                                                        doc.save(`Cohéro-Brief-${path.title.replace(/\s+/g, '-')}.pdf`);
                                                        toast({ title: "PDF Brief Downloadet", description: "Din professionelle analyse er klar." });
                                                    }}
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="rounded-xl font-black uppercase tracking-widest h-10 text-[10px] hover:bg-slate-900 hover:text-white transition-all px-4"
                                                >
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Download PDF
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Analysis Note */}
                        <div className="flex justify-center flex-col items-center gap-4 text-center">
                            <div className="w-16 h-1 bg-slate-100 rounded-full" />
                            <p className="text-[10px] text-slate-400 font-medium max-w-sm">
                                Deep Search kombinerer dine seminarer med peer-reviewed data fra {researchResult.existingSources.length} kilder fundet via Google Scholar for at skabe et felt-uafhængigt overblik.
                            </p>
                        </div>
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'research' && isResearchLocked && (
                <motion.div 
                    key="research-locked"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="py-24 px-10 text-center space-y-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-indigo-500/5 blur-3xl" />
                    <div className="relative z-10 max-w-sm mx-auto space-y-8">
                        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 mx-auto border-2 border-white shadow-xl">
                            <Sparkles className="w-12 h-12" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-900 serif leading-tight">Lås op for Forskning</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Forskning og Deep-Search er eksklusivt for vores <span className="text-indigo-600 font-black">Kollega+</span> medlemmer.</p>
                        </div>
                        <Link href="/upgrade" className="block w-full text-center">
                            <Button className="w-full bg-slate-900 hover:bg-indigo-950 text-white rounded-2xl h-16 font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                                OPGRADER TIL KOLLEGA+
                            </Button>
                        </Link>
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Få adgang til SerpApi & Deep Intelligence</p>
                    </div>
                </motion.div>
              )}
              {activeTab === 'timeline' && (
                <motion.div 
                    key="timeline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-3xl mx-auto"
                >
                  <div className="space-y-12 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-slate-100 before:rounded-full">
                    {stats.sortedSeminars.map((s, i) => (
                      <div key={s.id} className="relative pl-24 group">
                        {/* Time Marker */}
                        <div className="absolute left-8 -translate-x-1/2 top-4 w-8 h-8 bg-white border-4 border-indigo-500 rounded-full z-10 group-hover:scale-125 group-hover:bg-indigo-500 group-hover:border-white transition-all duration-300 shadow-lg shadow-indigo-500/20" />
                        
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden relative" onClick={() => onOpenSeminar(s)}>
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Calendar className="w-16 h-16 text-slate-900" />
                             </div>
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                    {s.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <div className="flex gap-1">
                                    <div className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[8px] font-black">{s.slides?.length} SLIDES</div>
                                </div>
                             </div>
                             <h4 className="text-xl font-black text-slate-900 serif mb-4">{s.overallTitle}</h4>
                             <p className="text-sm text-slate-400 font-medium italic line-clamp-2 mb-6">
                                "{s.slides?.[0]?.summary || 'Ingen opsummering tilgængelig'}"
                             </p>
                             <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex -space-x-2">
                                    {s.slides?.slice(0, 5).map((sl: any, si: number) => (
                                        <div key={si} className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                            {sl.slideNumber}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Gennemse <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                             </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'plan' && (
                <motion.div 
                    key="plan"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-4xl mx-auto space-y-10"
                >
                    {!studyPlanData ? (
                        <div className="py-20 text-center space-y-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-12">
                            <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 mx-auto">
                                <ClipboardList className="w-12 h-12" />
                            </div>
                            <div className="max-w-md mx-auto space-y-4">
                                <h3 className="text-3xl font-black text-slate-900 serif">Klar til at lære smartere?</h3>
                                <p className="text-slate-500 font-medium">Vi kan generere en personlig studieplan baseret på dine seminarer, så du ved præcis hvad du skal fokusere på og hvordan.</p>
                            </div>
                            <Button 
                                onClick={onGenerateStudyPlan}
                                disabled={isGeneratingPlan}
                                className="h-16 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {isGeneratingPlan ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin" /> GENERERER PLAN...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 mr-3 text-amber-400" /> GENERER STUDIEPLAN
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Målrettet Læring</p>
                                    <h3 className="text-4xl font-black text-slate-900 serif">{studyPlanData.plan.title}</h3>
                                    <p className="text-slate-400 font-medium max-w-xl">{studyPlanData.plan.description}</p>
                                </div>
                                <div className="shrink-0">
                                     <Button 
                                        variant="outline" 
                                        onClick={onGenerateStudyPlan}
                                        disabled={isGeneratingPlan}
                                        className="rounded-xl border-slate-200 text-slate-400 hover:text-slate-900 h-10 px-4 text-[10px] font-black uppercase tracking-widest"
                                     >
                                        {isGeneratingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5 mr-2" />}
                                        Opdater Plan
                                     </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {studyPlanData.plan.steps.map((step, i) => {
                                    const isChecked = studyPlanData.checkedSteps?.includes(step.id);
                                    return (
                                        <motion.div 
                                            key={step.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`group relative p-8 rounded-[2.5rem] border transition-all duration-300 ${
                                                isChecked 
                                                    ? 'bg-emerald-50/30 border-emerald-100' 
                                                    : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100'
                                            }`}
                                        >
                                            <div className="flex items-start gap-8">
                                                <button 
                                                    onClick={() => onTogglePlanStep(step.id, !isChecked)}
                                                    className={`mt-1 h-10 w-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                                                        isChecked 
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                                            : 'bg-slate-50 text-slate-300 border border-slate-100 hover:bg-slate-100 hover:text-slate-500'
                                                    }`}
                                                >
                                                    {isChecked ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                                                </button>
                                                
                                                <div className="flex-1 space-y-6">
                                                    <div>
                                                        <h4 className={`text-xl font-black serif mb-1 transition-colors ${isChecked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{step.title}</h4>
                                                        <p className={`text-sm leading-relaxed font-medium transition-colors ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>{step.description}</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Læringsmål</p>
                                                            <p className="text-xs font-bold text-slate-700 leading-relaxed">{step.learningObjective}</p>
                                                        </div>
                                                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Anbefalet Metode</p>
                                                            <p className="text-xs font-bold text-indigo-900 leading-relaxed">{step.suggestedMethod}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {studyPlanData.checkedSteps?.length === studyPlanData.plan.steps.length && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-10 bg-emerald-900 text-white rounded-[3rem] text-center space-y-4 shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] opacity-10" />
                                    <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce mb-4" />
                                    <h3 className="text-3xl font-black serif">Fantastisk stykke arbejde!</h3>
                                    <p className="text-emerald-100 font-medium max-w-md mx-auto">Du har gennemført hele studieplanen for {category}. Din forståelse for dette område er nu i topform!</p>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Footer Info */}
        <div className="h-14 bg-white border-t border-slate-100 flex items-center justify-between px-10 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Cohéro Intelligence Engine • Analyse af {stats.slidesCount} videnspunkter i {category}
            </p>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400">{studyPlanData?.checkedSteps?.length || 0} / {studyPlanData?.plan?.steps?.length || 0} Trin</span>
                </div>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CategoryDeepDiveOverlay;
