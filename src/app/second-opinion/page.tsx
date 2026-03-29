'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building,
  ShieldCheck,
  Scale,
  Share2,
  Bookmark,
  SearchCode, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  Loader2, 
  FileText, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ThumbsUp, 
  ThumbsDown, 
  ListChecks, 
  ChevronRight, 
  X, 
  UploadCloud, 
  File as FileIcon, 
  ArrowUpRight, 
  History, 
  XCircle, 
  Gavel, 
  Lock,
  ChevronDown,
  Clock,
  Layout,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Quote
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { 
  doc, 
  getDoc, 
  writeBatch, 
  increment, 
  serverTimestamp, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  setDoc,
  addDoc,
  where
} from 'firebase/firestore';
import { getSecondOpinionAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { calculateStudyStarted } from '@/lib/education';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

// --- TYPES ---

interface Analysis {
  isComplaintJustified: boolean;
  isGradeAccurate: boolean;
  gradeAccuracyArgument: string;
  strengths: string[];
  weaknesses: string[];
  riskAssessment: string[];
  suggestedNextSteps: string[];
}

interface SecondOpinionRecord {
  id: string;
  input: {
    grade: string;
    [key: string]: any;
  };
  analysis: Analysis;
  createdAt: any;
}

// --- PDF EXTRACTION ---

async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
  const pdfjsVersion = '4.10.38'; 
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  
  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({data: new Uint8Array(buffer)});
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ');
    text += strings + '\n';
  }
  return text;
}

// --- COMPONENTS ---

const DashboardCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'amber' | 'slate' | 'rose';
}> = ({ title, icon, children, className, variant = 'white' }) => {
    const variantStyles = {
        white: 'bg-white border-amber-100',
        amber: 'bg-amber-50/50 border-amber-100',
        slate: 'bg-slate-50/50 border-slate-100',
        rose: 'bg-rose-50/50 border-rose-100'
    };

    return (
        <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${variantStyles[variant]} p-10 rounded-[3.5rem] border shadow-sm relative group hover:shadow-xl transition-all ${className}`}
        >
            <div className="flex items-center gap-3 border-b border-black/5 pb-6 mb-8">
                <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-amber-950 shadow-sm border border-black/5">
                    {icon}
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">{title}</h3>
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </motion.section>
    );
};

const ModuleCard: React.FC<{
  module: any;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ module, isSelected, onSelect }) => {
  return (
    <button 
      onClick={onSelect}
      className={`relative p-8 rounded-[2.5rem] border transition-all text-left flex flex-col gap-4 group ${
        isSelected 
          ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400 shadow-lg shadow-amber-100/50' 
          : 'bg-white border-slate-100 hover:border-amber-200 hover:bg-slate-50/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-xs font-black shrink-0 border transition-colors ${
          isSelected ? 'bg-amber-600 text-white border-amber-500' : 'bg-white text-amber-600 border-amber-50'
        }`}>
          {module.id}
        </div>
        {module.ects && (
          <span className={`text-[10px] font-black px-3 py-1 rounded-full border transition-colors ${
            isSelected ? 'bg-amber-600 text-white border-amber-500' : 'bg-amber-100 text-amber-700 border-amber-200'
          }`}>
            {module.ects} ECTS
          </span>
        )}
      </div>
      <div>
        <h4 className="font-black text-slate-900 leading-tight mb-2 text-lg group-hover:text-amber-950 transition-colors">{module.name}</h4>
        <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3">
          {module.description || module.about || 'Ingen yderligere beskrivelse for dette modul.'}
        </p>
      </div>
      <div className="mt-auto pt-4 flex gap-1.5 flex-wrap">
        <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
          isSelected ? 'text-amber-600' : 'text-slate-300 group-hover:text-amber-400'
        }`}>
          {isSelected ? 'Valgt Modul' : 'Identificeret modul'}
        </span>
      </div>
    </button>
  );
};

