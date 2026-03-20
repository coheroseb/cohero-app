'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
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
  GraduationCap
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
  addDoc
} from 'firebase/firestore';
import { getSecondOpinionAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
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

const ResultCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className }) => (
  <div 
    className={`bg-white rounded-[2.5rem] border border-amber-100 p-8 shadow-sm animate-ink ${className}`}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-amber-950 serif">{title}</h3>
    </div>
    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium">
      {children}
    </div>
  </div>
);

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
    <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm hover:border-rose-200 transition-all group">
      <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-amber-900/50 mb-3">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {file ? (
        <div className="flex items-center justify-between gap-4 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
               <FileIcon className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-sm font-bold text-rose-950 truncate">{file.name}</span>
          </div>
          <button onClick={() => setFile(null)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label htmlFor={id} className="relative block w-full border-2 border-dashed border-amber-100 rounded-2xl p-8 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50/50 transition-all group/label">
            <UploadCloud className="mx-auto h-10 w-10 text-amber-200 group-hover/label:text-rose-400 transition-colors" />
            <span className="mt-4 block text-[10px] font-black uppercase tracking-widest text-amber-900/40">Træk & slip eller klik for at vælge PDF</span>
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

    const [studyRegulationsFile, setStudyRegulationsFile] = useState<File | null>(null);
    const [examRegulationsFile, setExamRegulationsFile] = useState<File | null>(null);
    const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
    const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
    const [grade, setGrade] = useState('');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<Analysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [limitError, setLimitError] = useState<string | null>(null);
    const [pastOpinions, setPastOpinions] = useState<SecondOpinionRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Fetch history
    useEffect(() => {
        if (!user || !firestore) return;
        const q = query(
            collection(firestore, 'users', user.uid, 'secondOpinions'), 
            orderBy('createdAt', 'desc'), 
            limit(6)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SecondOpinionRecord[];
            setPastOpinions(records.filter(r => r.id !== 'latest'));
            setIsLoadingHistory(false);
        });
        return () => unsubscribe();
    }, [user, firestore]);

    const isFormValid = useMemo(() => {
        return studyRegulationsFile && examRegulationsFile && assignmentFile && grade.trim();
    }, [studyRegulationsFile, examRegulationsFile, assignmentFile, grade]);

     const isPremiumUser = useMemo(() => {
        return userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership);
    }, [userProfile]);

    const handleGetSecondOpinion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || isAnalyzing || !user || !userProfile || !firestore) return;

        setIsAnalyzing(true);
        setResult(null);
        setError(null);
        setLimitError(null);

        try {
            const userRef = doc(firestore, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data() || {};
            
            const lastUsage = userData.lastSecondOpinionUsage?.toDate();
            const now = new Date();
            const isNewMonth = !lastUsage || lastUsage.getMonth() !== now.getMonth() || lastUsage.getFullYear() !== now.getFullYear();

            let limitVal;
            switch (userProfile.membership) {
                case 'Kollega':
                    limitVal = 1;
                    break;
                case 'Kollega+':
                    limitVal = 3;
                    break;
                default:
                    limitVal = 100; 
            }
            
            const currentCount = isNewMonth ? 0 : (userData.monthlySecondOpinionCount || 0);

            if (currentCount >= limitVal) {
                 const planName = userProfile.membership;
                 const upgradeText = planName === 'Kollega' ? ' Opgrader til Kollega+ for flere forsøg.' : '';
                 setLimitError(`Du har brugt dine ${limitVal} månedlige forsøg i Second Opinion for ${planName}.${upgradeText}`);
                 setIsAnalyzing(false);
                 return;
            }

            // Extract text from PDFs on the client
            const [studyRegulationsText, examRegulationsText, assignmentText, feedbackText] = await Promise.all([
                extractTextFromPdf(studyRegulationsFile!),
                extractTextFromPdf(examRegulationsFile!),
                extractTextFromPdf(assignmentFile!),
                feedbackFile ? extractTextFromPdf(feedbackFile) : Promise.resolve(undefined),
            ]);

            // Call Server Action for AI analysis
            const response = await getSecondOpinionAction({
                studyRegulations: studyRegulationsText,
                examRegulations: examRegulationsText,
                assignmentText: assignmentText,
                grade: grade,
                feedback: feedbackText
            });

            const analysisResult = response.data;
            setResult(analysisResult);

            // Save to Firestore
            const batch = writeBatch(firestore);
            const secondOpinionRef = doc(collection(firestore, 'users', user.uid, 'secondOpinions'));
            
            const dataToSave = {
                input: { grade },
                analysis: analysisResult,
                createdAt: serverTimestamp()
            };

            batch.set(secondOpinionRef, dataToSave);
            
            const latestRef = doc(firestore, 'users', user.uid, 'secondOpinions', 'latest');
            batch.set(latestRef, dataToSave);

            const userUpdates: {[key: string]: any} = {};
            if (isNewMonth) {
                userUpdates.monthlySecondOpinionCount = 1;
            } else {
                userUpdates.monthlySecondOpinionCount = increment(1);
            }
            userUpdates.lastSecondOpinionUsage = serverTimestamp();
            userUpdates.cohéroPoints = increment(500); // Reward for using the tool

            batch.update(userRef, userUpdates);
            await batch.commit();
            await refetchUserProfile();

        } catch (err: any) {
            console.error(err);
            setError('Der skete en fejl under analysen. Prøv venligst igen.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
    <div className="bg-[#FDFCF8] min-h-screen flex flex-col selection:bg-rose-100">
        
        {/* Editorial Header */}
        <header className="bg-white border-b border-amber-100 pt-24 pb-16 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-50/30 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <Link href="/portal" className="w-14 h-14 bg-white border border-amber-100 rounded-2xl flex items-center justify-center hover:bg-amber-50 transition-all shadow-sm group">
                            <ArrowLeft className="w-6 h-6 text-amber-950 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-1.5 bg-rose-50 rounded-lg">
                                    <SearchCode className="w-4 h-4 text-rose-700" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-900/50">Akademisk Kontrol</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold text-amber-950 serif tracking-tighter">
                                Second <span className="text-rose-700 italic">Opinion</span>
                            </h1>
                            <p className="text-slate-500 mt-4 max-w-xl text-lg leading-relaxed">
                                Få en uvildig, AI-drevet vurdering af din opgave. Vi sammenligner dit arbejde med studieordningens krav for at se, om din karakter er retvisende.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                         <div className="hidden md:flex items-center gap-3 px-6 py-4 bg-amber-50 text-amber-900 rounded-2xl border border-amber-100">
                            <Gavel className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Klage-vejledning inkluderet</span>
                         </div>
                    </div>
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-6 py-20 grid lg:grid-cols-12 gap-16 relative z-10">
            
            {/* SIDEBAR: INPUTS & HISTORY */}
            <aside className="lg:col-span-4 space-y-12">
                
                <section 
                    className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-xl relative overflow-hidden animate-ink"
                >
                    <h3 className="text-xl font-bold text-amber-950 serif mb-8 flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                            <UploadCloud className="w-5 h-5 text-rose-700" />
                        </div>
                        Upload Dokumenter
                    </h3>
                    
                    <form onSubmit={handleGetSecondOpinion} className="space-y-6">
                        <FileInputCard file={studyRegulationsFile} setFile={setStudyRegulationsFile} label="Studieordning (Læringsmål)" id="study-regulations" required />
                        <FileInputCard file={examRegulationsFile} setFile={setExamRegulationsFile} label="Eksamensbestemmelser" id="exam-regulations" required />
                        <FileInputCard file={assignmentFile} setFile={setAssignmentFile} label="Din opgavebesvarelse" id="assignment" required />
                        <FileInputCard file={feedbackFile} setFile={setFeedbackFile} label="Feedback fra bedømmer (valgfri)" id="feedback" />

                        <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                             <label htmlFor="grade" className="block text-[10px] font-black uppercase tracking-widest text-amber-900/50 mb-3">
                               Modtaget karakter <span className="text-rose-500">*</span>
                             </label>
                            <input 
                                id="grade" 
                                value={grade} 
                                onChange={(e) => setGrade(e.target.value)} 
                                placeholder="f.eks. 7, 10, B..." 
                                className="w-full p-4 bg-[#FDFCF8] border border-amber-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-rose-500/5 focus:outline-none transition-all shadow-inner"
                            />
                        </div>
                        
                        {error && <p className="text-xs text-rose-600 font-bold text-center pt-2 animate-pulse">{error}</p>}
                        
                        {limitError && (
                            <div className="bg-amber-50 border-2 border-dashed border-amber-200 text-amber-950 p-6 rounded-3xl text-center">
                                <h3 className="font-bold text-sm mb-2">Grænse nået</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{limitError}</p>
                                <Link href="/upgrade" className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-amber-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-900 transition-all">
                                    Opgrader nu <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            disabled={!isFormValid || isAnalyzing || !!limitError} 
                            className="w-full h-16 bg-amber-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-900 transition-all disabled:opacity-50 shadow-xl shadow-amber-950/20 active:scale-95"
                        >
                            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5 text-amber-400" />}
                            {isAnalyzing ? 'Analyserer...' : 'Start Second Opinion'}
                        </button>
                    </form>
                </section>

                {/* HISTORY SECTION */}
                <section className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-xl">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-[0.3em] flex items-center gap-3">
                        <History className="w-4 h-4 text-rose-700" /> Tidligere Analyser
                    </h3>
                    
                    {isLoadingHistory ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-200" />
                        </div>
                    ) : pastOpinions.length > 0 ? (
                        <div className="space-y-4">
                            {pastOpinions.map((opinion, idx) => (
                                <button 
                                    key={opinion.id}
                                    onClick={() => setResult(opinion.analysis)} 
                                    className="w-full text-left p-5 rounded-2xl bg-slate-50 border border-transparent hover:border-rose-200 hover:bg-white transition-all flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-rose-50 transition-colors">
                                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-rose-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-amber-950">Karakter: {opinion.input?.grade || 'N/A'}</p>
                                            <p className="text-[9px] font-black uppercase text-slate-300 mt-1 tracking-widest">
                                                {opinion.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:text-rose-600 transition-all" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 text-center">
                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Ingen historik endnu</p>
                        </div>
                    )}
                </section>
            </aside>

            {/* MAIN AREA: RESULTS */}
            <main className="lg:col-span-8">
                {!result && !isAnalyzing ? (
                    <div 
                        className="h-full min-h-[700px] border-2 border-dashed border-amber-100 rounded-[4rem] flex flex-col items-center justify-center text-center p-16 space-y-10 bg-white/50 shadow-inner animate-ink"
                    >
                        <div className="w-32 h-32 bg-amber-50 rounded-[3rem] flex items-center justify-center text-amber-200 shadow-inner">
                            <SearchCode className="w-16 h-16" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-amber-900/30 serif">Klar til akademisk kontrol</h3>
                            <p className="text-base text-slate-400 max-w-sm mx-auto mt-6 leading-relaxed">
                                Upload dine dokumenter for at få en uvildig vurdering af din opgave. Vi analyserer den røde tråd og det teoretiske niveau.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-6 py-3 bg-amber-50/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-900/30">PDF Analyse</div>
                            <div className="px-6 py-3 bg-amber-50/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-900/30">Læringsmål-tjek</div>
                        </div>
                    </div>
                ) : isAnalyzing ? (
                    <div 
                        className="h-full min-h-[700px] bg-white rounded-[4rem] border border-amber-100 flex flex-col items-center justify-center p-16 text-center shadow-2xl relative overflow-hidden animate-ink"
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10"></div>
                        <div className="relative mb-12">
                            <div className="w-40 h-40 border-4 border-rose-50 border-t-rose-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <GraduationCap className="w-12 h-12 text-rose-600 animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-amber-950 serif">Gennemlæser din opgave...</h3>
                        <p className="text-sm text-slate-400 mt-6 uppercase tracking-[0.3em] animate-pulse">Sammenligner med studieordning og læringsmål</p>
                    </div>
                ) : (
                    <div 
                        className="space-y-12 animate-fade-in-up"
                    >
                        {/* CONCLUSION HERO */}
                        <section className="bg-white rounded-[4rem] border border-amber-100 shadow-2xl overflow-hidden group">
                            <div className={`p-12 flex flex-col md:flex-row items-center justify-between gap-10 text-white transition-colors duration-700 ${
                                result.isGradeAccurate ? 'bg-emerald-900' : 'bg-rose-950'
                            }`}>
                                <div className="flex items-center gap-8">
                                    <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md shadow-2xl">
                                        {result.isGradeAccurate ? (
                                            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                                        ) : (
                                            <XCircle className="w-12 h-12 text-rose-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold serif leading-tight">
                                            {result.isGradeAccurate ? 'Karakteren er retvisende' : 'Karakteren er IKKE retvisende'}
                                        </h2>
                                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                                            Baseret på faglig sammenligning
                                        </p>
                                    </div>
                                </div>
                                <div className="px-8 py-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Din Karakter</p>
                                    <p className="text-3xl font-black serif">{grade}</p>
                                </div>
                            </div>
                            
                            <div className="p-16">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                        <Gavel className="w-5 h-5 text-amber-700" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-950">Faglig Argumentation</h3>
                                </div>
                                <div 
                                    className="prose prose-lg max-w-none text-amber-950/80 leading-relaxed serif italic" 
                                    dangerouslySetInnerHTML={{ __html: result.gradeAccuracyArgument }} 
                                />
                            </div>
                        </section>

                        {/* DETAILED ANALYSIS */}
                        {isPremiumUser ? (
                            <div className="space-y-12">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <ResultCard icon={<ThumbsUp className="text-emerald-600" />} title="Opgavens Styrker">
                                        <ul className="space-y-4">
                                            {result.strengths.map((item, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></div>
                                                    <span className="text-sm">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </ResultCard>
                                    <ResultCard icon={<ThumbsDown className="text-rose-600" />} title="Opgavens Svagheder">
                                        <ul className="space-y-4">
                                            {result.weaknesses.map((item, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"></div>
                                                    <span className="text-sm">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </ResultCard>
                                </div>

                                <ResultCard icon={<AlertTriangle className="text-amber-600" />} title="Risikovurdering ved klage">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {result.riskAssessment.map((item, index) => (
                                            <div key={index} className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                                    <span className="text-xs font-bold text-amber-700">{index + 1}</span>
                                                </div>
                                                <p className="text-sm text-amber-900/70 font-medium">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ResultCard>

                                <ResultCard icon={<ListChecks className="text-indigo-600" />} title="Anbefalede Næste Skridt">
                                    <div className="space-y-4">
                                        {result.suggestedNextSteps.map((item, index) => (
                                            <div key={index} className="flex items-center gap-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 group/item hover:bg-white transition-all">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-indigo-950">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ResultCard>
                            </div>
                        ) : (
                            <section className="bg-amber-950 p-16 rounded-[4rem] text-white text-center shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-amber-400 text-amber-950 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                                        <Sparkles className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-4xl font-bold serif mb-6 leading-tight">Lås op for den <br/>dybe analyse</h3>
                                    <p className="text-amber-100/60 text-xl mb-12 max-w-lg mx-auto italic font-medium leading-relaxed">
                                        Bliv klar til en eventuel klagesag med en detaljeret gennemgang af styrker, svagheder og risici.
                                    </p>
                                    <Link href="/upgrade">
                                        <button className="h-20 px-12 bg-amber-400 hover:bg-white text-amber-950 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl transition-all flex items-center gap-4 mx-auto group/btn">
                                            Opgrader til Kollega+
                                            <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        </button>
                                    </Link>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>
        </main>
    </div>
    );
};

const SecondOpinionPage = () => {
  const { user, isUserLoading } = useApp();
  const router = useRouter();

  if (isUserLoading || !user) {
    return <AuthLoadingScreen />;
  }

  return <SecondOpinionPageContent />;
};

export default SecondOpinionPage;
