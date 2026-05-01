'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  Search,
  ChevronRight,
  FileText,
  Clock,
  Zap,
  HelpCircle,
  Layout,
  Layers,
  GraduationCap,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { generateMaterialAIOverviewAction } from '@/app/actions';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Mock/Example mapping logic (In a real app, this would be AI-generated or DB-stored)
const getMappingColor = (index: number) => {
  const colors = [
    'border-indigo-500 bg-indigo-50 text-indigo-700',
    'border-amber-500 bg-amber-50 text-amber-700',
    'border-emerald-500 bg-emerald-50 text-emerald-700',
    'border-rose-500 bg-rose-50 text-rose-700',
    'border-sky-500 bg-sky-50 text-sky-700',
    'border-purple-500 bg-purple-50 text-purple-700',
  ];
  return colors[index % colors.length];
};

// Helper for semester identification
function getSemNum(semester: string): number {
  const match = semester.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

const LaeringsStiPage = () => {
  const { user, userProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const router = useRouter();

  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [isMapping, setIsMapping] = useState(false);
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);
  const [workMode, setWorkMode] = useState<{ 
    active: boolean; 
    materialId: string | null; 
    goalIndex: number | null;
    currentPage: number | null;
  }>({
    active: false,
    materialId: null,
    goalIndex: null,
    currentPage: null
  });

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Sync selectedModuleId with userProfile?.semester on load
  useEffect(() => {
    if (userProfile?.semester && !selectedModuleId) {
      setSelectedModuleId(userProfile.semester);
    }
  }, [userProfile?.semester]);

  // --- Curriculum / Module Identification (Synced with portal/page.tsx) ---
  const curriculumsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.profession) return null;
    return query(
      collection(firestore, 'curriculums'),
      where('profession', '==', userProfile.profession)
    );
  }, [firestore, userProfile?.profession]);

  const { data: curriculumsRaw } = useCollection<any>(curriculumsQuery);

  const curriculum = useMemo(() => {
    if (userProfile?.customCurriculum) return userProfile.customCurriculum;
    if (!curriculumsRaw || curriculumsRaw.length === 0) return null;

    const currentSemId = selectedModuleId || userProfile?.semester;
    
    if (currentSemId && (currentSemId.length > 2 || isNaN(parseInt(currentSemId)))) {
       const containingCurriculum = curriculumsRaw.find((c: any) => 
         c.modules?.some((m: any) => String(m.id) === String(currentSemId))
       );
       if (containingCurriculum) return containingCurriculum;
    }

    const userInst = (userProfile?.institution || '').toLowerCase().trim();
    const studyStarted = userProfile?.studyStarted;

    const normalize = (s: string) => {
      let res = s.toLowerCase().replace(/professionshøjskolen\s+/gs, '').trim();
      const mapping: Record<string, string> = { 'københavns professionshøjskole': 'kp', 'københavn': 'kp' };
      return mapping[res] || res;
    };

    const normalizedUserInst = normalize(userInst);
    const instMatches = curriculumsRaw.filter((c: any) => normalize(c.institution || '').includes(normalizedUserInst));

    if (instMatches.length === 0) return null;
    return instMatches[0];
  }, [curriculumsRaw, userProfile?.institution, userProfile?.customCurriculum, userProfile?.semester, selectedModuleId]);

  const activeModule = useMemo(() => {
    if (!curriculum) return null;
    const currentSem = selectedModuleId || userProfile?.semester || '1';
    const semNum = getSemNum(currentSem);
    const isSimpleNumber = /^\d+$/.test(currentSem.trim());
    
    let found = curriculum.modules.find((m: any) => String(m.id) === String(currentSem));
    if (!found) found = curriculum.modules.find((m: any) => String(m.name).toLowerCase() === currentSem.toLowerCase());
    if (!found && isSimpleNumber) found = curriculum.modules.find((m: any) => m.semester === semNum);
    
    return found || curriculum.modules[0];
  }, [curriculum, userProfile?.semester, selectedModuleId]);

  const learningGoals = useMemo(() => {
    return activeModule?.learningGoals || [
      "Vælg din uddannelse i indstillinger for at se officielle læringsmål."
    ];
  }, [activeModule]);

  // Fetch materials for selected module/semester (Real-time sync)
  useEffect(() => {
    if (!user || !firestore || !selectedModuleId) {
        setIsLoadingMaterials(false);
        return;
    }

    setIsLoadingMaterials(true);
    
    // Find all possible keys for this module (id and semester number)
    const moduleKeys = [selectedModuleId];
    const targetModule = curriculum?.modules?.find((m: any) => String(m.id) === String(selectedModuleId));
    if (targetModule?.semester) {
        moduleKeys.push(String(targetModule.semester));
    }

    const q = query(
      collection(firestore, 'users', user.uid, 'materials'),
      where('semester', 'in', moduleKeys)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(data);
      setIsLoadingMaterials(false);
    }, (err) => {
      console.error("Error fetching materials:", err);
      setIsLoadingMaterials(false);
    });

    return () => unsub();
  }, [user, firestore, selectedModuleId, curriculum]);

  // Detailed mapping (Prioritize AI-generated data from Firestore)
  const materialMapping = useMemo(() => {
    if (materials.length === 0 || learningGoals.length === 0) return {};
    
    const mapping: Record<string, Array<{ 
        goalIndex: number, 
        reason: string, 
        pages: string 
    }>> = {};
    
    materials.forEach((m: any) => {
      // 1. Try new aiOverviewData field
      if (m.aiOverviewData) {
        try {
          const parsed = JSON.parse(m.aiOverviewData);
          if (parsed.learningGoals && Array.isArray(parsed.learningGoals)) {
            const mappedGoals: any[] = [];
            
            parsed.learningGoals.forEach((aiGoal: any) => {
              const goalText = typeof aiGoal === 'string' ? aiGoal : aiGoal.goal;
              const reason = typeof aiGoal === 'string' ? "Relevant for dette mål" : aiGoal.explanation;
              
              if (!goalText) return;

              // Find matching index in official learning goals
              // Use a more flexible match: check if a significant part of the string matches
              const officialIdx = learningGoals.findIndex(g => {
                const cleanG = g.toLowerCase().trim();
                const cleanAI = goalText.toLowerCase().trim();
                return cleanG.includes(cleanAI) || cleanAI.includes(cleanG) || 
                       (cleanG.substring(0, 30) === cleanAI.substring(0, 30));
              });
              
              if (officialIdx !== -1) {
                mappedGoals.push({
                  goalIndex: officialIdx,
                  reason: reason || "Dette materiale understøtter læringsmålet.",
                  pages: "Hele dokumentet",
                  steps: aiGoal.steps || []
                });
              } else {
                console.warn("[LaeringsSti] No match for AI goal:", goalText.substring(0, 50));
              }
            });
            
            if (mappedGoals.length > 0) {
              mapping[m.id] = mappedGoals;
              return;
            }
          }
        } catch (e) {
          console.error("Error parsing aiOverviewData for mapping:", e);
        }
      }

      // 2. Fallback to legacy goalMapping if exists
      if (m.goalMapping && Array.isArray(m.goalMapping) && m.goalMapping.length > 0) {
        mapping[m.id] = m.goalMapping;
      }
    });
    
    return mapping;
  }, [materials, learningGoals]);

  const handleMapAI = () => {
    setIsMapping(true);
    // Simulate AI thinking
    setTimeout(() => setIsMapping(false), 2000);
  };

  const { toast } = useToast();

  const handleGenerateFlow = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Fejl", description: "Bruger ikke fundet." });
      return;
    }
    
    if (materials.length === 0) {
      toast({ variant: "destructive", title: "Ingen materialer", description: "Upload venligst materialer først." });
      return;
    }

    toast({ title: "Klargør Studie-Flow", description: "AI analyserer dine dokumenter. Vent venligst..." });
    setIsGeneratingFlow(true);
    
    try {
      const materialsToAnalyze = materials; 

      for (const m of materialsToAnalyze) {
        const textToUse = m.rawText || m.extractedText || "";
        if (!textToUse.trim()) continue;

        await generateMaterialAIOverviewAction({
          userId: user.uid,
          materialId: m.id,
          rawText: textToUse,
          candidateLearningGoals: learningGoals
        });
      }
      toast({ title: "Flow klar!", description: "Dit studie-flow er nu opdateret med fokuspunkter." });
    } catch (err) {
      console.error("[LaeringsSti] Generation error:", err);
      toast({ variant: "destructive", title: "Fejl ved klargøring", description: "Der skete en fejl under AI-analysen." });
    } finally {
      setIsGeneratingFlow(false);
    }
  };

  if (isUserLoading || !user) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 selection:bg-indigo-100 font-inter">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-slate-900 border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-[900] text-slate-900 tracking-tight">Lærings-sti</h1>
                
                {/* Module Selector Dropdown */}
                <div className="relative group/select">
                    <select 
                        value={selectedModuleId || ''} 
                        onChange={(e) => setSelectedModuleId(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 pr-10 h-8 text-[10px] font-black uppercase tracking-widest text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer hover:bg-slate-100"
                    >
                        {curriculum?.modules?.map((m: any) => (
                            <option key={m.id} value={m.id}>
                                {m.semester ? `${m.semester}. Semester` : m.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="w-3 h-3 text-indigo-400 rotate-90" />
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {activeModule?.name || 'Dit Aktuelle Modul'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={() => {
                // Prioritize materials that have already been mapped to any goal
                const firstMatWithData = materials.find(m => materialMapping[m.id] && materialMapping[m.id].length > 0);
                
                if (firstMatWithData) {
                  const firstGoalIdx = materialMapping[firstMatWithData.id][0].goalIndex;
                  setWorkMode({ 
                    active: true, 
                    materialId: firstMatWithData.id, 
                    goalIndex: firstGoalIdx,
                    currentPage: 1 
                  });
                } else {
                  // Fallback to first material and first goal
                  setWorkMode({ 
                    active: true, 
                    materialId: materials[0]?.id || null, 
                    goalIndex: 0,
                    currentPage: 1 
                  });
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 h-12 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 group"
            >
              <Zap className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              Start Studie-Flow
            </Button>

            <Button 
              onClick={handleMapAI}
              disabled={isMapping || materials.length === 0}
              variant="outline"
              className="border-slate-200 text-slate-500 rounded-2xl px-6 h-12 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
            >
              {isMapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Genopfrisk
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 lg:p-12">
        
        {/* INTRO SECTION */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-[900] text-slate-900 tracking-tight mb-6 leading-tight">
                Forbind dine <span className="text-indigo-600">mål</span> <br />
                med dit <span className="text-amber-500">pensum</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed italic">
                Klik på et læringsmål for at se hvilke dele af dit pensum der er relevante, eller vælg et dokument for at se hvilke mål det dækker.
            </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 relative">
          
          {/* CENTER DECORATION - FLOW LINES (Abstract) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
              <svg width="400" height="600" viewBox="0 0 400 600" fill="none" className="hidden lg:block">
                  <path d="M50 100 Q 200 300 350 500" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" className="text-indigo-200" />
                  <path d="M50 200 Q 150 250 350 150" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" className="text-amber-200" />
                  <path d="M50 400 Q 250 300 350 100" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" className="text-emerald-200" />
              </svg>
          </div>

          {/* LEFT COLUMN: LEARNING GOALS */}
          <div className="space-y-8 relative z-10">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                <Target className="w-5 h-5 text-indigo-500" /> Læringsmål
              </h3>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{learningGoals.length} Mål</span>
            </div>

            <div className="space-y-4">
              {learningGoals.map((goal, i) => {
                const isActive = selectedGoal === i;
                const isRelated = selectedMaterial && materialMapping[selectedMaterial]?.some(m => m.goalIndex === i);
                
                return (
                  <motion.div
                    key={i}
                    layout
                    onClick={() => {
                        setSelectedGoal(selectedGoal === i ? null : i);
                        setSelectedMaterial(null);
                    }}
                    className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer group relative overflow-hidden
                      ${isActive 
                        ? 'border-indigo-600 bg-white shadow-2xl shadow-indigo-100 scale-[1.02]' 
                        : isRelated
                        ? 'border-indigo-400 bg-indigo-50/50 scale-[1.01]'
                        : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5'}`}
                  >
                    <div className="flex items-start gap-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500
                        ${isActive ? 'bg-indigo-600 text-white rotate-6' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                        {isActive ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-black">{i + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-[13px] font-black leading-relaxed transition-colors ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                          {goal}
                        </p>
                        {isActive && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relevant pensum fremhævet til højre</span>
                            </div>
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Find the first material that has steps for this goal
                                const firstMatWithSteps = materials.find(m => 
                                  materialMapping[m.id]?.some(mapping => mapping.goalIndex === i && mapping.steps?.length > 0)
                                );
                                setWorkMode({ 
                                  active: true, 
                                  materialId: firstMatWithSteps?.id || null, 
                                  goalIndex: i 
                                });
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                Start Master-Flow
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: PENSUM / MATERIALS */}
          <div className="space-y-8 relative z-10">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-amber-500" /> Mit Pensum
              </h3>
              <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{materials.length} Filer</span>
                  <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">
                    Filtreret efter: {curriculum?.modules?.find((m: any) => m.id === selectedModuleId)?.name || selectedModuleId || userProfile?.semester}
                  </span>
              </div>
            </div>

            <div className="space-y-4">
              {isLoadingMaterials ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Henter dit pensum...</p>
                </div>
              ) : materials.length > 0 ? (
                materials.map((m) => {
                  const isActive = selectedMaterial === m.id;
                  const isRelated = selectedGoal !== null && materialMapping[m.id]?.some(gm => gm.goalIndex === selectedGoal);
                  
                  return (
                    <motion.div
                      key={m.id}
                      layout
                      onClick={() => {
                          setSelectedMaterial(selectedMaterial === m.id ? null : m.id);
                          setSelectedGoal(null);
                      }}
                      className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer group relative overflow-hidden
                        ${isActive 
                          ? 'border-amber-500 bg-white shadow-2xl shadow-amber-100 scale-[1.02]' 
                          : isRelated
                          ? 'border-amber-400 bg-amber-50/50 scale-[1.01]'
                          : 'border-slate-100 bg-white hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center shrink-0 transition-all duration-500 shadow-sm
                          ${isActive ? 'bg-amber-500 text-white -rotate-6' : 'bg-slate-50 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500'}`}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[13px] font-[900] truncate tracking-tight transition-colors ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                            {m.name || m.displayName || m.fileName || 'Uden navn'}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-300" />
                                <span className="text-[9px] font-black uppercase text-slate-400">Læsetid: ~15 min</span>
                            </div>
                            {isRelated && (
                                <span className="text-[8px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Relevant for mål</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform ${isActive ? 'rotate-90 text-amber-500' : 'group-hover:translate-x-1'}`} />
                      </div>

                      {isActive && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 pt-6 border-t border-slate-100 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dækker følgende mål:</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full">
                                    <Sparkles className="w-3 h-3 text-indigo-600" />
                                    <span className="text-[8px] font-black text-indigo-600 uppercase">AI-Vejledning</span>
                                </div>
                            </div>
                                {(!materialMapping[m.id] || materialMapping[m.id].length === 0) ? (
                                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center space-y-3">
                                        <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Ingen AI-kortlægning endnu</p>
                                        <p className="text-[10px] text-slate-400 leading-relaxed px-4">
                                            Gå til 'Mine Materialer' og klik på 'Danne AI Overblik' for at forbinde dette dokument med dine læringsmål.
                                        </p>
                                        <Button 
                                            onClick={() => router.push('/mine-materialer')}
                                            className="bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100 rounded-xl h-8 px-4 text-[9px] font-black uppercase tracking-widest mt-2"
                                        >
                                            Gå til mine materialer
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {materialMapping[m.id]?.map((mapData, idx) => (
                                            <div key={idx} className="p-5 bg-slate-50/80 rounded-[2rem] border border-slate-100 group/item hover:bg-white hover:border-indigo-100 transition-all">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                                        {mapData.goalIndex + 1}
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-[11px] font-[900] text-slate-900 leading-relaxed">
                                                            {learningGoals[mapData.goalIndex]}
                                                        </p>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-start gap-2">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                                                <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">{mapData.reason}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-3">
                                    <Button 
                                        onClick={() => {
                                            // Start work mode for the FIRST goal found in mapping or the current selected goal
                                            const targetGoal = selectedGoal !== null ? selectedGoal : materialMapping[m.id][0].goalIndex;
                                            setWorkMode({ active: true, materialId: m.id, goalIndex: targetGoal });
                                        }}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all flex items-center gap-2"
                                    >
                                        <Zap className="w-4 h-4 text-amber-300" />
                                        Start Arbejdsflow
                                    </Button>
                                    <Button 
                                        onClick={() => window.open(m.url, '_blank')}
                                        variant="outline"
                                        className="w-full border-slate-200 text-slate-600 h-14 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Åbn og læs dokument
                                    </Button>
                                </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[3rem]">
                    <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-black text-slate-900 mb-2">Intet pensum fundet</p>
                    <p className="text-xs text-slate-400 max-w-[200px] mx-auto">Upload dine materialer under 'Mit pensum' for at se dem her.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM TIPS SECTION */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
            {[
                { 
                    title: "Fokusér din læsning", 
                    desc: "Brug overblikket til at prioritere det pensum, der direkte dækker de sværeste læringsmål.",
                    icon: <Zap className="w-6 h-6 text-amber-500" />
                },
                { 
                    title: "Eksamensforberedelse", 
                    desc: "Gennemgå hvert mål og tjek om du har læst det tilknyttede materiale grundigt nok.",
                    icon: <Layout className="w-6 h-6 text-indigo-500" />
                },
                { 
                    title: "Mangler du noget?", 
                    desc: "Hvis et mål ikke har noget tilknyttet pensum, bør du søge efter supplerende kilder.",
                    icon: <HelpCircle className="w-6 h-6 text-emerald-500" />
                }
            ].map((tip, i) => (
                <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        {tip.icon}
                    </div>
                    <h4 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-widest">{tip.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{tip.desc}</p>
                </div>
            ))}
        </div>
      </main>

      {/* WORK MODE OVERLAY */}
      <AnimatePresence>
        {workMode.active && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            {/* Header */}
            <div className="h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-white shrink-0">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setWorkMode({ active: false, materialId: null, goalIndex: null })}
                  className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Arbejdsflow
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {workMode.materialId 
                      ? (materials.find(m => m.id === workMode.materialId)?.name || materials.find(m => m.id === workMode.materialId)?.displayName || 'Dokument')
                      : 'Modul Overblik'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                    onClick={handleGenerateFlow}
                    disabled={isGeneratingFlow}
                    variant="outline"
                    className="border-slate-200 text-slate-500 h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    {isGeneratingFlow ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                    Gen-analyser alt
                </Button>
                <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Aktiv læring</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Side: Guided Content */}
              <div className="w-[450px] border-r border-slate-100 overflow-y-auto bg-slate-50/30 p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aktuelt Mål</p>
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        {workMode.goalIndex !== null ? learningGoals[workMode.goalIndex] : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Din Guide Gennem Teksten
                  </h3>
                  
                  <div className="space-y-4">
                    {isGeneratingFlow ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative w-20 h-20 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                                    <Brain className="w-10 h-10 text-indigo-600 animate-pulse" />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent" />
                                </div>
                                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-bounce" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-[900] text-slate-900 tracking-tight">AI Analyserer Pensum...</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Udtager fokuspunkter & afsnit</p>
                            </div>
                            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                                />
                            </div>
                        </div>
                    ) : (() => {
                      // Aggregated steps for the ENTIRE module flow
                      const allSteps: any[] = [];
                      
                      learningGoals.forEach((goal, gIdx) => {
                        materials.forEach(m => {
                          const mMapping = materialMapping[m.id]?.find(mapping => mapping.goalIndex === gIdx);
                          if (mMapping) {
                            if (mMapping.steps && mMapping.steps.length > 0) {
                              mMapping.steps.forEach(s => {
                                allSteps.push({
                                  ...s,
                                  materialId: m.id,
                                  materialName: m.name || m.displayName,
                                  goalIndex: gIdx,
                                  goalName: goal
                                });
                              });
                            } else {
                              // Fallback: Create a default step from the reason
                              allSteps.push({
                                title: "Fordybelse i dokumentet",
                                description: mMapping.reason || "Læs dette dokument for at opnå forståelse for målet.",
                                context: "AI har endnu ikke udtrukket specifikke afsnit. Læs dokumentet i sin helhed med fokus på læringsmålet.",
                                materialId: m.id,
                                materialName: m.name || m.displayName,
                                goalIndex: gIdx,
                                goalName: goal
                              });
                            }
                          }
                        });
                      });

                      if (allSteps.length > 0) {
                        // RANKING LOGIC: Sort steps based on document properties
                        allSteps.sort((a, b) => {
                          // 1. Goal order (fundamental goals first)
                          if (a.goalIndex !== b.goalIndex) return a.goalIndex - b.goalIndex;
                          
                          // 2. Introductory documents first
                          const aData = materials.find(m => m.id === a.materialId)?.aiOverviewData;
                          const bData = materials.find(m => m.id === b.materialId)?.aiOverviewData;
                          
                          let aIntro = false;
                          let bIntro = false;
                          let aComp = 'begynder';
                          let bComp = 'begynder';
                          
                          try {
                            if (aData) {
                                const p = JSON.parse(aData);
                                aIntro = p.isIntroductory || false;
                                aComp = p.complexity || 'begynder';
                            }
                            if (bData) {
                                const p = JSON.parse(bData);
                                bIntro = p.isIntroductory || false;
                                bComp = p.complexity || 'begynder';
                            }
                          } catch (e) {}

                          if (aIntro !== bIntro) return aIntro ? -1 : 1;

                          // 3. Complexity order
                          const compOrder: Record<string, number> = { 'begynder': 0, 'øvet': 1, 'ekspert': 2 };
                          if (aComp !== bComp) return (compOrder[aComp] || 0) - (compOrder[bComp] || 0);

                          return 0;
                        });

                        // Group steps by goal to show dividers
                        let currentGoalIdx = -1;

                        return allSteps.map((step: any, i: number) => {
                          const isCurrentMaterial = workMode.materialId === step.materialId;
                          const showGoalDivider = step.goalIndex !== currentGoalIdx;
                          if (showGoalDivider) currentGoalIdx = step.goalIndex;
                          
                          return (
                            <React.Fragment key={i}>
                              {showGoalDivider && (
                                <div className="pt-4 pb-2">
                                  <h4 className="text-[10px] font-black text-indigo-600/50 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Target className="w-3 h-3" />
                                    {step.goalName}
                                  </h4>
                                </div>
                              )}
                              <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => {
                                  // Switch PDF and Goal and PAGE
                                  setWorkMode({ 
                                    active: true, 
                                    materialId: step.materialId, 
                                    goalIndex: step.goalIndex,
                                    currentPage: step.pageNumber || 1
                                  });
                                }}
                                className={`p-6 rounded-[2rem] border transition-all space-y-3 group cursor-pointer
                                  ${isCurrentMaterial && workMode.goalIndex === step.goalIndex && (workMode.currentPage === step.pageNumber || !step.pageNumber)
                                    ? 'bg-white border-indigo-200 shadow-md ring-2 ring-indigo-50' 
                                    : 'bg-white/50 border-slate-100 opacity-70 hover:opacity-100'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest
                                      ${isCurrentMaterial && workMode.goalIndex === step.goalIndex ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                      Trin {i + 1}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-400 truncate max-w-[150px]">
                                      {step.materialName}
                                    </span>
                                  </div>
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${isCurrentMaterial && workMode.goalIndex === step.goalIndex ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 group-hover:border-emerald-500'}`}>
                                    {isCurrentMaterial && workMode.goalIndex === step.goalIndex ? <ArrowRight className="w-3 h-3 text-indigo-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                  </div>
                                </div>
                                <p className="text-sm font-black text-slate-900">{step.title}</p>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.description}</p>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                        Fokus i teksten:
                                    </p>
                                    <p className="text-[11px] text-slate-700 italic leading-relaxed">
                                        "{step.context}"
                                    </p>
                                </div>
                              </motion.div>
                            </React.Fragment>
                          );
                        });
                      }

                      return (
                        <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-amber-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-[900] text-amber-900 uppercase tracking-tight">Klar til fordybelse?</p>
                                <p className="text-[10px] text-amber-700/70 leading-relaxed px-4">
                                    AI har endnu ikke analyseret dine dokumenter for specifikke fokuspunkter til dette mål.
                                </p>
                            </div>
                            <Button 
                                onClick={handleGenerateFlow}
                                className="bg-amber-500 hover:bg-amber-600 text-white h-12 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200 active:scale-95 transition-all"
                            >
                                Gør Studie-Flow Klar
                            </Button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                    <Button 
                        onClick={() => setWorkMode({ active: false, materialId: null, goalIndex: null })}
                        className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200"
                    >
                        Afslut Arbejdsflow
                    </Button>
                </div>
              </div>

              {/* Right Side: PDF Viewer */}
              <div className="flex-1 bg-slate-800 relative">
                {workMode.materialId && (
                  <iframe 
                    key={`${workMode.materialId}-${workMode.currentPage}`}
                    src={`${materials.find(m => m.id === workMode.materialId)?.url}#page=${workMode.currentPage || 1}&toolbar=0&navpanes=0`} 
                    className="w-full h-full border-none"
                    title="PDF Viewer"
                  />
                )}
                <div className="absolute top-4 right-4 pointer-events-none">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">PDF Viewer</span>
                    </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
};

export default LaeringsStiPage;