const MultiCurriculumSelection: React.FC<{
  institution?: string;
  profession?: string;
  curriculums: any[];
  selectedCurriculumId: string;
  selectedModuleId: string;
  setSelectedModuleId: (id: string) => void;
  isLoading: boolean;
}> = ({ institution, profession, curriculums, selectedCurriculumId, selectedModuleId, setSelectedModuleId, isLoading }) => {
  const currentCurriculum = curriculums.find(c => c.id === selectedCurriculumId) || curriculums[0];

  return (
    <div className="col-span-1 md:col-span-2 space-y-8">
      {/* Selection Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-amber-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-amber-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-inner">
                  <Building className="w-6 h-6 text-amber-600" />
               </div>
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-200">{profession || 'Uddannelse'}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">{institution || 'Institution'}</span>
                  </div>
                  <h3 className="text-2xl font-black text-amber-950 serif">{currentCurriculum?.title || 'Studieordning er indlæst'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Automatisk matchet ud fra din brugerprofil</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-6 px-4">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-900/40">Vælg det relevante modul for din opgave</h4>
          {currentCurriculum?.modules && (
            <span className="text-[10px] font-bold text-slate-400 italic">{currentCurriculum.modules.length} moduler identificeret</span>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-amber-100">
             <Loader2 className="w-10 h-10 animate-spin text-amber-200 mx-auto mb-4" />
             <p className="text-sm text-slate-400 font-bold italic">Søger efter studieordninger...</p>
          </div>
        ) : currentCurriculum?.modules ? (
          <div className="grid md:grid-cols-2 gap-6 animate-ink">
            {currentCurriculum.modules.map((m: any, idx: number) => (
              <ModuleCard 
                key={m.id || idx}
                module={m}
                isSelected={selectedModuleId === (m.id || String(idx+1))}
                onSelect={() => setSelectedModuleId(m.id || String(idx+1))}
              />
            ))}
          </div>
        ) : (
          <div className="bg-rose-50/50 border-2 border-dashed border-rose-100 rounded-[3rem] p-12 text-center">
             <AlertTriangle className="w-12 h-12 text-rose-300 mx-auto mb-4" />
             <h5 className="text-lg font-bold text-rose-950">Ingen studieordning fundet</h5>
             <p className="text-sm text-rose-500/70 max-w-sm mx-auto leading-relaxed mt-2">
               Admins har endnu ikke uploadet den officielle studieordning for din kombination af institution og uddannelse. Kontakt support hvis du mener dette er en fejl.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

const FileInputCard: React.FC<{
  file: File | null;
  setFile: (file: File | null) => void;
  label: string;
  id: string;
  required?: boolean;
}> = ({ file, setFile, label, id, required }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm hover:border-amber-400 transition-all group overflow-hidden relative">
      <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-amber-900/50 mb-3">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {file ? (
        <div className="flex items-center justify-between gap-4 p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
               <FileIcon className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-amber-950 truncate">{file.name}</span>
          </div>
          <button onClick={() => setFile(null)} className="p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-100 rounded-xl transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label htmlFor={id} className="relative block w-full border-2 border-dashed border-amber-100 rounded-2xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all group/label">
            <UploadCloud className="mx-auto h-8 w-8 text-amber-200 group-hover/label:text-amber-400 transition-colors" />
            <span className="mt-3 block text-[9px] font-black uppercase tracking-widest text-amber-900/40">Vælg PDF</span>
            <input id={id} name={id} type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
};

// --- PAGE CONTENT ---

const SecondOpinionPageContent = () => {
    const router = useRouter();
    const { user, userProfile, refetchUserProfile } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>('');
    const [selectedModuleId, setSelectedModuleId] = useState<string>(userProfile?.semester || '1');
    const [curriculums, setCurriculums] = useState<any[]>([]);
    const [isLoadingCurriculums, setIsLoadingCurriculums] = useState(true);

    const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
    const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
    const [grade, setGrade] = useState('');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState<{ step: number; label: string }>({ step: 0, label: '' });
    const [result, setResult] = useState<Analysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [limitError, setLimitError] = useState<string | null>(null);
    const [pastOpinions, setPastOpinions] = useState<SecondOpinionRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    // Fetch curriculums for the user's institution and profession
    useEffect(() => {
        if (!user || !firestore || !userProfile?.institution || !userProfile?.profession) {
            setIsLoadingCurriculums(false);
            return;
        }
        
        setIsLoadingCurriculums(true);
        // Robust fetch: Query by profession only to handle naming variations in institutions client-side
        const q = query(
            collection(firestore, 'curriculums'),
            where('profession', '==', userProfile.profession)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setCurriculums(records);
            if (records.length > 0 && !selectedCurriculumId) {
                // Initial selection based on study start date
                const studyStarted = userProfile?.studyStarted || calculateStudyStarted(userProfile?.semester || '1. Semester');
                const bestMatch = (records.find((c: any) => {
                    const start = c.validFrom;
                    const end = c.validTo;
                    return (!start || studyStarted >= start) && (!end || studyStarted < end);
                }) || records[0]) as any;
                setSelectedCurriculumId(bestMatch.id);
                
                // Also auto-select the module based on user's semester
                const semStr = String(userProfile?.semester || '1').replace(/\D/g, '');
                const m = bestMatch.modules?.find((mod: any) => {
                  const id = (mod.id || '').toLowerCase();
                  const name = (mod.name || '').toLowerCase();
                  return id.includes(semStr) || name.includes(semStr);
                }) || bestMatch.modules?.[parseInt(semStr) - 1];
                
                if (m) setSelectedModuleId(m.id || m.name || semStr);
            }
            setIsLoadingCurriculums(false);
        }, (err) => {
            console.error('[SecondOpinion] curriculum listener error:', err);
            setIsLoadingCurriculums(false);
        });

        return () => unsubscribe();
    }, [user, firestore, userProfile?.institution, userProfile?.profession]);

    const matchedModule = useMemo(() => {
        if (!curriculums || curriculums.length === 0 || !selectedCurriculumId) return null;
        
        const curr = curriculums.find(c => c.id === selectedCurriculumId);
        if (!curr) return null;

        const modId = selectedModuleId.toLowerCase();
        const module = curr.modules?.find((m: any) => {
            const id = (m.id || '').toLowerCase();
            const name = (m.name || '').toLowerCase();
            return id === modId || name === modId || id.includes(modId) || name.includes(modId);
        }) || curr.modules?.[parseInt(selectedModuleId) - 1];

        if (!module) return null;

        return {
            ...module,
            curriculumTitle: curr.title || 'Studieordning'
        };
    }, [curriculums, selectedCurriculumId, selectedModuleId]);

    // Fetch history
    useEffect(() => {
        if (!user || !firestore) return;
        const q = query(
            collection(firestore, 'users', user.uid, 'secondOpinions'), 
            orderBy('createdAt', 'desc'), 
            limit(10)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SecondOpinionRecord[];
            setPastOpinions(records.filter(r => r.id !== 'latest'));
            setIsLoadingHistory(false);
        }, (err) => {
            console.error('[SecondOpinion] history listener error:', err);
            setIsLoadingHistory(false);
        });
        return () => unsubscribe();
    }, [user, firestore]);

    const isFormValid = useMemo(() => {
        return matchedModule && assignmentFile && grade.trim();
    }, [matchedModule, assignmentFile, grade]);

      const isPremiumUser = useMemo(() => {
        const m = userProfile?.membership;
        return m && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(m);
    }, [userProfile]);

    const handleGetSecondOpinion = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!isFormValid || isAnalyzing || !user || !userProfile || !firestore) return;

        setIsAnalyzing(true);
        setResult(null);
        setError(null);
        setLimitError(null);
        setAnalysisProgress({ step: 1, label: 'Parser dokumenter...' });

        let progressInterval: NodeJS.Timeout | undefined;
        progressInterval = setInterval(() => {
            setAnalysisProgress(prev => {
                if (prev.step === 1) return { step: 2, label: 'Analyserer rød tråd og taksonomi...' };
                if (prev.step === 2) return { step: 3, label: 'Sammenligner med læringsmål...' };
                if (prev.step === 3) return { step: 4, label: 'Syntetiserer juridisk vurdering...' };
                return prev;
            });
        }, 3000);

        try {
            const userRef = doc(firestore, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data() || {};
            
            const lastUsage = userData.lastSecondOpinionUsage?.toDate();
            const now = new Date();
            const isNewMonth = !lastUsage || lastUsage.getMonth() !== now.getMonth() || lastUsage.getFullYear() !== now.getFullYear();

            let limitVal = 1;
            switch (userProfile.membership) {
                case 'Group Pro':
                case 'Kollega':
                    limitVal = 100;
                    break;
                case 'Kollega+':
                case 'Kollega++':
                case 'Institution':
                    limitVal = 1000;
                    break;
                default:
                    limitVal = 1; 
            }
            
            const currentCount = isNewMonth ? 0 : (userData.monthlySecondOpinionCount || 0);

            if (currentCount >= limitVal && !['Kollega+', 'Kollega++', 'Institution'].includes(userProfile.membership || '')) {
                 const planName = userProfile.membership || 'din plan';
                 setLimitError(`Månedlig grænse nået for ${planName}.`);
                 setIsAnalyzing(false);
                 if (progressInterval) clearInterval(progressInterval);
                 return;
            }

            // Client-side extraction
            const learningGoals = Array.isArray(matchedModule.learningGoals) 
                ? matchedModule.learningGoals.join('\n') 
                : (matchedModule.learningObjectives || '');
                
            const studyText = `CURRICULUM: ${matchedModule.curriculumTitle}\nMODULE: ${matchedModule.name || ''}\n\nDESCRIPTION:\n${matchedModule.description || matchedModule.about || ''}\n\nLEARNING OBJECTIVES:\n${learningGoals}`;
            const examText = matchedModule.examForm || matchedModule.examInfo || matchedModule.description || matchedModule.about || 'Ingen specifikke eksamensbestemmelser fundet.';

            const [assignmentText, feedbackText] = await Promise.all([
                extractTextFromPdf(assignmentFile!),
                feedbackFile ? extractTextFromPdf(feedbackFile) : Promise.resolve(undefined),
            ]);

            const response = await getSecondOpinionAction({
                studyRegulations: studyText,
                examRegulations: examText,
                assignmentText: assignmentText,
                grade: grade,
                feedback: feedbackText
            });

            const analysisResult = response.data;
            setResult(analysisResult);

            // Save
            const batch = writeBatch(firestore);
            const secondOpinionRef = doc(collection(firestore, 'users', user.uid, 'secondOpinions'));
            const dataToSave = { 
                input: { grade }, 
                analysis: analysisResult, 
                isUndervalued: !analysisResult.isGradeAccurate, // Markeres hvis opgaven er undervurderet
                createdAt: serverTimestamp() 
            };
            batch.set(secondOpinionRef, dataToSave);
            batch.set(doc(firestore, 'users', user.uid, 'secondOpinions', 'latest'), dataToSave);

            const userUpdates: any = {};
            if (isNewMonth) userUpdates.monthlySecondOpinionCount = 1;
            else userUpdates.monthlySecondOpinionCount = increment(1);
            userUpdates.lastSecondOpinionUsage = serverTimestamp();
            userUpdates.cohéroPoints = increment(500);

            batch.update(userRef, userUpdates);
            await batch.commit();
            await refetchUserProfile();

        } catch (err: any) {
            setError('Der skete en fejl. Prøv igen.');
            toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke gennemføre analysen." });
        } finally {
            setIsAnalyzing(false);
            setAnalysisProgress({ step: 0, label: '' });
            if (progressInterval) clearInterval(progressInterval);
        }
    };

    return (
    <div className="bg-[#FDFCF8] min-h-screen flex flex-col selection:bg-amber-100">
        
        {/* HEADER */}
        <header className="w-full h-20 bg-white/80 backdrop-blur-md border-b border-amber-50 px-8 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-6">
                <Link href="/portal" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all border border-amber-100">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-900 rounded-xl flex items-center justify-center text-white shadow-lg"><Scale className="w-5 h-5" /></div>
                    <h1 className="text-xl font-bold text-amber-950 serif tracking-tight hidden sm:block">Second Opinion</h1>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-3 rounded-2xl transition-all border ${showHistory ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}
                >
                    <History className="w-5 h-5" />
                </button>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-full border border-rose-100 text-[10px] font-black uppercase tracking-widest text-rose-900">
                    <ShieldCheck className="w-4 h-4" /> Klage-tjek aktivt
                </div>
            </div>
        </header>

        {/* MAIN DASHBOARD */}
        <main className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 pt-12 pb-40">
            <AnimatePresence mode="wait">
                {!result && !isAnalyzing ? (
                    <motion.div 
                        key="input-screen"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
                    >
                        {/* LEFT: HERO & INFO */}
                        <div className="lg:col-span-4 space-y-10">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-rose-100">
                                    <Sparkles className="w-4 h-4 text-rose-500" /> AI-drevet karakter-audit
                                </div>
                                <h2 className="text-5xl md:text-7xl font-black text-amber-950 serif tracking-tighter leading-none">
                                    Er din karakter <span className="text-rose-700 italic">retvisende</span>?
                                </h2>
                                <p className="text-lg text-slate-500 font-medium italic leading-relaxed">
                                    Upload din opgave og pensumkrav for at få en uvildig analyse af din bedømmelse – før du beslutter dig for at klage.
                                </p>
                            </div>

                            {/* HISTORY DRAWER (Inline on Desktop) */}
                            {showHistory && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-8 bg-white border border-amber-100 rounded-[3rem] shadow-sm space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tidligere analyser</h4>
                                    <div className="space-y-3">
                                        {pastOpinions.length > 0 ? (
                                            pastOpinions.map(op => (
                                                <button key={op.id} onClick={() => setResult(op.analysis)} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-amber-50 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4 text-slate-400" />
                                                        <span className="text-xs font-bold text-amber-950">Karakter {op.input.grade}</span>
                                                    </div>
                                                    <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-1" />
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-slate-300 text-center py-4 uppercase font-black">Ingen historik fundet</p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* RIGHT: UPLOAD FORM */}
                        <div className="lg:col-span-8 bg-white p-10 md:p-14 rounded-[4rem] border border-amber-100 shadow-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-12 w-64 h-64 bg-rose-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-10" />
                             
                             <form onSubmit={handleGetSecondOpinion} className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <MultiCurriculumSelection 
                                        institution={userProfile?.institution}
                                        profession={userProfile?.profession}
                                        curriculums={curriculums}
                                        selectedCurriculumId={selectedCurriculumId}
                                        selectedModuleId={selectedModuleId}
                                        setSelectedModuleId={setSelectedModuleId}
                                        isLoading={isLoadingCurriculums}
                                    />
                                    <FileInputCard file={assignmentFile} setFile={setAssignmentFile} label="Besvarelse" id="assign" required />
                                    <FileInputCard file={feedbackFile} setFile={setFeedbackFile} label="Feedback (valgfri)" id="feed" />
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-8 pt-8 border-t border-amber-50">
                                    <div className="flex-1 w-full space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-amber-900/50">Modtaget Karakter</label>
                                        <input 
                                            value={grade} 
                                            onChange={e => setGrade(e.target.value)}
                                            placeholder="f.eks. 4 el. 7" 
                                            className="w-full bg-slate-50 border border-amber-100 py-6 px-10 rounded-[2.5rem] text-2xl font-black text-amber-950 focus:ring-4 focus:ring-rose-100 outline-none transition-all placeholder:text-slate-200"
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={!isFormValid || isAnalyzing}
                                        className="h-20 w-full md:w-auto px-12 bg-rose-950 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-rose-900 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
                                    >
                                        Start Analysen <Zap className="w-5 h-5 text-amber-400" />
                                    </button>
                                </div>

                                {limitError && (
                                    <div className="p-6 bg-amber-950 text-white rounded-3xl text-center space-y-4">
                                        <p className="text-xs font-bold font-serif italic text-amber-200">{limitError}</p>
                                        <Link href="/upgrade" className="inline-flex items-center gap-2 text-[10px] font-black uppercase border-b border-white/20 pb-1">Opgrader nu</Link>
                                    </div>
                                )}
                             </form>
                        </div>
                    </motion.div>
                ) : isAnalyzing ? (
                   <motion.div 
                        key="loading-screen"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-[600px] flex flex-col items-center justify-center space-y-12"
                   >
                        <div className="relative">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="w-48 h-48 border-2 border-dashed border-rose-200 rounded-full"
                            />
                            <motion.div 
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-4 border-2 border-dotted border-amber-200 rounded-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1] }} 
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-20 h-20 bg-rose-950 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl"
                                >
                                    <Gavel className="w-8 h-8" />
                                </motion.div>
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-bold text-amber-950 serif">{analysisProgress.label}</h3>
                            <div className="flex items-center justify-center gap-2">
                                {[1,2,3,4].map(s => (
                                    <div key={s} className={`w-2 h-2 rounded-full transition-all duration-500 ${analysisProgress.step >= s ? 'bg-rose-600 scale-125' : 'bg-slate-200'}`} />
                                ))}
                            </div>
                        </div>
                   </motion.div>
                ) : result && (
                    <motion.div 
                        key="result-screen"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                         {/* DASHBOARD GRID */}
                         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                             
                             {/* COLUMN 1: VERDICT & ARGUMENT */}
                             <div className="lg:col-span-8 space-y-8">
                                 <section className={`rounded-[4rem] overflow-hidden shadow-2xl border ${result.isGradeAccurate ? 'bg-emerald-950 border-emerald-900' : 'bg-rose-950 border-rose-900'}`}>
                                     <div className="p-12 md:p-20 flex flex-col md:flex-row items-center gap-12 border-b border-white/5 relative">
                                         <div className="absolute top-0 right-0 p-12 w-64 h-64 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                                         <div className="w-40 h-40 bg-white/10 rounded-[4rem] flex flex-col items-center justify-center backdrop-blur-md shadow-2xl shrink-0 group hover:scale-105 transition-transform">
                                              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Karakter</p>
                                              <p className="text-6xl font-black text-white serif">{grade}</p>
                                         </div>
                                         <div className="text-center md:text-left space-y-4">
                                             <div className="flex items-center justify-center md:justify-start gap-4">
                                                 <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${result.isGradeAccurate ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                     {result.isGradeAccurate ? 'Karakter Bekræftet' : 'Misforhold fundet'}
                                                 </div>
                                                 <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/60 border border-white/10`}>
                                                     Audit ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                                                 </div>
                                             </div>
                                             <h2 className="text-4xl md:text-6xl font-black text-white serif tracking-tighter leading-none">
                                                 {result.isGradeAccurate 
                                                    ? 'Karakteren er pædagogisk retvisende.' 
                                                    : 'Din karakter er potentielt under vurderet.'}
                                             </h2>
                                         </div>
                                     </div>
                                     <div className="p-12 md:p-20 space-y-8 bg-black/10">
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60"><Gavel className="w-4 h-4" /></div>
                                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Juridisk & Faglig Argumentation</h4>
                                         </div>
                                         <div className="prose prose-invert prose-lg max-w-none text-white/80 serif italic italic leading-relaxed" dangerouslySetInnerHTML={{ __html: result.gradeAccuracyArgument }} />
                                     </div>
                                 </section>

                                 {/* DETAILED CARDS ROW 1 */}
                                 {isPremiumUser ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                         <DashboardCard title="Opgavens Styrker" icon={<ThumbsUp className="w-4 h-4 text-emerald-600" />} variant="slate">
                                            <ul className="space-y-4">
                                                {result.strengths.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 text-sm text-slate-600 font-medium">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                         </DashboardCard>
                                         <DashboardCard title="Opgavens Svagheder" icon={<ThumbsDown className="w-4 h-4 text-rose-600" />} variant="rose">
                                            <ul className="space-y-4">
                                                {result.weaknesses.map((w, i) => (
                                                    <li key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-rose-100 text-sm text-rose-600 font-medium italic">
                                                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                                        <span>{w}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                         </DashboardCard>
                                    </div>
                                 ) : (
                                    <section className="bg-amber-950 p-12 md:p-20 rounded-[4rem] text-center space-y-10 shadow-2xl overflow-hidden relative group">
                                         <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 to-black/40" />
                                         <div className="relative z-10 space-y-6">
                                             <div className="w-20 h-20 bg-amber-400 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl text-amber-950 group-hover:rotate-12 transition-transform duration-500"><Lock className="w-10 h-10" /></div>
                                             <h3 className="text-3xl md:text-5xl font-black text-white serif tracking-tighter">Lås op for dybden</h3>
                                             <p className="text-white/60 text-lg max-w-sm mx-auto font-medium italic">Få præcise styrker, svagheder og din personlige klage-risiko vurdering.</p>
                                             <Link href="/upgrade" className="inline-block px-12 py-6 bg-white text-rose-950 rounded-full font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all shadow-2xl">Opgrader nu</Link>
                                         </div>
                                    </section>
                                 )}
                             </div>

                             {/* COLUMN 2: RISKS & NEXT STEPS */}
                             <div className="lg:col-span-4 space-y-8">
                                 {isPremiumUser && (
                                     <>
                                         <DashboardCard title="Risiko ved klage" icon={<AlertTriangle className="w-4 h-4 text-amber-600" />} variant="amber">
                                            <div className="space-y-4">
                                                {result.riskAssessment.map((r, i) => (
                                                    <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-amber-100 text-xs font-bold text-amber-900 italic">
                                                        <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                                        {r}
                                                    </div>
                                                ))}
                                            </div>
                                         </DashboardCard>

                                         <DashboardCard title="Anbefalede skridt" icon={<ListChecks className="w-4 h-4 text-indigo-600" />} variant="slate">
                                            <div className="space-y-3">
                                                {result.suggestedNextSteps.map((step, i) => (
                                                    <button key={i} className="w-full text-left p-5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                                                        <span className="text-[11px] font-black text-slate-500 group-hover:text-indigo-950 transition-colors">{step}</span>
                                                        <ArrowUpRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 group-hover:-translate-y-1 group-hover:translate-x-1" />
                                                    </button>
                                                ))}
                                            </div>
                                         </DashboardCard>
                                     </>
                                 )}

                                 <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => window.print()} className="p-8 bg-white border border-amber-100 rounded-[3rem] flex flex-col items-center gap-4 shadow-sm hover:bg-slate-50 transition-all group">
                                        <Share2 className="w-6 h-6 text-slate-300 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PDF Audit</span>
                                    </button>
                                    <button className="p-8 bg-white border border-amber-100 rounded-[3rem] flex flex-col items-center gap-4 shadow-sm hover:bg-slate-50 transition-all group">
                                        <Bookmark className="w-6 h-6 text-slate-300 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gem Fund</span>
                                    </button>
                                 </div>
                             </div>
                         </div>

                         {/* FOOTER ACTION */}
                         {!result.isGradeAccurate && (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-12">
                                <Link href="/klage-hjaelp">
                                    <button className="px-12 py-6 bg-amber-950 text-white rounded-full font-black uppercase text-xs tracking-[0.4em] flex items-center gap-6 shadow-2xl hover:bg-rose-900 transition-all group">
                                        Generér din officielle klage <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </Link>
                             </motion.div>
                         )}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    </div>
    );
};

const SecondOpinionPage = () => {
  const { user, isUserLoading } = useApp();
  const router = useRouter();

  if (isUserLoading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    router.push('/auth');
    return null;
  }

  return <SecondOpinionPageContent />;
};

export default SecondOpinionPage;
