'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SavedSeminar } from '@/app/mine-seminarer/page'; 
import type { UserProfile, CategoryStudyPlan } from '@/ai/flows/types';

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
  isGeneratingPlan
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'timeline' | 'plan'>('overview');
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const studyPlanData = useMemo(() => {
    return userProfile?.categoryStudyPlans?.[category] || null;
  }, [userProfile, category]);

  // Aggregate Data
  const stats = useMemo(() => {
    const allSlides = seminars.flatMap(s => s.slides || []);
    const concepts = Array.from(new Set(allSlides.flatMap(s => (s.keyConcepts || []).map((c: any) => c.term))));
    const laws = Array.from(new Set(allSlides.flatMap(s => (s.legalFrameworks || []).map((l: any) => l.law))));
    const tools = Array.from(new Set(allSlides.flatMap(s => (s.practicalTools || []).map((t: any) => t.tool))));
    
    // Sort seminars by date
    const sortedSeminars = [...seminars].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return dateA - dateB;
    });

    const totalSteps = studyPlanData?.plan?.steps?.length || 0;
    const completedSteps = studyPlanData?.checkedSteps?.length || 0;
    const progression = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      slidesCount: allSlides.length,
      conceptsCount: concepts.length,
      lawsCount: laws.length,
      toolsCount: tools.length,
      concepts,
      laws,
      tools,
      sortedSeminars,
      progression
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
